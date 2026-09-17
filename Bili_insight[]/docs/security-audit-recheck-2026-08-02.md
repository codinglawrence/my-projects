# 安全审计终审复核 — Bili_summary 桌面端封装（2026-08-02）

> 复核者：**安无漏（An）**｜角色：软件安全工程师（静态审查 + 本次实际执行安全测试）
> 复核对象：寇豆码（Kou）针对 `security-audit-2026-08-02.md` 🔴 阻断结论的修复回传
> 复核方式：逐文件复读修复代码（不凭记忆）＋ **实际运行 `web/test_security_fix.py`** ＋ git 历史核验
> 配套输入：`security-audit-2026-08-02.md`、`implementation-log-2026-08-02.md`（六、安全修复说明）、修复后源码

---

## 〇、复核结论速览

- **原阻断项（1 严重 + 3 高危）全部消除**，无新增严重 / 高危。
- **实际测试**：`web/test_security_fix.py` 在本机指定 Python（`3.13.12`）运行 **8/8 全绿**。
- **最终判定：✅ 解除阻断，建议放行**（条件见第五节——含 1 项用户必须手动操作）。

| 原编号 | 严重度 | 复核判定 | 关键证据 |
|--------|--------|----------|----------|
| C1 真实 key 随分发二进制泄露 | 🔴 严重 | **已消除**（静态证明）＋ 残留风险 | `build_backend.py:25-50`（占位 config，全部 key 空）、`build-backend.spec:14-27`（datas 不再含 config.py）、`test_build_excludes_real_key` 通过；`git grep` 全历史无 key 命中 |
| H1 `/api/export` 路径穿越 | 🟠 高危 | **已消除**（实测通过） | `app.py:317-332`（仅 basename、拒绝 `/ \ ..`、绝对路径）、`test_export_traversal_rejected` / `test_export_absolute_path_rejected` 通过 |
| H2 CORS 放行 null + 无本地鉴权 | 🟠 高危 | **已消除**（实测通过） | `app.py:44-89`（令牌模式 + 非令牌模式拒绝 null）、`main.js:23-38`（CSPRNG 令牌）、`preload.js:18-19`、`test_cors_null_origin_rejected` / `TestLocalTokenGate` 通过 |
| H3 内置共享密钥分发 | 🟠 高危 | **已消除**（实测通过） | `key_provider.py:147`（回退默认 = 占位空 key）、`build_backend.py` 占位 config 全空、`test_default_key_is_empty_in_bundle_config` 通过 |
| 附带：移除 `/api/ask` 死代码 | — | **已消除** | `app.py` 全文无 `/api/ask` 路由（仅 `/api/chat`） |

---

## 一、原阻断项逐项复核（含证据与实测）

### 🔴 C1 — 真实 DashScope Key 随分发二进制泄露（严重）

**复核判定：已消除（静态证明级）；但存在一项残留风险需用户/工程师收尾。**

**消除证据（代码 + 实测）：**
1. `pyinstaller/build_backend.py:25-50` 在临时目录生成「无密钥占位 config」：所有 `*_API_KEY` 显式为 `""`（`DASHSCOPE_API_KEY = ""` 第 38 行）。
2. `pyinstaller/build-backend.spec:14-15` 将占位目录置于 `pathex` **最前**，使打包时 `import config` 解析到占位版本；`:23-27` 的 `datas` **不再把真实 `config.py` 打入**（仅携带 `results/`）。
3. 实测 `test_build_excludes_real_key`（`test_security_fix.py:139-154`）通过：构建脚本/SPEC 不含真实 key、读取 `BILI_BUILD_CONFIG_DIR`、datas 无 `config.py`。
4. **git 历史核验**：`git grep "sk-ws-H.EDRMPXH" $(git rev-list --all)` **全历史无命中**；`git show HEAD:config.py` 为占位版本（无真实 key）。→ 仓库历史当前**干净**。

**残留风险（非阻断，须收尾，详见第三节 N1）：**
- 本地工作区 `config.py:17` 仍含真实 key（仅未提交）；且 `.gitignore` 第 34 行虽写 `config.py`，但该文件**已被 git 跟踪**（`git ls-files config.py` 有输出，故 `git check-ignore` 不生效）。一旦执行 `git add config.py` 并提交，真实 key 即进入仓库 —— 与原 C1 同源风险复燃。**当前未触发**（未提交），但防护已失效。

**结论**：分发二进制泄露面已消除（静态证明成立）；但用户**必须**手动在云控制台吊销/轮换该 key（止血），并修正 config.py 的 git 跟踪问题（见 N1）。

---

### 🟠 H1 — `/api/export` 任意文件写入 / 路径穿越（高危）

**复核判定：已消除（实测通过）。**

**证据（`web/app.py:291-360`）：**
- `:317-332` 对 `path` 做严格校验：含 `/` 或 `\`、含 `..`、`os.path.isabs(path)` 任一即返回 `400`；文件名强制与格式一致扩展名。
- 导出始终写入固定安全目录 `%APPDATA%/BiliInsight/exports`（`:309-313`），不接受任意路径。
- 前端 `ResultsView.tsx:48-66` 仅传 `basename`（`res.filePath.split(/[\\/]/).pop()`）。

**实测**：`test_export_traversal_rejected`（400）、`test_export_absolute_path_rejected`（400）、`test_export_basename_writes_safe_dir`（写入安全目录且不在目录外落盘）均 **OK**。

---

### 🟠 H2 — CORS 放行 `null` + 无本地鉴权（高危）

**复核判定：已消除（实测通过 + 令牌逻辑复核无绕过）。**

**证据：**
- `web/app.py:44-73` `before_request`：`REQUIRE_TOKEN`（由环境变量 `BILI_LOCAL_TOKEN` 决定）为真时，除 `/api/test` 与 `OPTIONS` 外**必须** `Authorization: Bearer <token>` 匹配，否则 `401`。
- `web/app.py:76-89` `after_request`：令牌模式下**仅当 `auth_ok` 且带 Origin** 才反射 `Access-Control-Allow-Origin`；非令牌模式仅放行明确 localhost 来源（`:48-51` 白名单，拒绝 `null`/通配）。
- `desktop/main.js:23-38`：`crypto.randomBytes(24).toString('hex')`（192-bit CSPRNG）生成一次性令牌，持久化 `userData/.local_token`（mode `0o600`），经 IPC `get-local-token` 注入渲染进程。
- `desktop/preload.js:18-19` 仅暴露 `getLocalToken`（IPC 取令牌），**不含任何 key 明文**。
- `biliinsight-pro/src/api/client.ts:36-47` 仅在 `window.electron.getLocalToken` 存在时注入 `Authorization` 头，令牌**不写死在前端源码**。

**实测**：`test_cors_null_origin_rejected`（无 ACAO 头）、`TestLocalTokenGate`（缺令牌 401 / 正确 200 / 错误 401）均 **OK**。

**令牌逻辑专项复核（是否引入新高危）：**
- 随机性：CSPRNG 192-bit，**足够**（✅）。
- 是否泄漏到前端源码：前端仅调用 `getLocalToken()` 取运行时令牌，源码无字面令牌（✅）。
- `before_request` 是否可被绕过：仅 `/api/test`（探活，设计放行）、`OPTIONS`（预检，不带凭据）放行；其余在 `REQUIRE_TOKEN` 为真时严格校验，无空比较/类型绕过；生产态 `REQUIRE_TOKEN` 恒真（Electron 必注入令牌），外部 `file://` 页面无法获取令牌亦无 CORS 放行。**无可绕过点**（✅）。
- DNS rebinding 缓解：无令牌的请求返回 401 且不放行 CORS，浏览器侧跨源读取被拦截（✅）。

---

### 🟠 H3 — 内置共享密钥分发模式（高危，设计层）

**复核判定：已消除（实测通过）。**

**证据：**
- 打包占位 config 全部 key 为空（`build_backend.py:32-39`）。
- `web/key_provider.py:147` 回退默认：`getattr(config, _CONFIG_KEY_MAP..., "")` —— 占位 config 下返回 `""`，**不再内置可用共享 key**。
- `web/app.py:131-141` `_require_key`：生产（`REQUIRE_TOKEN`）且 `resolve(provider)` 为空时，返回明确提示「请先在设置面板填写你自己的密钥」。

**实测**：`test_default_key_is_empty_in_bundle_config`（默认空 → resolve 返回 `""`）**OK**。

---

## 二、实测结果（实际运行，非凭记忆）

运行命令：
```
C:/Users/terri/.workbuddy/binaries/python/versions/3.13.12/python.exe web/test_security_fix.py
```
运行环境：Python 3.13.12，已安装 `flask 3.1.3`（无需 `flask-cors`，因 CORS 改为手写中间件）。

**结果：Ran 8 tests — OK（全部通过）**
```
test_token_required_when_set ... ok      # H2 令牌鉴权：缺/错 401，正确 200
test_build_excludes_real_key ... ok      # C1/H3 构建静态校验
test_cors_null_origin_rejected ... ok    # H2 CORS 拒绝 null
test_default_key_is_empty_in_bundle_config ... ok  # H3 占位默认 key 为空
test_export_absolute_path_rejected ... ok        # H1 拒绝绝对路径
test_export_basename_writes_safe_dir ... ok       # H1 basename 落安全目录
test_export_traversal_rejected ... ok            # H1 拒绝 .. 穿越
test_settings_does_not_echo_key ... ok           # 设置接口不回显 key
```
> 注：`test_build_excludes_real_key` 有两条 `ResourceWarning`（未关闭文件句柄），属测试脚本小瑕疵，不影响断言结果。

**诚实声明（无法实跑的部分）：**
- `PyInstaller` 真实构建 `backend.exe` 在本环境缺 `bilibili-api-python`/`openai`/`pandas` 等重依赖且无法联网，未实跑。C1「二进制不含真实 key」的消除依据为 **静态逻辑（pathex 占位优先 + datas 移除 config.py）＋ `git grep` 全历史无 key**。逻辑链严密，但非端到端二进制实证——建议本机 `python pyinstaller/build_backend.py` 后，用 `strings backend.exe | grep sk-ws-` 再验证一次。

---

## 三、新发现 / 修复引入的问题

### N1（中危 · 残留）`.gitignore` 对 `config.py` 失效，未来提交恐泄露真实 key
- **现象**：`config.py` 已被 git 跟踪（`git ls-files config.py` 有输出），故 `.gitignore:34` 的 `config.py` 规则**不生效**（`git check-ignore` 无输出）。本地工作区 `config.py:17` 含真实 key 仅是「未提交」状态，防护并未真正生效。
- **影响**：一旦 `git add . && git commit`，真实 DashScope key 将进入仓库历史（与原 C1 同源）。当前仓库历史干净，故**非阻断**，但属明确的安全债。
- **建议（用户/工程师）**：
  1. `git rm --cached config.py` 取消跟踪；
  2. 将本地真实配置改名为 `config.local.py` 并在 `.gitignore` 固定，或改用环境变量 / 本地未跟踪文件承载真实 key；
  3. 确认 `git grep sk-ws-` 全历史持续为空。

### N2（中危 · 原 M4 未修复）渲染进程 `sandbox: false`
- `desktop/main.js:52` 仍为 `sandbox: false`。修复聚焦安全阻断项，此项未动。属原中危，未升级为高危。建议后续恢复 `sandbox: true`。

### N3（中危 · 原 M5 未修复）固定监听 `127.0.0.1:5000`
- `web/app.py:393-399` 与 `desktop/backend-launcher.js:13-15` 端口固定。原中危，未升级。建议后续改随机高端口回传。

### N4（低危 · 测试瑕疵）`test_security_fix.py:144/150` 未关闭 `open()` 文件句柄
- 产生 `ResourceWarning`，不影响结果。建议加 `with open(...)`。

**是否引入新的严重/高危：否。** 令牌鉴权逻辑（随机性、源码不泄漏、before_request 不可绕过）经专项复核无新问题。

---

## 四、注释率复核（ResultsView.tsx）

- 原报告：`3.0%`（6/202）⚠️。
- 修复后实测（保守口径：仅计纯注释行，含 JSX `{/* */}`，不含空行）：
  - 总行 207，空行 11，非空 196，注释行 **17** → **注释率 8.7%**（注释/非空）。
  - 工程师自述「约 12%」（口径更宽，含块注释各 `*` 行与行内注释）。
- **判定：显著提升，但未严格达 ≥10% 的复核阈值（按我口径 8.7%）**。
- 影响：注释率属质量项，**非发布阻断**（原报告也仅将 ResultsView 标 ⚠️ 建议补充，未阻断）。建议再补 2–3 行函数级注释（如 `handleExport`、`toRawRecords` 的字段映射意图）即可越过 10%；或认可工程师 12% 口径认定达标。

---

## 五、最终发布判定

### 判定：**✅ 解除阻断，建议放行**

依据：
1. 原 4 项阻断（C1 严重 + H1/H2/H3 高危）**均已消除**（H1/H2/H3 有实测佐证；C1 为静态证明级 + git 历史佐证）。
2. 未引入新的严重 / 高危漏洞（令牌逻辑专项复核通过）。
3. 残留项为中/低危（N1~N4），不触发阻断阈值。

### ⚠️ 用户必须手动完成的事项（AI 不能代做）
1. **【必须·止血】吊销/轮换原 DashScope key**：到**阿里云百炼（DashScope）控制台 → API-KEY 管理**删除/禁用并重新生成。原 `config.py:17` 的 `sk-ws-H.EDRMPXH...` 前缀密钥即便不再进二进制，仍应视为已暴露并轮换。
2. **【建议】修复 N1 git 跟踪问题**：`git rm --cached config.py`，改用 `config.local.py`（gitignored）或环境变量承载本地真实 key，避免未来误提交泄露。
3. **首次启动填自有 key**：桌面端「设置」面板填入你自己的 key（落 keyring/加密文件，不回显、不分发）。

### 建议（非阻断，后续迭代）
- 本机实跑 `python pyinstaller/build_backend.py` 后用 `strings backend.exe | grep sk-ws-` 端到端复核 C1。
- 处理 N2（`sandbox: true`）、N3（随机端口）、N4（测试文件句柄）、ResultsView 注释补至 ≥10%。

---

> 安无漏（An）｜终审复核完成。本次**实际运行**了安全测试（8/8 绿），并复读了全部修复文件与 git 历史，结论基于实证，无虚构。原 🔴 阻断项已解除。
