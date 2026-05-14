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
    discussed_topics: set  # 已讨论的话题类别
    used_phrases: list     # 已使用过的话术，避免重复


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
        "chat_status": "running",
        "discussed_topics": set(),  # 初始化已讨论话题集合
        "used_phrases": []          # 初始化已使用话术列表
    }


async def generate_opening(state: ChatStartState) -> ChatStartState:
    profile_a = state["agent_a_profile"]
    profile_b = state["agent_b_profile"]

    values_a = json.dumps(profile_a.get('values_view', {}), ensure_ascii=False)
    taboo_a = json.dumps(profile_a.get('taboo', {}), ensure_ascii=False)

    user_prompt = f"""你现在正在参加一个有趣的交友活动，刚刚认识了一个新朋友。这是你们的第一次对话，请留下好的第一印象。

对方的信息：说话风格{profile_b['speak_style']}，性格{profile_b['character']}，恋爱模式{profile_b['love_style']}。

你的核心价值观：{values_a}
你的底线/雷区：{taboo_a}

请用你的风格主动打招呼，就像平时跟朋友聊天一样自然。要求：
- 语气自然，像真人聊天，不要像机器人或客服
- 可以带语气词（呀、呢、嘛、哈），但别每句都用
- 简单介绍自己或分享一个生活小片段
- 问对方一个轻松的问题
- 2-4句话，不要太长
- 不要用"很高兴认识你"这种客套话开头"""

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
    topics_used = state.get("discussed_topics", set())
    topic, topics_used = _pick_topic(round_num, topics_used)
    state["discussed_topics"] = topics_used

    values = json.dumps(profile.get('values_view', {}), ensure_ascii=False)
    taboo = json.dumps(profile.get('taboo', {}), ensure_ascii=False)

    user_prompt = f"""你正在和一个新朋友聊天，氛围很轻松。{topic}

对方性格{other_profile['character']}，说话风格{other_profile['speak_style']}，恋爱观{other_profile['love_style']}。
你的核心价值观：{values}
你的底线/雷区：{taboo}

刚才的对话：
{context}

请自然地聊下去，像真人面对面聊天。要求：
- 自然生动，语气词适度（呀、呢、吧），但别每句都用
- 变换句式开头，不要总说"我觉得"、"其实"
- 对对方的话表示关心或好奇，先回应再延伸
- 可以分享一点相关的个人经历，让对话有温度
- 也可以聊一个新角度
- 2-4句话，不需要太长
- 不要重复之前用过的句式或表达"""

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


import random

# 话题池 - 按类别分组，增加多样性
TOPIC_CATEGORIES = {
    "兴趣爱好": [
        "可以聊聊平时的兴趣爱好。",
        "你平时喜欢做什么来放松自己？",
        "最近有没有什么特别喜欢做的事情？",
        "周末一般会怎么安排时间呢？",
        "有没有什么一直想尝试但还没做的事情？",
    ],
    "工作生活": [
        "可以聊聊工作和生活状态。",
        "工作中有没有什么有趣的事情？",
        "平时工作压力大吗？怎么缓解的？",
        "对现在的工作满意吗？",
        "你是怎么平衡工作和生活的？",
    ],
    "感情观念": [
        "可以聊聊对感情的看法。",
        "你觉得感情中最重要的是什么？",
        "喜欢什么样的相处模式？",
        "对恋爱有什么期待吗？",
        "怎么看待一见钟情和日久生情？",
    ],
    "家庭观念": [
        "可以聊聊家庭观念。",
        "和家人的关系怎么样？",
        "理想中的家庭是什么样的？",
        "平时会和家人一起做什么？",
        "觉得家庭对一个人影响大吗？",
    ],
    "未来规划": [
        "可以聊聊未来的规划。",
        "对未来有什么期待吗？",
        "五年后想成为什么样的人？",
        "有没有特别想实现的目标？",
        "未来想在哪个城市生活？",
    ],
    "价值观": [
        "可以聊聊消费观念。",
        "对AA制怎么看？",
        "觉得钱应该花在什么地方？",
        "怎么看待物质和精神的关系？",
        "消费时更看重品质还是价格？",
    ],
    "婚姻家庭": [
        "可以聊聊对婚姻的看法。",
        "理想中的另一半是什么样的？",
        "对生育有什么看法？",
        "怎么看待异地恋？",
        "觉得婚姻最重要的是什么？",
    ],
    "生活习惯": [
        "可以聊聊生活中的小习惯。",
        "每天有什么必做的事情吗？",
        "生活中有什么小仪式感吗？",
        "作息规律吗？",
        "喜欢收拾房间吗？",
    ],
}

def _pick_topic(round_num: int, topics_used: set) -> tuple[str, set]:
    """Per-session topic selection — no global state"""
    topics_used = topics_used or set()

    if round_num == 1:
        return "请回复对方的开场白，自然地介绍自己。", topics_used

    if round_num >= 29:
        return "对话即将结束，可以做一个总结或表达感受。", topics_used

    available_categories = [cat for cat in TOPIC_CATEGORIES.keys() if cat not in topics_used]

    if available_categories:
        selected_category = random.choice(available_categories)
        topics_used.add(selected_category)
    else:
        selected_category = random.choice(list(TOPIC_CATEGORIES.keys()))

    return random.choice(TOPIC_CATEGORIES[selected_category]), topics_used


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

    # Per-session topic tracking
    session_topics: set = set()

    async def _stream_generate(profile: dict, other_profile: dict, round_num: int,
                               context: str, speaker: str):
        nonlocal session_topics
        topic, session_topics = _pick_topic(round_num, session_topics)
        values = json.dumps(profile.get('values_view', {}), ensure_ascii=False)
        taboo = json.dumps(profile.get('taboo', {}), ensure_ascii=False)
        if round_num == 0:
            user_prompt = f"""你现在正在参加一个有趣的交友活动，刚刚认识了一个新朋友。这是你们的第一次对话，请留下好的第一印象。

对方：说话风格{other_profile['speak_style']}，性格{other_profile['character']}，恋爱模式{other_profile['love_style']}。
你的核心价值观：{values}
你的底线/雷区：{taboo}

请用你的风格主动打招呼。要求：
- 语气自然，像真人聊天，不要像机器人
- 可以带语气词（呀、呢、哈），但别每句都用
- 简单介绍自己或分享一个生活小片段
- 问对方一个轻松的问题
- 2-4句话，不要太长
- 不要用"很高兴认识你"这种客套话开头"""
        else:
            user_prompt = f"""你正在和一个新朋友聊天，氛围很轻松。{topic}

对方性格{other_profile['character']}，说话风格{other_profile['speak_style']}，恋爱观{other_profile['love_style']}。
你的核心价值观：{values}
你的底线/雷区：{taboo}

刚才的对话：
{context}

请自然地聊下去，像真人面对面聊天。要求：
- 自然生动，语气词适度（呀、呢、吧），但别每句都用
- 变换句式开头，不要总说"我觉得"、"其实"
- 对对方的话表示关心或好奇，先回应再延伸
- 可以分享一点相关的个人经历，让对话有温度
- 也可以聊一个新角度
- 2-4句话，不需要太长
- 不要重复之前用过的句式或表达"""

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
