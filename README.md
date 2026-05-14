# 双智能体婚恋相亲平台

基于双智能体（Dual-Agent）架构的在线婚恋相亲匹配平台。后端 Spring Boot + Python FastAPI 智能体服务 + React 前端。

## 快速开始

```bash
# 1. 克隆
git clone <repo-url> && cd Total

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 API Key（DeepSeek / OpenAI 至少配一个）

# 3. 启动全部服务
docker compose up -d

# 4. 访问
#   前端:  http://localhost:3000
#   后端:  http://localhost:8080
#   智能体: http://localhost:8001
```

## 项目结构

```
Total/
├── Backend/                    # Spring Boot 后端
│   ├── src/main/java/...       # 源码
│   ├── src/main/resources/
│   │   ├── db/schema.sql       # Docker 初始化建表
│   │   └── schema.sql          # Spring Boot 初始化建表
│   ├── ai-competition/agent_service/  # Python FastAPI 智能体
│   └── API文档/                 # API 接口文档 (.docx + 生成脚本)
├── Untitled/                   # React 前端 (Vite + TypeScript)
├── docker-compose.yml          # 一键部署编排
├── Makefile                    # 常用命令
├── scripts/                    # 测试脚本
└── .env.example                # 环境变量模板
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | Nginx 静态资源 |
| Backend | 8080 | Spring Boot REST API |
| Agent | 8001 | Python FastAPI 智能体 |
| MySQL | 3307 | MySQL 8.0 |

## 常用命令

```bash
make up        # 启动全部服务
make down      # 停止全部服务
make build     # 重新构建镜像
make logs      # 查看日志
make clean     # 清理（含数据卷）
make test      # 运行 Docker 集成测试
```

## 技术栈

- **后端**: Spring Boot 3.5.6, MyBatis, MySQL 8.0
- **智能体**: Python 3.11, FastAPI, LangGraph, DeepSeek/OpenAI
- **前端**: React 18, Vite, TypeScript, Tailwind CSS
- **部署**: Docker Compose, Nginx
