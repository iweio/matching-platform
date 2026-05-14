import json
from typing import TypedDict
from langgraph.graph import StateGraph, END
from llm_client import LLMClient


class RiskDetectState(TypedDict):
    request: dict
    session_id: str
    chat_record: list[dict]
    risk_tags: list[str]
    risk_score: int
    block_suggest: str
    error: str


RISK_PATTERNS = {
    "敷衍": {
        "keywords": ["嗯", "哦", "呵呵", "随便", "都行", "还行吧", "不知道"],
        "short_threshold": 5,
        "description": "回复过于简短敷衍，缺乏交流诚意",
    },
    "冷漠": {
        "keywords": ["关我什么事", "无所谓", "不感兴趣", "别烦我"],
        "description": "态度冷漠，缺乏基本社交温度",
    },
    "情绪化": {
        "keywords": ["烦死了", "气死我了", "滚", "无语", "受不了"],
        "description": "情绪波动大，容易产生冲突",
    },
    "利己主义": {
        "keywords": ["你必须", "你应该", "给我", "凭什么", "我不管"],
        "description": "以自我为中心，缺乏共情能力",
    },
    "套路化": {
        "keywords": ["在吗", "发张照片", "你多高", "你收入多少", "有房吗", "有车吗"],
        "description": "对话模式化，像在走流程而非真心交流",
    },
    "不尊重": {
        "keywords": ["你懂什么", "就你", "你这种人", "呵呵女人", "呵呵男人"],
        "description": "言语中存在不尊重对方的倾向",
    },
    "过度打探": {
        "keywords": ["工资多少", "存款多少", "家里干什么的", "房子多大"],
        "description": "过度打探隐私和物质条件",
    },
}


def validate_input(state: RiskDetectState) -> RiskDetectState:
    req = state["request"]
    chat_record = req.get("chat_record", [])

    if not chat_record:
        state["error"] = "对话记录不能为空"
        return state

    state["chat_record"] = chat_record
    state["session_id"] = req.get("session_id", "")
    return state


async def scan_risk_patterns(state: RiskDetectState) -> RiskDetectState:
    chat_record = state["chat_record"]

    if LLMClient.is_available():
        try:
            result = await _llm_risk_detect(chat_record)
            state["risk_tags"] = result["risk_tags"]
            state["risk_score"] = result["risk_score"]
            state["block_suggest"] = result["block_suggest"]
            return state
        except Exception:
            pass

    state.update(_keyword_risk_detect(chat_record))
    return state


async def _llm_risk_detect(chat_record: list[dict]) -> dict:
    conversation_text = "\n".join([
        f"{'A方' if m.get('speaker') == 'agent_a' else 'B方'}: {m.get('content', '')}"
        for m in chat_record
    ])

    system_prompt = """你是一个婚恋对话风险检测专家。你需要分析双智能体对话中是否存在以下风险：

风险类型：
- 敷衍：回复过于简短，缺乏交流诚意
- 冷漠：态度冷淡，缺乏社交温度
- 情绪化：情绪波动大，容易产生冲突
- 利己主义：以自我为中心，缺乏共情
- 套路化：对话模式化，像在走流程
- 不尊重：言语中存在不尊重对方的倾向
- 过度打探：过度打探隐私和物质条件

请严格按照以下JSON格式输出，不要包含任何其他内容：
{
  "risk_tags": ["agent_a(敷衍)", "agent_b(情绪化)"],
  "risk_score": 0-100的整数,
  "block_suggest": "风险拦截建议，不超过100字"
}"""

    user_prompt = f"请分析以下对话记录中的风险：\n\n{conversation_text}"

    result = await LLMClient.chat_json(system_prompt, user_prompt)
    return {
        "risk_tags": result.get("risk_tags", []),
        "risk_score": result.get("risk_score", 5),
        "block_suggest": result.get("block_suggest", "未检测到明显风险"),
    }


def _keyword_risk_detect(chat_record: list[dict]) -> dict:
    detected_tags = []
    risk_scores = []

    for agent in ["agent_a", "agent_b"]:
        agent_msgs = [m for m in chat_record if m.get("speaker") == agent]
        agent_contents = [m.get("content", "") for m in agent_msgs]

        for tag_name, pattern in RISK_PATTERNS.items():
            keyword_hits = 0
            short_count = 0

            for content in agent_contents:
                for kw in pattern["keywords"]:
                    if kw in content:
                        keyword_hits += 1
                if len(content) <= pattern.get("short_threshold", 3):
                    short_count += 1

            total = len(agent_contents)
            hit_rate = keyword_hits / max(total, 1)

            if hit_rate >= 0.3 or (short_count >= total * 0.5 and tag_name == "敷衍"):
                tag_label = f"{agent}({tag_name})"
                if tag_label not in detected_tags:
                    detected_tags.append(tag_label)
                risk_scores.append(min(100, int(hit_rate * 100 + 20)))

    if risk_scores:
        risk_score = int(sum(risk_scores) / len(risk_scores))
    else:
        risk_score = max(5, len(detected_tags) * 15)

    if not detected_tags:
        block_suggest = "未检测到明显风险，对话正常进行"
    elif risk_score >= 70:
        block_suggest = f"检测到高风险信号：{'、'.join(detected_tags)}。强烈建议终止匹配或进行人工审核。"
    elif risk_score >= 40:
        block_suggest = f"检测到中等风险信号：{'、'.join(detected_tags)}。建议关注并评估是否继续匹配。"
    else:
        block_suggest = f"检测到轻微风险信号：{'、'.join(detected_tags)}。可继续匹配，但需留意后续互动。"

    return {
        "risk_tags": detected_tags,
        "risk_score": risk_score,
        "block_suggest": block_suggest,
    }


def build_risk_detect_graph() -> StateGraph:
    graph = StateGraph(RiskDetectState)

    graph.add_node("validate_input", validate_input)
    graph.add_node("scan_risk_patterns", scan_risk_patterns)

    graph.set_entry_point("validate_input")

    graph.add_conditional_edges(
        "validate_input",
        lambda s: END if s.get("error") else "scan_risk_patterns",
        {"scan_risk_patterns": "scan_risk_patterns", END: END},
    )
    graph.add_edge("scan_risk_patterns", END)

    return graph.compile()


risk_detect_app = build_risk_detect_graph()
