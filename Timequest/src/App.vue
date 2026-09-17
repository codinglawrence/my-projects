<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTimerStore } from '@/stores/timer'
import { showDialog } from 'vant'

const timerStore = useTimerStore()

// R3: 日终反射 �?每天首次打开检查昨日记�?
onMounted(() => {
  const todayStr = timerStore.getTodayDateStr()
  const lastOpen = timerStore.lastOpenDate
  
  // 每天首次打开才触�?
  if (lastOpen === todayStr) return
  
  // 计算昨日日期
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.getFullYear() + '-' +
    String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
    String(yesterday.getDate()).padStart(2, '0')
  
  // 获取昨日条目
  const yesterdayEntries = timerStore.getTimeEntriesByDate(yesterdayStr)
  
  // 更新 lastOpenDate（无论是否弹窗都更新�?
  timerStore.updateLastOpenDate(todayStr)
  
  if (yesterdayEntries.length === 0) return
  
  const totalSeconds = yesterdayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)
  
  showDialog({
    title: '昨日回顾',
    message: '昨天记录�?' + yesterdayEntries.length + ' 项活动，�?' + totalHours + ' 小时。感觉如何？',
    showCancelButton: true,
    confirmButtonText: '👍',
    cancelButtonText: '👎',
    theme: 'round-button',
  }).then(() => {
    timerStore.recordDailyReflection(yesterdayStr, '👍')
  }).catch(() => {
    timerStore.recordDailyReflection(yesterdayStr, '👎')
  })
})
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
