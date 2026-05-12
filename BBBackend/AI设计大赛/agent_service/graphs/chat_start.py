import uuid
from typing import TypedDict
from datetime import datetime
from langgraph.graph import StateGraph, END
from models import ChatStartRequest, ChatMessage, ChatSession
from store import AgentStore, ChatStore
from llm_client import LLMClient


class ChatStartState(TypedDict):
    request: dict
    session_id: str
    agent_a_profile: dict
    agent_b_profile: dict
    messages: list[dict]
    current_round: int
    round_limit: int
    current_speaker: str
    chat_status: str
    error: str


def validate_agents(state: ChatStartState) -> ChatStartState:
    req = state["request"]
    agent_a = AgentStore.get_profile(req["agent_id_a"])
    agent_b = AgentStore.get_profile(req["agent_id_b"])

    if not agent_a:
        return {
            **state,
            "error": f"智能体 {req['agent_id_a']} 不存在，请先完成人格蒸馏",
            "chat_status": "failed"
        }
    if not agent_b:
        return {
            **state,
            "error": f"智能体 {req['agent_id_b']} 不存在，请先完成人格蒸馏",
            "chat_status": "failed"
        }

    return {
        **state,
        "agent_a_profile": {
            "agent_id": agent_a.agent_id,
            "speak_style": agent_a.speak_style,
            "character": agent_a.character,
            "love_style": agent_a.love_style,
            "values_view": agent_a.values_view,
            "taboo": agent_a.taboo,
            "system_prompt": agent_a.system_prompt,
        },
        "agent_b_profile": {
            "agent_id": agent_b.agent_id,
            "speak_style": agent_b.speak_style,
            "character": agent_b.character,
            "love_style": agent_b.love_style,
            "values_view": agent_b.values_view,
            "taboo": agent_b.taboo,
            "system_prompt": agent_b.system_prompt,
        }
    }


def init_session(state: ChatStartState) -> ChatStartState:
    req = state["request"]
    session_id = f"session_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    
    session = ChatSession(
        session_id=session_id,
        match_id=req["match_id"],
        agent_id_a=req["agent_id_a"],
        agent_id_b=req["agent_id_b"],
        status="running",
        messages=[],
        created_at=datetime.now().isoformat(),
    )
    ChatStore.create_session(session)
    
    return {
        **state,
        "session_id": session_id,
        "current_round": 0,
        "round_limit": req.get("round_limit", 30),
        "current_speaker": "agent_a",
        "messages": [],
        "chat_status": "running"
    }


async def generate_opening(state: ChatStartState) -> ChatStartState:
    profile_a = state["agent_a_profile"]
    profile_b = state["agent_b_profile"]

    user_prompt = f"""这是你们第一次见面。对方的基本信息：说话风格{profile_b['speak_style']}，性格{profile_b['character']}，恋爱模式{profile_b['love_style']}。

请用你的风格主动打招呼，介绍自己并表达友好。回复控制在2-4句话，像真人聊天一样自然。"""

    content = await _generate_message(
        system_prompt=profile_a["system_prompt"],
        user_prompt=user_prompt,
        profile=profile_a,
    )

    msg = ChatMessage(
        id=f"msg_{state['current_round']:04d}",
        speaker="agent_a",
        content=content,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    state["messages"].append(msg.model_dump())
    ChatStore.append_message(state["session_id"], msg)
    state["current_round"] = 1
    state["current_speaker"] = "agent_b"
    return state


async def agent_speak(state: ChatStartState) -> ChatStartState:
    round_num = state["current_round"]
    speaker = state["current_speaker"]
    profile = state["agent_a_profile"] if speaker == "agent_a" else state["agent_b_profile"]
    other_profile = state["agent_b_profile"] if speaker == "agent_a" else state["agent_a_profile"]

    recent_messages = state["messages"][-6:]
    context = _build_context(recent_messages, speaker)
    topic = _pick_topic(round_num)

    user_prompt = f"""当前是第{round_num}轮对话。{topic}

对方的基本信息：说话风格{other_profile['speak_style']}，性格{other_profile['character']}，恋爱模式{other_profile['love_style']}。

## 最近的对话记录
{context}

请根据你的人格设定自然地回复对方。回复控制在2-4句话，像真人聊天一样自然。"""

    content = await _generate_message(
        system_prompt=profile["system_prompt"],
        user_prompt=user_prompt,
        profile=profile,
    )

    msg = ChatMessage(
        id=f"msg_{round_num:04d}",
        speaker=speaker,
        content=content,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    state["messages"].append(msg.model_dump())
    ChatStore.append_message(state["session_id"], msg)

    state["current_speaker"] = "agent_b" if speaker == "agent_a" else "agent_a"
    state["current_round"] = round_num + 1
    return state


def finalize_chat(state: ChatStartState) -> ChatStartState:
    state["chat_status"] = "completed"
    if state.get("session_id"):
        ChatStore.update_status(state["session_id"], "completed")
    return state


def should_continue_chat(state: ChatStartState) -> str:
    if state.get("error"):
        return "finalize_chat"
    if state["current_round"] >= state["round_limit"]:
        return "finalize_chat"
    return "agent_speak"


def _build_context(messages: list[dict], current_speaker: str) -> str:
    lines = []
    for m in messages:
        label = "你" if m["speaker"] == current_speaker else "对方"
        lines.append(f"{label}: {m['content']}")
    return "\n".join(lines)


def _pick_topic(round_num: int) -> str:
    topics = {
        1: "请回复对方的开场白，自然地介绍自己。",
        3: "可以聊聊平时的兴趣爱好。",
        5: "可以聊聊工作和生活状态。",
        7: "可以聊聊对感情的看法。",
        9: "可以聊聊家庭观念。",
        11: "可以聊聊未来的规划。",
        13: "可以聊聊消费观念。",
        15: "可以聊聊对婚姻的看法。",
        17: "可以聊聊理想中的另一半。",
        19: "可以聊聊过去的感情经历（适度）。",
        21: "可以聊聊生活中的小习惯。",
        23: "可以聊聊对异地恋的看法。",
        25: "可以聊聊对AA制的看法。",
        27: "可以聊聊对生育的看法。",
        29: "对话即将结束，可以做一个总结或表达感受。",
    }
    for threshold in sorted(topics.keys(), reverse=True):
        if round_num >= threshold:
            return topics[threshold]
    return "自然地延续对话。"


async def _generate_message(system_prompt: str, user_prompt: str, profile: dict) -> str:
    if LLMClient.is_available():
        return await LLMClient.chat(system_prompt, user_prompt, profile)

    return LLMClient._simulate(system_prompt, user_prompt, profile)


def build_chat_start_graph() -> StateGraph:
    graph = StateGraph(ChatStartState)

    graph.add_node("validate_agents", validate_agents)
    graph.add_node("init_session", init_session)
    graph.add_node("generate_opening", generate_opening)
    graph.add_node("agent_speak", agent_speak)
    graph.add_node("finalize_chat", finalize_chat)

    graph.set_entry_point("validate_agents")

    graph.add_conditional_edges(
        "validate_agents",
        lambda s: "finalize_chat" if s.get("error") else "init_session",
        {"init_session": "init_session", "finalize_chat": "finalize_chat"},
    )
    graph.add_edge("init_session", "generate_opening")
    graph.add_conditional_edges(
        "generate_opening",
        should_continue_chat,
        {"agent_speak": "agent_speak", "finalize_chat": "finalize_chat"},
    )
    graph.add_conditional_edges(
        "agent_speak",
        should_continue_chat,
        {"agent_speak": "agent_speak", "finalize_chat": "finalize_chat"},
    )
    graph.add_edge("finalize_chat", END)

    return graph.compile()


import json
import asyncio
from store import ChatStore


async def stream_chat_start(req: dict):
    agent_a = AgentStore.get_profile(req["agent_id_a"])
    agent_b = AgentStore.get_profile(req["agent_id_b"])

    if not agent_a:
        msg = f'智能体 {req["agent_id_a"]} 不存在'
        yield f"data: {json.dumps({'event': 'error', 'data': {'msg': msg}})}\n\n"
        return
    if not agent_b:
        msg = f'智能体 {req["agent_id_b"]} 不存在'
        yield f"data: {json.dumps({'event': 'error', 'data': {'msg': msg}})}\n\n"
        return

    profile_a = {
        "agent_id": agent_a.agent_id,
        "speak_style": agent_a.speak_style,
        "character": agent_a.character,
        "love_style": agent_a.love_style,
        "values_view": agent_a.values_view,
        "taboo": agent_a.taboo,
        "system_prompt": agent_a.system_prompt,
    }
    profile_b = {
        "agent_id": agent_b.agent_id,
        "speak_style": agent_b.speak_style,
        "character": agent_b.character,
        "love_style": agent_b.love_style,
        "values_view": agent_b.values_view,
        "taboo": agent_b.taboo,
        "system_prompt": agent_b.system_prompt,
    }

    session_id = f"session_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    session = ChatSession(
        session_id=session_id,
        match_id=req["match_id"],
        agent_id_a=req["agent_id_a"],
        agent_id_b=req["agent_id_b"],
        status="running",
        messages=[],
        created_at=datetime.now().isoformat(),
    )
    ChatStore.create_session(session)
    queue = ChatStore.subscribe(session_id)

    asyncio.create_task(_run_chat_loop(session_id, profile_a, profile_b, req.get("round_limit", 30)))
    try:
        while True:
            event = await asyncio.wait_for(queue.get(), timeout=300)
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            if event["event"] == "done":
                break
    except asyncio.TimeoutError:
        yield f"data: {json.dumps({'event': 'error', 'data': {'msg': '对话超时'}}, ensure_ascii=False)}\n\n"
    finally:
        ChatStore.unsubscribe(session_id, queue)


async def _run_chat_loop(session_id: str, profile_a: dict, profile_b: dict, round_limit: int):

    async def _stream_generate(profile: dict, other_profile: dict, round_num: int,
                               context: str, speaker: str):
        topic = _pick_topic(round_num)
        if round_num == 0:
            user_prompt = f"""这是你们第一次见面。对方的基本信息：说话风格{other_profile['speak_style']}，性格{other_profile['character']}，恋爱模式{other_profile['love_style']}。

请用你的风格主动打招呼，介绍自己并表达友好。回复控制在2-4句话，像真人聊天一样自然。"""
        else:
            user_prompt = f"""当前是第{round_num}轮对话。{topic}

对方的基本信息：说话风格{other_profile['speak_style']}，性格{other_profile['character']}，恋爱模式{other_profile['love_style']}。

## 最近的对话记录
{context}

请根据你的人格设定自然地回复对方。回复控制在2-4句话，像真人聊天一样自然。"""

        tokens = []
        async for token in LLMClient.stream_chat(profile["system_prompt"], user_prompt, profile):
            tokens.append(token)
            yield {"event": "token", "data": {"speaker": speaker, "token": token}}

        full_content = "".join(tokens)

    messages: list[dict] = []
    msg_id = 0

    # Opening — agent_a
    opening = ""
    async for evt in _stream_generate(profile_a, profile_b, 0, "", "agent_a"):
        if evt["event"] == "token":
            opening += evt["data"]["token"]
    msg = ChatMessage(
        id=f"msg_{msg_id:04d}",
        speaker="agent_a",
        content=opening or "你好呀！很高兴认识你～",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    messages.append(msg.model_dump())
    ChatStore.append_message(session_id, msg)
    msg_id += 1

    # Rounds
    current_speaker = "agent_b"
    for r in range(1, round_limit):
        sp = profile_a if current_speaker == "agent_a" else profile_b
        op = profile_b if current_speaker == "agent_a" else profile_a
        recent = messages[-6:]
        ctx = "\n".join([f"{'你' if m['speaker'] == current_speaker else '对方'}: {m['content']}" for m in recent])

        content = ""
        async for evt in _stream_generate(sp, op, r, ctx, current_speaker):
            if evt["event"] == "token":
                content += evt["data"]["token"]
        if not content:
            content = "嗯，我觉得你说得很有道理。"

        msg = ChatMessage(
            id=f"msg_{msg_id:04d}",
            speaker=current_speaker,
            content=content,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        messages.append(msg.model_dump())
        ChatStore.append_message(session_id, msg)
        msg_id += 1
        current_speaker = "agent_b" if current_speaker == "agent_a" else "agent_a"

    ChatStore.update_status(session_id, "completed")
    ChatStore.notify_done(session_id, {
        "session_id": session_id,
        "chat_status": "completed",
        "total_rounds": round_limit,
    })


chat_start_app = build_chat_start_graph()
