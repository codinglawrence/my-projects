# 数字顾问笔记

> 私人笔记本风格的数字分身顾问团

## 项目简介

数字顾问笔记是一个"像私人笔记本"的网页应用，让你可以创建属于自己的数字顾问团。将喜爱的博主智慧珍藏于此，通过上传他们的文章、视频转录等内容，让AI学习他们的风格，随时翻开与他们深度对话。

## 核心设计理念

「静谧质感 × 微妙惊喜」：以极简为底色，用"克制的丰富"替代花哨装饰——留白即层次、质感胜装饰、惊喜藏日常。

### 设计特色

- **Apple克制美学**：留白逻辑、磨砂玻璃材质、自然动效
- **深邃色彩**：深灰蓝基调 + 深海绿强调 + 暖沙褐点缀
- **中西合璧排版**：无衬线标题 + 衬线正文
- **陪伴感设计**：动态时间戳、手写签名、微妙交互

## 核心功能

### 顾问管理

- ✨ 创建个性化顾问（博主/专家）
- ✏️ 编辑顾问信息
- 🗑️ 删除顾问（连带删除其知识库和对话）
- 🎨 自定义顾问颜色标识

### 知识库（顾问专属）

- 📄 **材料管理**：每个顾问拥有独立的知识库
- ⬆️ **文件上传**：支持 PDF、TXT、Markdown
- 🕷️ **网页采集**：输入网址自动抓取内容
- ✏️ **材料编辑**：修改材料名称
- 🗑️ **材料删除**：清理不需要的内容
- 🔍 **自动向量化**：上传的材料自动分块、嵌入并存储到向量数据库

### 混合知识库系统

- 🧠 **个人知识优先**：优先使用上传的材料内容回答问题
- 🌐 **LLM知识补充**：个人材料不足时，结合大模型预训练知识
- ⚖️ **智能权重分配**：个人知识库权重更高，确保回答符合顾问风格
- 📚 **材料引用**：回答中自然融入材料内容，保持风格一致性

### 对话系统

- 💬 与选定顾问进行多轮对话
- 📝 对话历史自动保存
- 🎯 AI模拟顾问风格回复
- 🧠 **RAG增强**：结合个人知识库和对话历史生成回复
- 🆕 随时开启新对话

## 技术栈

### 后端

- **Python 3.11+**
- **FastAPI**: 高性能API框架
- **SQLAlchemy**: 异步ORM
- **SQLite/PostgreSQL**: 数据存储
- **Playwright + BeautifulSoup**: 网页爬虫
- **DeepSeek API**: 大语言模型（支持DeepSeek系列模型）
- **ChromaDB**: 向量数据库（RAG记忆系统）
- **Sentence-Transformers**: 本地嵌入模型
- **Pydantic**: 数据验证和配置管理
- **Loguru**: 结构化日志管理

### 核心架构特性

- **🛡️ 健硕的错误处理系统**：统一异常处理、指数退避重试、错误分类
- **⚡ 性能优化工具**：缓存管理、性能监控、资源管理
- **🔒 类型安全系统**：完整的类型注解、数据验证
- **🧠 RAG增强记忆**：长期记忆管理、语义检索、上下文增强
- **🔄 资源管理**：懒加载模式、连接池、内存优化

### 前端

- **原生HTML/CSS/JS**: 无框架依赖
- **静谧质感设计系统**: 私人笔记本风格
- **响应式布局**: 适配桌面和移动端

## 项目结构

```
digital-advisor-team/
├── main.py                 # 入口：python main.py api 启动服务
├── config/config.py        # 唯一生效的配置（读 .env）
├── config/settings.py      # 实验框架配置（已废弃，仅供存档参考）
├── src/
│   ├── llm/client.py       # LLM 客户端（OpenAI 兼容协议，默认 DeepSeek）
│   ├── db/                 # SQLAlchemy 异步引擎 + 会话
│   ├── models/models.py    # ORM：Blogger/Material/Conversation/Message
│   ├── services/
│   │   ├── agent_service.py   # ⭐ SmartAgent（ReAct + RAG，项目核心）
│   │   ├── rag_service.py     # 向量嵌入 + ChromaDB 检索
│   │   ├── qa_agent.py        # 内存版问答系统（/qa API）
│   │   ├── style_learning.py  # 博主风格模拟
│   │   ├── knowledge_base.py  # 博主/材料 CRUD
│   │   └── conversation.py    # 对话管理
│   ├── api/endpoints/      # FastAPI 路由：conversation/knowledge/crawler/qa
│   ├── crawler/            # Playwright + BS4 网页抓取
│   ├── core/               # ⚠️ 实验性 Agent 框架（当前不可用，存档参考）
│   └── agents/             # ⚠️ 实验性 BloggerAgent（同上）
├── frontend/               # 原生 HTML/CSS/JS 前端（index.html + qa.html）
├── tests/                  # pytest 测试套件（15 条，全部通过）
├── init_db.py              # 初始化 SQLite 数据库
└── data/                   # SQLite + ChromaDB 向量库（运行时自动创建）
```

### 启动方式

```bash
# 直接启动（推荐，无需 pip install）
python main.py api --host 0.0.0.0 --port 8000

# 或使用 uvicorn
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

不需要执行 `pip install -e .`（曾经需要，现已通过路径推导消除依赖）。

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入 DeepSeek API 密钥
```

完整配置项：

```bash
# ---- 必填 ----
LLM_API_KEY=your_deepseek_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./data/digital_advisor.db

# ---- 可选（以下均为默认值）----
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_TIMEOUT_SECONDS=60
LLM_MAX_RETRIES=3
APP_NAME=数字顾问团
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
CRAWLER_DELAY=1
SLOW_QUERY_THRESHOLD_MS=500.0
```

### 3. 初始化数据库

```bash
python init_db.py
```

### 4. 启动

```bash
python main.py api --port 8080
# 或
uvicorn src.api.main:app --host 0.0.0.0 --port 8080
```

访问 `http://localhost:8080`。

## 使用指南

与上一节相同。第一步添加顾问 → 第二步上传材料构建知识库 → 第三步开始对话。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/system/status` | 系统状态 |
| GET | `/knowledge/bloggers` | 获取所有顾问 |
| POST | `/knowledge/bloggers` | 创建顾问 |
| GET | `/knowledge/bloggers/{id}` | 获取单个顾问 |
| PUT | `/knowledge/bloggers/{id}` | 更新顾问 |
| DELETE | `/knowledge/bloggers/{id}` | 删除顾问 |
| GET | `/knowledge/bloggers/{id}/materials` | 获取顾问知识库材料 |
| POST | `/knowledge/materials` | 上传材料（支持 PDF/TXT/MD） |
| GET | `/knowledge/materials/search` | 搜索材料 |
| GET | `/knowledge/materials/{id}` | 获取单个材料 |
| PUT | `/knowledge/materials/{id}` | 更新材料 |
| DELETE | `/knowledge/materials/{id}` | 删除材料 |
| POST | `/conversation/conversations` | 创建对话 |
| GET | `/conversation/bloggers/{id}/conversations` | 获取顾问对话列表 |
| GET | `/conversation/conversations/{id}/messages` | 获取对话消息 |
| POST | `/conversation/conversations/{id}/messages` | 发送消息 |
| POST | `/conversation/conversations/{id}/chat` | AI 回复（ReAct + RAG） |
| GET | `/qa/agents` | 列出问答 Agent |
| POST | `/qa/agents` | 创建问答 Agent |
| POST | `/qa/agents/{id}/chat` | 问答对话（流式） |
| POST | `/qa/agents/{id}/documents` | 上传文档 |
| POST | `/crawler/crawl` | 爬取网页内容 |

## 数据模型

```
Blogger（顾问）
├── Materials（知识库材料）1:N
└── Conversations（对话）1:N
    └── Messages（消息）1:N
```

知识库与顾问强绑定，每位顾问拥有完全独立的知识库。

## 设计规范

### 色彩

```css
--color-bg: #1a1c23          /* 深夜书页 */
--color-primary: #2d5a5a     /* 深海绿 */
--color-accent: #c2a38a      /* 暖沙褐 */
```

### 字体

```css
--font-sans: 'Inter', 'Noto Sans SC'       /* 标题 */
--font-serif: 'Noto Serif SC'              /* 正文 */
--font-display: 'Cormorant Garamond'       /* 装饰 */
```

### 交互

过渡如自然翻书，微交互像手绘般流畅；hover 下划线从中间延伸，按钮带涟漪。拒绝硬切闪。

## 测试

```bash
python -m pytest tests/test_code_quality.py -v   # 15 条，全部通过
python test_api.py                                 # 手工 API 冒烟测试
```

## 注意事项

1. 必须配置有效的 DeepSeek API 密钥
2. 首次运行自动下载 sentence-transformers 嵌入模型（约 120MB）
3. ChromaDB 向量库与 SQLite 数据库均存放在 `./data/` 下
4. Playwright 爬虫需先执行 `playwright install chromium`
5. 浏览器推荐 Chrome / Edge / Safari 最新版

## 许可证

MIT License

---

> 精心记录，慢慢思考。
