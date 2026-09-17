# Timequest 改进 — 系统设计文档

> **Architect: 高见远** | 2026-07-23 | 输入: PM PRD v1.0

---

## 1. 架构决策记录 (ADR)

### ADR-01: 为什么不动 timedebt.vue？

**决策**: 不从 timedebt.vue 抽取逻辑，仅读取 localStorage。

**理由**:
- timedebt.vue 数据使用独立 key `timeDebtData`，不在 Pinia store 中
- 该页面复杂度高（仪表盘、趋势图、术语解释、表单逻辑），抽到 store 风险高
- R5（时间价值融入主流程）只需读取 `annualIncome` → `hourlyRate`，无需修改 timedebt 本身
- 符合 PRD "不改 timedebt 页"的约束

### ADR-02: 新配置数据放哪里？

**决策**: 所有新增持久化状态放入 `timer` Pinia store，不复用 `timeDebtData` key。

**理由**:
- 已有序列化/反序列化基础设施（`serializeDate`/`deserializeDate`）
- 新增字段与计时主流程紧耦合（lastUsedCategory, lastOpenDate）
- 避免跨 view 直接操作 localStorage 导致的格式不一致

### ADR-03: 清醒时长存储格式

**决策**: 存入 `localStorage` key `timequest_config`（独立于 store），格式 `{ awakeHours: number }`。

**理由**: 与计时数据语义分离。MoreView 的配置修改不应触发 timer store 变更检测。

### ADR-04: 洞察计算放哪里？

**决策**: 新增 `src/utils/insights.ts` 作为纯函数模块。

**理由**:
- 计算逻辑无副作用，符合 utils 定位
- 不增加 Pinia store 负担
- 可被 ActivityView 直接 import 使用

---

## 2. 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                       localStorage                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐      │
│  │ timeEntries  │ │ activeTimer │ │ timeDebtData      │      │
│  │ (timer store)│ │ (timer store)│ │ (timedebt.vue)    │      │
│  └─────┬───────┘ └─────┬───────┘ └────────┬─────────┘      │
│        │               │                   │                 │
│  ┌─────┴───────────────┴───────────────────┴──────────┐    │
│  │  NEW: timequest_config   { awakeHours: 16 }         │    │
│  │  NEW: timequest_last_open  "2026-07-23"             │    │
│  │  NEW: timequest_reflections  [{date, rating}]       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐    ┌──────────────────────────┐
│  timer Store      │    │  timedebt.vue             │
│  (Pinia)          │    │  (独立管理 savedData)      │
│                   │    │  key: timeDebtData         │
│  + lastUsedCategory│   │                           │
│  + lastOpenDate   │    │  annualIncome ────┐       │
│  + dailyReflections│   │  hourlyRate       │       │
│                   │    │                   │       │
│  + getWeekEntries │    └───────────────────┼───────┘
│  + getMonthEntries│                        │
└────────┬──────────┘                        │ 读取
         │                                   │
         ▼                                   ▼
┌──────────────────┐    ┌──────────────────────────┐
│  insights.ts      │    │  ActivityView.vue         │
│  (纯函数)          │◄───│                           │
│                   │    │  ┌─ 时间漏洞卡片 (R1)     │
│  computeWeeklyComp│    │  ├─ 计时器 (R2一键+R5价值)│
│  computeMonthlyCmp│    │  ├─ 洞察区域 (R4)         │
│                   │    │  └─ 日终弹窗 (R3)         │
└────────┬──────────┘    └──────────────────────────┘
         │
         ▼
┌──────────────────┐
│  MoreView.vue     │
│  (R6)             │
│  ┌─ 清醒时长设置  │
│  └─ JSON 导出     │
└──────────────────┘
```

---

## 3. 数据结构定义

### 3.1 localStorage 新增 Keys

```
timequest_config        → { "awakeHours": 16 }
timequest_last_open     → "2026-07-23"       (YYYY-MM-DD)
timequest_reflections   → [{ "date": "2026-07-22", "rating": "good" }]
timequest_last_timer    → { "category": "自学", "icon": "📖" }
```

### 3.2 Timer Store 新增字段

```ts
// 追加到现有 store 返回值
lastUsedCategory: Ref<{ category: string; icon: string } | null>
lastOpenDate: Ref<string | null>
dailyReflections: Ref<Array<{ date: string; rating: 'good' | 'bad' }>>

// 新增 computed
todayAwakeSeconds: ComputedRef<number>  // awakeHours * 3600
todayRecordedSeconds: ComputedRef<number> // getTodayTotal() 别名
todayUnrecordedSeconds: ComputedRef<number>
unrecordedRatio: ComputedRef<number>

// 新增 actions
recordLastOpen(): void
addReflection(rating: 'good' | 'bad'): void
getYesterdayEntries(): TimeEntry[]
getWeekEntries(weekOffset: number): TimeEntry[]  // 0=本周, -1=上周
getMonthEntries(monthOffset: number): TimeEntry[] // 0=本月, -1=上月
```

### 3.3 insights.ts 类型

```ts
export interface Insight {
  type: 'weekly' | 'monthly'
  category: string
  icon: string
  direction: 'up' | 'down'    // 上升/下降
  currentLabel: string        // "本周 自学 12h"
  compareLabel: string        // "上周 自学 8h"
  changePercent: number       // 50 (正数=增加)
  severity: 'positive' | 'negative'
}

export function getInsights(
  entries: TimeEntry[],
  weekOffset?: number,
  monthOffset?: number
): Insight[]
```

### 3.4 日终反射弹窗数据流

```
App.vue onMounted
  → timer.lastOpenDate 对比 today
  → if (lastOpenDate ≠ today && yesterdayEntries.length > 0)
      → 显示 van-dialog: "昨天记录了 X 项, Y 小时, 感觉如何? 👍 👎"
      → 用户点击 → timer.addReflection(rating)
      → timer.recordLastOpen()
```

---

## 4. 文件改动清单

| # | 文件 | 改动类型 | 关联需求 | 预估行数 |
|---|------|---------|---------|---------|
| 1 | `src/stores/timer.ts` | **修改** — 新增 6 个 state + 3 个 action + 3 个 computed | R1, R2, R3 | +80 |
| 2 | `src/utils/insights.ts` | **新增** — 洞察计算纯函数 | R4 | +70 |
| 3 | `src/views/ActivityView.vue` | **修改** — 新增 4 个 UI 区域 | R1, R2, R3, R4, R5 | +200 |
| 4 | `src/views/MoreView.vue` | **修改** — 替换空壳 | R6 | +100 |
| 5 | `src/App.vue` | **修改** — onMounted 触发日终检查 | R3 | +15 |

**不改动**: `timedebt.vue`, `MainLayout.vue`, `router/index.ts`, `HistoryView.vue`, `CategoryView.vue`, `timeUtils.ts`

---

## 5. 关键调用流程

### 5.1 打开 App → 日终反射检查

```
App.vue onMounted()
  → today = new Date().toISOString().slice(0,10)
  → lastOpen = localStorage.getItem('timequest_last_open')
  → if (lastOpen !== today)
      → yesterdayEntries = timer.getTimeEntriesByDateRange(yesterday, today)
      → if (yesterdayEntries.length > 0)
          → showReflectionDialog = true
```

### 5.2 一键计时

```
用户点击悬浮按钮
  → lastUsed = timer.lastUsedCategory
  → if (lastUsed)
      → timer.startTimer(lastUsed.category, lastUsed.category, '', lastUsed.icon)
  → else
      → 展开类别选择器（现有逻辑 fallback）
```

### 5.3 计时停止 → 更新 lastUsedCategory

```
timer.stopTimer()
  → (现有逻辑: 创建 TimeEntry, 写入 localStorage)
  → NEW: timer.lastUsedCategory = { category: entry.category, icon: entry.icon }
  → NEW: localStorage.setItem('timequest_last_timer', JSON.stringify(...))
```

### 5.4 时间价值显示（计时运行中）

```
ActivityView 模板 computed:
  → timedebtData = JSON.parse(localStorage.getItem('timeDebtData') || '[]')
  → latestYear = timedebtData.find(d => d.annualIncome > 0) // 最新有数据的年份
  → if (latestYear)
      → hourlyRate = latestYear.hourlyRate
      → elapsedHours = activeTimer.elapsedSeconds / 3600
      → currentValue = hourlyRate * elapsedHours
      → display: "时间价值 ≈ ¥{hourlyRate}/h | 已累积 ¥{currentValue.toFixed(0)}"
  → else → 不显示此行
```

### 5.5 洞察计算

```
insights.getInsights(timer.timeEntries)
  → 对每个有记录的类别:
      → 本周总量 vs 上周总量
      → 本月总量 vs 上月总量
  → 过滤: 仅保留 |changePercent| ≥ 30%
  → 排序: 按 |changePercent| 降序
  → 返回前 3 条
```

---

## 6. 任务拆解（5 个任务）

### T1: 扩展 Timer Store

**输入**: 现有 `src/stores/timer.ts`

**要做什么**:
1. 新增 `awakeHours` 配置（读/写 `timequest_config` localStorage）
2. 新增 `lastUsedCategory`（读/写 `timequest_last_timer` localStorage）
3. 新增 `lastOpenDate` + `dailyReflections`（读/写对应 localStorage keys）
4. 新增 computed: `todayAwakeSeconds`, `todayUnrecordedSeconds`, `unrecordedRatio`
5. 新增 actions: `recordLastOpen()`, `addReflection(rating)`, `getYesterdayEntries()`, `getWeekEntries(offset)`, `getMonthEntries(offset)`
6. 修改 `stopTimer`: 在 `saveToStorage()` 前追加更新 `lastUsedCategory`

**验证**: 
- 打开浏览器 DevTools → Application → Local Storage → 确认新增 keys 可读写
- `import { useTimerStore }` → 新 computed/action 类型检查通过

**输出**: 修改后的 `timer.ts`

---

### T2: 时间漏洞卡片 (R1)

**输入**: 扩展后的 timer store

**要做什么**:
1. 在 ActivityView 顶部（计时器上方）插入「时间漏洞卡片」
2. 从 store 读取 `unrecordedRatio`, `todayAwakeSeconds`, `todayRecordedSeconds`
3. 未记录 > 70% → 百分比数字标红 (`color: #EF4444`)
4. 卡片样式: 白色圆角卡片，左侧时间图标，右侧数值

**验证**: 
- 首次打开：记录 0h，显示 "清醒 16h · 已记录 0h，16h 未记录 (100%)" → 标红
- 记录 5h 后：显示 "清醒 16h · 已记录 5h，11h 未记录 (69%)" → 正常色

**输出**: ActivityView 中新增 `<div class="time-leak-card">` 区域

---

### T3: 一键计时按钮 + 时间价值显示 (R2 + R5)

**输入**: 扩展后的 timer store, timedebt.vue 已存数据

**要做什么**:
1. ActivityView 底部悬浮按钮（position: fixed, 安全区域适配）
2. 读取 `timer.lastUsedCategory` → 显示 "{icon} {category} 一键计时"
3. 无历史时 fallback 到现有类别选择器
4. 计时运行中：计时器数字下方显示时间价值行
   - 从 `localStorage.getItem('timeDebtData')` 读取 `hourlyRate`
   - 实时计算 `hourlyRate × (elapsedSeconds / 3600)`
   - 仅在有 `annualIncome > 0` 的数据时显示

**验证**:
- 停止一个计时后，悬浮按钮显示上次类别
- 点击直接启动，无需选择
- 计时运行中，下方显示 "时间价值 ≈ ¥{rate}/h | 已累积 ¥{value}"
- 未设年薪 → 不显示时间价值行

**输出**: ActivityView 中新增 `.one-click-timer` 浮动按钮 + `.time-value-overlay` 区域

---

### T4: 洞察卡片 + 日终反射弹窗 (R3 + R4)

**输入**: T1 的 store, T3 的 ActivityView

**要做什么**:
1. 创建 `src/utils/insights.ts`（纯函数）
2. ActivityView 中「洞察」区域（计时器下方）
3. 调用 `getInsights(timeEntries)` → 渲染 0-3 条对比洞察
4. 每条洞察格式: "[icon] [direction] 本周[类别] +N% | 上周 xxx"
5. App.vue onMounted 添加日终反射检查逻辑
6. 弹窗使用 `van-dialog`："昨天记录了 X 项，共 Y 小时，感觉如何？👍 👎"

**验证**:
- 有 ≥30% 变化的类别 → 显示洞察卡
- 变化 < 30% 或只有本周数据 → 不显示该条
- 跨天后首次打开 → 弹出日终反射 → 点击👍/👎 → 存入 localStorage
- 昨天没记录 → 不弹

**输出**: `insights.ts` 文件 + ActivityView 洞察区域 + App.vue onMounted

---

### T5: MoreView 重构 (R6)

**输入**: 现有 `src/views/MoreView.vue`

**要做什么**:
1. 替换「报告[待完成]」→ 「清醒时长设置」（stepper: 8-20h, 默认 16）
2. 替换「设置[待完成]」→ 「导出数据（JSON）」按钮
3. 保留「帮助」和「关于」
4. 删除「登录/同步[待完成]」
5. 清醒时长修改 → 写入 `localStorage` key `timequest_config`
6. 导出功能 → `JSON.stringify({ timeEntries, config, reflections })` → 触发下载

**验证**:
- 清醒时长改为 14h → 回到活动页 → 时间漏洞卡片显示 "清醒 14h"
- 点击导出 → 下载 `timequest-export-2026-07-23.json`
- 文件内容包含完整 timeEntries 数组

**输出**: 修改后的 `MoreView.vue`

---

## 7. 依赖关系图

```
                    ┌─────────────┐
                    │  T1: Store  │  (基础设施)
                    │  扩展       │
                    └──┬───┬──┬──┘
                       │   │  │
          ┌────────────┘   │  └────────────┐
          ▼                ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │ T2: 漏洞卡片 │ │ T3: 一键+价值│ │ T4: 洞察+反射│
   │    (R1)     │ │  (R2+R5)    │ │  (R3+R4)    │
   └─────────────┘ └─────────────┘ └──────┬──────┘
                                          │
                                   ┌──────┴──────┐
                                   │  T4: 日终反射 │→ 需修改 App.vue
                                   └─────────────┘

                    ┌─────────────┐
                    │ T5: MoreView │  (独立，仅读 timequest_config)
                    │    (R6)     │
                    └─────────────┘
```

- **T1 必须最先完成**
- T2/T3/T4 可以并行（都依赖 T1）
- T4 中 App.vue 改动与 ActivityView 无冲突
- **T5 完全独立**，可任意时点执行

---

## 8. 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| timedebt localStorage key 不存在或格式异常 | R5 时间价值行无法显示 | 静默降级：不显示该行，不影响计时功能 |
| 用户从未记录过任何时间条目 | R2 一键计时无 lastUsedCategory, R4 洞察无数据 | 一键计时 fallback 到类别选择器；洞察区域显示空状态文案 |
| 清醒时长设为极端值（如 8h） | R1 未记录比率失准 | 允许 8-20h 范围，标注推荐 16h |
| JSON 导出文件过大 | 浏览器卡顿 | entries 按日期排序，无分页——对于个人级 App 足够 |

---

## 9. 一致性检查清单

- [ ] 所有新增 localStorage keys 命名统一前缀 `timequest_`
- [ ] 不与现有 `timeEntries` / `activeTimer` / `timeDebtData` key 冲突
- [ ] timer store 新增字段使用与现有一致的 `serializeDate` 逻辑
- [ ] Vant UI 组件用法与现有代码风格一致（van-dialog, van-cell-group, van-stepper）
- [ ] CSS 颜色变量与现有主题一致（`#6366F1` 品牌紫, `#EF4444` 红色, `#F9F9FB` 背景灰）
- [ ] TypeScript 严格模式兼容（现有项目已启用）
- [ ] 响应式安全区域适配（`env(safe-area-inset-bottom)` 用于悬浮按钮）
