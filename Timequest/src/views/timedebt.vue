<template>
  <div class="time-debt-page">
    <div class="custom-nav-bar">
      <div class="nav-left">
        <van-icon name="back" class="nav-icon" @click="goBack" />
      </div>
      <div class="nav-title">时间负债</div>
      <div class="nav-right">
        <van-icon name="question-circle" class="nav-icon" @click="showGuideModal = true" />
      </div>
    </div>
    
    <div class="content">
      
      <!-- 仪表盘 -->
      <div v-if="savedData.length > 0 && savedData.some(item => item.annualIncome > 0) && !showAddForm" class="dashboard-section">
        <!-- 仪表盘头部 -->
        <div class="dashboard-header">
          <h2>时间负债仪表盘</h2>
          <div class="header-actions">
            <van-button size="small" @click="showTerminologyModal = true">术语解释</van-button>
            <van-button size="small" type="primary" @click="showAddForm = true">添加数据</van-button>
          </div>
        </div>
        
        <!-- 核心指标卡片 -->
        <div class="part1">
          <div class="history-section">
            <h3>历史参数</h3>
            <div class="history-list">
              <div 
                v-for="item in savedData.filter(item => item.annualIncome > 0)" 
                :key="item.year"
                class="history-item"
              >
                <div class="history-year">{{ item.year }}年</div>
                <div class="history-details">
                  <div>时薪: ¥{{ item.hourlyRate.toFixed(2) }}</div>
                  <div>理想时薪: ¥{{ item.idealHourlyRate.toFixed(2) }}</div>
                  <div>理想负债: ¥{{ item.idealTimeDebt.toFixed(2) }}</div>
                  <button class="delete-btn" @click="deleteItem(item.year)">删除</button>
                </div>
              </div>
            </div>
          </div>
          <div class="metrics-container">
            <div class="metric-cards">
              <div class="metric-card positive">
                <div class="metric-label">已利用时间价值</div>
                <div class="metric-value">¥{{ totalValueEvaluation.toFixed(2) }}</div>
              </div>
              <div class="metric-card negative">
                <div class="metric-label">实际已利用时间负债</div>
                <div class="metric-value">¥{{ totalActualDebt.toFixed(2) }}</div>
              </div>
              <div class="metric-card positive">
                <div class="metric-label">价值净值</div>
                <div class="metric-value">¥{{ valueNetWorth.toFixed(2) }}</div>
              </div>
              <div class="metric-card negative">
                <div class="metric-label">理想已利用时间负债</div>
                <div class="metric-value">¥{{ totalIdealDebt.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 趋势图表 -->
        <div class="chart-section">
          <h3>价值积累趋势</h3>
          <div class="chart-placeholder">
            <div class="chart-bar-container">
              <div 
                v-for="(data, index) in trendData" 
                :key="index"
                class="chart-bar-wrapper"
              >
                <div class="chart-bar" :style="{ height: data.height + '%', backgroundColor: data.color }"></div>
                <div class="chart-label">{{ data.date }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 对比仪表盘 -->
        <div class="comparison-section">
          <h3>实际 vs 理想</h3>
          <div class="comparison-cards">
            <div class="comparison-card">
              <div class="comparison-title">时间价值实现率</div>
              <div class="comparison-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: valueRealizationRate + '%' }"></div>
                </div>
                <div class="progress-text">{{ valueRealizationRate.toFixed(1) }}%</div>
              </div>
            </div>
            <div class="comparison-card">
              <div class="comparison-title">理想负债差距</div>
              <div class="comparison-value" :class="{ positive: idealDebtGap >= 0, negative: idealDebtGap < 0 }">
                ¥{{ idealDebtGap.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史记录 -->

      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!showAddForm" class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">开始你的时间价值之旅</div>
        <div class="empty-subtext">时间负债帮助你量化时间价值，评估时间使用效率</div>
        <div class="empty-actions">
          <van-button type="primary" @click="showGuideModal = true">了解更多</van-button>
          <van-button type="default" @click="showAddForm = true">立即开始</van-button>
        </div>
      </div>
      
      <!-- 显示表单 -->
      <van-form v-if="showAddForm" @submit="calculateAndSave">
        <!-- 年份选择 -->
        <van-field 
          v-model="formData.year" 
          name="year" 
          label="年份" 
          placeholder="请选择年份"
          readonly
        >
          <template #right>
            <van-popup 
              v-model:show="showYearPicker" 
              position="bottom"
            >
              <van-picker 
                :columns="yearColumns" 
                @confirm="(value) => { formData.year = value; showYearPicker = false }"
                @cancel="showYearPicker = false"
              />
            </van-popup>
            <van-icon name="arrow" @click="showYearPicker = true" />
          </template>
        </van-field>
        
        <!-- 年收入 -->
        <van-field 
          v-model.number="formData.annualIncome" 
          name="annualIncome" 
          label="年收入" 
          placeholder="请输入年收入"
          type="number"
          required
        >
          <template #input-after>
            <span class="input-hint">¥</span>
          </template>
        </van-field>
        
        <!-- 有效工作天数 -->
        <van-field 
          v-model.number="formData.workDays" 
          name="workDays" 
          label="有效工作天数" 
          placeholder="请输入有效工作天数"
          type="number"
          required
        >
          <template #input-after>
            <span class="input-hint">天</span>
          </template>
        </van-field>
        
        <!-- 日均工作时长 -->
        <van-field 
          v-model.number="formData.dailyHours" 
          name="dailyHours" 
          label="日均工作时长" 
          placeholder="请输入日均工作时长"
          type="number"
          required
        >
          <template #input-after>
            <span class="input-hint">小时</span>
          </template>
        </van-field>
        

        
        <!-- 理想时薪 -->
        <van-field 
          v-model.number="formData.idealHourlyRate" 
          name="idealHourlyRate" 
          label="理想时薪" 
          placeholder="请输入理想时薪（建议值：当前时薪的1.5-2倍）"
          type="number"
          required
        >
          <template #input-after>
            <span class="input-hint">¥/小时</span>
          </template>
        </van-field>
        
        <!-- 计算出的理想时间负债 -->
        <van-field 
          v-model="calculatedIdealTimeDebt" 
          name="idealTimeDebt" 
          label="理想时间负债" 
          placeholder="自动计算"
          readonly
        >
          <template #input-after>
            <span class="input-hint">¥</span>
          </template>
        </van-field>
        
        <div class="button-container">
          <van-button type="primary" native-type="submit">计算并保存</van-button>
        </div>
      </van-form>
    </div>
    
    <!-- 底部加号按钮 -->
    <div class="add-btn" @click="showAddForm = true">
      <van-icon name="plus" size="24px" />
    </div>
    
    <!-- 功能介绍模态框 -->
    <van-popup v-model:show="showGuideModal" position="center" round>
      <div class="guide-modal">
        <div class="guide-header">
          <h2>什么是时间负债？</h2>
          <van-icon name="close" @click="showGuideModal = false" />
        </div>
        <div class="guide-content">
          <div class="guide-section">
            <h3>🎯 功能目标</h3>
            <p>时间负债帮助你量化时间的价值，做出更明智更清晰的时间投资决策,提醒你<strong>更多、更好</strong>的利用时间</p>
          </div>
          <div class="guide-section">
            <h3>📊 核心概念</h3>
            <ul>
              <li><strong>时薪[元/小时]</strong>：<br><span class="formula">年收入 ÷ (工作天数 × 每天工作小时数)</span></li>
              <li><strong>年度负债[元]</strong>：<br><span class="formula">一年总小时数 × 时薪</span></li>
              <li><strong>理想时薪[元/小时]</strong>：<br><span class="formula">你期望达到的每小时价值（用户输入）</span></li>
              <li><strong>理想负债[元]</strong>：<br><span class="formula">一年总小时数 × 理想时薪</span></li>
              <li><strong>价值净值[元]</strong>：<br><span class="formula">已利用时间价值 - 相应单位负债</span></li>
            </ul>
          </div>
          <div class="guide-section">
            <h3>💡 使用步骤</h3>
            <ol>
              <li>点击右下角加号按钮</li>
              <li>填写你的年收入、工作天数等信息</li>
              <li>设置你的理想时薪</li>
              <li>系统会自动计算并展示你的时间负债情况</li>
            </ol>
          </div>
        </div>
        <div class="guide-footer">
          <van-button type="primary" block @click="showGuideModal = false">我知道了</van-button>
        </div>
      </div>
    </van-popup>
    
    <!-- 术语解释模态框 -->
    <van-popup v-model:show="showTerminologyModal" position="bottom" round>
      <div class="terminology-modal">
        <div class="modal-header">
          <h3>术语解释</h3>
          <van-icon name="close" @click="showTerminologyModal = false" />
        </div>
        <div class="modal-content">
          <div class="term-item">
            <h4>时间负债</h4>
            <p>基于理想时薪计算的年度时间总价值，代表你一年时间的理想价值</p>
          </div>
          <div class="term-item">
            <h4>时薪</h4>
            <p>你的实际 hourly 价值，基于年收入和工作时长计算得出</p>
          </div>
          <div class="term-item">
            <h4>理想时薪</h4>
            <p>你期望达到的 hourly 价值，反映了你的职业目标和自我价值认知</p>
          </div>
          <div class="term-item">
            <h4>价值净值</h4>
            <p>已利用时间的价值减去实际时间负债，反映了你的时间使用效率</p>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTimerStore } from '@/stores/timer'

const router = useRouter()

// 表单数据
const formData = ref({
  year: new Date().getFullYear() - 1, // 默认去年
  workDays: 250, // 默认250个工作日
  dailyHours: 8, // 默认每天8小时
  annualIncome: 0,
  idealHourlyRate: 0
})

// 计算属性
const calculatedHourlyRate = computed(() => {
  if (formData.value.workDays <= 0 || formData.value.dailyHours <= 0 || formData.value.annualIncome <= 0) {
    return 0
  }
  const totalHours = formData.value.workDays * formData.value.dailyHours
  return formData.value.annualIncome / totalHours
})

const calculatedIdealTimeDebt = computed(() => {
  if (formData.value.idealHourlyRate <= 0) {
    return 0
  }
  const totalHoursInYear = 365 * 24 // 一年的总小时数
  return formData.value.idealHourlyRate * totalHoursInYear
})

// 年份选择器
const showYearPicker = ref(false)
const showAddForm = ref(false)
const showGuideModal = ref(false)
const showTerminologyModal = ref(false)
const yearColumns = ref<Array<{ text: string, value: number }>>([])

// 生成年份选项
const generateYearColumns = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push({ text: i.toString(), value: i })
  }
  yearColumns.value = years
}

// 保存的数据类型
interface TimeDebtData {
  year: number
  workDays: number
  dailyHours: number
  annualIncome: number
  hourlyRate: number
  idealHourlyRate: number
  idealTimeDebt: number
  savedAt: string
}

// 保存的数据
const savedData = ref<TimeDebtData[]>([])

// 从本地存储加载数据
const loadSavedData = () => {
  const data = localStorage.getItem('timeDebtData')
  if (data) {
    try {
      savedData.value = JSON.parse(data) as TimeDebtData[]
    } catch (error) {
      console.error('Failed to parse time debt data:', error)
      savedData.value = []
    }
  }
}

// 保存数据
const saveData = (data: TimeDebtData) => {
  savedData.value.push(data)
  localStorage.setItem('timeDebtData', JSON.stringify(savedData.value))
}

// 计算并保存
const calculateAndSave = () => {
  const data = {
    year: formData.value.year,
    workDays: formData.value.workDays,
    dailyHours: formData.value.dailyHours,
    annualIncome: formData.value.annualIncome,
    hourlyRate: calculatedHourlyRate.value,
    idealHourlyRate: formData.value.idealHourlyRate,
    idealTimeDebt: calculatedIdealTimeDebt.value,
    savedAt: new Date().toISOString()
  }
  
  saveData(data)
  
  // 保存后隐藏表单
  showAddForm.value = false
}

// 智能推荐理想时薪
const recommendIdealHourlyRate = () => {
  // 基于当前时薪推荐理想时薪
  if (calculatedHourlyRate.value > 0 && formData.value.idealHourlyRate === 0) {
    formData.value.idealHourlyRate = calculatedHourlyRate.value * 1.5 // 推荐当前时薪的1.5倍
  }
}

// 监听计算时薪变化，自动推荐理想时薪
watch(calculatedHourlyRate, (newValue) => {
  if (newValue > 0 && formData.value.idealHourlyRate === 0) {
    recommendIdealHourlyRate()
  }
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 计算属性 - 从 timerStore 获取时间条目
const timerStore = useTimerStore()
const timeEntries = computed(() => timerStore.timeEntries)

// 计算属性 - 核心指标
const totalValueEvaluation = computed(() => {
  return timeEntries.value.reduce((total, entry) => total + (entry.valueEvaluation || 0), 0)
})

const totalActualDebt = computed(() => {
  const latestData = savedData.value.filter(item => item.annualIncome > 0).sort((a, b) => b.year - a.year)[0]
  if (!latestData) return 0
  const hourlyRateMinute = latestData.hourlyRate / 60
  return timeEntries.value.reduce((total, entry) => total + (hourlyRateMinute * (entry.duration || 0)), 0)
})

const valueNetWorth = computed(() => {
  return totalValueEvaluation.value - totalActualDebt.value
})

const totalIdealDebt = computed(() => {
  const latestData = savedData.value.filter(item => item.annualIncome > 0).sort((a, b) => b.year - a.year)[0]
  if (!latestData) return 0
  const idealHourlyRateMinute = latestData.idealHourlyRate / 60
  return timeEntries.value.reduce((total, entry) => total + (idealHourlyRateMinute * (entry.duration || 0)), 0)
})

const valueRealizationRate = computed(() => {
  if (totalActualDebt.value === 0) return 0
  return (totalValueEvaluation.value / totalActualDebt.value) * 100
})

const idealDebtGap = computed(() => {
  return totalValueEvaluation.value - totalIdealDebt.value
})

// 趋势数据
const trendData = computed(() => {
  // 按日期分组计算每日价值
  const dailyData: Record<string, number> = {}
  timeEntries.value.forEach((entry: any) => {
    const dateKey = new Date(entry.startTime).toISOString().split('T')[0] as string
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = 0
    }
    dailyData[dateKey] += (entry.valueEvaluation || 0)
  })
  
  // 转换为图表数据
  return Object.entries(dailyData)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(-7) // 只显示最近7天
    .map(([date, value]) => {
      const maxValue = Math.max(...Object.values(dailyData), 1)
      const height = (value / maxValue) * 100
      return {
        date: date.split('-').slice(1).join('/'), // 格式化为 MM/DD
        value,
        height,
        color: value > 0 ? '#10B981' : '#EF4444'
      }
    })
})
const deleteItem = (year: number) => {
  savedData.value = savedData.value.filter(item => item.year !== year)
  
} 
// 初始化
onMounted(() => {
  generateYearColumns()
  loadSavedData()
})
</script>

<style scoped>
.time-debt-page {
  height: 100%;
  background-color: #F9F9FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.part1 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.metrics-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
}

.van-form {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.button-container {
  margin-top: 24px;
}

.history-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.metrics-container {
  height: 100%;
}

.history-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1C1C1E;
  font-weight: 500;
}

.history-item {
  padding: 8px;
  border-bottom: 1px solid #EFEFF4;
}

.history-item:last-child {
  border-bottom: none;
}

.history-year {
  font-size: 14px;
  font-weight: bold;
  color: #1C1C1E;
  margin-bottom: 6px;
  line-height: 1.2;
}

.history-details {
  font-size: 12px;
  color: #6E6E73;
  line-height: 1.3;
}

.history-details div {
  margin-bottom: 4px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #AEAEB2;
  margin-bottom: 24px;
}

/* 数学表达式样式 */
.formula {
  font-family: 'Courier New', monospace;
  background-color: #F9F9FB;
  padding: 4px 8px;
  border-radius: 4px;
  color: #6366F1;
  font-weight: bold;
  margin-top: 4px;
  display: inline-block;
}

/* 底部加号按钮 */
.add-btn {
  position: fixed;
  bottom: 70px;
  right: 20px;
  z-index: 100;
  width: 56px;
  height: 56px;
  background-color: #6366F1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.add-btn:active {
  transform: scale(0.95);
}

/* 仪表盘样式 */
.dashboard-section {
  padding: 16px 0;
}

/* 核心指标卡片 */
.metric-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  height: 100%;
}

.metric-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #e3e3e3;
}

.metric-card.positive .metric-value {
  color: #34c759;
}

.metric-card.negative .metric-value {
  color: #ff3b30;
}

.metric-label {
  font-size: 13px;
  color: #6e6e73;
  margin-bottom: 8px;
  line-height: 1.2;
  font-weight: 400;
  letter-spacing: -0.3px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #1d1d1f;
  letter-spacing: -0.5px;
}

/* 图表部分 */
.chart-section {
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.chart-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

.chart-placeholder {
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.chart-bar-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100%;
  width: 100%;
  padding-bottom: 30px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.chart-label {
  font-size: 12px;
  color: #AEAEB2;
  margin-top: 8px;
}

/* 对比部分 */
.comparison-section {
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.comparison-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

.comparison-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.comparison-card {
  background-color: #F9F9FB;
  border-radius: 6px;
  padding: 12px;
}

.comparison-title {
  font-size: 12px;
  color: #6E6E73;
  margin-bottom: 8px;
  line-height: 1.2;
}

.comparison-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #EFEFF4;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #6366F1;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: bold;
  color: #1C1C1E;
  min-width: 50px;
  text-align: right;
}

.comparison-value {
  font-size: 14px;
  font-weight: bold;
  line-height: 1.2;
}

.comparison-value.positive {
  color: #10B981;
}

.comparison-value.negative {
  color: #EF4444;
}

/* 历史记录部分 */
.history-section {
  background-color: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.history-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #AEAEB2;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #6E6E73;
}

/* 仪表盘头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1C1C1E;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 空状态操作按钮 */
.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 输入提示 */
.input-hint {
  font-size: 14px;
  color: #AEAEB2;
  margin-left: 4px;
}

/* 功能介绍模态框 */
.guide-modal {
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 16px;
  padding: 24px;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EFEFF4;
}

.guide-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1C1C1E;
  font-weight: 600;
}

.guide-content {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.guide-section {
  margin-bottom: 20px;
}

.guide-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #6366F1;
  font-weight: 500;
}

.guide-section p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6E6E73;
  line-height: 1.5;
}

.guide-section strong {
  font-weight: bold;
  color: #1C1C1E;
}

.guide-section ul,
.guide-section ol {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.guide-section li {
  font-size: 14px;
  color: #6E6E73;
  line-height: 1.5;
  margin-bottom: 6px;
}

.guide-footer {
  padding-top: 12px;
  border-top: 1px solid #EFEFF4;
}

/* 术语解释模态框 */
.terminology-modal {
  width: 100%;
  max-height: 80vh;
  background-color: white;
  border-radius: 16px 16px 0 0;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EFEFF4;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1C1C1E;
  font-weight: 600;
}

.modal-content {
  max-height: 400px;
  overflow-y: auto;
}

.term-item {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EFEFF4;
}

.term-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.term-item h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #6366F1;
  font-weight: 500;
}

.term-item p {
  margin: 0;
  font-size: 14px;
  color: #6E6E73;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metric-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-bar-container {
    gap: 4px;
  }
  
  .chart-label {
    font-size: 10px;
  }
  
  .metric-value {
    font-size: 16px;
  }
  
  .comparison-value {
    font-size: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .header-actions button {
    flex: 1;
  }
  
  .empty-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .empty-actions button {
    flex: 1;
    width: 100%;
  }
  
  .guide-modal {
    width: 95%;
    padding: 16px;
  }
  
  .guide-header h2 {
    font-size: 18px;
  }
  
  .guide-section h3 {
    font-size: 15px;
  }
  
  .guide-section p,
  .guide-section li {
    font-size: 13px;
  }
}

/* 删除按钮 */
.delete-btn {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #EF4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #F87171;
}

.delete-btn:active {
  background-color: #d9363e;
}
</style>