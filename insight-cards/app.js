// app.js
const { cards } = require('./data/cards.js');

App({
  globalData: {
    cards,
    deck: null, // 抽卡器实例，在首页 onLoad 时创建
  },
  onLaunch() {
    // 本地缓存初始化兜底（首次进入确保 key 存在）
    if (!wx.getStorageSync('favorites')) wx.setStorageSync('favorites', {});
    if (!wx.getStorageSync('notes')) wx.setStorageSync('notes', {});
    if (!wx.getStorageSync('history')) wx.setStorageSync('history', []);
  },
});
