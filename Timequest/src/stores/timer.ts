import { ref, computed } from "vue"
import { defineStore } from "pinia"

export interface TimeEntry {
  id: string
  title: string
  startTime: Date
  endTime: Date | null
  duration: number
  category: string
  description?: string
  valueEvaluation?: number
  actualValue?: number
  aiEmpowerment?: number
  status?: number
  workload?: number
  workloadUnit?: string
  createdAt: Date
  icon?: string
  statusRating?: number
  aiEnablementRating?: number
}

const serializeDate = (obj: any): any => {
  if (obj instanceof Date) {
    return { $date: obj.toISOString() }
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDate)
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDate(value)])
    )
  }
  return obj
}

const deserializeDate = (obj: any): any => {
  if (obj && typeof obj === "object" && "$date" in obj) {
    return new Date(obj.$date)
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeDate)
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deserializeDate(value)])
    )
  }
  return obj
}

export const useTimerStore = defineStore("timer", () => {
  const loadFromStorage = () => {
    try {
      const savedTimeEntries = localStorage.getItem("timeEntries")
      if (savedTimeEntries) {
        return deserializeDate(JSON.parse(savedTimeEntries))
      }
    } catch (error) {
      console.error("Failed to load data from storage:", error)
    }
    return []
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem("timeEntries", JSON.stringify(serializeDate(timeEntries.value)))
      if (activeTimer.value) {
        localStorage.setItem("activeTimer", JSON.stringify(serializeDate(activeTimer.value)))
      } else {
        localStorage.removeItem("activeTimer")
      }
    } catch (error) {
      console.error("Failed to save data to storage:", error)
    }
  }

  const loadActiveTimer = () => {
    try {
      const saved = localStorage.getItem("activeTimer")
      return saved ? deserializeDate(JSON.parse(saved)) : null
    } catch {
      return null
    }
  }

  const activeTimer = ref<{
    id: string
    title: string
    startTime: Date
    category: string
    description?: string
    valueEvaluation?: number
    icon?: any
    pauseDuration?: number
    lastPauseTime?: Date | null
  } | null>(loadActiveTimer())

  const timeEntries = ref<TimeEntry[]>(loadFromStorage())
  const totalDuration = computed(() => {
    return timeEntries.value.reduce((total, entry) => total + (entry.duration || 0), 0)
  })

  // --- T1: 新增状态 ---
  const lastUsedCategory = ref<string>("")
  const lastUsedIcon = ref<string>("")
  const lastOpenDate = ref<string>("")
  const wakeHours = ref<number>(16)

  // 从 localStorage 加载 wakeHours
  try {
    const config = localStorage.getItem("timequest_config")
    if (config) {
      const parsed = JSON.parse(config)
      if (typeof parsed.awakeHours === "number" && parsed.awakeHours >= 8 && parsed.awakeHours <= 20) {
        wakeHours.value = parsed.awakeHours
      }
    }
  } catch {
    // ignore
  }

  // 从 localStorage 加载 lastOpenDate
  try {
    const saved = localStorage.getItem("timequest_last_open")
    if (saved) lastOpenDate.value = saved
  } catch {
    // ignore
  }

  // --- T1: 新增 computed ---
  const todayRecordedDuration = computed(() => getTodayTotal())

  const unrecordedGap = computed(() => {
    const gap = wakeHours.value * 3600 - getTodayTotal()
    return Math.max(0, gap)
  })

  const unrecordedPercent = computed(() => {
    if (wakeHours.value <= 0) return 0
    return Math.round((unrecordedGap.value / (wakeHours.value * 3600)) * 100)
  })

  // 获取今日日期字符串 YYYY-MM-DD
  const getTodayDateStr = (): string => {
    const d = new Date()
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0")
  }

  // --- T1: 新增 actions ---
  function updateLastOpenDate(date: string) {
    lastOpenDate.value = date
    localStorage.setItem("timequest_last_open", date)
  }

  /** 更新清醒时长，同时保存到 localStorage（合并写入，不破坏其他 config 键） */
function updateWakeHours(h: number) {
    wakeHours.value = h
    const existing = JSON.parse(localStorage.getItem("timequest_config") || "{}")
    localStorage.setItem("timequest_config", JSON.stringify({ ...existing, awakeHours: h }))
  }

  function recordDailyReflection(date: string, mood: string) {
    try {
      let reflections: { date: string; mood: string }[] = []
      const saved = localStorage.getItem("timequest_reflections")
      if (saved) reflections = JSON.parse(saved)
      reflections.unshift({ date, mood })
      localStorage.setItem("timequest_reflections", JSON.stringify(reflections))
    } catch {
      // ignore
    }
  }

  // 获取指定日期的时间条目
  function getTimeEntriesByDate(targetDate: string) {
    const start = new Date(targetDate + "T00:00:00")
    const end = new Date(targetDate + "T23:59:59.999")
    return timeEntries.value.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= start && entryDate <= end
    })
  }

  // 获取周时间条目（指定结束日期，7天窗口）
  function getTimeEntriesByWeek(endDate: Date) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return timeEntries.value.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= start && entryDate <= end
    })
  }

  // 获取月时间条目（指定结束日期，30天窗口）
  function getTimeEntriesByMonth(endDate: Date) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    return timeEntries.value.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= start && entryDate <= end
    })
  }

  function startTimer(title: string, category: string, description?: string, icon?: any, valueEvaluation?: number, customStartTime?: Date) {
    if (activeTimer.value) {
      stopTimer()
    }

    const timerId = Date.now().toString()
    activeTimer.value = {
      id: timerId,
      title,
      startTime: customStartTime || new Date(),
      category,
      description,
      icon,
      valueEvaluation,
      pauseDuration: 0,
      lastPauseTime: null as Date | null
    }
    saveToStorage()
  }

  function pauseTimer() {
    if (activeTimer.value && !activeTimer.value.lastPauseTime) {
      activeTimer.value.lastPauseTime = new Date()
      saveToStorage()
    }
  }

  function resumeTimer() {
    if (activeTimer.value && activeTimer.value.lastPauseTime) {
      const pauseDuration = Math.floor((new Date().getTime() - activeTimer.value.lastPauseTime!.getTime()) / 1000)
      activeTimer.value.pauseDuration = (activeTimer.value.pauseDuration || 0) + pauseDuration
      activeTimer.value.lastPauseTime = null
      saveToStorage()
    }
  }

  function stopTimer() {
    if (!activeTimer.value) return

    // T1: 保存上次使用的类别和图标
    lastUsedCategory.value = activeTimer.value.category
    lastUsedIcon.value = activeTimer.value.icon

    if (activeTimer.value.lastPauseTime) {
      const pauseDuration = Math.floor((new Date().getTime() - activeTimer.value.lastPauseTime!.getTime()) / 1000)
      activeTimer.value.pauseDuration = (activeTimer.value.pauseDuration || 0) + pauseDuration
      activeTimer.value.lastPauseTime = null
    }

    const now = new Date()
    const rawDuration = Math.floor((now.getTime() - activeTimer.value.startTime.getTime()) / 1000)
    const duration = rawDuration - (activeTimer.value.pauseDuration || 0)

    const newEntry: TimeEntry = {
      id: activeTimer.value.id,
      title: activeTimer.value.title,
      startTime: activeTimer.value.startTime,
      endTime: now,
      duration,
      category: activeTimer.value.category,
      description: activeTimer.value.description,
      valueEvaluation: activeTimer.value.valueEvaluation,
      createdAt: new Date()
    }

    timeEntries.value.unshift(newEntry)
    activeTimer.value = null
    saveToStorage()
  }

  function addTimeEntry(entry: Omit<TimeEntry, "id" | "createdAt">) {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date()
    }

    if (!newEntry.duration && newEntry.startTime && newEntry.endTime) {
      newEntry.duration = Math.floor((newEntry.endTime.getTime() - newEntry.startTime.getTime()) / 1000)
    }

    timeEntries.value.unshift(newEntry)
    saveToStorage()
  }

  function removeTimeEntry(id: string) {
    timeEntries.value = timeEntries.value.filter(entry => entry.id !== id)
    saveToStorage()
  }

  function updateTimeEntry(id: string, updates: Partial<TimeEntry>) {
    const index = timeEntries.value.findIndex(entry => entry.id === id)
    if (index !== -1) {
      timeEntries.value[index] = { ...timeEntries.value[index], ...updates } as TimeEntry
      saveToStorage()
    }
  }

  function getTimeEntriesByDateRange(startDate: Date, endDate: Date) {
    return timeEntries.value.filter(entry => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  function getStatsByCategory() {
    const stats: Record<string, { totalTime: number, count: number }> = {}

    timeEntries.value.forEach(entry => {
      const category = entry.category
      if (!stats[category]) {
        stats[category] = { totalTime: 0, count: 0 }
      }
      const categoryStats = stats[category]
      if (categoryStats) {
        categoryStats.totalTime += entry.duration || 0
        categoryStats.count += 1
      }
    })

    return stats
  }

  function getTodayTotal() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return getTimeEntriesByDateRange(today, tomorrow).reduce(
      (sum, entry) => sum + (entry.duration || 0),
      0
    )
  }

  function clearAllEntries() {
    timeEntries.value = []
    saveToStorage()
  }

  return {
    activeTimer,
    timeEntries,
    totalDuration,
    // T1: 新增
    lastUsedCategory,
    lastUsedIcon,
    lastOpenDate,
    wakeHours,
    todayRecordedDuration,
    unrecordedGap,
    unrecordedPercent,
    getTodayDateStr,
    updateLastOpenDate,
    updateWakeHours,
    recordDailyReflection,
    getTimeEntriesByDate,
    getTimeEntriesByWeek,
    getTimeEntriesByMonth,
    // 原有
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    addTimeEntry,
    removeTimeEntry,
    updateTimeEntry,
    getTimeEntriesByDateRange,
    getStatsByCategory,
    getTodayTotal,
    clearAllEntries
  }
})
