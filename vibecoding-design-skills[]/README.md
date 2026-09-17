# vibecoding-design-skills

研究辅助脚本：按关键词搜 GitHub 仓库并克隆到本地，纯标准库 Python（零第三方依赖）。

## 怎么打开

```bash
python search_and_clone.py
```

会按内置 10 个 `vibe coding / Codex / design` 关键词搜索 GitHub Top 仓库并克隆到 `C:\Users\terri\Desktop\Project\vibecoding-design-skills`。

> 注意：脚本会真实克隆仓库到上述路径，跑前确认目录。

## 文件结构

| 文件 | 用途 |
|------|------|
| `search_and_clone.py` | 主脚本（标准库：urllib / json / subprocess / os） |
| `__pycache__/` | 缓存 |

## 技术栈

纯 Python 3 标准库，**无 requirements.txt**。

## 状态

✅ 已完成（2026-09-05 标记）。