# Vellum · 数字顾问笔记

数字顾问笔记 / 数字分身顾问团系统。**实际可运行的应用在子目录 `digital-advisor-team/`**。

## 怎么打开

```bash
cd digital-advisor-team
pip install -r requirements.txt
python main.py
```

详细文档见 `digital-advisor-team/README.md`、`ARCHITECTURE.md`、`docs/`。

## 子项目结构

| 目录 | 说明 |
|------|------|
| `digital-advisor-team/` | 主项目（FastAPI + 多顾问 Agent） |
| `digital-advisor-team/frontend/` | Web 前端 |
| `digital-advisor-team/src/` | Agent 核心源码 |
| `digital-advisor-team/data/` | 数据与知识库 |
| `digital-advisor-team/scripts/` | 运维脚本 |
| `digital-advisor-team/tests/` | 测试 |
| `DockerDesktopWSL/` | Docker / WSL 部署相关 |

## 技术栈

Python + FastAPI + 多 Agent 协作（具体依赖见 `digital-advisor-team/pyproject.toml` 与 `requirements.txt`）。

## 状态

✅ 已完成（2026-09-05 标记）。