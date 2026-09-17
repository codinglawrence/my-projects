<template>
  <div class="history-page">
    <!-- 编辑页面 -->
    <div v-if="showEditPage" class="edit-page">
      <div class="edit-nav-bar">
        <div class="edit-nav-left">
          <van-icon name="arrow-left" class="nav-icon" @click="closeEditPage" />
        </div>
        <div class="edit-nav-right">
          <van-icon name="delete-o" class="nav-icon delete-icon" @click="confirmDelete" />
          <van-icon name="success" class="nav-icon" @click="saveEntry" />
        </div>
      </div>

      <div class="edit-content">
        <!-- 状态选项 -->
        <div class="status-options">
          <div
            class="status-item"
            :class="{ active: newEntry.status === 'ongoing' }"
            @click="newEntry.status = 'ongoing'"
          >
            进行中状态
          </div>
          <div
            class="status-item"
            :class="{ active: newEntry.status === 'paused' }"
            @click="newEntry.status = 'paused'"
          >
            暂停状态
          </div>
          <div
            class="status-item"
            :class="{ active: newEntry.status === 'ended' }"
            @click="newEntry.status = 'ended'"
          >
            结束状态
          </div>
        </div>

        <!-- 活动类别 -->
        <div class="form-item" @click="showCategoryPicker = true">
          <div class="form-label">活动类别</div>
          <div class="activity-category">
            <div class="category-icon">{{ newEntry.icon }}</div>
            <div class="category-name">{{ newEntry.title }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-item">
          <div class="form-label">备注</div>
          <van-field
            v-model="newEntry.note"
            placeholder="输入备注"
            :border="false"
            class="form-input"
          />
        </div>

        <!-- 开始时间 -->
        <div class="form-item">
          <div class="form-label">开始于</div>
          <div class="start-time">
            <div class="start-date" @click="showDatePicker = true">{{ formatDate(newEntry.startTime) }}</div>
            <div class="start-time-value" @click="showTimeOnlyPicker = true">{{ formatTimeString(newEntry.startTime) }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- 结束时间 -->
        <div class="form-item" v-if="newEntry.status === 'paused' || newEntry.status === 'ended'">
          <div class="form-label">结束于</div>
          <div class="start-time">
            <div class="start-date" @click="showEndDatePicker = true">{{ formatDate(newEntry.endTime) }}</div>
            <div class="start-time-value" @click="showEndTimePicker = true">{{ formatTimeString(newEntry.endTime) }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- 状态打分 -->
        <div class="form-item" @click="showStatusRatingPicker = true">
          <div class="form-label">状态打分</div>
          <div class="rating-container">
            <span class="rating-text">{{ newEntry.statusRating }}/10</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- AI赋能比例打分 -->
        <div class="form-item" @click="showAiRatingPicker = true">
          <div class="form-label">AI赋能比例打分</div>
          <div class="rating-container">
            <span class="rating-text">{{ newEntry.aiEnablementRating }}/10</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- 价值评估 -->
        <div class="form-item">
          <div class="form-label">价值评估（元）<span style="color: #ff4d4f;">*</span></div>
          <van-field
            v-model.number="newEntry.valueEvaluation"
            type="number"
            placeholder="输入价值评估金额"
            :border="false"
            class="form-input"
            :rules="[{ required: true, message: '请输入价值评估金额' }]"
          />
        </div>

        <!-- 实际价值 -->
        <div class="form-item">
          <div class="form-label">实际价值（元）</div>
          <van-field
            v-model.number="newEntry.actualValue"
            type="number"
            placeholder="输入实际价值金额"
            :border="false"
            class="form-input"
          />
        </div>

        <!-- 时间段 -->
        <div class="time-section" @click="showDurationPicker = true">
          <div class="time-label">时间段</div>
          <div class="time-info">
            <van-icon name="plus" class="time-add-icon" />
          </div>
        </div>

        <!-- 类别选择弹窗 -->
        <van-popup v-model:show="showCategoryPicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择活动类别</h3>
            </div>
            <div class="category-list">
              <div
                v-for="category in categories"
                :key="category.id"
                class="category-option"
                :class="{ active: newEntry.title === category.name }"
                @click="selectCategory(category)"
              >
                <span class="category-option-icon">{{ category.icon }}</span>
                <span class="category-option-name">{{ category.name }}</span>
                <van-icon v-if="newEntry.title === category.name" name="success" class="category-check" />
              </div>
            </div>
            <div class="picker-actions">
              <van-button type="default" block @click="showCategoryPicker = false">取消</van-button>
            </div>
          </div>
        </van-popup>

        <!-- 日期选择器 -->
        <van-calendar
          v-model:show="showDatePicker"
          :default-date="newEntry.startTime"
          @confirm="handleDateConfirm"
          @close="showDatePicker = false"
          title="选择日期"
          :min-date="minDate"
          :max-date="maxDate"
        />

        <!-- 结束日期选择器 -->
        <van-calendar
          v-model:show="showEndDatePicker"
          :default-date="newEntry.endTime"
          @confirm="handleEndDateConfirm"
          @close="showEndDatePicker = false"
          title="选择结束日期"
          :min-date="minDate"
          :max-date="maxDate"
        />

        <!-- 时间选择器 -->
        <van-popup v-model:show="showTimeOnlyPicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择时间</h3>
            </div>
            <van-time-picker
              v-model="timePickerValue"
              @confirm="handleTimeConfirm"
              @cancel="showTimeOnlyPicker = false"
              format="HH:mm"
              minute-step="1"
            />
          </div>
        </van-popup>

        <!-- 结束时间选择器 -->
        <van-popup v-model:show="showEndTimePicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择结束时间</h3>
            </div>
            <van-time-picker
              v-model="endTimePickerValue"
              @confirm="handleEndTimeConfirm"
              @cancel="showEndTimePicker = false"
              format="HH:mm"
              minute-step="1"
            />
          </div>
        </van-popup>

        <!-- 时长选择器 -->
        <van-popup v-model:show="showDurationPicker" position="bottom">
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择时长</h3>
            </div>
            <div style="padding: 0 20px;">
              <input
                type="number"
                v-model.number="newEntry.duration"
                placeholder="输入时长（分钟）"
                style="width: 100%; padding: 12px; font-size: 16px; border: 1px solid #EFEFF4; border-radius: 8px;"
              />
              <div style="margin-top: 8px; font-size: 14px; color: #6E6E73;">单位：分钟</div>
            </div>
            <div class="picker-actions">
              <van-button type="default" block @click="showDurationPicker = false">取消</van-button>
              <van-button type="primary" block @click="confirmDuration">确认</van-button>
            </div>
          </div>
        </van-popup>

        <!-- 状态打分选择器 -->
        <van-popup v-model:show="showStatusRatingPicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择状态打分</h3>
            </div>
            <van-picker
              :columns="ratingColumns"
              :default-index="newEntry.statusRating - 1"
              @confirm="handleStatusRatingConfirm"
              @cancel="showStatusRatingPicker = false"
            />
          </div>
        </van-popup>

        <!-- AI赋能比例打分选择器 -->
        <van-popup v-model:show="showAiRatingPicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择AI赋能比例打分</h3>
            </div>
            <van-picker
              :columns="ratingColumns"
              :default-index="newEntry.aiEnablementRating - 1"
              @confirm="handleAiRatingConfirm"
              @cancel="showAiRatingPicker = false"
            />
          </div>
        </van-popup>

        <!-- 删除确认弹框 -->
        <van-dialog
          v-model:show="showDeleteConfirm"
          title="确认删除"
          message="您确定删除此项活动吗？"
          show-cancel-button
          @confirm="deleteEntry"
          @cancel="showDeleteConfirm = false"
        />
      </div>
    </div>

    <!-- 历史记录列表页面 -->
    <div v-else>
      <div class="custom-nav-bar">
        <div class="nav-left">
          <van-icon name="chart-trending-o" class="nav-icon chart-icon" @click="showStats = true" />
        </div>
        <div class="nav-title">{{ todayDate }}</div>
        <div class="nav-right">
          <van-icon name="delete-o" class="nav-icon" @click="clearAllHistory" />
        </div>
      </div>

      <div class="history-content">
        <!-- 空状态 -->
        <div v-if="timeEntries.length === 0" class="empty-state">
          <van-icon name="clock-o" class="empty-icon" />
          <div class="empty-text">暂无历史记录</div>
          <div class="empty-subtext">开始记录你的时间吧</div>
        </div>

        <!-- 按日期分组的历史记录列表 -->
        <div v-else class="history-list">
          <div
            v-for="(group, date) in groupedEntries"
            :key="date"
            class="date-group"
          >
            <div class="date-header">{{ date }}</div>
            <div
              v-for="entry in group"
              :key="entry.id"
              class="history-item"
              @click="editEntry(entry)"
            >
              <div class="history-icon">{{ entry.icon || getIconForCategory(entry.category) }}</div>
              <div class="history-info">
                <div class="history-name">{{ entry.title }}</div>
                <div class="history-time-range">
                  {{ formatTimeString(entry.startTime) }} - {{ entry.endTime ? formatTimeString(entry.endTime) : '进行中' }}
                </div>
              </div>
              <div class="history-duration">{{ calculateEntryDuration(entry) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="add-btn" @click="openEditPage">
        <van-icon name="plus" size="24px" />
      </div>
    </div>

    <!-- 统计弹窗 -->
    <van-popup v-model:show="showStats" position="right" :style="{ width: '100%', height: '100%' }">
      <div class="stats-page">
        <div class="stats-nav-bar">
          <van-icon name="arrow-left" class="nav-icon" @click="showStats = false" />
          <div class="nav-title">时间统计</div>
          <div></div>
        </div>

        <div class="stats-content">
          <!-- 今日统计 -->
          <div class="stats-section">
            <div class="stats-title">今日统计</div>
            <div class="stats-grid">
              <div class="stats-item">
                <div class="stats-value">{{ todayTotal }}</div>
                <div class="stats-label">总时长</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ todayCount }}</div>
                <div class="stats-label">活动数</div>
              </div>
            </div>
          </div>

          <!-- 类别统计 -->
          <div class="stats-section">
            <div class="stats-title">类别分布</div>
            <div class="category-stats">
              <div
                v-for="stat in categoryStats"
                :key="stat.category"
                class="category-stat-item"
              >
                <div class="stat-info">
                  <div class="stat-icon">{{ stat.icon }}</div>
                  <div class="stat-details">
                    <div class="stat-name">{{ stat.category }}</div>
                    <div class="stat-duration">{{ formatDuration(stat.duration) }}</div>
                  </div>
                </div>
                <div class="stat-percentage">{{ stat.percentage }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'
import {
  formatDate,
  formatTimeString,
  formatDuration,
  getTimePickerValue,
  updateDateFromTimePicker,
  ratingColumns,
  getIconForCategory
} from '@/utils/timeUtils'

const timerStore = useTimerStore()

// 类别数据
const categories = ref([
  { id: '1', name: 'S1: 阅读', icon: '📚' },
  { id: '2', name: 'S1: 复盘', icon: '🌍' },
  { id: '3', name: 'S1: 计划', icon: '🔍' },
  { id: '4', name: 'S1: 整理', icon: '📁' },
  { id: '5', name: 'S1: 自学', icon: '📱' },
  { id: '6', name: '交通', icon: '🚗' },
  { id: '7', name: '睡眠', icon: '😴' },
  { id: '8', name: '用餐', icon: '🍽️' },
  { id: '9', name: '运动', icon: '🏋️' },
  { id: '10', name: '购物', icon: '🛒' },
  { id: '11', name: '娱乐', icon: '🎨' },
  { id: '12', name: '步行', icon: '🚶' },
  { id: '13', name: '电话', icon: '📞' },
  { id: '14', name: '洗澡', icon: '🚿' }
])

// 历史记录数据
const timeEntries = computed(() => timerStore.timeEntries)

// 编辑页面显示状态
const showEditPage = ref(false)

// 新条目数据
const newEntry = ref({
  id: '',
  title: '',
  category: '',
  icon: '',
  note: '',
  status: 'ended',
  startTime: new Date(),
  endTime: new Date(),
  duration: 3600,
  statusRating: 5,
  aiEnablementRating: 5,
  valueEvaluation: 0,
  actualValue: 0
})

// 弹窗显示状态
const showCategoryPicker = ref(false)
const showDatePicker = ref(false)
const showTimeOnlyPicker = ref(false)
const showEndDatePicker = ref(false)
const showEndTimePicker = ref(false)
const showDurationPicker = ref(false)
const showStatusRatingPicker = ref(false)
const showAiRatingPicker = ref(false)
const showStats = ref(false)
const showDeleteConfirm = ref(false)

// 时间选择器值
const timePickerValue = ref<string[]>([])
const endTimePickerValue = ref<string[]>([])

// 日历日期范围
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

// 监听开始时间变化
watch(
  () => newEntry.value.startTime,
  (newDate: Date) => {
    if (newDate) {
      timePickerValue.value = getTimePickerValue(newDate)
    }
  },
  { immediate: true }
)

// 监听结束时间变化
watch(
  () => newEntry.value.endTime,
  (newDate: Date) => {
    if (newDate) {
      endTimePickerValue.value = getTimePickerValue(newDate)
    }
  },
  { immediate: true }
)

// 打开编辑页面
const openEditPage = () => {
  newEntry.value = {
    id: Date.now().toString(),
    title: '',
    category: '',
    icon: '',
    note: '',
    status: 'ended',
    startTime: new Date(),
    endTime: new Date(),
    duration: 3600,
    statusRating: 5,
    aiEnablementRating: 5,
    valueEvaluation: 0,
    actualValue: 0
  }
  showEditPage.value = true
}

// 关闭编辑页面
const closeEditPage = () => {
  showEditPage.value = false
}

// 编辑条目
const editEntry = (entry: any) => {
  newEntry.value = {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    icon: entry.icon || getIconForCategory(entry.category),
    note: entry.description || '',
    status: entry.status || 'ended',
    startTime: new Date(entry.startTime),
    endTime: new Date(entry.endTime),
    duration: entry.duration,
    statusRating: entry.statusRating || 5,
    aiEnablementRating: entry.aiEnablementRating || 5,
    valueEvaluation: entry.valueEvaluation || 0,
    actualValue: entry.actualValue || 0
  }
  showEditPage.value = true
}

// 保存条目
const saveEntry = () => {
  // 验证类别是否已选择
  if (!newEntry.value.title) {
    alert('请选择活动类别！')
    return
  }

  // 验证价值评估是否已填写
  if (!newEntry.value.valueEvaluation || newEntry.value.valueEvaluation <= 0) {
    alert('请输入价值评估金额！')
    return
  }

  // 检查是否已存在
  const existingIndex = timerStore.timeEntries.findIndex(e => e.id === newEntry.value.id)
  if (existingIndex >= 0) {
    // 更新现有条目
    timerStore.updateTimeEntry(newEntry.value.id, {
      title: newEntry.value.title,
      startTime: newEntry.value.startTime,
      endTime: newEntry.value.endTime,
      duration: newEntry.value.duration,
      category: newEntry.value.category,
      description: newEntry.value.note,
      icon: newEntry.value.icon,
      statusRating: newEntry.value.statusRating,
      aiEnablementRating: newEntry.value.aiEnablementRating,
      valueEvaluation: newEntry.value.valueEvaluation,
      actualValue: newEntry.value.actualValue
    })
  } else {
    // 添加新条目
    timerStore.addTimeEntry({
      title: newEntry.value.title,
      startTime: newEntry.value.startTime,
      endTime: newEntry.value.endTime,
      duration: newEntry.value.duration,
      category: newEntry.value.category,
      description: newEntry.value.note,
      icon: newEntry.value.icon,
      statusRating: newEntry.value.statusRating,
      aiEnablementRating: newEntry.value.aiEnablementRating,
      valueEvaluation: newEntry.value.valueEvaluation,
      actualValue: newEntry.value.actualValue
    })
  }

  showEditPage.value = false
}

// 确认删除
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

// 删除条目
const deleteEntry = () => {
  timerStore.removeTimeEntry(newEntry.value.id)
  showDeleteConfirm.value = false
  showEditPage.value = false
}

// 选择类别
const selectCategory = (category: { id: string; name: string; icon: string }) => {
  newEntry.value.title = category.name
  newEntry.value.category = category.name
  newEntry.value.icon = category.icon
  showCategoryPicker.value = false
}

// 计算条目持续时间（基于开始和结束时间实时计算，只显示小时和分钟）
const calculateEntryDuration = (entry: any): string => {
  if (!entry.startTime || !entry.endTime) {
    return '00:00'
  }
  const start = new Date(entry.startTime)
  const end = new Date(entry.endTime)
  const durationMs = end.getTime() - start.getTime()
  if (durationMs <= 0) {
    return '00:00'
  }
  const durationMin = Math.floor(durationMs / 1000 / 60)
  const hrs = Math.floor(durationMin / 60)
  const mins = durationMin % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// 处理日期确认
const handleDateConfirm = (date: Date) => {
  newEntry.value.startTime = date
  showDatePicker.value = false
}

// 处理结束日期确认
const handleEndDateConfirm = (date: Date) => {
  newEntry.value.endTime = date
  showEndDatePicker.value = false
}

// 处理时间确认
const handleTimeConfirm = () => {
  newEntry.value.startTime = updateDateFromTimePicker(newEntry.value.startTime, timePickerValue.value)
  showTimeOnlyPicker.value = false
}

// 处理结束时间确认
const handleEndTimeConfirm = () => {
  newEntry.value.endTime = updateDateFromTimePicker(newEntry.value.endTime, endTimePickerValue.value)
  showEndTimePicker.value = false
}

// 确认时长
const confirmDuration = () => {
  if (newEntry.value.duration < 0) {
    newEntry.value.duration = 0
  }
  newEntry.value.duration = newEntry.value.duration * 60
  showDurationPicker.value = false
}

// 处理状态打分确认
const handleStatusRatingConfirm = (value: { text: string; value: string }) => {
  newEntry.value.statusRating = Number(value.value)
  showStatusRatingPicker.value = false
}

// 处理AI赋能比例打分确认
const handleAiRatingConfirm = (value: { text: string; value: string }) => {
  newEntry.value.aiEnablementRating = Number(value.value)
  showAiRatingPicker.value = false
}

// 清空历史记录
const clearAllHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    timerStore.clearAllEntries()
  }
}

// 今天的日期（用于标题）
const todayDate = computed(() => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[today.getDay()]
  return `${month}月${day}日 ${weekDay}`
})

// 按日期分组的历史记录
const groupedEntries = computed(() => {
  const groups: Record<string, typeof timeEntries.value> = {}

  timeEntries.value.forEach(entry => {
    const date = new Date(entry.startTime)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    const dateKey = `${month}月${day}日 ${weekDay}`

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(entry)
  })

  // 按日期降序排序
  return Object.fromEntries(
    Object.entries(groups).sort((a, b) => {
      const entriesA = a[1]
      const entriesB = b[1]
      const firstEntryA = entriesA[0]
      const firstEntryB = entriesB[0]
      if (!firstEntryA || !firstEntryB) {
        return 0
      }
      const dateA = new Date(firstEntryA.startTime)
      const dateB = new Date(firstEntryB.startTime)
      return dateB.getTime() - dateA.getTime()
    })
  )
})

// 今日统计
const todayTotal = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEntries = timeEntries.value.filter(entry => {
    const entryDate = new Date(entry.startTime)
    entryDate.setHours(0, 0, 0, 0)
    return entryDate.getTime() === today.getTime()
  })
  const totalSeconds = todayEntries.reduce((sum, entry) => sum + entry.duration, 0)
  return formatDuration(totalSeconds)
})

const todayCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return timeEntries.value.filter(entry => {
    const entryDate = new Date(entry.startTime)
    entryDate.setHours(0, 0, 0, 0)
    return entryDate.getTime() === today.getTime()
  }).length
})

// 类别统计
const categoryStats = computed(() => {
  const stats: Record<string, { duration: number; icon: string }> = {}

  timeEntries.value.forEach(entry => {
    if (!stats[entry.category]) {
      stats[entry.category] = { duration: 0, icon: entry.icon || getIconForCategory(entry.category) }
    }
    const categoryStats = stats[entry.category]
    if (categoryStats) {
      categoryStats.duration += entry.duration
    }
  })

  const totalDuration = Object.values(stats).reduce((sum, s) => sum + s.duration, 0)

  return Object.entries(stats)
    .map(([category, data]) => ({
      category,
      duration: data.duration,
      icon: data.icon,
      percentage: totalDuration > 0 ? Math.round((data.duration / totalDuration) * 100) : 0
    }))
    .sort((a, b) => b.duration - a.duration)
})
</script>

<style scoped>
.history-page {
  height: 100%;
  background-color: #F9F9FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
}

.history-content {
  padding: 0;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.custom-nav-bar {
  background-color: #6366F1;
  height: calc(44px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  position: relative;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-title {
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: -0.5px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-icon {
  font-size: 20px;
  color: #ffffff;
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6E6E73;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #AEAEB2;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: #1C1C1E;
}

.empty-subtext {
  font-size: 14px;
  color: #6E6E73;
}

/* 历史记录列表 */
.history-list {
  padding: 8px 0;
}

/* 日期分组 */
.date-group {
  margin-bottom: 16px;
}

.date-header {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  background-color: #F9F9FB;
  border-bottom: 1px solid #EFEFF4;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #EFEFF4;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:active {
  background-color: #F9F9FB;
}

.history-icon {
  font-size: 32px;
  margin-right: 12px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 16px;
  color: #1C1C1E;
  margin-bottom: 4px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time-range {
  font-size: 13px;
  color: #6E6E73;
}

.history-duration {
  font-size: 16px;
  color: #6366F1;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
}

/* 添加按钮 */
.add-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 100;
  width: 56px;
  height: 56px;
  background-color: #6366F1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  transition: transform 0.2s;
}

.add-btn:active {
  transform: scale(0.95);
}

.add-btn .van-icon {
  font-size: 24px;
  color: #ffffff;
}

/* 统计页面 */
.stats-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F9F9FB;
}

.stats-nav-bar {
  background-color: #6366F1;
  height: calc(44px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
}

.stats-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stats-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #EFEFF4;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #6366F1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #6E6E73;
}

.category-stats {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #EFEFF4;
}

.category-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #EFEFF4;
}

.category-stat-item:last-child {
  border-bottom: none;
}

.stat-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.stat-icon {
  font-size: 24px;
  margin-right: 12px;
}

.stat-details {
  flex: 1;
}

.stat-name {
  font-size: 14px;
  color: #1C1C1E;
  margin-bottom: 2px;
}

.stat-duration {
  font-size: 12px;
  color: #6E6E73;
}

.stat-percentage {
  font-size: 14px;
  font-weight: 500;
  color: #6366F1;
}

.chart-icon {
  margin-left: 8px;
}

/* 编辑页面样式 */
.edit-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F9F9FB;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.edit-nav-bar {
  background-color: #6366F1;
  height: calc(44px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  flex-shrink: 0;
}

.edit-nav-left, .edit-nav-right {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.edit-content {
  flex: 1;
  padding: 16px;
  background-color: #F9F9FB;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

/* 状态选项 */
.status-options {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #EFEFF4;
  flex-shrink: 0;
}

.status-item {
  font-size: 14px;
  color: #6E6E73;
  padding: 8px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
  margin: 0 4px;
  white-space: nowrap;
}

.status-item.active {
  color: white;
  font-weight: 500;
  background-color: #6366F1;
}

/* 表单样式 */
.form-item {
  margin-bottom: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  border: 1px solid #EFEFF4;
  flex-shrink: 0;
}

.form-label {
  font-size: 13px;
  color: #6E6E73;
  margin-bottom: 12px;
  font-weight: 500;
  display: block;
}

/* 活动类别样式 */
.activity-category {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

.category-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 16px;
  color: #1C1C1E;
}

/* 表单输入样式 */
.form-input {
  font-size: 16px;
  color: #1C1C1E;
  padding: 8px 0;
}

/* 开始时间样式 */
.start-time {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
}

.start-date, .start-time-value {
  font-size: 16px;
  color: #1C1C1E;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #F9F9FB;
}

.start-date:active, .start-time-value:active {
  background-color: #EFEFF4;
}

.arrow-icon {
  font-size: 16px;
  color: #AEAEB2;
  margin-left: auto;
}

/* 评分样式 */
.rating-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.rating-text {
  font-size: 16px;
  color: #1C1C1E;
}

/* 时间段样式 */
.time-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #6366F1;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.time-section:active {
  background-color: #4F46E5;
  transform: scale(0.98);
}

.time-label {
  font-size: 13px;
  margin-bottom: 8px;
  opacity: 0.9;
  display: block;
}

.time-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.time-total {
  font-size: 16px;
  font-weight: 500;
}

.time-add-icon {
  font-size: 20px;
}

/* 类别选择器样式 */
.category-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px;
}

.category-option {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #EFEFF4;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-option:active {
  background-color: #F9F9FB;
}

.category-option.active {
  background-color: #F5F5FF;
}

.category-option-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.category-option-name {
  flex: 1;
  font-size: 16px;
  color: #1C1C1E;
}

.category-check {
  font-size: 20px;
  color: #6366F1;
}

/* 选择器内容样式 */
.picker-content {
  background-color: white;
}

.picker-header {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #EFEFF4;
}

.picker-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1C1C1E;
}

.picker-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
}
</style>
