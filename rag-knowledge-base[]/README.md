# RAG 企业级知识库问答系统

基于 FastAPI + LangChain + ChromaDB + DeepSeek 的本地知识库问答（Python 后端 + React 前端）。

> 📌 **毕设原题与目标**：面向电商商品场景的多用户多会话 RAG 问答系统，管理员可管理知识库，普通用户可问答并看到引用片段，支持注册登录与历史会话保存。完整题目与背景见 `docs/`。

## 怎么打开

### 方式 A：本地开发（推荐开发/调试）

```bash
# 后端（:8000）
cd backend
python _run_app.py

# 前端（:5173）
cd frontend
npm install
npm run dev
```

### 方式 B：Docker 一键启动

```bash
docker-compose up -d
# 前端 Nginx 暴露 80，后端 8000
```

### 默认账户

- 管理员：`admin / 123456`

## 技术栈

| 类别 | 选型 |
|------|------|
| 后端 | Python + FastAPI + LangChain + ChromaDB + DeepSeek API |
| 前端 | React + TypeScript + Vite + Ant Design 5 |
| 部署 | Docker + docker-compose + Nginx |

## 目录结构

| 目录 / 文件 | 说明 |
|------|------|
| `backend/` | Python 后端（FastAPI 路由、LangChain 链路、用户与会话管理） |
| `backend/_run_app.py` | 后端启动入口 |
| `frontend/` | React 前端（问答界面 + 知识库管理后台） |
| `docs/` | 毕设相关文档（需求 / 设计 / 论文素材） |
| `Dockerfile.backend` / `Dockerfile.frontend` | 镜像构建 |
| `docker-compose.yml` | 编排 |
| `nginx.conf` | 前端 Nginx 反向代理 |
| `start.bat` | Windows 一键启动脚本 |

## 核心功能

1. 浏览器端知识库管理（管理员）
2. 问答时引用知识库片段作为参考，答案中显示引用来源
3. 多用户多会话独立管理
4. 会话历史持久化，跨登录找回
5. 用户注册 / 登录 / 改密
6. 管理员账号 `admin/123456` 独享知识库管理权限
7. 多级缓存 / 性能优化（企业级目标）

## ⚠️ 安全告警（部署公网前必修）

当前代码存在以下高危问题，**部署到公网前必须修复**：

1. 🔴 **明文 API Key**：DeepSeek / DashScope Key 明文写在代码中，未走环境变量或密钥管理
2. 🔴 **默认 JWT 密钥**：`SECRET_KEY` 用默认值或硬编码，未做强制环境变量校验
3. 🔴 **默认管理员口令 `admin / 123456`**：首次登录后必须强制改密，且代码侧禁止默认口令登录公网
4. 🔴 **Nginx 裸 80 端口**：无 TLS 证书，生产环境必须加 HTTPS

> 用户已明确知晓，当前选择**先结项**，修复排到后续迭代。

## 状态

✅ 已完成（毕设主体功能闭环，2026-09-05 标记）。安全告警作为 Known Issues 留存。