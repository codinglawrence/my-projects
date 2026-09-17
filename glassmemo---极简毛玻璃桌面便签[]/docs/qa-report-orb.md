# QA 测试报告 · GlassMemo Orb 增量（v1.1.0）

> 角色：QA 严过关（Edward）
> Round：1
> 范围：悬浮球（Orb Mode）— 完整便签 ↔ 悬浮球形态切换功能
> 时间：2026-09-05

---

## Summary

| 项 | 结果 |
| --- | --- |
| 总测试用例 | **106 passed / 0 failed** |
| 现有 baseline 全保留 | ✅ |
| 新增测试用例 | 55（30 + 25） |
| 测试文件清单 | 2 新增 / 0 修改 |
| `npm run build` | ✅ 通过 |
| `npm run lint` | ⚠️ 3 error，均来自 `_template_backup/AppleStickyNote.tsx`（历史 scaffold 残留，**与本次 orb 增量无关**） |
| 源码 bug | **未发现** |
| 测试自身 bug | **未遗留**（Round 1 内已自修） |
| 路由决策 | **NoOne（无源码 bug，可合入）** |

---

## 测试文件清单

### 新增

| 路径 | 类型 | 用例数 | 用途 |
| --- | --- | --- | --- |
| `electron/test/orb-controller.test.cjs` | 状态机单测 | 30 | OrbController 状态机 + BoundsRepository IO + DragHandler + SnappingPolicy 边界 |
| `electron/test/view-type-consistency.test.cjs` | 静态契约 | 25 | types.ts ↔ preload.cjs ↔ main.cjs ↔ StickyNote.tsx ↔ Orb.tsx ↔ useViewMode.ts 字段一致 + 跨层常量一致 |

### 既有（保留独立自检，未修改）

| 路径 | 用例数 | 用途 |
| --- | --- | --- |
| `electron/_diag-orb.cjs` | 9 | SnappingPolicy 单测（开发者自检脚本） |
| `electron/test/desktop-layer.test.cjs` | 15 | desktop-layer.cjs 单元测试 |
| `electron/test/main-static.test.cjs` | 15 | main.cjs 静态契约（pin 维度） |
| `electron/test/type-consistency.test.cjs` | 12 | 类型契约（pin 维度） |

合计：**6 个测试入口，106 用例。**

---

## Failed

**0 个失败用例。** Round 1 跑出来过 3 个测试自身 bug（不是源码问题），都在本轮 QA 内自修：

| 测试用例 | 原因 | 处理 |
| --- | --- | --- |
| `orb-controller.test.cjs: expand → setMinimumSize 对比` | mock 记录键名 `{w, h}` ≠ NOTE_MIN_SIZE 键名 `{width, height}` | 改对比为 mock 键名 |
| `orb-controller.test.cjs: toggle win.destroyed 后返回'note'` | 测试逻辑错：先 shrink 再 destroy 后，currentView='orb' 而非 'note' | 改期望为 'orb' |
| `view-type-consistency.test.cjs: webContents.send('view:change')` | 设计上 view:change 由 OrbController 推送，main.cjs 故意不直接 send | 改为检查 main.cjs 不直接 send + orb-controller 正确推送 |

---

## 覆盖矩阵

### OrbController 状态机（30 例）

| 套件 | 用例 |
| --- | --- |
| SnappingPolicy 边界 | 4（width 缺失兜底 / workArea 过小 / 正中央不贴 / distLeft=0 边界） |
| BoundsRepository IO | 8（save/load 往返 × 2 / 缺文件 → null / JSON 损坏 → null / 非法 enum → null / loadOrb 兜底居中） |
| shrink | 1（note → orb：minSize=60, resizable=false, setBounds 推 60×60, view:change 推送, note-bounds + view-state 持久化） |
| expand | 2（orb → note：minSize=200, resizable=true, setBounds=存档, view-state 切换；note-bounds 缺失时用 DEFAULT_NOTE_BOUNDS 兜底） |
| toggle | 3（note → shrink；isAnimating 防快速点击 AC-18；win.destroyed 不抛错） |
| notifyAnimationDone | 1 |
| restoreOnStartup | 3（lastView=orb / lastView=note / 首次默认 note） |
| DragHandler | 6（start/move/end/越界 clamp/贴边+持久化/win.destroyed/缺 phase） |
| 顺序合约 | 2（shrink: minSize+resizable+bounds 均执行；expand: setBounds+view:change 都触发，对应 SK-3/SK-4） |

### 类型一致性（25 例）

| 覆盖点 | 说明 |
| --- | --- |
| types.ts 单一来源 | ViewMode / Bounds / ViewState / ViewChangePayload / OrbDragDelta / ViewToggleSource |
| preload.cjs | view.{toggle, get, onChange, drag, notifyAnimDone} 全部签名存在 |
| main.cjs | view:toggle / view:get / view:drag / view:anim-done IPC + 转发 OrbController + ready-to-show → restoreOnStartup + view:change **不**直接 send（SK-4 单一推送源）+ 托盘 inOrb 三元动态 |
| orb-controller.cjs | _emitChange 字段 from/to/bounds/isAnimating + 状态字段 currentView/currentBounds/isAnimating |
| StickyNote.tsx | window.glassmemo.view 接口 + 按钮顺序（pin → shrink → hide）+ AnimatePresence 三元 + useViewMode 解构 |
| Orb.tsx | 引用常量 + onExpand 类型 + 拖动 phase |
| useViewMode.ts | onChange payload.setState + notifyAnimationDone |
| 跨层常量 | ORB_SIZE / SNAP_THRESHOLD / SNAP_INSET 渲染层==主进程 |

---

## npm run build / lint

### `npm run build` ✅

```
vite v6.4.3 building for production...
✓ 2083 modules transformed.
dist/index.html                   0.68 kB │ gzip:   0.47 kB
dist/assets/index-BeVv0SRW.css   61.23 kB │ gzip:   11.45 kB
dist/assets/index-B832dzom.js   351.48 kB │ gzip: 112.03 kB
✓ built in 14.42s
```

### `npm run lint` ⚠️

**3 个 error，全部来自 `_template_backup/AppleStickyNote.tsx`：**

```
_template_backup/AppleStickyNote.tsx(14,53): error TS2307: Cannot find module '../types'
_template_backup/AppleStickyNote.tsx(15,60): error TS2307: Cannot find module '../utils/date'
_template_backup/AppleStickyNote.tsx(16,35): error TS2307: Cannot find module './MinimalDatePicker'
```

**结论：与本次 orb 增量无关。** 该文件位于 `_template_backup/` 历史模板目录（不在 src/ 下、vite 也不打包它），时间戳是 2026-08-16，远早于本次 PR。**本次增量代码本身 0 lint error**。

> 此项已知但**不建议在本 PR 顺手修**，原因：(a) 不在本 PR scope；(b) 文件名带 backup 暗示是历史 backup，删除前需要 PM/Architect 决策。

---

## Known Issues（沙箱不可验项）

下列条目**未能在本环境跑出验证**，需在 GUI 环境（Windows + Electron）验证：

| ID | 内容 | 来源 | 验证方式 |
| --- | --- | --- | --- |
| KI-1 | 真实 BrowserWindow 收缩/展开动画 | PRD AC-2 / 系统设计 SK-3 | 启动应用 → 点缩小按钮 → 看 motion 250ms 过渡 + bounds 切到 60×60 |
| KI-2 | 真实拖动手势 | PRD AC-9 / 系统设计 A.1 难点 3 | 鼠标在 orb 上 mousedown → move → up，看跟手 + 4px 阈值判定 click/drag |
| KI-3 | 真实 IPC `view:change` 主→渲染推送 | PRD AC-2 / 系统设计 SK-4 | 启动应用 → toggle → DevTools console 观察 `view:change` 消息与回调时序 |
| KI-4 | view-mode 持久化恢复（无 userData 真实读写） | PRD AC-6 / AC-12 / 序列图 S4 | shrink → 关闭应用 → 重启 → 应从 orb 启动；expand → 关闭 → 重启 → 应从 note 启动 |
| KI-5 | 贴边吸附的真实视觉判定 | PRD AC-11 | 拖 orb 到屏幕左/右 ≤30px 释放 → 应贴边（视觉上圆心距边 8px） |
| KI-6 | 打包后 `asar:false` 路径下 orb 实际效果 | 电子打包配置 | `npm run dist` 产出 .exe → 安装 → 看 orb 模式在真实 Windows 桌面层嵌入时是否正常 |
| KI-7 | orb 模式桌面层嵌入 z-order 行为 | 系统设计 A.5 Open Q5 | orb 模式下右键菜单 / Alt+Tab / Win+D 后是否仍可见 |
| KI-8 | `pinned=true` 状态横跨 view 切换保持 | PRD AC-14 | 先点置顶 → 缩小 → 看 orb 是否置顶；展开 → 看 note 是否仍置顶 |
| KI-9 | 双击 orb 展开 vs 单击展开的区别 | PRD P1 / AC-8 | 单击 250ms 内 vs 间隔 ≥300ms 的两次点击行为差异 |
| KI-10 | `_template_backup/AppleStickyNote.tsx` 历史 scaffold 残留 | baseline 旧文件 | tsconfig 加 exclude 或删除该目录 |

---

## 路由决策

### Send To: **NoOne**

**理由**：
1. 全部 106 个测试用例通过，源码层面无 bug
2. 新增 55 个用例覆盖 OrbController 状态机、BoundsRepository IO、DragHandler、SnappingPolicy、类型契约全链路
3. `npm run build` 通过；`npm run lint` 仅 baseline 残留文件报错，与 PR 无关
4. 沙箱不可验项已完整清单化，转交后续 GUI 验证

**不需要**：
- 不需要 Engineer 修源码
- 不需要 Security / PM / Architect 介入

---

## 沙箱不可验项清单（再次汇总）

参见上文 "Known Issues" 章节 KI-1 ~ KI-10。

---

## 测试可重跑命令

```bash
# 1. 已有 baseline
node electron/_diag-orb.cjs
node electron/test/desktop-layer.test.cjs
node electron/test/main-static.test.cjs
node electron/test/type-consistency.test.cjs

# 2. 本次新增
node electron/test/orb-controller.test.cjs
node electron/test/view-type-consistency.test.cjs

# 3. 构建
npm run build
npm run lint   # 仅 _template_backup 报错，与本 PR 无关
```
