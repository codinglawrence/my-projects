<template>
  <div class="activity-page">
    <!-- 活动编辑页面 -->
    <div v-if="showEditPage" class="edit-page">
      <div class="edit-nav-bar">
        <div class="edit-nav-left">
          <van-icon name="arrow-left" class="nav-icon" @click="exitEditPage" />
        </div>
        <div class="edit-nav-right">
          <van-icon name="success" class="nav-icon" @click="saveActivity" />
        </div>
      </div>
      
      <div class="edit-content">
        <!-- 状态选项 -->
        <div class="status-options">
          <div 
            class="status-item" 
            :class="{ active: currentActivity.status === 'ongoing' }"
            @click="currentActivity.status = 'ongoing'"
          >
            进行中状态
          </div>
          <div 
            class="status-item" 
            :class="{ active: currentActivity.status === 'paused' }"
            @click="currentActivity.status = 'paused'"
          >
            暂停状态
          </div>
          <div 
            class="status-item" 
            :class="{ active: currentActivity.status === 'ended' }"
            @click="currentActivity.status = 'ended'"
          >
            结束状态
          </div>
        </div>
        
        <!-- 活动类别 -->
        <div class="form-item" @click="selectCategory">
          <div class="form-label">活动类别</div>
          <div class="activity-category">
            <div class="category-icon">{{ currentActivity.icon }}</div>
            <div class="category-name">{{ currentActivity.title }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>
        
        <!-- 备注 -->
        <div class="form-item">
          <div class="form-label">备注</div>
          <van-field 
            v-model="currentActivity.note" 
            placeholder="输入备注" 
            :border="false"
            class="form-input"
          />
        </div>
        
        <!-- 开始时间 -->
        <div class="form-item">
          <div class="form-label">开始于</div>
          <div class="start-time">
            <div class="start-date" @click="showDatePicker = true">{{ formatDate(currentActivity.startTime) }}</div>
            <div class="start-time-value" @click="showTimeOnlyPicker = true">{{ formatTimeString(currentActivity.startTime) }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>
        
        <!-- 结束时间 -->
        <div class="form-item" v-if="currentActivity.status === 'paused' || currentActivity.status === 'ended'">
          <div class="form-label">结束于</div>
          <div class="start-time">
            <div class="start-date" @click="showEndDatePicker = true">{{ formatDate(currentActivity.endTime) }}</div>
            <div class="start-time-value" @click="showEndTimePicker = true">{{ formatTimeString(currentActivity.endTime) }}</div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>
        
        <!-- 状态打分 -->
        <div class="form-item" @click="showStatusRatingPicker = true">
          <div class="form-label">状态打分</div>
          <div class="rating-container">
            <span class="rating-text">{{ currentActivity.statusRating }}/10</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>
        
        <!-- AI赋能比例打分 -->
        <div class="form-item" @click="showAiRatingPicker = true">
          <div class="form-label">AI赋能比例打分</div>
          <div class="rating-container">
            <span class="rating-text">{{ currentActivity.aiEnablementRating }}/10</span>
            <van-icon name="arrow" class="arrow-icon" />
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
                :class="{ active: currentActivity.title === category.name }"
                @click="handleCategorySelect(category)"
              >
                <span class="category-option-icon">{{ category.icon }}</span>
                <span class="category-option-name">{{ category.name }}</span>
                <van-icon v-if="currentActivity.title === category.name" name="success" class="category-check" />
              </div>
            </div>
            <div class="picker-actions">
              <van-button type="default" block @click="showCategoryPicker = false">取消</van-button>
            </div>
          </div>
        </van-popup>
        
        <!-- 日期选择器 -->
        <van-popup v-model:show="showDatePicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择日期</h3>
            </div>
            <van-date-picker
              v-model="datePickerValue"
              @confirm="handleDateConfirm"
              @cancel="showDatePicker = false"
              :min-date="minDate"
              :max-date="maxDate"
            />
          </div>
        </van-popup>
        
        <!-- 结束日期选择器 -->
        <van-popup v-model:show="showEndDatePicker" position="bottom" round>
          <div class="picker-content">
            <div class="picker-header">
              <h3>选择结束日期</h3>
            </div>
            <van-date-picker
              v-model="endDatePickerValue"
              @confirm="handleEndDateConfirm"
              @cancel="showEndDatePicker = false"
              :min-date="minDate"
              :max-date="maxDate"
            />
          </div>
        </van-popup>
        
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
                v-model.number="currentActivity.duration"
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
              :default-index="currentActivity.statusRating - 1"
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
              :default-index="currentActivity.aiEnablementRating - 1"
              @confirm="handleAiRatingConfirm"
              @cancel="showAiRatingPicker = false"
            />
          </div>
        </van-popup>
      </div>
    </div>
    
    <!-- 活动列表页面 -->
    <div v-else>
      <div class="custom-nav-bar">
        <div class="nav-title">活动</div>
      </div>

      <!-- R1: 时间漏洞卡片 -->
      <div class="time-gap-card">
        <div class="gap-header">今日时间</div>
        <div class="gap-stats">
          <div class="gap-stat">
            <span class="gap-label">清醒</span>
            <span class="gap-value">{{ timerStore.wakeHours }}h</span>
          </div>
          <div class="gap-stat">
            <span class="gap-label">已记录</span>
            <span class="gap-value">{{ formatDuration(timerStore.todayRecordedDuration) }}</span>
          </div>
          <div class="gap-stat" :class="{ 'gap-warning': timerStore.unrecordedPercent > 70 }">
            <span class="gap-label">未记录</span>
            <span class="gap-value">{{ formatDuration(timerStore.unrecordedGap) }}</span>
            <span class="gap-percent">({{ timerStore.unrecordedPercent }}%)</span>
          </div>
        </div>
      </div>
      
      <div class="timer-section" v-if="activeTimer">
        <div class="timer-card">
          <div class="timer-info">
            <div class="timer-icon">{{ activeTimer.icon }}</div>
            <div class="timer-details">
              <div class="timer-title">{{ activeTimer.title }}</div>
              <div class="timer-time">{{ formatTime(currentDuration) }}</div>
              <!-- R5: 时间价值行 -->
              <div class="time-value-row" v-if="hourlyRate > 0">
                <span class="time-value-label">时间价值 ≈ ¥{{ hourlyRate }}/h</span>
                <span class="time-value-amount">已累积 ¥{{ timeAccumulatedValue }}</span>
              </div>
            </div>
            <div class="timer-controls">
              <button class="control-btn pause-btn" @click="togglePauseTimer">
                <van-icon name="pause-circle" v-if="!isPaused" />
                <van-icon name="play" v-else />
              </button>
              <button class="control-btn stop-btn" @click="stopTimer">
                <van-icon name="stop-circle" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- R4: 对比洞察卡片 -->
      <div class="insights-section" v-if="insights.length > 0">
        <div class="insights-header">洞察</div>
        <div
          v-for="(insight, idx) in insights"
          :key="idx"
          class="insight-card"
          :class="insight.type === 'up' ? 'insight-up' : 'insight-down'"
        >
          <span class="insight-arrow">{{ insight.type === 'up' ? "↑" : "↓" }}</span>
          <span class="insight-text">{{ insight.text }}</span>
        </div>
      </div>
      
      <div class="activity-content">
        <van-grid :column-num="4" :border="false" class="activity-grid">
          <van-grid-item
            v-for="category in categories"
            :key="category.id"
            class="activity-item"
            clickable
            @click="handleActivityClick(category)"
          >
            <div class="activity-icon">{{ category.icon }}</div>
            <div class="activity-name">{{ category.name }}</div>
          </van-grid-item>
        </van-grid>
      </div>
      
      <div class="add-btn" @click="showEditPage = true">
        <van-icon name="plus" size="24px" />
      </div>

      <!-- R2: 一键计时浮动按钮 -->
      <div class="one-click-timer" @click="handleOneClickTimer">
        <template v-if="timerStore.lastUsedCategory">
          <span class="quick-icon">{{ timerStore.lastUsedIcon }}</span>
          <span class="quick-label">{{ timerStore.lastUsedCategory }}</span>
        </template>
        <template v-else>
          <van-icon name="play-circle-o" size="18px" class="quick-placeholder-icon" />
          <span class="quick-label quick-placeholder">选择类别</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { computeInsights, type Insight } from '@/utils/insights'
import {
  formatTime,
  formatDate,
  formatTimeString,
  formatDuration,
  formatDateTime,
  calculateDuration,
  getTimePickerValue,
  getDatePickerValue,
  updateDatePart,
  updateDateFromTimePicker,
  ratingColumns,
  getIconForCategory
} from '@/utils/timeUtils'

const timerStore = useTimerStore()

// 类别接口
interface Category {
  id: string
  name: string
  icon: string
}

// 类别数据 - 从 localStorage 加载，与 CategoryView 保持一致
const categories = ref<Category[]>([])

// 加载类别数据
const loadCategories = () => {
  try {
    const stored = localStorage.getItem('categories')
    if (stored) {
      categories.value = JSON.parse(stored)
    } else {
      // 默认类别 - 与 CategoryView 保持一致
      categories.value = [
        { id: "1", name: "阅读", icon: "📎" },
        { id: "2", name: "复盘", icon: "🔄" },
        { id: "3", name: "计划", icon: "📷" },
        { id: "4", name: "整理", icon: "📧" },
        { id: "5", name: "自学", icon: "📫" },
        { id: "6", name: "交通", icon: "🚫" },
        { id: "7", name: "睡眠", icon: "😾" },
        { id: "8", name: "用餐", icon: "🍔️" },
        { id: "9", name: "运动", icon: "⏸️" },
        { id: "10", name: "购物", icon: "📅" },
        { id: "11", name: "娱乐", icon: "🎨" },
        { id: "12", name: "步行", icon: "🚝" },
        { id: "13", name: "电话", icon: "📓" },
        { id: "14", name: "洗澡", icon: "🚧" }
      ]
      // 保存到 localStorage
      localStorage.setItem('categories', JSON.stringify(categories.value))
    }
  } catch (e) {
    console.error('加载类别失败:', e)
  }
}

// 类别选择弹窗状态
const showCategoryPicker = ref(false)

// 控制是否显示编辑页面
const showEditPage = ref(false)

// 编辑页面相关状态
const currentActivity = ref({
  id: '',
  title: '自学',
  category: '学习',
  icon: "📫",
  note: '开发',
  status: 'ongoing',
  startTime: new Date(),
  endTime: new Date(),
  duration: 3600,
  timeSegments: [],
  statusRating: 5,
  aiEnablementRating: 5
})

// 时间选择器状态
const showDatePicker = ref(false)
const showTimeOnlyPicker = ref(false)
const showDurationPicker = ref(false)
const showEndDatePicker = ref(false)
const showEndTimePicker = ref(false)

// 评分选择器状态
const showStatusRatingPicker = ref(false)
const showAiRatingPicker = ref(false)

// 日历组件日期范围
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

// 时间选择器值
const timePickerValue = ref<string[]>([])
const endTimePickerValue = ref<string[]>([])

// 日期选择器值（van-date-picker 的 modelValue 为 [年, 月, 日] 字符串数组）
const datePickerValue = ref<string[]>([])
const endDatePickerValue = ref<string[]>([])

// 当活动开始时间变化时，更新时间选择器值
watch(
  () => currentActivity.value.startTime,
  (newDate: Date) => {
    if (newDate) {
      timePickerValue.value = getTimePickerValue(newDate)
    }
  },
  { immediate: true }
)

// 当活动结束时间变化时，更新时间选择器值
watch(
  () => currentActivity.value.endTime,
  (newDate: Date) => {
    if (newDate) {
      endTimePickerValue.value = getTimePickerValue(newDate)
    }
  },
  { immediate: true }
)

// 当活动开始日期变化时，更新日期选择器值
watch(
  () => currentActivity.value.startTime,
  (newDate: Date) => {
    if (newDate) {
      datePickerValue.value = getDatePickerValue(newDate)
    }
  },
  { immediate: true }
)

// 当活动结束日期变化时，更新日期选择器值
watch(
  () => currentActivity.value.endTime,
  (newDate: Date) => {
    if (newDate) {
      endDatePickerValue.value = getDatePickerValue(newDate)
    }
  },
  { immediate: true }
)

const activeTimer = computed(() => timerStore.activeTimer)
const currentDuration = ref(0)
const isPaused = ref(false)

// R5: 时间价值
const hourlyRate = ref(0)
const timeAccumulatedValue = computed(() => {
  if (hourlyRate.value <= 0) return "0.00"
  return ((currentDuration.value / 3600) * hourlyRate.value).toFixed(2)
})

// R4: 洞察
const insights = computed(() => {
  if (timerStore.timeEntries.length === 0) return []
  return computeInsights(timerStore.timeEntries)
})

const loadHourlyRate = () => {
  try {
    const raw = localStorage.getItem('timeDebtData')
    if (raw) {
      const data = JSON.parse(raw)
      // data is an array; find current year entry
      const currentYear = new Date().getFullYear()
      const entry = data.find((d: any) => d.year === currentYear) || data[data.length - 1]
      if (entry && entry.hourlyRate) {
        hourlyRate.value = Number(entry.hourlyRate) || 0
      }
    }
  } catch {
    hourlyRate.value = 0
  }
}

// 处理活动点击
const handleActivityClick = (category: { id: string; name: string; icon: string }) => {
  if (activeTimer.value) {
    stopTimer()
  }
  startTimer(category.name, category.name, category.icon)
}

// R2: 一键计时处理
const handleOneClickTimer = () => {
  if (!timerStore.lastUsedCategory) {
    // No history — fallback to showing category grid (scroll to it is implicit)
    return
  }
  if (activeTimer.value) {
    stopTimer()
  }
  startTimer(timerStore.lastUsedCategory, timerStore.lastUsedCategory, timerStore.lastUsedIcon)
}

// 开始计时
const startTimer = (title: string, category: string, icon: string) => {
  timerStore.startTimer(title, category, undefined, icon)
  isPaused.value = false
  currentDuration.value = 0
}

// 停止计时
const stopTimer = () => {
  timerStore.stopTimer()
  isPaused.value = false
}

// 切换暂停/恢复计时
const togglePauseTimer = () => {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    timerStore.pauseTimer()
  } else {
    timerStore.resumeTimer()
  }
}

// 退出编辑页面
const exitEditPage = () => {
  showEditPage.value = false
}

// 保存活动
const saveActivity = () => {
  if (!currentActivity.value.title) {
    alert('请选择活动类别！')
    return
  }

  const duration = currentActivity.value.duration
  
  if (currentActivity.value.status === 'ongoing') {
    timerStore.startTimer(
      currentActivity.value.title,
      currentActivity.value.category,
      currentActivity.value.note,
      currentActivity.value.icon,
      undefined,
      currentActivity.value.startTime
    )
    console.log('开始进行中活动:', currentActivity.value.title, '开始时间:', currentActivity.value.startTime)
  } else {
    const timeEntry = {
      title: currentActivity.value.title,
      startTime: currentActivity.value.startTime,
      endTime: new Date(currentActivity.value.startTime.getTime() + duration * 1000),
      duration: duration,
      category: currentActivity.value.category,
      description: currentActivity.value.note,
      statusRating: currentActivity.value.statusRating,
      aiEnablementRating: currentActivity.value.aiEnablementRating
    }
    
    timerStore.addTimeEntry(timeEntry)
    console.log('保存活动到历史记录:', timeEntry)
  }
  
  showEditPage.value = false
}

// 选择活动类别
const selectCategory = () => {
  showCategoryPicker.value = true
}

// 处理类别选择
const handleCategorySelect = (category: { id: string; name: string; icon: string }) => {
  currentActivity.value.title = category.name
  currentActivity.value.icon = category.icon
  currentActivity.value.category = category.name
  showCategoryPicker.value = false
}

// 添加时间段
const addTimeSegment = () => {
  console.log('添加时间段')
}



// 处理日期选择确认
const handleDateConfirm = () => {
  const value = datePickerValue.value
  if (value && value.length >= 3) {
    const dateStr = `${value[0]}-${value[1]}-${value[2]}`
    currentActivity.value.startTime = updateDatePart(currentActivity.value.startTime, dateStr)
  }
  showDatePicker.value = false
}

// 处理结束日期选择确认
const handleEndDateConfirm = () => {
  const value = endDatePickerValue.value
  if (value && value.length >= 3) {
    const dateStr = `${value[0]}-${value[1]}-${value[2]}`
    currentActivity.value.endTime = updateDatePart(currentActivity.value.endTime, dateStr)
  }
  showEndDatePicker.value = false
}

// 处理时间选择确认
const handleTimeConfirm = () => {
  currentActivity.value.startTime = updateDateFromTimePicker(currentActivity.value.startTime, timePickerValue.value)
  showTimeOnlyPicker.value = false
}

// 处理结束时间选择确认
const handleEndTimeConfirm = () => {
  currentActivity.value.endTime = updateDateFromTimePicker(currentActivity.value.endTime, endTimePickerValue.value)
  showEndTimePicker.value = false
}

// 确认时长
const confirmDuration = () => {
  if (currentActivity.value.duration < 0) {
    currentActivity.value.duration = 0
  }
  currentActivity.value.duration = currentActivity.value.duration * 60
  showDurationPicker.value = false
}

// 处理状态打分确认
const handleStatusRatingConfirm = (value: { text: string; value: string }) => {
  currentActivity.value.statusRating = Number(value.value)
  showStatusRatingPicker.value = false
}

// 处理AI赋能比例打分确认
const handleAiRatingConfirm = (value: { text: string; value: string }) => {
  currentActivity.value.aiEnablementRating = Number(value.value)
  showAiRatingPicker.value = false
}

// 更新当前计时显示
const updateCurrentDuration = () => {
  if (activeTimer.value && !isPaused.value) {
    const now = new Date()
    const startTime = new Date(activeTimer.value.startTime)
    let duration = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    if (duration < 0) {
      duration = 0
    }
    currentDuration.value = duration
  }
}

let intervalId: number | null = null

onMounted(() => {
  loadCategories()
  loadHourlyRate()
  intervalId = window.setInterval(updateCurrentDuration, 100)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.activity-page {
  height: 100%;
  background-color: #F9F9FB;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  display: flex;
  flex-direction: column;
}

.activity-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

.activity-grid {
  margin: 0 -8px;
}

.activity-item {
  padding: 8px;
}

.activity-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.activity-name {
  font-size: 12px;
  color: #6E6E73;
}

.custom-nav-bar {
  background-color: #6366F1;
  height: calc(44px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 16px;
  padding-right: 16px;
}

.nav-icon {
  font-size: 20px;
  color: #ffffff;
}

.nav-title {
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.5px;
}

/* R1: 时间漏洞卡片 */
.time-gap-card {
  margin: 12px 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #6366F1, #818CF8);
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.gap-header {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.gap-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.gap-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gap-label {
  font-size: 11px;
  opacity: 0.75;
  margin-bottom: 2px;
}

.gap-value {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.gap-percent {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 2px;
}

.gap-warning {
  color: #FCA5A5;
}

.gap-warning .gap-value {
  color: #FCA5A5;
}

/* R5: 时间价值行 */
.time-value-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.time-value-label,
.time-value-amount {
  font-size: 11px;
  opacity: 0.8;
}

/* R4: 洞察区域 */
.insights-section {
  margin: 8px;
  flex-shrink: 0;
}

.insights-header {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.insight-card {
  padding: 10px 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.insight-arrow {
  font-size: 20px;
  flex-shrink: 0;
}

.insight-up .insight-arrow {
  color: #EF4444;
}

.insight-down .insight-arrow {
  color: #22C55E;
}

.insight-text {
  font-size: 13px;
  color: #1C1C1E;
  line-height: 1.4;
}

/* R2: 一键计时浮动按钮 */
.one-click-timer {
  position: fixed;
  bottom: 130px;
  right: 20px;
  z-index: 100;
  background-color: white;
  border-radius: 24px;
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.one-click-timer:active {
  transform: scale(0.95);
}

.quick-icon {
  font-size: 20px;
}

.quick-label {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.quick-placeholder {
  color: #AEAEB2;
}

.quick-placeholder-icon {
  color: #AEAEB2;
}

/* 计时器区域 */
.timer-section {
  margin: 0 8px;
  flex-shrink: 0;
}

.timer-card {
  background-color: #6366F1;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.timer-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.timer-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.timer-details {
  flex: 1;
  color: white;
}

.timer-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.timer-time {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.timer-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.control-btn:active {
  transform: scale(0.9);
}

.add-btn {
  position: fixed;
  bottom: 70px;
  right: 20px;
  z-index: 100;
  width: 56px;
  height: 56px;
  background-color: #ec7d51;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(94, 92, 230, 0.4);
  color: white;
}

.add-btn:active {
  transform: scale(0.95);
}

.time-add-icon {
  font-size: 20px;
}

/* 时间选择器样式 */
.picker-content {
  padding: 20px;
}

.picker-header {
  margin-bottom: 20px;
  text-align: center;
}

.picker-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1C1C1E;
  font-weight: 500;
}

.picker-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

/* 时长输入样式 */
:deep(.van-field__control) {
  font-size: 16px;
  color: #1C1C1E;
}

/* 时间选择器样式 */
:deep(.van-datetime-picker) {
  --van-datetime-picker-height: 300px;
}

:deep(.van-picker-column__item--selected) {
  color: #6366F1;
  font-size: 18px;
}
</style>

<style>
/* 编辑页面全局样式 - 不使用scoped确保样式生效 */
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
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  gap: 8px;
  flex-shrink: 0;
}

.status-item {
  font-size: 14px;
  color: #6E6E73;
  padding: 10px 12px;
  border-radius: 20px;
  background-color: #F9F9FB;
  text-align: center;
  flex: 1;
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
</style>
