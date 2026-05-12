# Stage 1: Build virtual environment
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip python -m venv /venv && \
    /venv/bin/pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
RUN useradd -m -s /bin/bash appuser
WORKDIR /app
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"
COPY . .
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1
LABEL org.opencontainers.image.title="matching-agent"
LABEL org.opencontainers.image.description="Dual-AI Agent Matchmaking Platform - Agent Service"
LABEL org.opencontainers.image.version="1.0.0"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
