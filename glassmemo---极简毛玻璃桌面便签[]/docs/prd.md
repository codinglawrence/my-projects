# GlassMemo PRD — 桌面挂件形态（v1.0.0）

## 1. 项目信息

- **Language**: 中文
- **Programming Language**: Electron 33 + React 19 + Vite 6 + Tailwind 4 + Motion（已落地，沿用）
- **Project Name**: glassmemo（深色霓虹毛玻璃桌面便签）
- **原始需求复述**: 把现有桌面便签改造成**真正的 Windows 桌面插件（Desktop Widget）**——默认把窗口嵌入 Windows 桌面层（与壁纸、桌面图标同层），打开其它程序时便签被盖住、按 `Win+D` 回桌面时仍可见；托盘菜单提供「窗口置顶」checkbox，可在浮窗模式（置顶于所有窗口之上）之间切换。形态正确优先于花式功能。

---

## 2. 产品定义

### 2.1 Product Goals（3 个，正交）

1. **形态正确**: 默认嵌入 Windows 桌面层（Progman → WorkerW 的 SetParent），便签与壁纸/桌面图标同层。被其它程序窗口盖住、按 `Win+D` 回到桌面时仍可见。
2. **切换灵活**: 托盘菜单可在「桌面挂件 ↔ 浮窗置顶」两种模式间切换，切换后立刻生效，无需重启。
3. **不破坏既有体验**: 暗色霓虹毛玻璃视觉、按日期记录、透明度可调、托盘常驻、开机自启等已有功能全部保留；不引入新视觉风格、不破坏已有交互。

### 2.2 User Stories（3–5 个）

- **US-1** As a Windows 用户，我想要便签贴在桌面上不被其它窗口遮挡 so that 打开浏览器 / IDE 时还能持续看到自己写的提示和备忘。
- **US-2** As a Windows 用户，我希望 `Win+D` 切回桌面时还能看到便签 so that 便签真的像「贴」在桌面上，而不是一个会随其它窗口消失的浮窗。
- **US-3** As a Windows 用户，我希望偶尔把便签改成置顶浮窗 so that 演示、临时强调、或对照参考时便签浮在所有窗口之上不被遮。
- **US-4** As a Windows 用户，我希望开机后便签仍出现在桌面 so that 不需要每天手动启动 App 也不需要在系统启动文件夹里手工配置。
- **US-5** As a Windows 用户，我希望在嵌入失败这种极少见环境下 App 不会闪退 so that 我至少还能把便签当作普通置顶浮窗继续用。

### 2.3 边界 / 不做什么

- **不做云同步**：便签全部存本机，不联网，不上传，不同步到其它设备。
- **不做加密 / 密码保护**：本机单用户使用，不引入登录态。
- **不做富文本**：沿用现有纯文本 + Markdown 简化渲染（若已有），不引入完整 WYSIWYG 编辑器。
- **不做跨平台**：仅 Windows。macOS / Linux 不在范围内。
- **不做多桌面挂件编排**：不做主控面板、不做"贴纸墙"多贴纸拖拽排版（v1.0 保留当前单窗口列表视图）。

---

## 3. 技术规范

> 说明：以下技术方案**已经落地**，PRD 仅作为约束记录，不重新设计架构。

### 3.1 Requirements Pool

#### P0（必须，MUST）

- 默认启动后嵌入 Windows 桌面层：通过 `SendMessageTimeoutW(Progman, 0x052C, …)` 触发分层，再用 `SetParent(BrowserWindow.handle, WorkerW)` 挂到 Progman 的直接子 WorkerW（已封装在 `electron/desktop-layer.cjs` 的 `attachToDesktop(hwnd)`）。
- 层级切换 `applyLayer()` 必须在 BrowserWindow `ready-to-show` 之后再调用，避免创建过程中 handle 还未就绪。
- 嵌入失败（找不到 WorkerW / SetParent 抛错 / koffi 调用失败）时**降级为普通可拖拽窗口**，不闪退、不卡死；降级本身以 `console.error` 留痕。
- `koffi` 原生 `.node` 二进制通过 `electron-builder.yml` 的 `asarUnpack: ['node_modules/**/*.node']` 解包到 asar 外，避免打包后 FFI 找不到 native binding。
- 已成功打包产物：`release/GlassMemo-Setup-1.0.0.exe`（约 78MB）。

#### P1（应该，SHOULD）

- 托盘菜单「窗口置顶」checkbox 与应用状态双向绑定：
  - 勾选 → `applyLayer({ pinned: true })`：便签浮于所有窗口之上（alwaysOnTop）。
  - 取消勾选 → `applyLayer({ pinned: false })`：再次尝试 SetParent 回 WorkerW，回退桌面挂件模式。
- IPC 通道 `pin:toggle` 由渲染进程触发，统一走到主进程 `applyLayer()`，避免多处直接调用 Win32 API。
- 关闭按钮（标题栏 X）隐藏到托盘，不退出进程。
- 开机自启：托盘「开机自启」checkbox 写入 `app.setLoginItemSettings`，重启后便签出现在桌面。

#### P2（可选，COULD）

- 嵌入失败时把失败原因写入托盘 `tooltip` 字符串，便于用户在不打开 DevTools 的情况下自检（如「桌面挂件模式不可用：未找到 WorkerW」）。
- 提供诊断脚本 `_diag.cjs`：枚举 Progman 直接子窗口 + 顶层 WorkerW，打印句柄和 className，用于排查嵌入异常时的窗口树变化。

### 3.2 UI Design Draft

- **主窗口视觉**：沿用 `glassdemo` 已实现的暗色霓虹毛玻璃风格（半透明背景 + 霓虹色描边 + 高斯模糊），本 PR 不调整任何视觉。
- **托盘菜单项**（顺序固定）：
  1. 显示 / 隐藏（点击切换主窗口可见性）
  2. 窗口置顶（checkbox：勾选=浮窗置顶；未勾选=桌面挂件）
  3. 开机自启（checkbox：托盘常驻）
  4. 退出（彻底退出 App）
- **状态指示**：托盘图标 `tooltip` 随模式切换：
  - 桌面挂件模式：`GlassMemo · 桌面挂件`
  - 浮窗置顶模式：`GlassMemo · 浮窗置顶`

### 3.3 已知技术现状（约束，非设计）

- Windows 桌面树现状（已通过 koffi 枚举确认）：
  - `Progman` → `{ SHELLDLL_DefView（图标层）, WorkerW（空，待用于嵌入） }`
  - 顶层另有 14 个其它程序的 WorkerW，已在 `findDesktopWorkerW()` 中按"Progman 直接子"过滤，避免挂错对象。
- FFI 链路：`koffi 3.2.1` → `FindWindowW` / `FindWindowExW` / `SendMessageTimeoutW` / `SetParent` / `GetClassNameW`。
- 打包链路：`vite build → dist/` + `electron-builder` → `release/GlassMemo-Setup-1.0.0.exe`，已含 `asarUnpack`。

### 3.4 Open Questions（需用户本机验证，主 agent 不能代验）

1. `npm run electron:dev` 启动后，`SetParent` 实际嵌入是否生效？即：打开 Chrome / VS Code 后便签是否被盖住、`Win+D` 回桌面后便签是否仍可见？
2. `win.getNativeWindowHandle()` 在 Electron 33 下返回 `Buffer`，作为 koffi `void*` 参数传入时被实际接受吗？（koffi 期望 `Buffer` / `BigInt` 形式的指针，内部二进制可能需要 64 位对齐处理）
3. 多显示器扩展环境下，仅用 Progman 直接子 WorkerW 是否足够？是否需要在副屏也挂载？（v1.0 假设仅主屏）
4. koffi `.node` 在 `asarUnpack` 之外、且应用以普通用户权限运行时，是否仍能被正确加载（无管理员权限冲突）？

> 以上 Open Questions 关闭前，v1.0.0 的形态正确性可视作"已具备能力，依赖用户本机一次启动验证"。

---

## 4. 验收标准（必须明确、可测）

### 4.1 桌面挂件模式（默认）

- [ ] **AC-1**：执行 `npm run electron:dev` 或安装 `release/GlassMemo-Setup-1.0.0.exe` 后双击运行，便签窗口出现并可见。
- [ ] **AC-2**：打开任意其它程序窗口（如浏览器、IDE、文件管理器），便签被遮挡看不到。
- [ ] **AC-3**：按 `Win+D` 切回桌面，便签重新可见。
- [ ] **AC-4**：托盘图标 `tooltip` 显示「桌面挂件」。

### 4.2 浮窗置顶模式（托盘切换）

- [ ] **AC-5**：在托盘菜单勾选「窗口置顶」，便签立刻浮于所有其它窗口之上（包括全屏应用）。
- [ ] **AC-6**：再次打开 `Win+D` / 切换其它窗口，便签仍可见、不被遮挡。
- [ ] **AC-7**：取消勾选「窗口置顶」，便签返回桌面挂件模式（重新 SetParent 回 WorkerW）。
- [ ] **AC-8**：托盘 `tooltip` 切换为「浮窗置顶」，再次回到「桌面挂件」。

### 4.3 降级与稳定性

- [ ] **AC-9**：在不支持嵌入的极少见环境下（如 koffi 加载失败、找不到 WorkerW），便签退化为普通窗口；不闪退、不卡死、不弹窗打扰用户。
- [ ] **AC-10**：主进程 `console` 输出一条降级原因（如 `[desktop-layer] WorkerW not found, fallback to normal window`），便于事后排查。

### 4.4 既有体验保留

- [ ] **AC-11**：暗色霓虹毛玻璃视觉与改动前一致，无新增/修改视觉。
- [ ] **AC-12**：按日期记录便签功能正常，新增 / 编辑 / 删除 / 列表滚动行为不变。
- [ ] **AC-13**：透明度可调仍然可用，调后立刻生效。

### 4.5 托盘与生命周期

- [ ] **AC-14**：点击主窗口关闭按钮（X），窗口隐藏到托盘，进程不退出。
- [ ] **AC-15**：托盘「开机自启」勾选后，重启系统便签自动出现在桌面（默认桌面挂件模式）。
- [ ] **AC-16**：托盘「退出」点击后，进程完全退出，不再驻留。

### 4.6 打包验证

- [ ] **AC-17**：`npm run dist` 生成 `release/GlassMemo-Setup-1.0.0.exe`，安装后以上 AC-1 ~ AC-16 全部成立。
- [ ] **AC-18**：安装目录的 `resources/app.asar.unpacked/node_modules/**/koffi/**` 下存在 `.node` 文件，运行时 koffi 加载无 `Cannot find module` 报错。

---

## 5. 附：不在本 PRD 范围内的明确项

- 多便签拖拽摆放 / 桌面贴纸墙
- 便签云同步 / 账号系统
- 富文本编辑器 / 插入图片
- macOS / Linux 适配
- 便签导出 / 备份
- 自定义主题色（仅保留现有暗色霓虹毛玻璃一套）
