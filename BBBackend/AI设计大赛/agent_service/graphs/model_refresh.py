from typing import TypedDict
from datetime import datetime
from langgraph.graph import StateGraph, END
from models import ModelRefreshRequest, AgentProfile
from store import AgentStore


class ModelRefreshState(TypedDict):
    request: dict
    profile: dict
    model_version: str
    status: str
    error: str


def validate_input(state: ModelRefreshState) -> ModelRefreshState:
    req = state["request"]
    if not req.get("user_id") or not req.get("agent_id"):
        state["error"] = "user_id 和 agent_id 不能为空"
        state["status"] = "failed"
        return state
    if AgentStore.exists(req["agent_id"]):
        state["error"] = f"智能体 {req['agent_id']} 已存在"
        state["status"] = "failed"
        return state
    state["status"] = "validated"
    return state


def build_system_prompt(state: ModelRefreshState) -> ModelRefreshState:
    req = state["request"]
    values = req.get("values_view", {}) or {}
    taboo = req.get("taboo", {}) or {}

    values_lines = "\n".join([f"- {k}：{v}" for k, v in values.items()]) if values else "- 无特殊要求"
    taboo_lines = "\n".join([f"- {k}：{v}" for k, v in taboo.items()]) if taboo else "- 无"

    system_prompt = f"""你是一个婚恋智能体，代表用户 {req.get('user_id')} 进行婚恋匹配对话。

## 你的人格设定
- 说话风格：{req.get('speak_style', '自然')}
- 性格类型：{req.get('character', '友善')}
- 恋爱模式：{req.get('love_style', '真诚')}

## 你的三观
{values_lines}

## 你的雷点底线
{taboo_lines}

## 对话规则
1. 用你的人格设定自然地与对方交流
2. 逐步了解对方的三观、性格、生活习惯
3. 遇到触及雷点的内容时，礼貌地表达不适
4. 保持真诚，不伪装，不套路
5. 每次回复控制在2-4句话，像真人聊天一样自然
"""

    state["profile"] = {
        "agent_id": req["agent_id"],
        "user_id": req["user_id"],
        "speak_style": req["speak_style"],
        "character": req["character"],
        "love_style": req["love_style"],
        "values_view": values,
        "taboo": taboo,
        "system_prompt": system_prompt,
    }
    return state


def save_profile(state: ModelRefreshState) -> ModelRefreshState:
    profile_data = state["profile"]
    version = datetime.now().strftime("v%Y%m%d%H%M%S")

    profile = AgentProfile(
        agent_id=profile_data["agent_id"],
        user_id=profile_data["user_id"],
        speak_style=profile_data["speak_style"],
        character=profile_data["character"],
        love_style=profile_data["love_style"],
        values_view=profile_data["values_view"],
        taboo=profile_data["taboo"],
        system_prompt=profile_data["system_prompt"],
        model_version=version,
        created_at=datetime.now().isoformat(),
    )
    AgentStore.save_profile(profile)

    state["model_version"] = version
    state["status"] = "success"
    return state


def handle_error(state: ModelRefreshState) -> ModelRefreshState:
    state["status"] = "failed"
    return state


def should_continue(state: ModelRefreshState) -> str:
    if state.get("error"):
        return "handle_error"
    return "build_system_prompt"


def build_model_refresh_graph() -> StateGraph:
    graph = StateGraph(ModelRefreshState)

    graph.add_node("validate_input", validate_input)
    graph.add_node("build_system_prompt", build_system_prompt)
    graph.add_node("save_profile", save_profile)
    graph.add_node("handle_error", handle_error)

    graph.set_entry_point("validate_input")

    graph.add_conditional_edges(
        "validate_input",
        should_continue,
        {
            "build_system_prompt": "build_system_prompt",
            "handle_error": "handle_error",
        },
    )
    graph.add_edge("build_system_prompt", "save_profile")
    graph.add_edge("save_profile", END)
    graph.add_edge("handle_error", END)

    return graph.compile()


model_refresh_app = build_model_refresh_graph()
