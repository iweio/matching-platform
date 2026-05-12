import json
from typing import TypedDict
from langgraph.graph import StateGraph, END
from models import GenerateReportRequest, Dimensions
from store import ChatStore, AgentStore
from llm_client import LLMClient


class GenerateReportState(TypedDict):
    request: dict
    session_id: str
    match_id: str
    messages: list[dict]
    agent_a_profile: dict
    agent_b_profile: dict
    score: int
    dimensions: dict
    advantage: str
    risk: str
    suggest: str
    error: str


def load_session(state: GenerateReportState) -> GenerateReportState:
    session_id = state["request"]["session_id"]
    session = ChatStore.get_session(session_id)

    if not session:
        state["error"] = f"会话 {session_id} 不存在"
        return state

    if session.status != "completed":
        state["error"] = f"会话 {session_id} 尚未完成，当前状态: {session.status}"
        return state

    messages = [m.model_dump() for m in session.messages]
    state["messages"] = messages
    state["session_id"] = session_id
    state["match_id"] = session.match_id

    agent_a = AgentStore.get_profile(session.agent_id_a)
    agent_b = AgentStore.get_profile(session.agent_id_b)

    if agent_a:
        state["agent_a_profile"] = {
            "speak_style": agent_a.speak_style,
            "character": agent_a.character,
            "love_style": agent_a.love_style,
            "values_view": agent_a.values_view,
            "taboo": agent_a.taboo,
        }
    if agent_b:
        state["agent_b_profile"] = {
            "speak_style": agent_b.speak_style,
            "character": agent_b.character,
            "love_style": agent_b.love_style,
            "values_view": agent_b.values_view,
            "taboo": agent_b.taboo,
        }
    return state


async def analyze_conversation(state: GenerateReportState) -> GenerateReportState:
    messages = state["messages"]
    profile_a = state.get("agent_a_profile", {})
    profile_b = state.get("agent_b_profile", {})

    if not messages:
        state["dimensions"] = {"emotion": 50, "value": 50, "communication": 50, "lifestyle": 50, "future": 50}
        state["score"] = 50
        state["advantage"] = "对话数据不足，无法生成分析"
        state["risk"] = "对话数据不足"
        state["suggest"] = "建议重新匹配"
        return state

    conversation_text = _format_conversation(messages)

    system_prompt = """你是一个专业的婚恋匹配分析师。你需要根据双智能体的对话记录，分析双方的匹配程度。

请严格按照以下JSON格式输出分析结果，不要包含任何其他内容：
{
  "dimensions": {
    "emotion": 0-100的整数,
    "value": 0-100的整数,
    "communication": 0-100的整数,
    "lifestyle": 0-100的整数,
    "future": 0-100的整数
  },
  "score": 0-100的整数,
  "advantage": "优势分析，不超过100字",
  "risk": "风险提示，不超过100字",
  "suggest": "婚恋建议，不超过100字"
}

评分标准：
- emotion(情感契合度)：对话是否热情、有来有往、情感投入程度
- value(价值观匹配度)：三观是否一致、对婚姻家庭的看法
- communication(沟通舒适度)：对话是否自然流畅、有无尴尬或冲突
- lifestyle(生活方式匹配度)：生活习惯、消费观念是否相近
- future(未来规划契合度)：对未来是否有共同期待
- score(总分)：综合五维评分的加权总分"""

    user_prompt = f"""请分析以下双智能体婚恋匹配对话：

## A方人格
说话风格：{profile_a.get('speak_style', '未知')}
性格：{profile_a.get('character', '未知')}
恋爱模式：{profile_a.get('love_style', '未知')}
三观：{json.dumps(profile_a.get('values_view', {}), ensure_ascii=False)}

## B方人格
说话风格：{profile_b.get('speak_style', '未知')}
性格：{profile_b.get('character', '未知')}
恋爱模式：{profile_b.get('love_style', '未知')}
三观：{json.dumps(profile_b.get('values_view', {}), ensure_ascii=False)}

## 对话记录
{conversation_text}"""

    if LLMClient.is_available():
        try:
            result = await LLMClient.chat_json(system_prompt, user_prompt)
            state["dimensions"] = result.get("dimensions", {"emotion": 50, "value": 50, "communication": 50, "lifestyle": 50, "future": 50})
            state["score"] = result.get("score", 50)
            state["advantage"] = result.get("advantage", "双方基本匹配")
            state["risk"] = result.get("risk", "暂未发现明显风险")
            state["suggest"] = result.get("suggest", "建议进一步了解")
            return state
        except Exception:
            pass

    state.update(_fallback_analysis(messages, profile_a, profile_b))
    return state


def _format_conversation(messages: list[dict]) -> str:
    lines = []
    for m in messages:
        speaker_label = "A方" if m["speaker"] == "agent_a" else "B方"
        lines.append(f"{speaker_label}: {m['content']}")
    return "\n".join(lines)


def _fallback_analysis(messages: list[dict], profile_a: dict, profile_b: dict) -> dict:
    total_msgs = len(messages)
    a_msgs = [m for m in messages if m["speaker"] == "agent_a"]
    b_msgs = [m for m in messages if m["speaker"] == "agent_b"]

    a_avg_len = sum(len(m["content"]) for m in a_msgs) / max(len(a_msgs), 1)
    b_avg_len = sum(len(m["content"]) for m in b_msgs) / max(len(b_msgs), 1)
    length_balance = 100 - abs(a_avg_len - b_avg_len) * 2
    length_balance = max(40, min(100, int(length_balance)))

    emotion_score = int(length_balance * 0.6 + 70 * 0.4)

    style_a = profile_a.get("speak_style", "")
    style_b = profile_b.get("speak_style", "")
    complementary_pairs = [
        ({"幽默风趣", "温柔细腻"}, 95),
        ({"直接干脆", "温柔细腻"}, 90),
        ({"外向开朗", "内向文静"}, 92),
        ({"霸气外露", "温柔细腻"}, 85),
    ]
    style_bonus = 0
    for pair, bonus in complementary_pairs:
        if style_a in pair and style_b in pair and style_a != style_b:
            style_bonus = bonus - 50
            break

    value_score = 75 + style_bonus // 2
    value_score = max(40, min(100, value_score))
    comm_score = max(40, min(100, int(emotion_score * 0.7 + value_score * 0.3)))
    life_score = 70
    future_score = 70

    dimensions = {
        "emotion": emotion_score,
        "value": value_score,
        "communication": comm_score,
        "lifestyle": life_score,
        "future": future_score,
    }

    weights = {"emotion": 0.25, "value": 0.25, "communication": 0.20, "lifestyle": 0.15, "future": 0.15}
    score = int(sum(dimensions[k] * weights[k] for k in weights))

    advantages = []
    risks = []
    if dimensions["emotion"] >= 80:
        advantages.append("双方情感交流顺畅，互动积极热情")
    elif dimensions["emotion"] < 60:
        risks.append("情感交流略显不足，建议增加互动深度")
    if dimensions["value"] >= 80:
        advantages.append("三观契合度高，核心价值观一致")
    elif dimensions["value"] < 60:
        risks.append("价值观存在一定差异，需要进一步沟通磨合")
    if dimensions["communication"] >= 80:
        advantages.append("沟通风格互补，交流舒适自然")
    elif dimensions["communication"] < 60:
        risks.append("沟通方式需要调整，建议多倾听对方")
    if style_a and style_b:
        advantages.append(f"{style_a}的A方与{style_b}的B方风格{'互补' if style_a != style_b else '相似'}")

    if score >= 85:
        suggest = "匹配度优秀，强烈建议解锁真人聊天，尽快线下见面加深了解"
    elif score >= 70:
        suggest = "匹配度良好，建议解锁真人聊天，进一步了解对方"
    elif score >= 55:
        suggest = "匹配度一般，可以尝试解锁聊天，但需注意沟通中的差异点"
    else:
        suggest = "匹配度较低，建议谨慎考虑是否解锁，或重新匹配"

    return {
        "dimensions": dimensions,
        "score": score,
        "advantage": "；".join(advantages) if advantages else "双方基本匹配，有进一步发展的潜力",
        "risk": "；".join(risks) if risks else "暂未发现明显风险点",
        "suggest": suggest,
    }


def build_generate_report_graph() -> StateGraph:
    graph = StateGraph(GenerateReportState)

    graph.add_node("load_session", load_session)
    graph.add_node("analyze_conversation", analyze_conversation)

    graph.set_entry_point("load_session")

    graph.add_conditional_edges(
        "load_session",
        lambda s: END if s.get("error") else "analyze_conversation",
        {"analyze_conversation": "analyze_conversation", END: END},
    )
    graph.add_edge("analyze_conversation", END)

    return graph.compile()


generate_report_app = build_generate_report_graph()
