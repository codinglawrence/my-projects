/**
 * 时间处理工具函数
 * 提供时间格式化、计算、转换等公共方法
 */

/**
 * 格式化时间为 HH:mm:ss 格式
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00:00'
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化日期为简短格式（月 日）
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * 格式化时间为 HH:mm 格式
 * @param date 日期
 * @returns 格式化后的时间字符串
 */
export const formatTimeString = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * 格式化日期为 YYYY-MM-DD 格式（用于 input[type=date]）
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
export const formatDateInput = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 * @param date 日期
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * 格式化持续时间（秒转为 HH:mm:ss）
 * @param seconds 秒数
 * @returns 格式化后的持续时间字符串
 */
export const formatDuration = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00:00'
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化日期标题
 * @param dateStr 日期字符串
 * @returns 格式化后的日期标题
 */
export const formatDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return dateStr
  }
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric'
  }).format(date) + ' ' + weekday
}

/**
 * 格式化时间范围
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化后的时间范围字符串
 */
export const formatTimeRange = (startTime: Date, endTime: Date | null): string => {
  if (!(startTime instanceof Date)) {
    startTime = new Date(startTime)
  }

  const format = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  if (!endTime) return `${format(startTime)} - 进行中`
  if (!(endTime instanceof Date)) {
    endTime = new Date(endTime)
  }
  return `${format(startTime)} - ${format(endTime)}`
}

/**
 * 计算持续时间（秒）
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 持续时间（秒）
 */
export const calculateDuration = (startTime: Date, endTime: Date): number => {
  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    return 0
  }
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  return duration > 0 ? duration : 0
}

/**
 * 获取时间选择器的初始值
 * @param date 日期
 * @returns [小时, 分钟] 字符串数组
 */
export const getTimePickerValue = (date: Date): string[] => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date()
    return [
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0')
    ]
  }
  return [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0')
  ]
}

/**
 * 获取日期选择器的初始值（年/月/日）
 * @param date 日期
 * @returns [年, 月, 日] 字符串数组，与 van-date-picker 的 modelValue 格式一致
 */
export const getDatePickerValue = (date: Date): string[] => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date()
    return [
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0')
    ]
  }
  return [
    date.getFullYear().toString(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0')
  ]
}

/**
 * 更新日期的年月日部分
 * @param originalDate 原始日期
 * @param newDateStr 新的日期字符串（YYYY-MM-DD）
 * @returns 更新后的日期
 */
export const updateDatePart = (originalDate: Date, newDateStr: string): Date => {
  if (!(originalDate instanceof Date) || isNaN(originalDate.getTime())) {
    return new Date()
  }
  const newDate = new Date(newDateStr)
  const result = new Date(originalDate)
  result.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
  return result
}

/**
 * 更新日期的时间部分
 * @param originalDate 原始日期
 * @param hours 小时
 * @param minutes 分钟
 * @returns 更新后的日期
 */
export const updateTimePart = (originalDate: Date, hours: number, minutes: number): Date => {
  if (!(originalDate instanceof Date) || isNaN(originalDate.getTime())) {
    return new Date()
  }
  const result = new Date(originalDate)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/**
 * 从时间选择器值更新日期
 * @param originalDate 原始日期
 * @param timeValue 时间选择器值 [小时, 分钟]
 * @returns 更新后的日期
 */
export const updateDateFromTimePicker = (originalDate: Date, timeValue: string[]): Date => {
  if (!timeValue || timeValue.length < 2) {
    return originalDate
  }
  const hours = parseInt(timeValue[0] || '0')
  const minutes = parseInt(timeValue[1] || '0')
  return updateTimePart(originalDate, hours, minutes)
}

/**
 * 评分选项列数据
 */
export const ratingColumns = Array.from({ length: 10 }, (_, i) => ({
  text: (i + 1).toString(),
  value: (i + 1).toString()
}))

/**
 * 获取当前日期的格式化字符串
 * @returns 格式化后的当前日期
 */
export const getCurrentDateFormatted = (): string => {
  const now = new Date()
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(now)
}

/**
 * 获取默认的活动图标
 * @param category 类别
 * @returns 图标字符串
 */
export const getIconForCategory = (category: string): string => {
  const iconMap: Record<string, string> = {
    '学习': '📚',
    '工作': '💼',
    '生活': '🏠',
    '健康': '🏋️',
    '娱乐': '🎨',
    '交通': '🚗',
    '其他': '📝',
    '洗澡': '🚿',
    '睡眠': '😴',
    '自学': '📱',
    '阅读': '📖',
    '复盘': '🔄',
    '计划': '📋',
    '整理': '📂',
    '用餐': '🍽️',
    '运动': '🏃',
    '购物': '🛒',
    '步行': '🚶',
    '电话': '📞'
  }
  return iconMap[category] || '📝'
}

/**
 * 计算效率
 * @param workload 工作量
 * @param duration 持续时间（秒）
 * @param workloadUnit 工作量单位
 * @returns 效率字符串
 */
export const calculateEfficiency = (workload: number, duration: number, workloadUnit: string): string => {
  if (!workload || !duration || !workloadUnit || duration <= 0) {
    return ''
  }
  const minutes = duration / 60
  const efficiency = workload / minutes
  return `${efficiency.toFixed(2)} ${workloadUnit}/min`
}

/**
 * 获取类别颜色
 * @param index 索引
 * @returns 颜色代码
 */
export const getCategoryColor = (index: number): string => {
  const colors = [
    '#6366F1', // 品牌紫
    '#F59E0B', // 暖黄
    '#10B981', // 绿色
    '#3B82F6', // 蓝色
    '#EF4444', // 红色
    '#8B5CF6', // 紫色
    '#FBBF24', // 黄色
    '#22C55E', // 浅绿色
    '#F472B6', // 粉红色
    '#6B7280'  // 灰色
  ]
  return colors[index % colors.length] || '#6366F1'
}

/**
 * 按日期分组时间条目
 * @param entries 时间条目数组
 * @returns 按日期分组的对象
 */
export const groupEntriesByDate = <T extends { startTime: Date | string }>(entries: T[]): Record<string, T[]> => {
  const groups: Record<string, T[]> = {}

  entries.forEach((entry) => {
    const dateKey = new Date(entry.startTime).toISOString().split('T')[0]
    if (!dateKey) return
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(entry)
  })

  // 按日期降序排序
  const sortedGroups: Record<string, T[]> = {}
  Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(date => {
      const group = groups[date]
      if (group) {
        sortedGroups[date] = group.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
      }
    })

  return sortedGroups
}

/**
 * 计算总持续时间
 * @param entries 时间条目数组
 * @returns 总持续时间（秒）
 */
export const calculateTotalDuration = <T extends { duration?: number }>(entries: T[]): number => {
  return entries.reduce((total, entry) => total + (entry.duration || 0), 0)
}
