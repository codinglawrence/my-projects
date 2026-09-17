# RAG 知识库 · 后端

FastAPI 后端（ChromaDB + DeepSeek + DashScope）。

## 如何手动打开
```bash
cd rag-knowledge-base/backend
pip install -r requirements.txt
python _run_app.py
```

### 预期结果
uvicorn 启动，提供问答 / 知识库 API（端口看终端输出）。

### 验证状态
✅ 已验证可开（import `_run_app` / `from app import main` 通过，装依赖后）

### 注意事项
- 需配置 ChromaDB 与 API Key（DashScope / DeepSeek）才能完整运行。
