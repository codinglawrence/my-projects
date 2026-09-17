# 安全审计报告 — Bili_summary 桌面端封装（2026-08-02）

> 审查者：**安无漏（An）**｜角色：软件安全工程师（静态审查，只审不修）
> 审查对象：Electron + PyInstaller 桌面端封装（依据 implementation-log / system-design / prd 三份文档）
> 审查方式：不运行代码，逐文件静态审计 + 注释率抽样统计
> 配套输入文档：`implementation-log-2026-08-02.md`、`system-design-desktop-2026-08-02.md`、`prd-desktop-2026-08-02.md`

---

## 一、安全审计

### 1.1 概要

- 扫描文件：21（Python 5、TS/TSX 3、Electron JS 3、归档 4、配置/依赖 6）
- 发现问题：**严重 1 / 高危 3 / 中危 5 / 低危 2**
- **发布判定：🔴 阻断发布（回传工程师修复）** —— 依据"严重漏洞 ≥ 1 即阻断"

| 等级 | 数量 | 说明 |
|------|------|------|
| 🔴 严重 (Critical) | 1 | C1：真实 API Key 随分发二进制泄露 |
| 🟠 高危 (High) | 3 | H1 任意文件写 / H2 CORS null+无鉴权 / H3 内置共享密钥模式 |
| 🟡 中危 (Medium) | 5 | M1~M5 |
| 🟢 低危 (Low) | 2 | L1~L2 |

### 1.2 发现列表（按严重度排序）

---

#### 🔴 C1 — 真实 DashScope API Key 硬编码并随分发二进制泄露（严重）

- **位置**：`config.py:17`；打包链路 `web/app.py:27`（`from config import *`）+ `pyinstaller/build-backend.spec`（`datas` 携带 `config.py`）
- **现象**：
  - `config.py:17` 写入了**真实可用的 DashScope 密钥**（`sk-ws-H.EDRMPXH...`）。
  - 该文件被 PyInstaller 以 `datas` 打入 `backend.exe`，且 `app.py` 通过 `from config import *` 在运行时读取 `DASHSCOPE_API_KEY`。
  - 因此**任何下载安装包的用户都可通过 `strings backend.exe` 等手法提取该付费密钥**——等同于把后端凭据公开分发。
  - 已核实：`config.py` 未被 git 跟踪（`git ls-files` 为空）、仓库历史无该 key（`git grep` 无命中），即**未泄露进代码仓库**；但**分发二进制仍是泄露面**，风险依旧成立。
- **影响**：密钥被滥用产生资损、被滥发请求导致限流/封禁、且可被反查到账号。
- **修复建议**：
  1. **立即在阿里云百炼控制台吊销/轮转该 key**（最高优先级，止血）。
  2. `config.py` 不再写入任何真实 key，仅保留占位符（与 `config.example.py` 一致）。
  3. 取消"内置默认 key 先用着"的分发模式（见 H3），改为首次启动引导用户填自有 key 或提前实现登录入口。
- **判定**：属"硬编码密码 / API Key / Token"类严重漏洞，触发**阻断发布**。

---

#### 🟠 H1 — `/api/export` 任意文件写入（路径未校验 + 接口无认证）（高危）

- **位置**：`web/app.py:228-273`（路径处理 `236-246`、写文件 `248-267`）
- **现象**：
  - 导出接口直接信任请求体中的 `path` 字段作为写文件路径，**未做目录白名单、未校验是否位于用户经对话框选定的目录内、未防 `../` 穿越**。
  - 后端仅绑定 `127.0.0.1` 但**无任何认证/令牌**（见 H2），任意本机进程（或经 DNS rebinding 的网页）可发起 `POST /api/export`，以当前用户权限向任意可写路径写文件（覆盖系统/用户文件、投毒）。
  - `format` 由调用方决定扩展名，文件名完全可控。
- **影响**：本地任意文件写/覆盖（LFI 写方向），可被用于持久化、破坏用户数据。
- **修复建议**：
  1. 后端校验 `path` 必须位于用户经 `showSaveDialog` 返回的路径（或在后端用一次性 token + 仅允许写入用户指定目录）。
  2. 对 `path` 做规范化（realpath）并限制父目录白名单；拒绝绝对路径穿越。
  3. 引入本地鉴权 token（见 H2），使写入接口不可被任意本机程序调用。

---

#### 🟠 H2 — CORS 放行 `null` 来源 + 接口无本地令牌鉴权（高危）

- **位置**：`web/app.py:35-44`（CORS 白名单含 `"null"`）；全局无 token 校验
- **现象**：
  - 因 Electron 以 `file://` 加载前端，其 Origin 为 `null`，故 CORS 被迫放行 `"null"`。但这意味着**本机任意 `file://` HTML 文档**都能调用后端 API。
  - 所有 `/api/*` 路由**均无认证**（无 bearer token / 本地密钥）。结合 H1，攻击面被显著放大。
  - 互联网恶意网页虽受 CORS Origin 限制，但可通过 **DNS rebinding**（解析到 127.0.0.1）绕过 CORS 直接打本地 API。
- **影响**：本机任意网页/文件可调用本地 API（含导出写文件、提交 key、触发抓取），构成本地 CSRF / 越权。
- **修复建议**：
  1. 启动时生成**一次性随机本地 token**，写入文件并经 preload 注入渲染进程；后端中间件校验 `Authorization: Bearer <token>`。
  2. 避免在 CORS 放行 `null` 时同时暴露无鉴权写接口；token 校验通过后再处理。
  3. 后端绑定改用**随机高端口**进一步降低被扫描/劫持概率（见 M5）。

---

#### 🟠 H3 — "内置默认 key 先用着"属共享密钥分发模式（高危，设计层）

- **位置**：`web/key_provider.py:147`（`resolve` 回退到 `config.py` 内置默认）；`config.py`（全部 *API_KEY 默认值）
- **现象**：
  - 即便吊销当前泄露的 DashScope key，"把一份内置默认 key 打进安装包"的设计模式本身意味着**给所有用户分发同一个后端共享凭据**。一旦再次内置真实 key，风险重现。
  - 违背 PRD P0-4"不把真实 key 提交/分发"的初衷（仅"本地打包、不入仓库"不能解决分发泄露）。
- **影响**：长期资损与账号风险；与后续"登录入口"演进目标冲突。
- **修复建议**：
  1. 安装包**不携带任何真实 key**；首次启动若 `has_key=false` 直接引导用户在设置面板填自有 key 或登录。
  2. 把"登录入口(P2-1)"提前评估，用云端账号 key 替代内置共享 key。

---

#### 🟡 M1 — 密钥保存失败时静默吞错，用户误以为保存成功（中危）

- **位置**：`web/app.py:170-195`（`post_settings` 的 `except` 在 `194` 行吞掉异常）；`web/key_provider.py:111-117`（`_write_file_keys` 在加密模块不可用时抛 `RuntimeError`）
- **现象**：当用户填了 key 但运行环境同时缺失 `keyring` 与 `cryptography` 时，`key_svc.set` 抛异常被 `app.py` 的顶层 `except` 捕获，返回通用错误；但在"keyring 失败且 cryptography 不可用"边界下 `set` 不落库却返回 `has_key=False`，前端可能提示失败但用户困惑；更糟的是若部分路径异常被吞，用户误以为 key 已保存。
- **修复建议**：`post_settings` 中对 `key_svc.set` 单独 try/except，明确返回"密钥未能保存到凭据库/加密文件，请检查环境"的提示，不让用户误判。

#### 🟡 M2 — 本地加密文件仅防同机 casual 访问，无法防本机恶意软件（中危）

- **位置**：`web/key_provider.py:86-116`（`.fernet` + `keys.enc` 兜底）
- **现象**：Fernet 密钥文件与密文文件同处 `%APPDATA%/BiliInsight/`，权限 `0o600` 良好，但**密钥与密文都在同一用户会话内**，运行中的恶意软件（同一用户权限）可读密文+密钥文件解密出 key。这是本地加密的固有局限。
- **修复建议**：在文档/隐私声明中说明此局限；优先使用 `keyring`（系统凭据管理器，隔离更好）；对高安全场景建议结合 DPAPI/系统级保护。

#### 🟡 M3 — 后台任务无并发上限，可被本地资源耗尽（中危）

- **位置**：`web/app.py:93-125`（`/api/extract` 每次调用 `task_mgr.create`）；`web/task_manager.py:64-75`（`create` 无上限起 daemon 线程）
- **现象**：`/api/extract` 无频率/并发限制，可被本机恶意程序大量调用，创建大量后台线程与 B 站抓取任务，导致本地 DoS / 触发 B 站风控。
- **修复建议**：限制同时运行任务数（如单任务或 N 个），超出返回 `429`；对 `uid` 加简单限流。

#### 🟡 M4 — 渲染进程 `sandbox: false` 削弱 Electron 安全边界（中危）

- **位置**：`desktop/main.js:27`（`sandbox: false`）
- **现象**：`contextIsolation: true` 与 `nodeIntegration: false` 配置正确（✅），但 `sandbox: false` 关闭了渲染进程沙箱。虽然 preload 仅暴露最小 API（✅），一旦渲染进程因依赖漏洞被攻破，影响面更大。
- **修复建议**：在确认 preload/渲染进程无需特权的前提下，将 `sandbox` 设为 `true`（Electron 默认即 true），提升隔离强度。

#### 🟡 M5 — 固定监听 `127.0.0.1:5000`，存在本地端口劫持/占用风险（中危）

- **位置**：`web/app.py:320-326`；`desktop/backend-launcher.js:13-15`
- **现象**：端口固定为 5000，若被本机其他程序先占或恶意监听，Electron 可能连到伪造后端（本地中间人），或被端口冲突导致启动失败。
- **修复建议**：后端启动尝试随机高端口，将实际端口写入本地文件/通过 stdout 回传给 Electron；Electron 读取后连接，避免固定端口。

---

#### 🟢 L1 — `/api/chat` 前端可控 `context` 直接进模型提示词（低危）

- **位置**：`web/app.py:294-310`
- **现象**：`context` 由前端传入并拼入 prompt 调用模型，属正常功能，但构成对 LLM 的提示词注入面（影响限于模型输出质量/越权内容，不触及系统）。
- **修复建议**：对 `context`/`question` 做长度与内容边界校验；必要时在 system prompt 中固化"仅基于提供内容回答"。

#### 🟢 L2 — 后端日志无轮转（低危）

- **位置**：`web/app.py:46-58`
- **现象**：`backend.log` 仅追加、无大小/数量轮转，长期使用可无限增长。
- **修复建议**：使用 `RotatingFileHandler` 限制单文件大小与备份数。

---

### 1.3 依赖风险（静态关注项，未联网扫描）

| 依赖 | 版本约束 | 关注 |
|------|----------|------|
| `Flask` / `Flask-CORS` | `>=3.0.0` / `>=4.0.0` | 仅下限约束，建议锁定精确版本并定期 `pip-audit` |
| `keyring` / `cryptography` | `>=24.0.0` / `>=42.0.0` | 新增敏感依赖，建议锁定+扫描 |
| `bilibili-api-python` / `openai` / `pandas` / `openpyxl` / `requests` | `>=` | 第三方 SDK，关注已知 CVE，建议 CI 接入依赖扫描 |
| `electron@^31` / `electron-builder@^24` | `^` | Electron 历史有多项 CVE，建议随版本更新并启用 sandbox（见 M4） |

> 注：本环境未联网做 CVE 扫描，仅按"已知需关注项"列出，建议发布前跑 `pip-audit` 与 `npm audit`。

---

## 二、注释检查

### 2.1 概要

- **整体加权注释率（抽样 12 个审计文件）：21.9%（291 / 1330）** → **≥ 15%，达标 ✅**（按本次任务阈值判定，不阻断）。
- 对照角色自身更严标准（每 10 行约 3 行注释 ≈ 30%）：整体未达 30%，但本次发布判定采用任务阈值 15%。
- **单文件异常**：`ResultsView.tsx` 仅 **3.0%**（6/202），多为声明式 JSX 标记，逻辑注释偏少 → **标记 ⚠️**，建议补充。
- 一致性评级：✅（注释与代码逻辑相符，未发现明显注释/实现不符）
- 可读性评级：✅（含中文注释、魔法数字有说明，如 `max_videos 1-200`、`0o600`）

### 2.2 各文件注释率

| 文件 | 注释率 | 行数(注释/总) | 备注 |
|------|--------|----------------|------|
| web/app.py | 23.6% | 77/326 | 达标 |
| web/key_provider.py | 31.8% | 56/176 | 达标 |
| web/settings_store.py | 43.9% | 25/57 | 达标 |
| web/history_store.py | 28.6% | 14/49 | 达标 |
| web/task_manager.py | 18.5% | 28/151 | 达标 |
| biliinsight-pro/src/api/client.ts | 25.8% | 32/124 | 达标 |
| biliinsight-pro/src/components/ResultsView.tsx | **3.0%** | 6/202 | ⚠️ 偏低（多 JSX） |
| biliinsight-pro/src/hooks/useSettings.ts | 25.4% | 16/63 | 达标 |
| desktop/main.js | 15.9% | 13/82 | 达标（临界） |
| desktop/preload.js | 38.9% | 7/18 | 达标 |
| desktop/backend-launcher.js | 20.7% | 17/82 | 达标 |

> 统计口径：Python 计 `#` 注释与模块/函数文档字符串行；TS/JS 计 `//`、`/* */` 注释块行；不含空行。

---

## 三、其他质量检查

### 3.1 命名规范 ✅
变量/函数命名清晰（`task_mgr`、`key_svc`、`_resolve_api_keys`、`launchBackend`），无 `a`/`b`/`tmp` 等无意义命名。

### 3.2 错误处理 ✅（局部可加强）
- 路由层普遍有 `try/except` 并返回统一 `{success,message}` 信封（✅）。
- 短板：密钥保存失败被静默吞（见 M1）；`key_provider` 部分异常被 `except Exception: return None` 吞掉（调试困难）。

### 3.3 代码重复 ⚠️（轻微）
- `app.py` 内 `_resolve_api_keys()`、`_make_crawler()` 与 `task_manager._run()` 中构造 `BilibiliUpCrawler` 的逻辑存在重复（三处拼 provider/keys 参数）。建议抽出统一的"构建 crawler"工厂函数。

### 3.4 文件组织 ✅
目录结构合理：`web/`（后端）、`desktop/`（壳）、`biliinsight-pro/`（前端）、`archive/web-v1/`（归档）、`docs/`（文档）分工清晰；新增模块边界明确。

### 3.5 已确认的安全改进（正面）
- ✅ `app.py` 绑定 `127.0.0.1`（关闭 `0.0.0.0` 局域网暴露）—— 满足 PRD P0-5。
- ✅ `Electron` `contextIsolation: true`、`nodeIntegration: false` —— 满足桌面暴露面要求。
- ✅ `preload.js` 仅暴露 `dialog` 与 `onBackendLog`，不暴露 key/文件写 —— 满足最小暴露。
- ✅ 前端 `src/` 无 `localStorage` 存 key、无 `innerHTML`/`dangerouslySetInnerHTML` 渲染 LLM 输出（用 `ReactMarkdown`）—— 满足 PRD P1-4。
- ✅ `/api/settings` 仅返回 `has_key`，不回显 key 明文；`/api/ask`、`/api/chat` 统一走 `KeyProvider`，不再收前端 key。
- ✅ 归档 `archive/web-v1/`（含旧 `innerHTML`/`localStorage` 风险的 `script.js`）**未被打包进桌面包**（`desktop/build.mjs` 仅拷贝 `biliinsight-pro/dist` 与 `backend.exe`），旧风险已隔离。
- ✅ `backend-launcher.js` 的 `spawn` 参数均为固定值（`web/app.py` / `backend.exe`），无用户可控参数注入。

---

## 四、总评

| 维度 | 评分 | 等级 |
|------|------|------|
| 安全评分 | 35/100 | **F**（存在 1 严重 + 3 高危，触发阻断） |
| 注释评分 | 78/100 | **C**（整体 21.9% 达标，单文件偏低） |
| 质量评分 | 82/100 | **B**（结构/命名良好，少量重复与错误处理短板） |
| **是否阻断发布** | **是** | 🔴 **阻断发布（回传工程师修复）** |

### 判定依据
- **严重漏洞 ≥ 1（C1）** → 阻断发布，必须修复。
- 高危漏洞 ≥ 3（H1/H2/H3） → 即便无严重亦应阻断建议修复（此处同时满足）。
- 注释率 21.9% ≥ 15% → 不触发 ⚠️ 阻断（但 `ResultsView.tsx` 单文件偏低，建议补充）。

### 工程师修复优先级（回传清单）
1. **[P0 止血]** 立即吊销/轮转 `config.py:17` 的真实 DashScope key；安装包不再内置真实 key（C1/H3）。
2. **[P0]** `/api/export` 增加路径白名单 + 防穿越校验（H1）。
3. **[P0]** 引入本地一次性 token 鉴权，收紧 CORS `null` 暴露面（H2）。
4. **[P1]** 修复密钥保存失败静默吞错（M1）；渲染进程恢复 `sandbox: true`（M4）；任务并发限制（M3）。
5. **[P2]** 后端随机端口（M5）；日志轮转（L2）；`ResultsView.tsx` 补注释；抽出 crawler 构造工厂消除重复。

---

> 安无漏（An）｜静态审查完成，未运行任何代码。以上发现均基于实际读取的源文件与行号，无虚构。
