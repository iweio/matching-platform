from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from models import (
    ModelRefreshRequest,
    ModelRefreshResponse,
    ChatStartRequest,
    ChatStartResponse,
    GenerateReportRequest,
    GenerateReportResponse,
    RiskDetectRequest,
    RiskDetectResponse,
    ApiResponse,
)
from graphs.model_refresh import model_refresh_app
from graphs.chat_start import chat_start_app, stream_chat_start
from graphs.generate_report import generate_report_app
from graphs.risk_detect import risk_detect_app
from store import ChatStore

app = FastAPI(
    title="双智能体婚恋相亲平台 - 智能体算法服务",
    description="基于 LangGraph + FastAPI 的智能体算法层，包含人格蒸馏、双AI对话、适配报告、风险检测",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ApiResponse(code=500, msg=f"服务器内部错误: {str(exc)}", data=None).model_dump(),
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "agent-service", "version": "1.0.0"}


@app.post("/api/agent/algo/model-refresh", response_model=ApiResponse)
async def model_refresh(req: ModelRefreshRequest):
    result = await model_refresh_app.ainvoke({"request": req.model_dump()})

    if result.get("error"):
        return ApiResponse(code=400, msg=result["error"], data=None)

    return ApiResponse(
        code=200,
        msg="模型生成成功",
        data=ModelRefreshResponse(
            model_version=result["model_version"],
            status=result["status"],
        ).model_dump(),
    )


@app.post("/api/agent/algo/chat-start", response_model=ApiResponse)
async def chat_start(req: ChatStartRequest):
    result = await chat_start_app.ainvoke({"request": req.model_dump()})

    if result.get("error"):
        return ApiResponse(code=400, msg=result["error"], data=None)

    return ApiResponse(
        code=200,
        msg="对话已启动",
        data=ChatStartResponse(
            session_id=result["session_id"],
            chat_status=result["chat_status"],
        ).model_dump(),
    )


@app.post("/api/agent/algo/generate-report", response_model=ApiResponse)
async def generate_report(req: GenerateReportRequest):
    result = await generate_report_app.ainvoke({"request": req.model_dump()})

    if result.get("error"):
        return ApiResponse(code=400, msg=result["error"], data=None)

    return ApiResponse(
        code=200,
        msg="报告生成成功",
        data=GenerateReportResponse(
            score=result["score"],
            dimensions=result["dimensions"],
            advantage=result["advantage"],
            risk=result["risk"],
            suggest=result["suggest"],
        ).model_dump(),
    )


@app.post("/api/agent/algo/risk-detect", response_model=ApiResponse)
async def risk_detect(req: RiskDetectRequest):
    result = await risk_detect_app.ainvoke({"request": req.model_dump()})

    if result.get("error"):
        return ApiResponse(code=400, msg=result["error"], data=None)

    return ApiResponse(
        code=200,
        msg="检测完成",
        data=RiskDetectResponse(
            risk_tags=result["risk_tags"],
            risk_score=result["risk_score"],
            block_suggest=result["block_suggest"],
        ).model_dump(),
    )


@app.post("/api/agent/algo/chat-start-stream")
async def chat_start_stream(req: ChatStartRequest):
    return StreamingResponse(
        stream_chat_start(req.model_dump()),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/agent/algo/chat-record")
async def get_chat_record(session_id: str, since_id: str = ""):
    session = ChatStore.get_session(session_id)
    if not session:
        return ApiResponse(code=404, msg=f"会话 {session_id} 不存在", data=None)

    if since_id:
        messages = ChatStore.get_messages_since(session_id, since_id)
    else:
        messages = ChatStore.get_messages(session_id)

    records = [m.model_dump() for m in messages]
    return ApiResponse(
        code=200,
        msg="success",
        data={
            "records": records,
            "has_more": session.status == "running",
            "chat_status": session.status,
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
