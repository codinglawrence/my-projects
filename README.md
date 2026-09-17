# 我的项目 · 状态总览与打开指南

> 命名约定：目录名带 `[]` = 已完成。判定时间 2026-09-05。
> 判定标准：主体交付物做完且能跑通、无阻塞性未办事项。仅"能启动"不算完成。

---

## 1. 已完成（11 个）

| 项目 | 一句话怎么开 |
|------|--------------|
| Bili_insight[] | `pip install -r requirements.txt` → `python main.py` → localhost:5000 |
| bubble-pop-keyboard[] | `npm run dev` → localhost:5173 |
| Kissrecord[] | 双击 `kissrecord.html` |
| My_blog[] | 已上线：codinglawrence.github.io/Gargantua-Portfolio｜本地 `npm run dev` |
| Vellum[] | `cd digital-advisor-team` → `pip install -r requirements.txt` → `python main.py` |
| vibecoding-design-skills[] | `python search_and_clone.py`（会克隆仓库，确认再跑）|
| 天纪命理决策系统[] | `npm run dev` → localhost:3000（无 API Key 自动离线降级）|
| promptmaster---智能提示词管理器[] | `npm run dev` → localhost:3000 |
| 五字日记[] | `cp index.dev.html index.html` → `npm run dev` → localhost:3000 |
| rag-knowledge-base[] | 后端 `python _run_app.py`（:8000）｜前端 `npm run dev`（:5173）|
| glassmemo---极简毛玻璃桌面便签[] | 双击 `release/win-unpacked/GlassMemo.exe`，或装 `release/GlassMemo-Setup-1.0.0.exe` |

---

## 2. 未完成（1 个）

| 项目 | 卡点 |
|------|------|
| gesture-particle-forge | **手势识别没跑通**（实测：MediaPipe hands 未成功运行），粒子特效本身可看，手势控制不可用 |

---

## 3. 已停止（2 个，用户 2026-09-05 决定不再投入）

| 项目 | 停止时状态 |
|------|-----------|
| insight-cards | 代码与功能完成（QA 26/26），但全息箔层与重力感应**从未真机验证**，就此封存 |
| Timequest | 停在 `v0.0.0`，计时/活动/历史三个视图已能跑，未完成出包 |

---

## 4. 已完成但未标 `[]`（待你确认是否补 `[]`）

以下两个项目功能完整可用，但目录名未按约定加 `[]`，**等你拍板**是否补：

| 项目 | 现状 | 建议 |
|------|------|------|
| principle-retro | 单文件 HTML 的《原则》复盘 MVP，五步流程 / 偏差沉淀 / 原则库 / 演化树 / 导入导出 全部可用，零依赖 | 补 `principle-retro[]` |
| 原则-·-五步决策复盘系统 | Express + Gemini 五步复盘完整版，五步向导 / 原则库 / 行为模式分析 / Pre-Mortem / 本地持久化，无 Key 走启发式 | 补 `原则-·-五步决策复盘系统[]` |

---

## 5. ⚠️ rag-knowledge-base 安全遗留（标记完成 ≠ 已修复）

已按用户指示标为完成，但 `docs/代码审查报告.md`（2026-08-13）的 4 个高危问题**客观存在、至今未修**：

1. `backend/.env` 明文存放**真实第三方 API Key** → 需到平台侧手动轮换
2. JWT 密钥仍是默认值 `rag-system-secret-key-change-in-production`
3. admin 口令仍是 `123456`
4. `nginx.conf` 仍只监听 80，无 TLS

> 已确认：`.env` 被 `.gitignore` 忽略、从未进入 git 历史，密钥只在本机未外泄。
> **但这个项目一旦部署到公网，上述任一项都可直接出事。** 修之前别上公网。

---

## 6. 已归档（移出本目录，放 `../归档项目/`）

| 项目 | 归档时间 | 原样 |
|------|---------|------|
| sticky-memo[] | 2026-09-05 | 原生 JS + Electron 的按日期文本便签，是 glassmemo 的前一版（无毛玻璃/透明度/条目勾选/音效）。已完成可用，但被 glassmemo 取代 |

---

## 7. 备注

- **glassmemo 已打包成真正的桌面挂件**：无边框透明窗口、系统托盘常驻、位置记忆、开机自启、点 X 隐藏到托盘。产物 78MB 安装包 + 180MB 免安装版。
  ⚠️ 从 WorkBuddy 终端启动时，沙箱注入的 `NODE_OPTIONS` 会让它崩溃——**从资源管理器双击启动**即可。
- **sticky-memo[] 是 glassmemo 的前一版**：原生 JS + Electron，按日期存单个文本（`userData/notes/YYYY-MM-DD.json`），有置顶切换和自动保存，但没有毛玻璃、透明度调节、条目勾选、音效。功能更少但已完成可用。
- **promptmaster[] 的小程序端是空的**：`promptmaster-weapp/dist/` 从未成功构建。Web 主应用完整可用。
- **principle-retro 与 原则-·-五步决策复盘系统**：前者是单文件 MVP（双击即用），后者是带 Gemini AI 的完整版（npm run dev）。两者并存，前者作为随手用，后者作为深度工具。