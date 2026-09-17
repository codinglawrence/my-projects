# PRD — RAG 企业级知识库问答系统

---

## 一、项目信息

| 项 | 内容 |
|---|------|
| 项目名称 | rag-knowledge-base |
| 产品定位 | 基于 RAG（检索增强生成）的私有知识库问答系统 |
| 版本 | v1.0 |
| 创建日期 | 2026-07-15，最后改动 2026-07-19 |
| 技术栈 | FastAPI + ChromaDB + DeepSeek + 阿里 DashScope + React/Antd |
| 当前状态 | 代码完成度约 85%，待实跑验证 + 文档补全（本文档即补全项之一） |

---

## 二、产品定义

### 2.1 一句话描述

上传 / 录入私有文档，系统自动切片、向量化并建立索引；用户用自然语言提问，系统从知识库检索相关内容，交由大模型生成**带引用来源**的流式回答。

### 2.2 不是什么

| 不是 | 说明 |
|------|------|
| ❌ 通用搜索引擎 | 仅检索自有知识库，不联网 |
| ❌ 多模态系统 | 仅处理纯文本，无图片/表格结构化解析 |
| ❌ 多租户 SaaS | 单库多用户，无租户隔离 |
| ❌ 实时问答机器人 | 回答完全基于已入库文档，不依赖外部知识 |

### 2.3 目标用户

- 需要沉淀私有知识并快速检索的个人 / 小团队。
- 当前 `SYSTEM_PROMPT` 定位偏"商品 / 产品知识库"（客服、商品问答场景），可扩展为通用知识库。

### 2.4 核心场景

1. **管理员建库**：上传 `.txt/.md/.json` 文档或手动录入文本 → 系统自动分块、向量化、建立索引。
2. **用户提问**：发起自然语言提问 → 流式返回带引用来源 `[1][2]` 的回答。
3. **管理员运营**：查看仪表盘（用户数 / 文档数 / 问答数），按需删除文档或重建索引。

---

## 三、功能需求

### 3.1 用户与权限（P0）

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| 注册 | 用户名 + 密码（密码 ≥ 6 位，bcrypt 哈希存储） | P0 |
| 登录 | JWT 鉴权，登录接口限流 5 次/分钟 | P0 |
| 修改密码 | 登录后凭旧密码修改 | P0 |
| 角色 | `user` / `admin`，初始 admin 由环境变量 `ADMIN_USERNAME`/`ADMIN_PASSWORD` 初始化 | P0 |
| 会话隔离 | 用户只能访问自己名下的会话 | P0 |
| 权限隔离 | 知识库管理、索引重建、仪表盘仅 `admin` 可访问 | P0 |

### 3.2 知识库管理（admin, P0）

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| 文档上传 | 支持 `.txt` / `.md` / `.json`，单文件 ≤ 10MB | P0 |
| 文本录入 | 直接粘贴文本建库 | P0 |
| 文档列表 | 分页 + 标题关键词搜索 | P0 |
| 文档详情 | 查看原文 + 切片（chunks）明细 | P1 |
| 文档删除 | 同步删除 SQLite 切片与 ChromaDB 向量 | P0 |
| 重建索引 | 全量重新分块 + 重新向量化 | P1 |

### 3.3 问答（chat, P0）

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| 多会话管理 | 创建 / 列表 / 删除会话 | P0 |
| 流式回答 | SSE 实时逐 token 推送 | P0 |
| 引用标注 | 回答附带来源片段，支持 `[1][2]` 溯源 | P0 |
| 历史上下文 | 最近 10 条对话纳入 prompt | P1 |
| 会话自动命名 | 首条消息自动生成会话标题 | P1 |
| 问题建议 | 默认 5 条引导性问题 | P2 |

### 3.4 仪表盘（admin, P1）

| 指标 | 说明 |
|------|------|
| `user_count` | 注册用户总数 |
| `document_count` | 知识库文档总数 |
| `session_count` | 会话总数 |
| `today_qa_count` | 当日用户提问数（按消息表 `role=user` 统计） |
| `total_qa_count` | 累计用户提问数 |

---

## 四、技术方案

### 4.1 技术栈

| 层 | 选型 |
|----|------|
| 后端框架 | FastAPI + SQLAlchemy + SQLite（aiosqlite） |
| 向量库 | ChromaDB（持久化，`CHROMA_PERSIST_DIR`） |
| RAG 框架 | LangChain（Chroma / OpenAI 兼容接口） |
| 生成模型 | DeepSeek（`deepseek-chat`，流式） |
| 嵌入模型 | 阿里 DashScope `text-embedding-v3` |
| 流式协议 | `sse-starlette`（Server-Sent Events） |
| 限流 | `slowapi` |
| 前端 | React 18 + TypeScript + Vite + Antd 5 + react-router 6 + react-markdown + axios |
| 部署 | docker-compose（backend:8000 / frontend:3000 nginx） |

### 4.2 RAG 检索增强流程

- **入库**：原始文本 → `RecursiveCharacterTextSplitter`（`chunk_size=500`、`chunk_overlap=50`，中英文分隔符）→ DashScope `text-embedding-v3` 批量向量化 → 写入 ChromaDB（cosine 相似度，collection=`rag_knowledge_base`）+ SQLite `chunks` 表记录切片。
- **检索**：用户问题 → ChromaDB `similarity_search(top_k=5)` → 取回 chunks 及其 metadata（`document_id`、`chunk_index`）。
- **生成**：拼装 `SYSTEM_PROMPT`（context + 最近 10 条 history + 问题）→ DeepSeek 流式生成 → 逐 token 以 SSE `chunk` 事件推送；末尾 `done` 事件附带 `citations`。
- **可配置项**（`backend/.env` / `config.py`）：`CHUNK_SIZE`、`CHUNK_OVERLAP`、`TOP_K`、`RERANK_ENABLED`、`HYBRID_SEARCH_ENABLED`（后两者默认 false，预留未启用）。

### 4.3 核心难点与对策

| 难点 | 方案 |
|------|------|
| 流式回答 | 异步生成器 + SSE，逐 token 推送，避免整段阻塞 |
| 引用溯源 | 检索阶段保留 metadata，生成后在 `done` 事件统一附带 citations |
| 用户隔离 | 会话归属 `user_id`，知识库仅 admin 可写 |
| 嵌入成本 | 切片批量 `embed_documents`，SQLite 与向量库双写 |

---

## 五、里程碑（实际进度）

| 阶段 | 内容 | 状态 |
|------|------|------|
| M1 后端骨架 + 鉴权 | FastAPI 路由 / JWT / 限流 / 用户隔离 | ✅ |
| M2 知识库 ingestion | 分块 / embedding / 向量库 / CRUD | ✅ |
| M3 问答 SSE + 引用 | 检索增强 / 流式 / citations | ✅ |
| M4 前端页面 | 登录 / 注册 / 聊天 / 知识库 / 仪表盘 | ✅ |
| M5 测试 | pytest 套件（鉴权 / 会话 / 聊天 / 权限 / 知识库 / 仪表盘），约 710 行 | ✅ |
| M6 验证与文档 | 实跑验证 + 项目文档 | ⚠️ 进行中（此前文档误配为其他项目，已于 2026-08-11 重写） |

---

## 六、非功能需求

- 检索精度：当前为纯向量相似度，rerank / hybrid 预留接口但未启用。
- 文件格式：仅文本类（`.txt` / `.md` / `.json`）。
- 并发模型：SQLite + aiosqlite，适合小规模 / 内部使用。
- 部署：docker-compose 一键启动前后端。

---

## 七、已知缺口（v1 范围外 / 待补）

- ❌ 不支持 PDF / Word / 网页等常见格式解析（仅纯文本）。
- ❌ `SYSTEM_PROMPT` 写死"商品知识库"场景，通用性弱。
- ❌ 无 rerank / hybrid 检索，召回质量有限。
- ❌ 无多知识库 / 租户隔离。
- ❌ 无文档版本管理、无回答反馈标注。
- ⚠️ 此前 `docs/prd.md`、`docs/system_design.md` 误用其他项目（泡泡纸解压键盘）文档，已于 2026-08-11 重写校正。
