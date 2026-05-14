# 双智能体婚恋相亲平台 · 智能体算法服务

基于 **FastAPI + LangGraph** 的智能体算法层，提供人格蒸馏、双AI对话、适配报告生成、风险检测四大核心能力。

---

## 目录

- [快速启动](#快速启动)
- [服务架构](#服务架构)
- [API 文档](#api-文档)
- [数据模型](#数据模型)
- [工作流说明](#工作流说明)
- [后端对接指南](#后端对接指南)
- [环境变量](#环境变量)
- [降级策略](#降级策略)
- [常见问题](#常见问题)

---

## 快速启动

### 方式一：Docker 部署（推荐）

#### 环境要求

- Docker + Docker Compose

#### 配置

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 配置 OpenAI API Key（可选，不配则自动降级）
# nano .env
```

#### 启动

```bash
docker-compose up -d
```

#### 验证

```bash
curl http://localhost:8001/health
```

#### 停止

```bash
docker-compose down
```

### 方式二：本地开发

#### 环境要求

- Python **3.11+**
- 可选：OpenAI API Key（不配置则自动使用降级模式）

#### 安装

```bash
cd agent_service
pip install -r requirements.txt
```

#### 配置环境变量

```bash
# 必填：无
# 选填：以下环境变量均可通过 .env 或系统环境变量设置

# OpenAI 配置（不配则自动降级为模板回复）
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_BASE_URL=https://api.openai.com/v1
export LLM_MODEL=gpt-4o-mini
```

#### 启动服务

```bash
python main.py
```

服务默认运行在 **http://localhost:8001**

### 验证服务

```bash
# 健康检查
curl http://localhost:8001/health

# 预期返回
{"status":"ok","service":"agent-service","version":"1.0.0"}
```

---

## 服务架构

```
┌──────────────────────────────────────────────────────────────────┐
│                   Agent Service (:8001)                          │
│                                                                  │
│  ┌─────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  Personality  │  │   Dual-AI  │  │  Matching   │                │
│  │   Distill    │  │  Dialogue  │  │   Report    │                │
│  │  (LangGraph) │  │ (LangGraph)│  │ (LangGraph) │                │
│  └──────┬───────┘  └─────┬──────┘  └──────┬──────┘                │
│         │                │                │                       │
│         ▼                ▼                ▼                       │
│  ┌──────────────────────────────────────────────────┐             │
│  │                 LLM Client                        │             │
│  │  OpenAI (可用)  ──→  模板降级 (不可用时)            │             │
│  └──────────────────────────────────────────────────┘             │
│         │                │                │                       │
│         ▼                ▼                ▼                       │
│  ┌──────────────────────────────────────────────────┐             │
│  │     AgentStore (智能体档案)  /  ChatStore (对话)    │             │
│  │              内存存储（V1，后续可迁移Redis）         │             │
│  └──────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| 服务入口 | [main.py](main.py) | FastAPI 应用，注册路由、中间件、异常处理 |
| 数据模型 | [models.py](models.py) | 所有请求/响应的 Pydantic Schema |
| 内存存储 | [store.py](store.py) | AgentStore（智能体档案）/ ChatStore（对话记录） |
| LLM客户端 | [llm_client.py](llm_client.py) | OpenAI 调用 + 降级模板，单例模式 |
| 人格蒸馏 | [graphs/model_refresh.py](graphs/model_refresh.py) | 将用户人格数据构建为 AI System Prompt |
| 双AI对话 | [graphs/chat_start.py](graphs/chat_start.py) | 两个智能体自动完成20-50轮对话 |
| 报告生成 | [graphs/generate_report.py](graphs/generate_report.py) | 基于对话生成五维适配报告 |
| 风险检测 | [graphs/risk_detect.py](graphs/risk_detect.py) | 实时检测对话中的风险信号 |

---

## API 文档

### 通用说明

**Base URL**: `http://localhost:8001`

**统一响应格式**:

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

**错误响应**:

```json
{
  "code": 400,
  "msg": "具体错误信息",
  "data": null
}
```

**错误码**:

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误（请求参数不合法） |
| 404 | 资源不存在（Session/Agent 未找到） |
| 500 | 服务器内部错误 |

---

### 1. 健康检查

> 后端对接前可通过此接口确认服务是否正常

```
GET /health
```

**响应示例**:

```json
{
  "status": "ok",
  "service": "agent-service",
  "version": "1.0.0"
}
```

---

### 2. 人格蒸馏

> **由后端服务层在用户完成人格蒸馏后调用**
>
> 将用户的人格数据灌入 AI，生成专属智能体

```
POST /api/agent/algo/model-refresh
```

**请求体**:

```json
{
  "user_id": "user_20260504_001",
  "agent_id": "agent_20260504_001",
  "speak_style": "幽默风趣",
  "character": "外向开朗",
  "love_style": "浪漫型",
  "values_view": {
    "marriage_view": "婚姻是人生大事",
    "money_view": "钱够用就好",
    "family_view": "重视家庭"
  },
  "taboo": {
    "hate_behavior": ["出轨", "冷暴力", "妈宝"],
    "hate_habit": ["赌博", "酗酒"]
  }
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户唯一ID |
| agent_id | string | 是 | 智能体唯一ID |
| speak_style | string | 是 | 说话风格。可选值：幽默风趣、温柔细腻、直接干脆、文艺清新、霸气外露 |
| character | string | 是 | 性格类型。可选值：外向开朗、内向沉稳、理性冷静、感性浪漫、独立自主 |
| love_style | string | 是 | 恋爱模式。可选值：浪漫型、务实型、陪伴型、成长型、自由型 |
| values_view.marriage_view | string | 是 | 婚姻观 |
| values_view.money_view | string | 是 | 消费观 |
| values_view.family_view | string | 是 | 家庭观 |
| taboo.hate_behavior | string[] | 否 | 不能接受的行为列表 |
| taboo.hate_habit | string[] | 否 | 不能接受的习惯列表 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "模型生成成功",
  "data": {
    "model_version": "v20260504120000",
    "status": "success"
  }
}
```

**错误响应**:

```json
{
  "code": 400,
  "msg": "智能体 agent_xxx 已存在",
  "data": null
}
```

| model_version | string | 模型版本号（时间戳格式：vYYYYMMDDHHMMSS） |
| status | string | 固定值 "success" |

**后端对接时序**:

```
后端服务层                              Agent Service
    │                                        │
    │  ── POST /api/user/distill ──→          │  (用户提交蒸馏数据)
    │                                        │
    │  ── POST /api/agent/algo/model-refresh →│  (内部调用)
    │                                        │  ├─ 校验参数合法性
    │  ←──────── 200 ───────────────         │  ├─ 构建 System Prompt
    │                                        │  └─ 保存到 AgentStore
    │                                        │
    │  返回前端 { status: "processing" }      │
```

---

### 3. 启动双AI对话

> **由后端服务层在匹配成功后调用**
>
> 两个智能体基于各自人格自动展开 20-50 轮对话

```
POST /api/agent/algo/chat-start
```

**请求体**:

```json
{
  "match_id": "match_20260504_001",
  "agent_id_a": "agent_20260504_001",
  "agent_id_b": "agent_20260504_002",
  "round_limit": 30
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| match_id | string | 是 | - | 匹配ID |
| agent_id_a | string | 是 | - | 我方智能体ID（必须在AgentStore中存在） |
| agent_id_b | string | 是 | - | 对方智能体ID（必须在AgentStore中存在） |
| round_limit | int | 否 | 30 | 对话轮数上限，范围 10-50 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "对话已启动",
  "data": {
    "session_id": "session_20260504120000_abc123",
    "chat_status": "running"
  }
}
```

| session_id | string | 对话会话ID，后续查询/报告/检测接口需要此ID |
| chat_status | string | running（对话进行中）/ completed（对话已完成）/ failed（对话失败） |

**错误响应**:

```json
{
  "code": 400,
  "msg": "智能体 agent_xxx 不存在，请先完成人格蒸馏",
  "data": null
}
```

**注意**：

- 此接口**异步执行**，返回 `chat_status: "running"` 表示对话已开始
- 对话完成后状态自动变为 `completed`
- 可通过 `GET /api/agent/algo/chat-record` 轮询对话进度

**后端对接时序**:

```
后端服务层                              Agent Service
    │                                        │
    │  ── POST /api/agent/algo/chat-start →  │
    │  ←── { session_id, running } ───       │  ├─ 校验双方智能体
    │                                        │  ├─ 初始化 Session
    │                                        │  ├─ A方开场白
    │                                        │  └─ 交替对话(20-50轮)
    │                                        │
    │                   对话进行中...           │
    │                                        │
    │  ── GET /api/agent/algo/chat-record →  │  (前端轮询)
    │  ←── { records, has_more: true } ───    │
    │                                        │
    │  ── POST /api/agent/algo/risk-detect → │  (全程检测)
    │                                        │
    │                   对话结束               │
    │                                        │
    │  ── POST /api/agent/algo/generate-report│
```

---

### 4. 查询对话记录

> **由后端服务层调用，供前端轮询展示AI对话气泡**
>
> 支持增量查询

```
GET /api/agent/algo/chat-record?session_id=xxx&since_id=msg_0010
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 对话会话ID |
| since_id | string | 否 | 上次最后一条消息的ID。不传则返回全部消息 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "msg_0000",
        "speaker": "agent_a",
        "content": "你好呀，很高兴认识你！",
        "timestamp": "2026-05-04 10:00:00"
      },
      {
        "id": "msg_0001",
        "speaker": "agent_b",
        "content": "你好，我是来自北京的小姐姐~",
        "timestamp": "2026-05-04 10:00:05"
      }
    ],
    "has_more": true,
    "chat_status": "running"
  }
}
```

| records | array | 消息列表 |
| records[].id | string | 消息ID（格式：msg_0000, msg_0001...） |
| records[].speaker | string | 发送者：agent_a（我方）/ agent_b（对方） |
| records[].content | string | 消息文本内容 |
| records[].timestamp | string | 发送时间，格式：YYYY-MM-DD HH:mm:ss |
| has_more | bool | true=对话仍在进行，false=对话已结束 |
| chat_status | string | running / completed |

**前端轮询逻辑参考**:

```python
# 伪代码：后端服务层转发给前端的轮询逻辑
last_id = ""
while True:
    resp = await client.get(
        f"http://localhost:8001/api/agent/algo/chat-record",
        params={"session_id": session_id, "since_id": last_id}
    )
    data = resp.json()["data"]
    for msg in data["records"]:
        # 转发给前端
        last_id = msg["id"]
    if not data["has_more"]:
        break
    await asyncio.sleep(2)
```

---

### 5. 生成适配报告

> **由后端服务层在双AI对话结束后调用**
>
> 基于完整对话数据，LLM 分析生成五维适配报告

```
POST /api/agent/algo/generate-report
```

**请求体**:

```json
{
  "session_id": "session_20260504120000_abc123",
  "match_id": "match_20260504_001"
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 对话会话ID |
| match_id | string | 是 | 匹配ID |

**成功响应**:

```json
{
  "code": 200,
  "msg": "报告生成成功",
  "data": {
    "score": 85,
    "dimensions": {
      "emotion": 90,
      "value": 88,
      "communication": 82,
      "lifestyle": 80,
      "future": 85
    },
    "advantage": "双方价值观契合度高，沟通风格互补，有共同的生活追求",
    "risk": "双方在消费观念上存在一定差异，建议进一步沟通",
    "suggest": "建议解锁真人聊天，线下见面加深了解，重点关注消费观念磨合"
  }
}
```

| score | int | 匹配总分（0-100），五维加权综合 |
| dimensions.emotion | int | 情感契合度（0-100）。评估对话热情度、互动质量 |
| dimensions.value | int | 价值观匹配度（0-100）。评估三观一致性 |
| dimensions.communication | int | 沟通舒适度（0-100）。评估对话流畅度、自然度 |
| dimensions.lifestyle | int | 生活方式匹配度（0-100）。评估生活习惯、消费观念 |
| dimensions.future | int | 未来规划契合度（0-100）。评估对未来的共同期待 |
| advantage | string | 优势分析（不超过100字） |
| risk | string | 风险提示（不超过100字） |
| suggest | string | 婚恋建议（不超过100字） |

**错误响应**:

```json
{
  "code": 400,
  "msg": "会话 session_xxx 不存在",
  "data": null
}
```

**注意**：session 状态必须为 `completed`，否则返回错误。

---

### 6. 风险检测

> **由后端服务层在对话进行中全程调用**
>
> 实时检测对话中的风险信号，支持 LLM 语义分析和关键词匹配两种模式

```
POST /api/agent/algo/risk-detect
```

**请求体**:

```json
{
  "session_id": "session_20260504120000_abc123",
  "chat_record": [
    {
      "id": "msg_0000",
      "speaker": "agent_a",
      "content": "你好呀，很高兴认识你！",
      "timestamp": "2026-05-04 10:00:00"
    },
    {
      "id": "msg_0001",
      "speaker": "agent_b",
      "content": "呵呵，随便吧",
      "timestamp": "2026-05-04 10:00:05"
    }
  ]
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 对话会话ID |
| chat_record | array | 是 | 要检测的对话消息列表 |
| chat_record[].id | string | 是 | 消息ID |
| chat_record[].speaker | string | 是 | agent_a / agent_b |
| chat_record[].content | string | 是 | 消息内容 |
| chat_record[].timestamp | string | 是 | 时间戳 |

**成功响应**:

```json
{
  "code": 200,
  "msg": "检测完成",
  "data": {
    "risk_tags": ["agent_b(敷衍)"],
    "risk_score": 35,
    "block_suggest": "检测到轻微风险信号：agent_b(敷衍)。可继续匹配，但需留意后续互动。"
  }
}
```

| risk_tags | string[] | 风险标签列表。格式：["agent_a(风险类型)", "agent_b(风险类型)"] |
| risk_score | int | 风险评分（0-100）。0-20=安全，20-40=轻微，40-70=中等，70以上=高风险 |
| block_suggest | string | 拦截建议 |

**风险类型说明**:

| 风险类型 | LLM检测模式 | 关键词模式 | 示例 |
|----------|------------|-----------|------|
| 敷衍 | 语义分析回复质量 | 嗯/哦/呵呵/随便/都行/还行吧/不知道 | "呵呵"、"随便吧" |
| 冷漠 | 语义分析情感温度 | 关我什么事/无所谓/不感兴趣/别烦我 | "不感兴趣" |
| 情绪化 | 语义分析情绪稳定性 | 烦死了/气死我了/滚/无语/受不了 | "烦死了" |
| 利己主义 | 语义分析共情能力 | 你必须/你应该/给我/凭什么/我不管 | "你应该这样" |
| 套路化 | 语义分析对话自然度 | 在吗/发张照片/你多高/收入多少/有房吗/有车吗 | "你工资多少" |
| 不尊重 | 语义分析尊重程度 | 你懂什么/就你/你这种人 | "你懂什么" |
| 过度打探 | 语义分析隐私边界 | 工资多少/存款多少/家里干什么的 | "你存款多少" |

**风险评分等级**:

| 评分区间 | 等级 | 建议 |
|----------|------|------|
| 0-20 | 安全 | 未检测到明显风险 |
| 20-40 | 轻微 | 可继续匹配，需留意 |
| 40-70 | 中等 | 建议关注并评估 |
| 70-100 | 高风险 | 强烈建议终止匹配 |

---

## 数据模型

### AgentProfile（智能体档案）

存储在 `AgentStore` 中，key 为 `agent_id`。

```python
class AgentProfile:
    agent_id: str        # 智能体唯一ID
    user_id: str         # 关联用户ID
    speak_style: str     # 说话风格
    character: str       # 性格类型
    love_style: str      # 恋爱模式
    values_view: dict    # 三观 { marriage_view, money_view, family_view }
    taboo: dict          # 雷点 { hate_behavior[], hate_habit[] }
    system_prompt: str   # 生成的 AI System Prompt（核心）
    model_version: str   # 模型版本号
    created_at: str      # 创建时间
```

### ChatSession（对话会话）

存储在 `ChatStore` 中，key 为 `session_id`。

```python
class ChatSession:
    session_id: str      # 会话唯一ID
    match_id: str        # 关联匹配ID
    agent_id_a: str      # 我方智能体ID
    agent_id_b: str      # 对方智能体ID
    status: str          # running / completed
    messages: list       # ChatMessage 列表
    created_at: str      # 创建时间
```

### ChatMessage（对话消息）

```python
class ChatMessage:
    id: str              # 消息ID（msg_0000, msg_0001...）
    speaker: str         # agent_a / agent_b
    content: str         # 消息文本
    timestamp: str       # 时间戳
```

---

## 工作流说明

### 工作流1：人格蒸馏 (model-refresh)

```
输入 → validate_input → build_system_prompt → save_profile → 结束
                        │                           │
                    构建 AI 的 System Prompt      存入 AgentStore
```

**关键输出**：`system_prompt` 包含完整人格设定和对话规则，后续所有对话都基于此 Prompt。

### 工作流2：双AI对话 (chat-start)

```
输入 → validate_agents → init_session → generate_opening
                                         ↓
                              agent_speak ←→ 循环(20-50轮)
                                         ↓
                                      finalize_chat → 结束
```

**话题推进策略**：每2轮推进一个话题（兴趣爱好→工作→感情→家庭→未来规划→消费→婚姻→理想型...）

### 工作流3：报告生成 (generate-report)

```
输入 → load_session → analyze_conversation(LLM) → 结束
                      ↓ 失败
                     结束
```

LLM不可用时自动降级为 **启发式规则**（基于消息长度平衡度、说话风格互补度等）。

### 工作流4：风险检测 (risk-detect)

```
输入 → validate_input → scan_risk_patterns → 结束
                        ↓          ↑
                   LLM分析 ←→ 关键词匹配(降级)
```

优先使用 LLM 进行语义分析，不可用时使用关键词匹配。

---

## 后端对接指南

### 完整对接时序

```
后端服务层                                  Agent Service (:8001)
    │                                              │
    │  ① 用户注册/创建智能体                         │
    │  ── POST /api/agent/algo/model-refresh ────→  │
    │  ←── { model_version, status: success } ──   │
    │                                              │
    │  ② 用户发起匹配                                │
    │  ── POST /api/agent/algo/chat-start ────────→ │
    │  ←── { session_id, chat_status: running } ─   │
    │                                              │
    │  ③ 轮询对话进度 + 展示聊天气泡                   │
    │  ── GET /api/agent/algo/chat-record ────────→ │  (每2秒)
    │  ←── { records, has_more, chat_status } ──   │
    │                                              │
    │  ④ 实时风险检测（每次收到新消息后）               │
    │  ── POST /api/agent/algo/risk-detect ───────→ │
    │  ←── { risk_tags, risk_score } ────────────   │
    │                                              │
    │  ⑤ 对话结束，生成报告                            │
    │  ── POST /api/agent/algo/generate-report ───→ │
    │  ←── { score, dimensions, advantage, ... }    │
```

### 关键注意事项

| 序号 | 注意事项 |
|------|----------|
| 1 | 必须**先调用 model-refresh** 创建智能体，再调用 chat-start。否则 chat-start 会返回"智能体不存在"错误 |
| 2 | chat-start 返回后立即返回 `running` 状态，后端**不可等待对话完成再返回**，应另起协程或任务执行 |
| 3 | 通过 `GET /api/agent/algo/chat-record` 轮询判断对话是否结束（`has_more: false` 或 `chat_status: completed`） |
| 4 | generate-report 必须在 **chat_status 为 completed** 时调用，否则返回错误 |
| 5 | risk-detect 是**有状态检测**，每次调用请传入从开始到当前的所有消息 |
| 6 | 所有数据存储在内存中（AgentStore / ChatStore），**服务重启后数据丢失**。生产环境需迁移到 Redis/MySQL |

### Python 调用示例

```python
import httpx
import asyncio

AGENT_SERVICE_URL = "http://localhost:8001"


async def create_agent(user_id: str, agent_id: str):
    """调用人格蒸馏"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{AGENT_SERVICE_URL}/api/agent/algo/model-refresh", json={
            "user_id": user_id,
            "agent_id": agent_id,
            "speak_style": "幽默风趣",
            "character": "外向开朗",
            "love_style": "浪漫型",
            "values_view": {
                "marriage_view": "婚姻是人生大事",
                "money_view": "钱够用就好",
                "family_view": "重视家庭"
            },
            "taboo": {
                "hate_behavior": ["出轨", "冷暴力"],
                "hate_habit": ["赌博"]
            }
        })
        return resp.json()


async def start_chat(match_id: str, agent_id_a: str, agent_id_b: str):
    """启动双AI对话，并轮询等待结束"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{AGENT_SERVICE_URL}/api/agent/algo/chat-start", json={
            "match_id": match_id,
            "agent_id_a": agent_id_a,
            "agent_id_b": agent_id_b,
            "round_limit": 30,
        })
        result = resp.json()
        session_id = result["data"]["session_id"]

        # 轮询等待对话完成
        last_id = ""
        while True:
            record_resp = await client.get(
                f"{AGENT_SERVICE_URL}/api/agent/algo/chat-record",
                params={"session_id": session_id, "since_id": last_id}
            )
            record_data = record_resp.json()["data"]

            # 处理新消息
            for msg in record_data["records"]:
                print(f"[{msg['speaker']}] {msg['content']}")
                last_id = msg["id"]

            # 检测风险
            if record_data["records"]:
                risk_resp = await client.post(
                    f"{AGENT_SERVICE_URL}/api/agent/algo/risk-detect",
                    json={"session_id": session_id, "chat_record": record_data["records"]}
                )
                print(f"风险检测: {risk_resp.json()['data']}")

            if not record_data["has_more"]:
                break

            await asyncio.sleep(2)

        return session_id


async def generate_report(session_id: str, match_id: str):
    """生成适配报告"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{AGENT_SERVICE_URL}/api/agent/algo/generate-report", json={
            "session_id": session_id,
            "match_id": match_id,
        })
        return resp.json()


# 完整流程
async def main():
    # 1. 创建两个智能体
    await create_agent("user_001", "agent_001")
    await create_agent("user_002", "agent_002")

    # 2. 启动对话
    session_id = await start_chat("match_001", "agent_001", "agent_002")

    # 3. 生成报告
    report = await generate_report(session_id, "match_001")
    print(f"匹配总分: {report['data']['score']}")
    print(f"分析: {report['data']['advantage']}")


asyncio.run(main())
```

---

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| OPENAI_API_KEY | 否 | "" | OpenAI API密钥。不配置则使用模板降级模式 |
| OPENAI_BASE_URL | 否 | https://api.openai.com/v1 | API 地址，可配置代理或第三方兼容接口 |
| LLM_MODEL | 否 | gpt-4o-mini | 模型名称。可选：gpt-4o, gpt-4o-mini, gpt-4-turbo 等 |

**不配置任何环境变量时**，所有功能正常工作，但回复内容为模板生成，非真实AI对话。

---

## 降级策略

| 场景 | 有API Key | 无API Key |
|------|-----------|-----------|
| 对话生成 | GPT-4o-mini 根据人格实时生成 | 基于话题关键词的模板回复（15种话题模板） |
| 报告分析 | GPT-4o-mini JSON结构输出 | 基于消息长度平衡度+风格互补度的启发式规则 |
| 风险检测 | GPT-4o-mini 语义分析 | 7类风险关键词库匹配（含命中率计算） |

**降级模式特点**：
- 对话：根据话题关键词匹配预置模板（如"兴趣爱好"→运动健身话题）
- 报告：基于消息长度比、说话风格互补度计算五维评分
- 风险：统计关键词命中率（≥30%标记风险）

---

## 常见问题

### Q1: 服务启动后所有接口都返回500

检查依赖是否安装完整：
```bash
pip install -r requirements.txt --upgrade
```

### Q2: 对话启动了但 chat-record 一直返回空

确认 `session_id` 正确，且 `since_id` 参数未误传。首次请求不传 `since_id`。

### Q3: 生成报告返回"会话尚未完成"

对话仍在进行中，等待 `chat_status` 变为 `completed` 后再调用。

### Q4: 如何确认智能体已创建成功？

调用 model-refresh 返回 `status: "success"` 即创建成功。也可通过再次调用确认（会返回"智能体已存在"）。

### Q5: 服务重启后数据还在吗？

**不在**。当前使用内存存储（V1设计），重启后所有智能体档案和对话记录丢失。生产环境需将 AgentStore / ChatStore 迁移到 Redis 或 MySQL。

### Q6: 为什么用 LangGraph？

LangGraph 提供**有状态图工作流**，可以清晰定义多步骤AI流程、条件分支和状态管理，比直接调用 LLM 更可控、可观测、可扩展。
