<template>
  <div class="category-page">
    <div class="custom-nav-bar">
      <div class="nav-left">
        <van-icon name="menu" class="nav-icon" />
      </div>
      <div class="nav-title">类别</div>
      <div class="nav-right">
        <van-icon name="ellipsis" class="nav-icon" />
      </div>
    </div>
    
    <div class="category-content">
      <van-list
        v-model:loading="loading"
        v-model:finished="finished"
        :error="error"
        error-text="加载失败，点击重试"
        @load="onLoad"
        class="category-list"
      >
        <van-cell 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          :border="false"
          clickable
          @click="editCategory(category)"
        >
          <template #icon>
            <div class="category-icon">{{ category.icon }}</div>
          </template>
          <div class="category-name">{{ category.name }}</div>
          <template #right>
            <van-icon name="arrow" />
          </template>
        </van-cell>
      </van-list>
    </div>
    
    <van-fab class="add-btn" @click="showAddCategoryDialog = true">
      <van-icon name="plus" />
    </van-fab>
    
    <!-- 添加类别对话框 -->
    <van-popup v-model:show="showAddCategoryDialog" position="bottom">
      <div class="dialog-content">
        <h3>添加新类别</h3>
        <van-form @submit="addCategory">
          <van-field 
            v-model="newCategory.name" 
            name="name"
            label="类别名称" 
            placeholder="输入类别名称" 
            :rules="[{ required: true, message: '请输入类别名称' }]"
          />
          <div class="form-group">
            <label>选择图标</label>
            <div class="icon-selector">
              <div 
                v-for="icon in availableIcons" 
                :key="icon"
                class="icon-option"
                :class="{ active: newCategory.icon === icon }"
                @click="newCategory.icon = icon"
              >
                {{ icon }}
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <van-button type="default" block size="large" @click="showAddCategoryDialog = false">
              取消
            </van-button>
            <van-button type="primary" block size="large" native-type="submit">
              确定
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
    
    <!-- 编辑类别对话框 -->
    <van-popup v-model:show="showEditCategoryDialog" position="bottom">
      <div class="dialog-content">
        <h3>编辑类别</h3>
        <van-form @submit="saveEditedCategory">
          <van-field 
            v-model="editCategoryData.name" 
            name="name"
            label="类别名称" 
            placeholder="输入类别名称" 
            :rules="[{ required: true, message: '请输入类别名称' }]"
          />
          <div class="form-group">
            <label>选择图标</label>
            <div class="icon-selector">
              <div 
                v-for="icon in availableIcons" 
                :key="icon"
                class="icon-option"
                :class="{ active: editCategoryData.icon === icon }"
                @click="editCategoryData.icon = icon"
              >
                {{ icon }}
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <van-button type="default" block size="large" @click="showEditCategoryDialog = false">
              取消
            </van-button>
            <van-button type="primary" block size="large" native-type="submit">
              确定
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'

interface Category {
  id: number
  name: string
  icon: string
}

const categories = ref<Category[]>([])
const loading = ref(false)
const finished = ref(false)
const error = ref(false)

const showAddCategoryDialog = ref(false)
const showEditCategoryDialog = ref(false)

const newCategory = ref({
  name: '',
  icon: '📱'
})

const editCategoryData = ref<Category>({
  id: 0,
  name: '',
  icon: ''
})

const availableIcons = ['📱', '💻', '📚', '✏️', '🎨', '🎮', '🏃', '🍔', '😴', '🛒', '🧹', '🎵', '🎬', '💼', '💰', '❤️', '🌟', '🔥']

// 从 localStorage 加载类别
const loadCategories = () => {
  try {
    const stored = localStorage.getItem('categories')
    if (stored) {
      categories.value = JSON.parse(stored)
    } else {
      // 默认类别 - 与 ActivityView 保持一致
      categories.value = [
        { id: 1, name: '阅读', icon: '📚' },
        { id: 2, name: '复盘', icon: '🌍' },
        { id: 3, name: '计划', icon: '🔍' },
        { id: 4, name: '整理', icon: '📁' },
        { id: 5, name: '自学', icon: '📱' },
        { id: 6, name: '交通', icon: '🚗' },
        { id: 7, name: '睡眠', icon: '😴' },
        { id: 8, name: '用餐', icon: '🍽️' },
        { id: 9, name: '运动', icon: '🏋️' },
        { id: 10, name: '购物', icon: '🛒' },
        { id: 11, name: '娱乐', icon: '🎨' },
        { id: 12, name: '步行', icon: '🚶' },
        { id: 13, name: '电话', icon: '📞' },
        { id: 14, name: '洗澡', icon: '🚿' }
      ]
      saveCategories()
    }
  } catch (e) {
    console.error('加载类别失败:', e)
  }
}

// 保存类别到 localStorage
const saveCategories = () => {
  try {
    localStorage.setItem('categories', JSON.stringify(categories.value))
  } catch (e) {
    console.error('保存类别失败:', e)
  }
}

const onLoad = () => {
  loading.value = true
  // 模拟加载
  setTimeout(() => {
    loadCategories()
    loading.value = false
    finished.value = true
  }, 500)
}

const addCategory = () => {
  if (!newCategory.value.name.trim()) {
    showToast('请输入类别名称')
    return
  }
  
  const category: Category = {
    id: Date.now(),
    name: newCategory.value.name.trim(),
    icon: newCategory.value.icon
  }
  
  categories.value.push(category)
  saveCategories()
  
  newCategory.value = { name: '', icon: '📱' }
  showAddCategoryDialog.value = false
  
  showToast('添加成功')
}

const editCategory = (category: Category) => {
  editCategoryData.value = { ...category }
  showEditCategoryDialog.value = true
}

const saveEditedCategory = () => {
  if (!editCategoryData.value.name.trim()) {
    showToast('请输入类别名称')
    return
  }
  
  const index = categories.value.findIndex(c => c.id === editCategoryData.value.id)
  if (index !== -1) {
    categories.value[index] = { ...editCategoryData.value }
    saveCategories()
    showToast('修改成功')
  }
  
  showEditCategoryDialog.value = false
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-page {
  height: 100%;
  background-color: #F9F9FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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

.category-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.category-list {
  min-height: 0;
}

.category-item {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-name {
  font-size: 16px;
  color: #1C1C1E;
}

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
}

.dialog-content {
  padding: 20px;
  background: white;
  border-radius: 20px 20px 0 0;
}

.dialog-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.form-group {
  margin: 16px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.icon-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option.active {
  border-color: #6366F1;
  background-color: #f0f0ff;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.dialog-actions .van-button {
  flex: 1;
}
</style>
