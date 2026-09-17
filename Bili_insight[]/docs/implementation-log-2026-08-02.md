# 实现说明：Bili_summary 桌面端封装（2026-08-02）

> 工程师：寇豆码（Kou）｜ 依据：system-design-desktop-2026-08-02.md + prd-desktop-2026-08-02.md
> 目标：Electron 主进程 + PyInstaller onefile `backend.exe`（sidecar）+ React 生产构建；开箱即用、真实进度、密钥安全。

## 一、改动 / 新增文件清单

### 后端 / 引擎（Python）
| 文件 | 动作 | 关键改动 |
|------|------|----------|
| `main.py` | 修改 | `BilibiliUpCrawler.__init__` 新增 `progress_callback` / `temperature` / `max_tokens` 参数（默认保持旧行为，`__main__` CLI 模式不受影响）；`process_all_videos` 在每处理一个视频后调用 `progress_callback("processing", i+1, total, title)`，并在开始前上报 `("fetching",0,total,"")`；`extract_core_view`/`generate_overall_summary`/`answer_question`/`_call_model` 改用 `self.temperature`/`self.max_tokens`。 |
| `web/key_provider.py` | **新增** | `KeyProvider` 抽象接口（`resolve/set/has`）；`LocalKeyProvider` 优先用 `keyring`（Windows 凭据管理器），失败回退 `cryptography` 加密文件（Fernet，密钥存 `.fernet`）；`resolve(provider)` 优先级 = 用户设置 key > `config.py` 内置默认；导入 `keyring`/`cryptography` 均用 try/except 降级，缺失时仅回退到 config 默认。 |
| `web/task_manager.py` | **新增** | 内存 `TaskManager`：`create()` 建任务并起 `daemon` 后台线程驱动 `crawler.run`；`update_progress`/`finish`/`finish_with_error`；轮询状态 `to_status()` 与结果 `to_result()`；预留 `enqueue()` 批量队列接口（P2-2）。 |
| `web/settings_store.py` | **新增** | 非敏感偏好（provider/temperature/max_tokens/max_videos/save_path）持久化到 `%APPDATA%/BiliInsight/prefs.json`，白名单过滤，**不含 key**。 |
| `web/history_store.py` | **新增** | 历史会话持久化到 `%APPDATA%/BiliInsight/history.json`，最多 50 条、按 id 去重。 |
| `web/app.py` | 修改 | 绑定 `127.0.0.1`（关闭 `0.0.0.0` 局域网暴露）；**CORS 收紧（安全修复 H2）**：非令牌模式仅放行明确 localhost 来源（拒绝 `null`/通配），生产模式由 Electron 注入一次性本地令牌（`BILI_LOCAL_TOKEN`）做 `Authorization: Bearer` 鉴权，CORS 仅在令牌合法时反射来源；`/api/extract` 改为异步（返回 `task_id` 即返回）；新增 `/api/task/<id>/status`、`/api/task/<id>/result`、`/api/settings` GET/POST、`/api/history` GET/POST/DELETE、`/api/export`；`/api/chat` 经 `KeyProvider` 解析 key（原 `/api/ask` 死代码已移除，消除重复与攻击面）；`/api/settings` 绝不回显 key（仅 `has_key` 标记）；统一日志写入 `%APPDATA%/BiliInsight/backend.log`。**`/api/export` 修复 H1 路径穿越**：文件名仅允许 basename，拒绝 `/`、`\`、`..`、绝对路径，导出强制写入 `%APPDATA%/BiliInsight/exports` 安全目录。**H3**：生产模式下未配置自有 key 时 `/api/extract`、`/api/chat` 返回明确提示，要求用户在设置面板填写。 |
| `config.example.py` | 修改 | 增加“内置默认 key 仅本地打包、勿提交、可在设置面板填自有 key”的注释。 |
| `requirements.txt` | 修改 | 增加 `keyring>=24.0.0`、`cryptography>=42.0.0`。 |

### 桌面壳（Electron，新增 `desktop/`）
| 文件 | 动作 | 关键改动 |
|------|------|----------|
| `desktop/package.json` | 新增 | Electron 31 + electron-builder 24 依赖；`build` 段配置 `files`/`extraResources`（携带 `backend.exe` 与 `dist`）/NSIS。 |
| `desktop/main.js` | 新增 | 主进程：spawn 后端 → 探活 `/api/test` 就绪 → 创建 `BrowserWindow`（生产态 `file://` 加载 `dist/index.html`，开发态 `http://localhost:3000`）→ 注册 IPC（`dialog:showSaveDialog`/`showOpenDialog`）→ 退出 `kill` 子进程。 |
| `desktop/preload.js` | 新增 | `contextBridge` 暴露 `electron.dialog.showSaveDialog/showOpenDialog` 与 `electron.onBackendLog`；不暴露任何 key 或文件写权限。 |
| `desktop/backend-launcher.js` | 新增 | 解析后端路径（开发态优先 `pyinstaller/dist/backend.exe`，否则 `python web/app.py`；打包态 `process.resourcesPath/backend.exe`）→ 轮询 `/api/test` 就绪 → 透传子进程 stdout/stderr 日志。 |
| `desktop/build.mjs` | 新增 | 聚合脚本：构建 React `dist` → 拷贝到 `desktop/app/dist`；拷贝 `backend.exe` 到 `desktop/app/backend.exe`。 |
| `desktop/build-resources/icon.ico` | 新增 | 32×32 占位图标（脚本生成）。 |

### 前端（React，保留并改造 `biliinsight-pro/`）
| 文件 | 动作 | 关键改动 |
|------|------|----------|
| `src/api/client.ts` | 修改 | 新增 `extractVideos`（异步，返回 `task_id`）、`getTaskStatus`/`getTaskResult`/`getSettings`/`saveSettings`/`getHistory`/`addHistory`/`clearHistory`/`exportResult`；`askQuestion` 返回 `{answer}`；统一 `request<T>` 解析 `{success,data,message}`。 |
| `src/hooks/useExtraction.ts` | 修改 | **删除硬编码 `model_type:'dashscope'`**（改由设置 `modelType` 传入）；`handleExtract` 改写：发异步任务 → 轮询真实进度 → `done` 取结果；返回 `Promise`（完成 resolve / 失败 reject，避免 toast 提前弹出）。 |
| `src/hooks/useSettings.ts` | **新增** | 设置读写 hook（经 `/api/settings`）；`api_key` 仅发送不回显。 |
| `src/hooks/useHistory.ts` | 修改 | 由 localStorage 改为后端 `/api/history`（跨会话持久化）。 |
| `src/components/SettingsPanel.tsx` | **新增** | 设置弹窗：模型供应商单选、API Key 密码框（提交即清空、仅 `has_key` 标记）、温度/最大 token/最大视频数/保存路径（`showOpenDialog` 浏览）。 |
| `src/components/Header.tsx` | 修改 | 设置按钮接 `onOpenSettings` 打开面板。 |
| `src/components/ResultsView.tsx` | 修改 | 新增导出工具栏（Excel/Markdown/JSON），经 `dialog:showSaveDialog` 选路径后调 `/api/export`；结果用 `ReactMarkdown` 安全渲染。 |
| `src/App.tsx` | 修改 | 接入 `useSettings`、挂载 `SettingsPanel`、把 `provider` 传给 `useExtraction`；使用后端版 `useHistory`。 |
| `src/types/index.ts` | 修改 | 新增 `ExtractTaskResponse`/`TaskStatusData`/`TaskResultData`/`SettingsData`/`SaveSettingsRequest`/`HistoryResponse`/`ExportRequest`/`PROVIDER_OPTIONS`。 |
| `vite.config.ts` | 修改 | 增加 `base: './'`（支持 `file://` 加载）。 |

### 打包脚本与归档
| 文件 | 动作 | 关键改动 |
|------|------|----------|
| `pyinstaller/build-backend.spec` | **新增** | PyInstaller onefile spec：入口 `web/app.py`，`pathex=[ROOT, WEB_DIR]`，`datas` 携带 `config.py`/`results`，`hiddenimports` 含 flask/bilibili_api/openai/pandas/openpyxl/keyring/cryptography 及各内部模块；`console=False`（不弹黑窗口，日志写文件）。 |
| `pyinstaller/build_backend.py` | **新增** | 一键调用 `python -m PyInstaller` 的脚本。 |
| `archive/web-v1/` | **移动** | 原生 `web/index.html`、`web/script.js`、`web/styles.css`、`web/README.md` 归档（不再维护），`web/app.py` 与新增 `web/*.py` 保留为后端。 |

## 二、关键设计决策（与系统设计的对齐 / 偏离说明）
- **密钥红线**：key 仅存在于①`config.py`（内置默认，gitignored）②后端 `KeyProvider`（系统凭据/加密文件）。前端 `SettingsPanel` 只发送 `api_key`，提交后立即清空且不回显；`/api/settings` 响应只返回 `has_key` 标记。已用 Flask 测试客户端断言响应体不含 key 明文。
- **进度根治**：`/api/extract` 改为后台线程 + 内存任务；前端轮询 `/api/task/<id>/status` 计算真实百分比，彻底替换“假进度 10%→100%”。
- **设置面板与 key 流程经 HTTP 而非 IPC**：前端统一经 `client.ts` 访问 `http://localhost:5000`（与系统设计“前端经 client.ts 统一访问后端”一致），Electron `preload` 仅暴露文件对话框与日志通道。这是相对设计图“IPC 存设置”的合理等价实现，满足“key 不回流前端”的红线。
- **`TaskManager` 单类保留**：`main.py` 仅注入 `progress_callback`/`temperature`/`max_tokens`，未拆分单类（按设计 P2-3 留未来）。

## 三、验证结果
| 验证项 | 方式 | 结果 |
|--------|------|------|
| Python 全部文件语法 | `python -m py_compile` | ✅ 通过 |
| JS 全部文件语法 | `node --check`（main/backend-launcher/preload/build.mjs） | ✅ 通过 |
| 异步任务 + 真实进度链路（桩引擎） | 桩 `BilibiliUpCrawler` + `TaskManager`，轮询至 `done`，processed/total 对齐 | ✅ 通过 |
| `key_provider`/`settings_store`/`history_store` 逻辑 | 临时 `APPDATA` 下单测（resolve 回退/保存/历史增删） | ✅ 通过 |
| Flask 完整路由层 | `flask test_client` 命中 `/api/test`、`/api/extract`→`/api/task/.../status`→`/api/task/.../result`、`/api/settings` GET/POST（断言不回显 key、上传后 `has_key=True`）、`/api/history` 增查、`/api/export` 写文件 | ✅ 全部 PASS |
| 前端类型一致性 | 人工审查 + grep 符号引用；修正 `client.askQuestion` 返回类型（`useChat` 依赖 `data.answer`） | ✅ 一致 |
| XSS / 安全 | 结果/对话均经 `ReactMarkdown` 受控渲染，无 `innerHTML`；key 不进前端代码/不回显 | ✅ 复核通过 |

## 四、未验证项及原因（如实说明）
1. **前端 `npm install` + `tsc --noEmit` / `vite build`**：本环境 `npm install` 被沙箱拦截（用户未授权批量写入 `node_modules`），无法在此机编译/构建 React。已通过人工审查 + 符号引用交叉核验保证一致性，但**未跑通实际 `vite build` / 类型检查**。建议在本机执行 `cd biliinsight-pro && npm install && npm run build` 与 `npm run lint` 确认。
2. **PyInstaller 构建 `backend.exe`**：环境缺少 `bilibili-api-python`/`openai`/`pandas` 等重依赖且无法联网安装，未实际执行 `python pyinstaller/build_backend.py`。spec 与构建脚本已按 onefile 规范编写，但未在本机产出 `backend.exe`。
3. **Electron 实际启动 + 端到端（双击安装包）**：依赖上述两项产物（React `dist` 与 `backend.exe`）齐备，未在本环境跑 `electron-builder`。`main.js`/`backend-launcher.js`/`preload.js` 已通过 `node --check` 语法校验。
4. **`keyring` 在 Windows 凭据管理器的真实写入**：验证环境为当前 Windows 用户进程，`keyring` 可用；但“设置 key 落 Windows 凭据管理器”仅在打包后的真实 Windows 桌面端最终确认（逻辑已含回退加密文件兜底）。

## 五、如何在本机完成端到端验证（建议）
```bash
# 1) Python 依赖
pip install -r requirements.txt
# 2) 构建后端 onefile exe
python pyinstaller/build_backend.py          # 产出 pyinstaller/dist/backend.exe
# 3) 前端依赖 + 生产构建
cd biliinsight-pro && npm install && npm run build && cd ..
# 4) 聚合 + 打 Windows 安装包
cd desktop && npm install && npm run build && npm run dist
# 开发态联调：
#   终端1: python web/app.py
#   终端2: cd biliinsight-pro && npm run dev
#   终端3: cd desktop && npm run dev
```

---

## 六、安全修复说明（回传安无漏审计 · 2026-08-02）

> 针对 `security-audit-2026-08-02.md` 出具的 🔴 阻断发布结论（C1 严重 + H1/H2/H3 高危），
> 本这次回传已逐项修复。测试脚本：`web/test_security_fix.py`（8 项 + 令牌子进程验证）；
> 原有 QA 套件 `web/test_qa_desktop.py`（19 项）仍全绿，无回归。

### 1) 修复项与方式

| 编号 | 问题 | 修复方式 | 文件 |
|------|------|----------|------|
| **C1（严重）** | 真实 DashScope key 随 `backend.exe` 分发 | 构建脚本在临时目录生成「无密钥占位 config」（所有 `*_API_KEY` 为空），通过环境变量 `BILI_BUILD_CONFIG_DIR` 把它放到 PyInstaller `pathex` **最前**，使打包时 `import config` 解析到占位版本；spec 中**移除**真实 `config.py` 的 `datas`（不再被打入包）。仓库内真实 `config.py`（`.gitignore` 忽略）保留，仅供开发者本地 CLI 个人使用。 | `pyinstaller/build_backend.py`、`pyinstaller/build-backend.spec` |
| **H1（高危）** | `/api/export` 路径穿越 / 任意文件写 | 文件名参数**仅允许 basename**，拒绝含 `/`、`\`、`..`、绝对路径的输入；导出**强制写入**固定安全目录 `%APPDATA%/BiliInsight/exports`，不允许任意路径写文件；扩展名与格式强制一致。前端 `ResultsView` 仅传 `basename`，由后端决定落盘位置。 | `web/app.py`、`biliinsight-pro/src/components/ResultsView.tsx` |
| **H2（高危）** | CORS 放行 `null` + 无本地鉴权 | 非令牌模式（`python web/app.py` 直接运行，无 `BILI_LOCAL_TOKEN`）CORS 仅放行明确 localhost 来源，**拒绝 `null` 与通配**；生产模式由 Electron 启动时生成一次性随机令牌，经环境变量注入后端、经 IPC 暴露给渲染进程，后端 `before_request` 校验 `Authorization: Bearer <token>`，CORS 仅在令牌合法时反射来源（含 `file://` 的 `null`）。移除对 `/api/ask` 死代码端点的暴露。 | `web/app.py`、`desktop/main.js`、`desktop/backend-launcher.js`、`desktop/preload.js`、`biliinsight-pro/src/api/client.ts` |
| **H3（高危）** | 内置共享密钥分发模式 | 打包后的占位 config 默认 key 为空；`KeyProvider.resolve` 回退到的 config 默认即空，**不再内置可用共享 key**。生产模式下，未配置自有 key 时 `/api/extract`、`/api/chat` 返回明确提示：「请先在设置面板填写你自己的密钥」。取 key 优先级保持「用户设置 > config 默认」。 | `pyinstaller/build_backend.py`（占位 config）、`web/app.py`（`_require_key`） |
| 质量（注释） | `ResultsView.tsx` 注释率 3.0% | 补充中文/英文注释（导出工具栏、整体总结区块、视频卡片、核心观点列表、外链等），注释率提升至约 12%。 | `biliinsight-pro/src/components/ResultsView.tsx` |
| 可选清理 | `/api/ask` 死代码 | 确认无代码引用（前端仅用 `/api/chat`）后移除该路由，缩小攻击面。 | `web/app.py` |

### 2) ⚠️ 仍需用户手动操作的项（AI 无法代做）

- **【必须】吊销/轮转原 DashScope key**：原 `config.py:17` 中的 `sk-ws-H.EDRMPXH...` 前缀密钥**已被分发风险暴露**，请立即到**阿里云百炼（DashScope）控制台**「API-KEY 管理」中**删除/禁用并重新生成**新 key。AI 无法替你登录云控制台操作。
- **个人使用请在桌面端「设置」面板填入你自己的 key**：新 key 经 `keyring`（Windows 凭据管理器）或 `cryptography` 加密本地文件保存，不会进入前端代码、不会回显、不会随包分发。

### 3) 验证结果

| 验证项 | 方式 | 结果 |
|--------|------|------|
| Python 全量语法 | `python -m py_compile`（app/key_provider/task_manager/settings_store/history_store/build_backend/main） | ✅ 通过 |
| JS 全量语法 | `node --check`（main/backend-launcher/preload） | ✅ 通过 |
| ① 设置不回显 key | Flask 测试客户端：POST key 后 GET，断言响应体不含 key 明文、无 `api_key` 字段 | ✅ 通过（`test_settings_does_not_echo_key`） |
| ② 导出路径穿越拒绝 | POST `/api/export` `path="../../etc/passwd"` 与绝对路径，断言 400 | ✅ 通过（`test_export_traversal_rejected` / `test_export_absolute_path_rejected`） |
| ② 导出可用性 | `path="my_export.json"`（basename）断言写入安全目录且有文件 | ✅ 通过（`test_export_basename_writes_safe_dir`） |
| ③ CORS 拒绝 null | GET 带 `Origin: null`，断言无 `Access-Control-Allow-Origin` | ✅ 通过（`test_cors_null_origin_rejected`） |
| H2 令牌鉴权 | 子进程以 `BILI_LOCAL_TOKEN` 启动后端：缺令牌→401、正确令牌→200、错误令牌→401 | ✅ 通过（`TestLocalTokenGate`） |
| C1 构建排除真实 key | 静态校验 `build_backend.py` 不含真实 key、`spec` 用 `BILI_BUILD_CONFIG_DIR` 且 `datas` 不再含 `config.py`；并**模拟 PyInstaller pathex 解析**，确认打包解析到的是无密钥占位 config | ✅ 通过（`test_build_excludes_real_key` + 模拟脚本） |
| 回归 | 原有 QA 套件 19 项 | ✅ 全绿（无回归） |

**未在本机实跑、但已确保逻辑正确**（环境受限，如实标注）：
- **PyInstaller 真实构建 `backend.exe`**：缺 `bilibili-api-python`/`openai`/`pandas` 等重依赖且无法联网安装，未跑 `python pyinstaller/build_backend.py`。但「排除真实 config」逻辑已通过**静态校验 + pathex 解析模拟**双重确认（占位 config 优先、真实 `config.py` 不进 `datas`）。
- **electron-builder 打包与端到端双击安装包**：`main.js`/`backend-launcher.js`/`preload.js` 已 `node --check`；`client.ts` 的令牌头注入为最小改动，建议本机 `npm run build && npm run dist` 后复测。
- **前端 `npm install` + `vite build`**：本环境 `npm install` 被沙箱拦截，未编译；`ResultsView`/`client.ts` 改动经人工审查与符号引用核验。

