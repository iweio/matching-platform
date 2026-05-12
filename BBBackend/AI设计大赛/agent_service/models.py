from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ModelRefreshRequest(BaseModel):
    user_id: str = Field(description="用户ID")
    agent_id: str = Field(description="智能体ID")
    speak_style: str = Field(description="说话风格")
    character: str = Field(description="性格类型")
    love_style: str = Field(description="恋爱模式")
    values_view: dict = Field(default_factory=dict, description="三观数据")
    taboo: dict = Field(default_factory=dict, description="雷点底线")


class ModelRefreshResponse(BaseModel):
    model_version: str
    status: str


class ChatStartRequest(BaseModel):
    match_id: str = Field(description="匹配ID")
    agent_id_a: str = Field(description="我方智能体ID")
    agent_id_b: str = Field(description="对方智能体ID")
    round_limit: int = Field(default=30, description="对话轮数上限")


class ChatStartResponse(BaseModel):
    session_id: str
    chat_status: str


class ChatMessage(BaseModel):
    id: str
    speaker: str
    content: str
    timestamp: str


class GenerateReportRequest(BaseModel):
    session_id: str = Field(description="对话会话ID")
    match_id: str = Field(description="匹配ID")


class Dimensions(BaseModel):
    emotion: int = Field(description="情感契合度")
    value: int = Field(description="价值观匹配度")
    communication: int = Field(description="沟通舒适度")
    lifestyle: int = Field(description="生活方式匹配度")
    future: int = Field(description="未来规划契合度")


class GenerateReportResponse(BaseModel):
    score: int
    dimensions: Dimensions
    advantage: str
    risk: str
    suggest: str


class RiskDetectRequest(BaseModel):
    session_id: str = Field(description="对话会话ID")
    chat_record: list[ChatMessage] = Field(description="对话记录")


class RiskDetectResponse(BaseModel):
    risk_tags: list[str]
    risk_score: int
    block_suggest: str


class AgentProfile(BaseModel):
    agent_id: str
    user_id: str
    speak_style: str
    character: str
    love_style: str
    values_view: dict = Field(default_factory=dict)
    taboo: dict = Field(default_factory=dict)
    system_prompt: str = ""
    model_version: str = ""
    created_at: str = ""


class ChatSession(BaseModel):
    session_id: str
    match_id: str
    agent_id_a: str
    agent_id_b: str
    status: str
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: str = ""


class ApiResponse(BaseModel):
    code: int = 200
    msg: str = "success"
    data: Optional[dict] = None
