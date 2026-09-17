<template>
  <div class="more-page">
    <div class="custom-nav-bar">
      <div class="nav-left">
        <van-icon name="menu" class="nav-icon" />
      </div>
      <div class="nav-title">更多</div>
      <div class="nav-right">
        <van-icon name="ellipsis" class="nav-icon" />
      </div>
    </div>
    
    <div class="more-content">
      <!-- R6: 清醒时长设置 -->
      <van-cell-group class="menu-section">
        <van-cell class="menu-item" :border="false">
          <template #icon>
            <van-icon name="clock-o" size="20" />
          </template>
          <template #title>
            <div class="menu-title-row">
              <span>清醒时长设置</span>
              <span class="menu-value">{{ wakeHours }}h</span>
            </div>
          </template>
          <template #label>
            <div class="stepper-row">
              <span class="stepper-hint">每天清醒小时数（8-20，默认16）</span>
              <van-stepper v-model="wakeHours" :min="8" :max="20" integer @change="onWakeHoursChange" />
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- R6: 数据导出 -->
      <van-cell-group class="menu-section">
        <van-cell 
          title="导出数据"
          class="menu-item"
          :border="false"
          @click="exportData"
        >
          <template #icon>
            <van-icon name="down" size="20" />
          </template>
          <template #right>
            <van-icon name="arrow" />
          </template>
          <template #label>
            <span class="menu-label">导出为 JSON 文件</span>
          </template>
        </van-cell>
      </van-cell-group>
      
      <van-cell-group class="menu-section">
        <van-cell 
          title="帮助"
          class="menu-item"
          :border="false"
        >
          <template #icon>
            <van-icon name="question-circle" size="20" />
          </template>
          <template #right>
            <van-icon name="arrow" />
          </template>
        </van-cell>
        <van-cell 
          title="关于"
          class="menu-item"
          :border="false"
          @click="showAboutDialog"
        >
          <template #icon>
            <van-icon name="info-circle" size="20" />
          </template>
          <template #right>
            <van-icon name="arrow" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showDialog, showToast } from 'vant'
import { useTimerStore } from '@/stores/timer'

const timerStore = useTimerStore()

// 清醒时长绑定到 store
const wakeHours = ref(timerStore.wakeHours)

const onWakeHoursChange = (value: number | string) => {
  const h = typeof value === 'string' ? parseInt(value) : value
  timerStore.updateWakeHours(h)
}

// 导出数据
const exportData = () => {
  try {
    const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
    const config = JSON.parse(localStorage.getItem('timequest_config') || '{}')
    let reflections = []
    try {
      reflections = JSON.parse(localStorage.getItem('timequest_reflections') || '[]')
    } catch { /* ignore */ }

    const exportObj = { timeEntries, config, reflections, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const today = new Date()
    const dateStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'timequest-export-' + dateStr + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast('导出成功')
  } catch (e) {
    showToast('导出失败')
    console.error('导出失败:', e)
  }
}

const showAboutDialog = () => {
  showDialog({
    title: '关于',
    message: 'coded by lawrence\ninspired by wave\nversion 1.0.0',
    theme: 'round-button',
  }).then(() => {
    // on close
  })
}
</script>

<style scoped>
.more-page {
  height: 100%;
  background-color: #F9F9FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
}

.more-content {
  padding: 16px;
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
}

.menu-section {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.menu-item {
  padding: 16px;
  transition: all 0.3s ease;
}

.menu-item:active {
  background-color: #F9F9FB;
}

/* R6: 清醒时长行 */
.menu-title-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.menu-value {
  font-size: 15px;
  font-weight: 600;
  color: #6366F1;
}

.stepper-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.stepper-hint {
  font-size: 12px;
  color: #AEAEB2;
}

.menu-label {
  font-size: 12px;
  color: #AEAEB2;
}
</style>
