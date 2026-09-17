export interface Insight {
  type: "up" | "down"
  category: string
  text: string
  diffPercent: number
}

interface CategoryTotals {
  [category: string]: number
}

/**
 * Sum durations grouped by category for a list of entries
 */
function groupByCategory(entries: { category: string; duration?: number }[]): CategoryTotals {
  const totals: CategoryTotals = {}
  for (const e of entries) {
    if (!totals[e.category]) totals[e.category] = 0
    totals[e.category] = (totals[e.category] || 0) + (e.duration || 0)
  }
  return totals
}

/**
 * Compute comparative insights (week-over-week, month-over-month).
 * Only returns categories with diffPercent >= 30%.
 *
 * Week: rolling 7 days vs previous 7 days
 * Month: rolling 30 days vs previous 30 days
 */
export function computeInsights(
  timeEntries: { category: string; duration?: number; startTime: Date | string }[]
): Insight[] {
  const now = new Date()
  const results: Insight[] = []

  // --- Week over week ---
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(thisWeekStart.getDate() - 6)
  thisWeekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1)

  const thisWeekEntries = timeEntries.filter((e) => {
    const d = new Date(e.startTime)
    return d >= thisWeekStart && d <= now
  })
  const lastWeekEntries = timeEntries.filter((e) => {
    const d = new Date(e.startTime)
    return d >= lastWeekStart && d <= lastWeekEnd
  })

  const thisWeekTotals = groupByCategory(thisWeekEntries)
  const lastWeekTotals = groupByCategory(lastWeekEntries)

  // Compare week categories
  const allWeekCats = new Set([...Object.keys(thisWeekTotals), ...Object.keys(lastWeekTotals)])
  for (const cat of allWeekCats) {
    const current = thisWeekTotals[cat] || 0
    const previous = lastWeekTotals[cat] || 0
    if (previous <= 0 && current <= 0) continue
    if (previous <= 0) {
      results.push({ type: "up", category: cat, text: `本周${cat} ${formatHours(current)}，上周无记录`, diffPercent: 100 })
    } else {
      const diff = Math.round(((current - previous) / previous) * 100)
      const absDiff = Math.abs(diff)
      if (absDiff >= 30) {
        const dir = diff > 0 ? "up" : "down"
        results.push({
          type: dir,
          category: cat,
          text: `本周${cat} ${formatHours(current)}，较上周${diff > 0 ? "+" : ""}${diff}%`,
          diffPercent: absDiff
        })
      }
    }
  }

  // --- Month over month ---
  const thisMonthStart = new Date(now)
  thisMonthStart.setDate(thisMonthStart.getDate() - 29)
  thisMonthStart.setHours(0, 0, 0, 0)

  const lastMonthStart = new Date(thisMonthStart)
  lastMonthStart.setDate(lastMonthStart.getDate() - 30)
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1)

  const thisMonthEntries = timeEntries.filter((e) => {
    const d = new Date(e.startTime)
    return d >= thisMonthStart && d <= now
  })
  const lastMonthEntries = timeEntries.filter((e) => {
    const d = new Date(e.startTime)
    return d >= lastMonthStart && d <= lastMonthEnd
  })

  const thisMonthTotals = groupByCategory(thisMonthEntries)
  const lastMonthTotals = groupByCategory(lastMonthEntries)

  // Compare month categories
  const allMonthCats = new Set([...Object.keys(thisMonthTotals), ...Object.keys(lastMonthTotals)])
  for (const cat of allMonthCats) {
    const current = thisMonthTotals[cat] || 0
    const previous = lastMonthTotals[cat] || 0
    if (previous <= 0 && current <= 0) continue
    if (previous <= 0) {
      results.push({ type: "up", category: cat, text: `本月${cat} ${formatHours(current)}，上月无记录`, diffPercent: 100 })
    } else {
      const diff = Math.round(((current - previous) / previous) * 100)
      const absDiff = Math.abs(diff)
      if (absDiff >= 30) {
        const dir = diff > 0 ? "up" : "down"
        results.push({
          type: dir,
          category: cat,
          text: `本月${cat} ${formatHours(current)}，较上月${diff > 0 ? "+" : ""}${diff}%`,
          diffPercent: absDiff
        })
      }
    }
  }

  // Sort by diffPercent desc, return max 3
  results.sort((a, b) => b.diffPercent - a.diffPercent)
  return results.slice(0, 3)
}

function formatHours(seconds: number): string {
  const hrs = seconds / 3600
  if (hrs < 1) return `${Math.round(hrs * 60)}分钟`
  return `${hrs.toFixed(1)}h`
}
