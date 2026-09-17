<template>
  <div class="main-layout">
    <div class="content-wrapper">
      <RouterView />
    </div>
    
    <van-tabbar route class="tab-bar" active-color="pink">
      <van-tabbar-item name="activity" to="/activity">
        <template #icon>
          <van-icon />
        </template>
        活动
      </van-tabbar-item>
      <van-tabbar-item name="history" to="/history">
        <template #icon>
          <van-icon  />
        </template>
        历史
      </van-tabbar-item>
      <van-tabbar-item name="category" to="/category">
        <template #icon>
          <van-icon />
        </template>
        类别
      </van-tabbar-item>
      <van-tabbar-item name="time-debt" to="/timedebt">
        <template #icon>
          <van-icon />
        </template>
        负债
      </van-tabbar-item>
      <van-tabbar-item name="more" to="/more">
        <template #icon>
          <van-icon />
        </template>
        更多
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
// 主布局组件，包含底部导航栏
</script>

<style scoped>
.main-layout {
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-bar {
  flex-shrink: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 99;
  height: 50px;
}
</style>
