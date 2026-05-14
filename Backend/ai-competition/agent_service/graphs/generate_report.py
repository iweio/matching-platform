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

    # Always compute real scores from profile data first
    fallback = _fallback_analysis(messages, profile_a, profile_b)
    state["dimensions"] = fallback["dimensions"]
    state["score"] = fallback["score"]

    # Use LLM to polish text if available, otherwise use computed text
    if LLMClient.is_available():
        try:
            polish_prompt = f"""请根据以下匹配分析数据，润色生成更自然的优势分析、风险提示和婚恋建议文本。

## 计算得出的数据
总分：{fallback["score"]}
各维度：{json.dumps(fallback["dimensions"], ensure_ascii=False)}
优势要点：{fallback["advantage"]}
风险要点：{fallback["risk"]}
建议要点：{fallback["suggest"]}

## 双方画像
A方：{json.dumps(profile_a, ensure_ascii=False)}
B方：{json.dumps(profile_b, ensure_ascii=False)}

请严格按照JSON格式输出，不要包含其他内容：
{{"advantage": "优势分析，不超过100字", "risk": "风险提示，不超过100字", "suggest": "婚恋建议，不超过100字"}}"""

            result = await LLMClient.chat_json(system_prompt, polish_prompt)
            state["advantage"] = result.get("advantage", fallback["advantage"])
            state["risk"] = result.get("risk", fallback["risk"])
            state["suggest"] = result.get("suggest", fallback["suggest"])
            return state
        except Exception:
            pass

    state["advantage"] = fallback["advantage"]
    state["risk"] = fallback["risk"]
    state["suggest"] = fallback["suggest"]
    return state


def _format_conversation(messages: list[dict]) -> str:
    lines = []
    for m in messages:
        speaker_label = "A方" if m["speaker"] == "agent_a" else "B方"
        lines.append(f"{speaker_label}: {m['content']}")
    return "\n".join(lines)


# ── 性格相容度矩阵 ──
CHARACTER_COMPAT = {
    ("活泼", "温柔"): 90, ("活泼", "沉稳"): 80, ("活泼", "活泼"): 85,
    ("温柔", "沉稳"): 92, ("温柔", "温柔"): 88, ("沉稳", "沉稳"): 75,
    ("幽默", "温柔"): 88, ("幽默", "沉稳"): 78, ("幽默", "活泼"): 92, ("幽默", "幽默"): 85,
}

# ── 说话风格互补 ──
SPEAK_STYLE_COMPAT = {
    ("幽默风趣", "温柔细腻"): 95, ("直接干脆", "温柔细腻"): 90,
    ("外向开朗", "内向文静"): 92, ("活泼开朗", "温柔体贴"): 90,
    ("沉稳内敛", "温柔细腻"): 88, ("直率豪爽", "温柔细腻"): 85,
    ("幽默风趣", "活泼开朗"): 92, ("沉稳内敛", "内向文静"): 70,
    ("直接干脆", "直率豪爽"): 82, ("温柔细腻", "温柔体贴"): 88,
}

# ── 恋爱模式兼容 ──
LOVE_STYLE_COMPAT = {
    ("浪漫", "浪漫"): 90, ("浪漫", "务实"): 72, ("浪漫", "均衡"): 82,
    ("务实", "务实"): 85, ("务实", "均衡"): 88, ("均衡", "均衡"): 85,
}

# ── 价值观关键词检测 ──
VALUE_KEYWORDS = {
    "family": {"家庭": 1, "父母": 1, "孝顺": 1, "孩子": 1, "陪伴": 0.8, "团聚": 0.8},
    "consume": {"储蓄": 1, "投资": 1, "享受": 0.7, "节俭": 1, "品质": 0.8, "体验": 0.7},
    "marriage": {"忠诚": 1, "信任": 1, "尊重": 1, "平等": 1, "包容": 1, "理解": 0.9},
    "ideal_partner": {"温柔": 0.8, "体贴": 0.8, "上进": 0.9, "幽默": 0.7, "责任感": 1, "善良": 0.9, "成熟": 0.8},
}

# ── 禁忌关键词映射 ──
TABOO_KEYWORDS = {
    "抽烟": ["生活习惯", "健康"],
    "喝酒": ["生活习惯", "社交"],
    "赌博": ["价值观", "责任感"],
    "撒谎": ["信任", "诚实"],
    "懒惰": ["上进心", "责任感"],
    "冷漠": ["情感", "沟通"],
    "自私": ["性格", "价值观"],
    "花心": ["忠诚", "信任"],
    "暴力": ["安全", "性格"],
    "抠门": ["消费观", "价值观"],
    "妈宝": ["独立性", "家庭"],
    "邋遢": ["生活习惯", "生活品质"],
}


def _get_char_compat(char_a: str, char_b: str) -> int:
    """获取性格相容度分数"""
    for (c1, c2), score in CHARACTER_COMPAT.items():
        if (char_a in c1 or char_a in c2) and (char_b in c1 or char_b in c2):
            return score
    # 模糊匹配
    char_a_lower = char_a.lower() if char_a else ""
    char_b_lower = char_b.lower() if char_b else ""
    for (c1, c2), score in CHARACTER_COMPAT.items():
        if (c1 in char_a_lower or char_a_lower in c1) and (c2 in char_b_lower or char_b_lower in c2):
            return score
        if (c2 in char_a_lower or char_a_lower in c2) and (c1 in char_b_lower or char_b_lower in c1):
            return score
    return 72  # 默认适中分数


def _get_style_compat(style_a: str, style_b: str) -> int:
    """获取说话风格相容度分数"""
    for (s1, s2), score in SPEAK_STYLE_COMPAT.items():
        if (style_a in s1 or style_a in s2) and (style_b in s1 or style_b in s2):
            return score
    # 相同风格
    if style_a and style_b and style_a == style_b:
        return 82
    return 75


def _get_love_compat(love_a: str, love_b: str) -> int:
    """获取恋爱模式相容度分数"""
    for (l1, l2), score in LOVE_STYLE_COMPAT.items():
        if (love_a in l1 or love_a in l2) and (love_b in l1 or love_b in l2):
            return score
    return 78


def _compare_values(view_a: dict, view_b: dict) -> tuple:
    """比较双方价值观，返回(匹配分, 共同点列表, 差异点列表)"""
    if not view_a or not view_b:
        return 70, [], []

    matches = []
    diffs = []
    total_score = 0
    fields_checked = 0

    for field, keywords in VALUE_KEYWORDS.items():
        text_a = str(view_a.get(field, "")).lower()
        text_b = str(view_b.get(field, "")).lower()
        if not text_a or not text_b:
            continue
        fields_checked += 1

        matches_a = sum(1 for kw, _ in keywords.items() if kw in text_a)
        matches_b = sum(1 for kw, _ in keywords.items() if kw in text_b)

        if matches_a >= 2 and matches_b >= 2:
            # 检查重叠的关键词
            kw_a = {kw for kw, _ in keywords.items() if kw in text_a}
            kw_b = {kw for kw, _ in keywords.items() if kw in text_b}
            overlap = len(kw_a & kw_b)
            if overlap >= 2:
                total_score += 90
                matches.append(_field_name(field))
            elif overlap >= 1:
                total_score += 78
            else:
                total_score += 65
        elif matches_a >= 1 and matches_b >= 1:
            total_score += 72
        else:
            total_score += 60
            diffs.append(_field_name(field))

    avg_score = int(total_score / max(fields_checked, 1))
    return avg_score, matches, diffs


def _field_name(field: str) -> str:
    return {"family": "家庭观", "consume": "消费观", "marriage": "婚姻观", "ideal_partner": "理想伴侣"}.get(field, field)


def _detect_taboo_conflicts(profile_a: dict, profile_b: dict) -> list:
    """检测禁忌冲突"""
    conflicts = []
    taboo_a = profile_a.get("taboo", {})
    taboo_b = profile_b.get("taboo", {})

    for taboo_profile, other_profile, side in [(taboo_a, profile_b, "A"), (taboo_b, profile_a, "B")]:
        if not taboo_profile or not isinstance(taboo_profile, dict):
            continue
        behaviors = taboo_profile.get("behaviors", [])
        if not behaviors:
            continue

        for behavior in behaviors:
            behavior_lower = str(behavior).lower()
            for taboo_kw, categories in TABOO_KEYWORDS.items():
                if taboo_kw in behavior_lower:
                    # 检查对方画像是否触发该禁忌
                    other_values = str(other_profile.get("values_view", "")).lower()
                    other_char = str(other_profile.get("character", "")).lower()
                    other_love = str(other_profile.get("love_style", "")).lower()
                    other_combined = other_values + other_char + other_love

                    for cat in categories:
                        if cat.lower() in other_combined or cat.lower() in behavior_lower:
                            conflicts.append(f"{side}方不接受{taboo_kw}，与对方特质存在潜在冲突")
                            break
                    break

    return list(set(conflicts))  # 去重


def _fallback_analysis(messages: list[dict], profile_a: dict, profile_b: dict) -> dict:
    """基于用户真实画像数据的匹配分析"""
    total_msgs = len(messages)
    a_msgs = [m for m in messages if m["speaker"] == "agent_a"]
    b_msgs = [m for m in messages if m["speaker"] == "agent_b"]

    # ── 1. 情感契合度：消息互动 + 性格相容 ──
    a_avg_len = sum(len(m["content"]) for m in a_msgs) / max(len(a_msgs), 1)
    b_avg_len = sum(len(m["content"]) for m in b_msgs) / max(len(b_msgs), 1)
    length_balance = 100 - abs(a_avg_len - b_avg_len) * 2
    length_balance = max(40, min(100, int(length_balance)))

    char_a = profile_a.get("character", "")
    char_b = profile_b.get("character", "")
    char_compat = _get_char_compat(char_a, char_b)

    emotion_score = int(length_balance * 0.4 + char_compat * 0.6)
    emotion_score = max(40, min(100, emotion_score))

    # ── 2. 价值观匹配度：基于 values_view 比对 ──
    view_a = profile_a.get("values_view", {})
    view_b = profile_b.get("values_view", {})
    value_score, value_matches, value_diffs = _compare_values(view_a, view_b)

    # ── 3. 沟通舒适度：说话风格互补 ──
    style_a = profile_a.get("speak_style", "")
    style_b = profile_b.get("speak_style", "")
    style_compat = _get_style_compat(style_a, style_b)
    comm_score = int(style_compat * 0.6 + length_balance * 0.4)
    comm_score = max(40, min(100, comm_score))

    # ── 4. 生活方式匹配度：恋爱模式 + 消息互动 ──
    love_a = profile_a.get("love_style", "")
    love_b = profile_b.get("love_style", "")
    love_compat = _get_love_compat(love_a, love_b)
    life_score = int(love_compat * 0.5 + length_balance * 0.5)
    life_score = max(40, min(100, life_score))

    # ── 5. 未来规划契合度：价值观共性 ──
    future_score = value_score  # 价值观决定未来规划
    # 如果双方在多个维度一致，加分
    if len(value_matches) >= 3:
        future_score = min(100, future_score + 8)
    if len(value_matches) >= 2:
        future_score = min(100, future_score + 4)

    # ── 6. 禁忌冲突检测 ──
    taboo_conflicts = _detect_taboo_conflicts(profile_a, profile_b)
    taboo_penalty = len(taboo_conflicts) * 12  # 每个冲突扣12分

    dimensions = {
        "emotion": emotion_score,
        "value": value_score,
        "communication": comm_score,
        "lifestyle": life_score,
        "future": future_score,
    }

    weights = {"emotion": 0.25, "value": 0.25, "communication": 0.20, "lifestyle": 0.15, "future": 0.15}
    raw_score = int(sum(dimensions[k] * weights[k] for k in weights))
    score = max(30, min(95, raw_score - taboo_penalty))

    # ── 构建优势 & 风险文本 ──
    advantages = []
    risks = []

    # 维度得分评价
    dim_labels = {
        "emotion": "情感契合度", "value": "价值观匹配度",
        "communication": "沟通舒适度", "lifestyle": "生活方式匹配度",
        "future": "未来规划契合度",
    }
    top_dims = sorted(dimensions.items(), key=lambda x: x[1], reverse=True)

    for key, val in top_dims:
        if val >= 82:
            advantages.append(f"{dim_labels[key]}高（{val}分）")
        elif val < 58:
            risks.append(f"{dim_labels[key]}较低（{val}分）")

    # 性格匹配评价
    if char_a and char_b:
        if char_compat >= 88:
            advantages.append(f"{char_a}型与{char_b}型性格高度互补")
        elif char_compat >= 78:
            advantages.append(f"{char_a}型与{char_b}型性格基本相容")
        else:
            risks.append(f"{char_a}型与{char_b}型性格需要磨合")

    # 价值观匹配细节
    if value_matches:
        advantages.append(f"在{'、'.join(value_matches[:3])}方面观念相近")
    if value_diffs:
        risks.append(f"在{'、'.join(value_diffs[:3])}方面存在差异，需沟通")

    # 风格匹配
    if style_compat >= 88:
        advantages.append(f"“{style_a}”与“{style_b}”的沟通风格兼容度高")
    elif style_compat < 75:
        risks.append(f"“{style_a}”与“{style_b}”的沟通风格差异较大")

    # 禁忌冲突
    for conflict in taboo_conflicts:
        risks.append(conflict)

    # ── 个性化建议 ──
    suggest_parts = []
    if score >= 85:
        suggest_parts.append("匹配度优秀，性格与价值观高度契合，强烈建议解锁真人聊天")
    elif score >= 70:
        suggest_parts.append("匹配度良好，有一定发展潜力，建议解锁进一步了解")
    elif score >= 55:
        suggest_parts.append("匹配度尚可，可以尝试解锁但需多加了解对方")
    else:
        suggest_parts.append("匹配度偏低，建议谨慎考虑")

    # 互动话题推荐（基于共同点）
    topic_map = {
        "家庭观": "可以聊聊各自的原生家庭和未来期待的家庭模式",
        "消费观": "可以聊聊日常消费习惯，了解彼此的金钱观",
        "婚姻观": "可以聊聊对婚姻的看法，看看是否方向一致",
        "理想伴侣": "可以聊聊各自理想中的相处模式",
    }
    for match_field in value_matches[:2]:
        if match_field in topic_map:
            suggest_parts.append(topic_map[match_field])

    # 相处提醒（基于差异点）
    if value_diffs:
        field_names = "、".join(value_diffs[:2])
        suggest_parts.append(f"在{field_names}上有分歧，建议用开放心态倾听对方想法，不必急于说服")

    if taboo_conflicts:
        suggest_parts.append("注意潜在的价值观冲突点，建议在聊天中温和地试探双方底线")

    if char_compat < 75:
        suggest_parts.append("性格差异需要更多耐心和理解，可以尝试从共同话题切入建立信任")

    return {
        "dimensions": dimensions,
        "score": score,
        "advantage": "；".join(advantages) if advantages else "双方在核心维度上基本匹配，有进一步发展的潜力",
        "risk": "；".join(risks) if risks else "暂未发现明显风险点",
        "suggest": "。".join(suggest_parts) + "。",
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
