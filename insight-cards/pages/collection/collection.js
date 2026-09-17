// pages/collection/collection.js
const app = getApp();
const storage = require('../../utils/storage.js');
const { buildFoilLayers } = require('../../data/rarity.js');

Page({
  data: { list: [], current: 0 },
  onShow() { this.load(); },
  onSwipe(e) { this.setData({ current: e.detail.current }); },
  load() {
    const fav = storage.getFavorites();
    const list = app.globalData.cards
      .filter((c) => fav[c.id])
      .map((c) => ({
        ...c,
        favoritedAt: fav[c.id].favoritedAt,
        note: storage.getNote(c.id),
        // 按 card.rarity 解析箔层，供 wxml 在 rc-img 与 rc-img-fg 间渲染
        foilLayers: buildFoilLayers(c.rarity),
      }));
    this.setData({ list });
  },
  // 点开笔记编辑（复用半屏思路，这里简单用 showModal 输入）
  editNote(e) {
    const id = e.currentTarget.dataset.id;
    const old = storage.getNote(id);
    wx.showModal({
      title: '我的思考',
      editable: true,
      placeholderText: '写下你的想法…',
      content: old,
      success: (r) => {
        if (r.confirm) {
          storage.saveNote(id, r.content || '');
          storage.syncHistoryNote(id, r.content || '');
          this.load();
        }
      },
    });
  },

  // 清除全部数据：二次确认 → 清空收藏/笔记/历史 → 刷新列表
  onResetAll() {
    wx.showModal({
      title: '清除全部数据',
      content: '将清空所有收藏、笔记与抽卡历史，且无法恢复。确定继续？',
      confirmText: '清除',
      confirmColor: '#e64340',
      success: (r) => {
        if (r.confirm) {
          storage.resetAll();
          this.load(); // 重新读取 storage，列表将变为空
          wx.showToast({ title: '已清除全部数据', icon: 'success' });
        }
      },
    });
  },
});
