# 系统设计文档 — RAG 企业级知识库问答系统

---

**作者**: 后端 / 前端实现（rag-knowledge-base）  
**日期**: 2026-07-15（初版），2026-08-11（按真实代码重写）  
**基于**: PRD v1.0  
**技术栈**: FastAPI + ChromaDB + DeepSeek + 阿里 DashScope + React 18 / Antd  
**类型**: 全栈应用（前后端分离，SSE 流式问答）

---

## Part A: 系统设计

---

### 1. 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React 18)                       │
│  /login  /register  /chat  /admin/dashboard  /admin/knowledge   │
│  Antd 5 + react-router 6 + axios + react-markdown + SSE 客户端    │
└───────────────────────────────┬─────────────────────────────────┘
                                  │ HTTPS (fetch / EventSource)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI :8000)                        │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ auth API   │  │ session API│  │ chat API   │  │knowledge  │  │
│  │ (JWT)      │  │ (CRUD+隔离)│  │ (SSE 流式) │  │ API(admin)│  │
│  └────────────┘  └────────────┘  └─────┬──────┘  └─────┬─────┘  │
│                                         ▼              ▼        │
│                          ┌────────────────────────────────────┐ │
│                          │ Services                           │ │
│                          │ RAGService / KnowledgeService     │ │
│                          │ SessionService / AuthService      │ │
│                          │ DashboardService / EmbeddingService│ │
│                          └───────────────┬──────────────────┘ │
└──────────────────────────────────────────┼────────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                              ▼
   ┌────────────────┐            ┌──────────────────┐            ┌──────────────────┐
   │ ChromaDB       │            │ SQLite            │            │ 外部 API          │
   │ (向量库,持久化) │            │ (用户/文档/会话/  │            │ DashScope 嵌入    │
   │ collection=    │            │  消息/切片)        │            │ DeepSeek 生成    │
   │ rag_knowledge_ │            │ aiosqlite         │            │ (流式)            │
   │ base           │            │                  │            │                  │
   └────────────────┘            └──────────────────┘            └──────────────────┘
```

**分层职责**

| 层 | 位置 | 职责 |
|----|------|------|
| 路由层 | `app/api/*.py` | HTTP 端点、鉴权依赖、请求/响应模型 |
| 服务层 | `app/services/*.py` | 业务逻辑（RAG、知识库、会话、鉴权、仪表盘） |
| 数据层 | `app/models/*.py` + `app/database.py` | SQLAlchemy ORM 模型与连接 |
| 中间件 | `app/middleware/auth.py` | JWT 校验、admin 校验 |
| 工具层 | `app/utils/text_splitter.py` | 文本分块 |
| 配置 | `app/config.py` + `.env` | 集中配置 |

---

### 2. 技术选型

| 层 | 技术 | 选型理由 |
|----|------|---------|
| 后端框架 | FastAPI | 原生异步、自动 OpenAPI、SSE 支持好 |
| ORM | SQLAlchemy 2.x | 成熟稳定，支持异步 |
| 数据库 | SQLite（aiosqlite） | 零部署、单机 / 内部场景足够 |
| 向量库 | ChromaDB（持久化） | 轻量、本地持久化、LangChain 集成好 |
| RAG 编排 | LangChain（Chroma / OpenAI 兼容） | 统一 embedding / LLM 接口 |
| 生成模型 | DeepSeek `deepseek-chat` | 中文能力强、成本低、支持流式 |
| 嵌入模型 | 阿里 DashScope `text-embedding-v3` | 中文 embedding 质量高 |
| 流式 | sse-starlette | FastAPI 下 SSE 标准实现 |
| 限流 | slowapi | 轻量、基于装饰器 |
| 前端框架 | React 18 + TypeScript | 类型安全 |
| 构建 | Vite 5 | HMR 快 |
| UI 库 | Antd 5 + zhCN | 企业级组件、中文 locale |
| 路由 | react-router-dom 6 | 页面路由 + 受保护路由 |
| 渲染 | react-markdown | 回答 Markdown 渲染 |
| 部署 | docker-compose | 前后端一键编排 |

---

### 3. 数据模型

数据库：SQLite，由 `app/database.py` 的 `Base` 统一管理。

#### 3.1 `users`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| username | String(50) unique | 登录名 |
| password_hash | String(255) | bcrypt 哈希 |
| role | String(20) default `user` | `user` / `admin` |
| created_at | DateTime | 注册时间 |

#### 3.2 `documents`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| title | String(200) | 文档标题 |
| content | Text | 原文（建库后保留） |
| file_type | String(20) default `txt` | txt / md / json / manual |
| file_size | Integer | 字节数 |
| chunk_count | Integer | 切片数 |
| uploaded_at | DateTime | 入库时间 |

关系：`Document.chunks` → 一对多 `Chunk`（cascade 删除）。

#### 3.3 `chunks`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| document_id | Integer FK → documents.id | 所属文档 |
| content | Text | 切片文本 |
| chunk_index | Integer | 在文档中的序号 |
| vector_id | String(100) nullable | ChromaDB 中的向量 ID（删除时用） |
| created_at | DateTime | 创建时间 |

#### 3.4 `sessions`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| user_id | Integer FK → users.id | 归属用户 |
| title | String(100) default `新会话` | 会话标题（首条消息自动命名） |
| created_at / updated_at | DateTime | 时间戳 |

关系：`Session.messages` → 一对多 `Message`（cascade 删除）。

#### 3.5 `messages`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| session_id | Integer FK → sessions.id | 所属会话 |
| role | String(20) | `user` / `assistant` |
| content | Text | 消息内容 |
| citations | Text nullable | JSON 字符串（引用来源列表） |
| created_at | DateTime | 时间戳 |

> 问答统计（`dashboard`）基于 `messages` 表中 `role='user'` 计数。

---

### 4. RAG 入库流程（Ingestion）

```
管理员上传/录入文本
  → KnowledgeService.add_text_entry / upload_document
  → RecursiveCharacterTextSplitter.split_text
       (chunk_size=500, chunk_overlap=50,
        separators=["\n\n","\n","。",".","！","？","?"," ",""])
  → EmbeddingService.embed_documents(批量)
  → ChromaDB collection.add(ids, embeddings, documents, metadatas)
       metadatas: {document_id, chunk_index}
  → 同时写 SQLite chunks 表（保存 vector_id 以便删除）
```

- 文件上传在 API 层校验：`ALLOWED_EXTENSIONS = {".txt", ".md", ".json"}`，超过 `MAX_FILE_SIZE = 10MB` 返回 413。
- `rebuild_index`：清空 ChromaDB collection → 遍历全部 `documents` 重新分块 + 向量化。
- 解码：优先 `utf-8`，失败回退 `gbk`（errors="replace"）。

---

### 5. RAG 检索生成流程（Retrieval + Generation，SSE）

```
用户 POST /api/sessions/{id}/send
  → SessionService 校验归属 → 保存 user 消息
  → 首条消息自动命名会话
  → RAGService.generate_answer（异步生成器）
       1. _retrieve(question, top_k=TOP_K=5)
            → ChromaDB.similarity_search（cosine）
       2. 拼装 context（每个 chunk 前缀 [idx] + metadata 来源）
       3. 取最近 10 条历史对话（get_history_for_prompt）
       4. 格式化 SYSTEM_PROMPT（context + history + question）
       5. DeepSeek.streaming 逐 token 生成
            → 每个 token 以 SSE 事件推送：
              data: {"type":"chunk","content":"..."}
       6. 结束时推送：
              data: {"type":"done","citations":[...],"full_answer":"..."}
              data: [DONE]
  → 前端 EventSource / fetch 流读取，渲染流式回答 + CitationCard
  → 后端保存 assistant 消息（含 citations JSON）
```

`SYSTEM_PROMPT` 当前写死为"产品信息知识库助手 / 商品信息"，要求仅基于上下文回答、引用用 `[编号]`、结构化 Markdown 输出。

---

### 6. API 设计

基址：`http://localhost:8000`，统一响应包装 `{ code, data, message }`（`ApiResponse`）。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 公开 | 注册，返回 token + user |
| POST | `/api/auth/login` | 公开（限流 5/min） | 登录，返回 token |
| PUT | `/api/auth/password` | user | 修改密码 |
| GET | `/api/user/me` | user | 当前用户信息 |
| POST | `/api/sessions` | user | 创建会话 |
| GET | `/api/sessions` | user | 会话列表（按用户隔离） |
| GET | `/api/sessions/{id}/messages` | user（归属） | 消息分页 |
| DELETE | `/api/sessions/{id}` | user（归属） | 删除会话 |
| POST | `/api/sessions/{session_id}/send` | user（归属） | SSE 流式问答 |
| GET | `/api/sessions/{session_id}/suggestions` | user（归属） | 问题建议 |
| GET | `/api/knowledge/documents` | admin | 文档列表（分页 + 关键词） |
| GET | `/api/knowledge/documents/{doc_id}` | admin | 文档详情 + chunks |
| POST | `/api/knowledge/documents` | admin | 上传文件（txt/md/json ≤10MB） |
| POST | `/api/knowledge/documents/text` | admin | 文本录入 |
| DELETE | `/api/knowledge/documents/{doc_id}` | admin | 删除文档（含向量） |
| POST | `/api/knowledge/rebuild` | admin | 重建索引 |
| GET | `/api/dashboard/stats` | admin | 仪表盘统计 |
| GET | `/health` | 公开 | 健康检查 |

---

### 7. 鉴权与安全

- **JWT**：`python-jose`，`HS256`，`JWT_SECRET_KEY` 由环境变量提供；登录后 token 有效期 `JWT_EXPIRE_HOURS`（默认 24h）。
- **中间件依赖**：
  - `get_current_user`：解析 Bearer token，注入 `User`。
  - `require_admin`：在 `get_current_user` 基础上校验 `role == 'admin'`。
- **用户隔离**：会话 / 消息均按 `user_id` 过滤，跨用户访问返回 403。
- **限流**：登录接口 `slowapi` 限流 5 次/分钟（按远程地址）。
- **密码**：`passlib[bcrypt]` 哈希，不存明文。
- **CORS**：`allow_origins=["http://localhost:3000"]`（前端开发地址）。

---

### 8. 部署（docker-compose）

```
version: "3.8"
services:
  backend:
    build: Dockerfile.backend
    ports: ["8000:8000"]
    volumes: ["./data:/app/data"]
    environment: DEEPSEEK_API_KEY / DASHSCOPE_API_KEY / DATABASE_URL / CHROMA_PERSIST_DIR
    restart: unless-stopped
  frontend:
    build: Dockerfile.frontend
    ports: ["3000:80"]
    depends_on: [backend]
    restart: unless-stopped
```

- 后端入口：`uvicorn app.main:app`，lifespan 中 `init_db()` + `init_admin()`。
- 前端：`npm run build` → nginx 提供静态文件（Dockerfile.frontend）。
- 本地开发：`start.bat` 启动前后端；前端 `vite` 默认 3000 端口。
- 数据持久化：`./data`（SQLite `rag_system.db` + ChromaDB `chroma/`）。

---

### 9. 已知限制与后续规划

| 项 | 现状 | 建议 |
|----|------|------|
| 文件格式 | 仅 txt/md/json | 接入 PDF/Word/HTML 解析（PyMuPDF / unstructured） |
| 检索质量 | 纯向量相似度 | 启用 rerank（如 bge-reranker）/ hybrid 检索 |
| 场景通用性 | prompt 写死"商品知识库" | 改为可配置系统提示词 |
| 多知识库 | 单 collection | 支持多空间 / 租户隔离 |
| 测试 | pytest 710 行（mock 外部） | 补充真实链路集成测试（标记 `@pytest.mark.integration`） |
| 文档 | 已校正 | 本文档替代误配的旧版 |

---

## Part B: 任务拆解（实现回顾）

> 本项目由软件公司团队 SOP 生成：PM（PRD）→ Architect（设计）→ Engineer（实现）→ QA（测试）。代码层已覆盖 M1–M5，测试套件完整。2026-08-11 补全文档（此前 `docs/` 误用其他项目文档）。

### 关键实现文件

| 文件 | 职责 |
|------|------|
| `backend/app/main.py` | FastAPI 实例、路由挂载、CORS、lifespan |
| `backend/app/config.py` | 配置加载（强制读取 `.env` 防污染） |
| `backend/app/api/{auth,session,chat,knowledge,dashboard}.py` | 路由层 |
| `backend/app/services/rag_service.py` | RAG 检索 + 流式生成 + citations |
| `backend/app/services/knowledge_service.py` | 分块 / 向量化 / 文档 CRUD / 重建索引 |
| `backend/app/services/embedding_service.py` | DashScope embedding 封装 |
| `backend/app/middleware/auth.py` | JWT / admin 依赖 |
| `frontend/src/App.tsx` | 路由 + Antd 主题 + 受保护路由 |
| `frontend/src/pages/*` | Login / Register / Chat / KnowledgeManage / AdminDashboard |
| `frontend/src/components/chat/*` | ChatBubble / ChatInput / CitationCard / StreamRenderer / QuestionSuggestions |
| `frontend/src/hooks/useSSE.ts` | SSE 流式消费 |

---

*文档维护者：实现团队（按真实代码于 2026-08-11 重写）*  
*最后更新：2026-08-11*
