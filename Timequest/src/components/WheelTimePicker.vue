<template>
  <div class="wheel-time-picker">
    <div class="picker-header">
      <div class="current-time">
        <span class="hour-part" :class="{ active: selectionStep === 'hour' }" @click="selectionStep = 'hour'">
          {{ selectedHour.toString().padStart(2, '0') }}
        </span>
        <span class="time-separator">:</span>
        <span class="minute-part" :class="{ active: selectionStep === 'minute' }" @click="selectionStep = 'minute'">
          {{ selectedMinute.toString().padStart(2, '0') }}
        </span>
      </div>
    </div>
    <div 
      class="wheel-container"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @touchstart="startDrag"
      @touchmove="onDrag"
      @touchend="stopDrag"
    >
      <!-- 小时选择界面 -->
      <div v-if="selectionStep === 'hour'" class="time-wheel hour-wheel">
        <div 
          v-for="i in 12" 
          :key="i"
          class="time-number"
          :class="{ active: selectedHour === getHourFromPosition(i) }"
          @click="selectHour(getHourFromPosition(i))"
          :style="getPosition(i, 12, 120)"
        >
          {{ getHourFromPosition(i).toString().padStart(2, '0') }}
        </div>
        <div class="wheel-center"></div>
        <div class="wheel-line" :style="getWheelLineStyle(selectedHour, 12)"></div>
      </div>
      
      <!-- 分钟选择界面 -->
      <div v-else class="time-wheel minute-wheel">
        <div 
          v-for="(item, index) in 12" 
          :key="index"
          class="time-number"
          :class="{ active: Math.floor((selectedMinute || 0) / 5) === index }"
          @click="selectMinute(index * 5)"
          :style="getPosition(index + 1, 12, 120)"
        >
          {{ (index * 5).toString().padStart(2, '0') }}
        </div>
        <template v-for="(item, index) in 60" :key="`minute-${index}`">
          <div 
            v-if="(index + 1) % 5 !== 0"
            class="minute-mark"
            :style="getMinuteMarkPosition(index + 1, 60, 120)"
          ></div>
        </template>
        <div class="wheel-center"></div>
        <div class="wheel-line" :style="getWheelLineStyle(selectedMinute, 60)"></div>
      </div>
    </div>
    <div class="picker-actions">
      <button class="cancel-btn" @click="$emit('cancel')">取消</button>
      <button class="confirm-btn" @click="confirmSelection">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: Date
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void
  (e: 'confirm', value: Date): void
  (e: 'cancel'): void
}>()

const selectedHour = ref(props.modelValue.getHours())
const selectedMinute = ref(props.modelValue.getMinutes())
const selectionStep = ref<'hour' | 'minute'>('hour')
const isDragging = ref(false)

// 从位置获取小时
const getHourFromPosition = (position: number): number => {
  // 12小时制位置映射到24小时制
  const hourMap: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const hour12 = hourMap[position - 1] || 12
  // 如果当前小时大于等于12，则返回下午时间
  return selectedHour.value >= 12 ? hour12 + 12 : hour12
}

// 选择小时
const selectHour = (hour: number) => {
  selectedHour.value = hour
  // 自动切换到分钟选择
  selectionStep.value = 'minute'
}

// 选择分钟
const selectMinute = (minute: number) => {
  selectedMinute.value = minute
}

// 获取位置
const getPosition = (value: number, total: number, radius: number) => {
  const angle = (value / total) * 2 * Math.PI - Math.PI / 2
  const centerX = 150
  const centerY = 150
  const x = Math.cos(angle) * radius + centerX
  const y = Math.sin(angle) * radius + centerY
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)'
  }
}

// 获取分钟刻度位置
const getMinuteMarkPosition = (value: number, total: number, radius: number) => {
  const angle = (value / total) * 2 * Math.PI - Math.PI / 2
  const centerX = 150
  const centerY = 150
  const x = Math.cos(angle) * radius + centerX
  const y = Math.sin(angle) * radius + centerY
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)'
  }
}

// 获取时针样式
const getHourHandStyle = () => {
  const hour12 = selectedHour.value % 12 || 12
  const angle = (hour12 / 12) * 2 * Math.PI - Math.PI / 2
  return {
    transform: `rotate(${angle}rad)`
  }
}

// 获取轮盘线样式
const getWheelLineStyle = (value: number, total: number) => {
  let normalizedValue = value
  if (total === 12) {
    // 小时转换为12小时制
    normalizedValue = value % 12 || 12
  }
  const angle = (normalizedValue / total) * 2 * Math.PI - Math.PI / 2
  const length = 120 // 与数字位置相同的半径
  return {
    transform: `rotate(${angle}rad)`,
    height: `${length}px`
  }
}

// 开始拖动
const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true
  updateFromDragPosition(event)
}

// 拖动中
const onDrag = (event: MouseEvent | TouchEvent) => {
  if (isDragging.value) {
    updateFromDragPosition(event)
  }
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
}

// 从拖动位置更新时间
const updateFromDragPosition = (event: MouseEvent | TouchEvent) => {
  const wheelContainer = event.currentTarget as HTMLElement
  const rect = wheelContainer.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  let clientX: number, clientY: number
  if (event instanceof TouchEvent) {
    if (event.touches && event.touches[0]) {
      clientX = event.touches[0].clientX - rect.left
      clientY = event.touches[0].clientY - rect.top
    } else {
      return
    }
  } else {
    clientX = event.clientX - rect.left
    clientY = event.clientY - rect.top
  }
  
  const deltaX = clientX - centerX
  const deltaY = clientY - centerY
  let angle = Math.atan2(deltaY, deltaX)
  angle += Math.PI / 2
  if (angle < 0) {
    angle += 2 * Math.PI
  }
  
  if (selectionStep.value === 'hour') {
    const hour = Math.round((angle / (2 * Math.PI)) * 12) % 12
    const hourMap: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    const hour12 = hourMap[hour] || 12
    selectedHour.value = selectedHour.value >= 12 ? hour12 + 12 : hour12
  } else {
    const minute = Math.round((angle / (2 * Math.PI)) * 60) % 60
    selectedMinute.value = minute
  }
}

// 确认选择
const confirmSelection = () => {
  const newDate = new Date(props.modelValue)
  newDate.setHours(selectedHour.value)
  newDate.setMinutes(selectedMinute.value)
  emit('update:modelValue', newDate)
  emit('confirm', newDate)
}

// 监听modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedHour.value = newValue.getHours()
    selectedMinute.value = newValue.getMinutes()
  }
)
</script>

<style scoped>
.wheel-time-picker {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
}

.picker-header {
  text-align: center;
  margin-bottom: 20px;
}

.current-time {
  font-size: 32px;
  font-weight: bold;
  color: #6E6E73;
}

.hour-part.active, .minute-part.active {
  color: #6366F1;
}

.time-separator {
  color: #6E6E73;
  margin: 0 4px;
}

.wheel-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 30px;
  cursor: pointer;
}

.time-wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: white;
}

.time-number {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #6E6E73;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  border: 1px solid #EFEFF4;
}

.time-number:hover {
  background-color: #F5F5FF;
  color: #6366F1;
  border-color: #6366F1;
}

.time-number.active {
  background-color: #6366F1;
  color: white;
  font-weight: bold;
  border-color: #6366F1;
}

.minute-mark {
  position: absolute;
  width: 2px;
  height: 8px;
  background-color: #EFEFF4;
  transform: translate(-50%, -50%);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #6366F1;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.wheel-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  background-color: #6366F1;
  background-image: repeating-linear-gradient(
    to top,
    #6366F1,
    #6366F1 4px,
    transparent 4px,
    transparent 8px
  );
  transform-origin: bottom center;
  transform: translate(-50%, -100%);
  z-index: 5;
  border-radius: 2px;
}

.picker-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: transparent;
  color: #6E6E73;
}

.cancel-btn:hover {
  background-color: #F9F9FB;
}

.confirm-btn {
  background-color: #6366F1;
  color: white;
}

.confirm-btn:hover {
  background-color: #4F46E5;
}
</style>