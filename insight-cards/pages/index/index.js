// pages/index/index.js
const app = getApp();
const storage = require('../../utils/storage.js');
const { DrawDeck } = require('../../utils/draw.js');

let deck = null;
let cardsById = {};

Page({
  data: {
    hand: [],        // 所有已抽出的卡牌，顶部 strip 展示
    isDrawing: false,
    remaining: 52,
    showOverlay: false,
    closing: false,

    // —— 抽卡遮罩状态机 ——
    // overlayMode: 'single'（单抽放大） | 'drum'（滚筒轮播） | 'focus'（从滚筒点入的放大）
    overlayMode: 'single',
    fromDrum: false,        // 当前 focus 是否来自滚筒（决定空白点返回哪里）
    drumRunning: false,     // 滚筒是否在转
    drumCards: [],          // 本次抽取的卡牌（card 对象数组），供滚筒渲染
    drumStart: 0,           // 这批卡牌在 hand 中的起始下标
    focusIndex: -1,         // 当前放大卡牌在 hand 中的下标
    focusCard: null,        // 当前放大卡牌（= hand[focusIndex]）

    showNote: false,
    noteText: '',
    noteIndex: -1,

    dealPaused: false,   // 抽卡 720° 登场期间置 true，暂停 flip-card 重力倾斜
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '照见卡牌' });
    cardsById = {};
    app.globalData.cards.forEach((c) => { cardsById[c.id] = c; });
    if (!app.globalData.deck) {
      app.globalData.deck = new DrawDeck(app.globalData.cards);
    }
    deck = app.globalData.deck;
    this.setData({ remaining: deck.remaining() });
  },

  drawSingle() { this.draw(1); },
  drawTriple() { this.draw(3); },

  resetDeck() {
    if (this.data.isDrawing) return;
    wx.showModal({
      title: '换一副新牌',
      content: '当前牌堆会重新洗牌，适合和不同的人开启新一轮抽卡。',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        deck.reset();
        this.setData({
          hand: [], showOverlay: false,
          overlayMode: 'single', fromDrum: false, drumRunning: false,
          drumCards: [], drumStart: 0, focusIndex: -1, focusCard: null,
          remaining: deck.remaining(),
        });
        wx.showToast({ title: '已换新牌', icon: 'success' });
      },
    });
  },

  draw(count) {
    if (this.data.isDrawing || this.data.showOverlay) return;
    this.setData({ isDrawing: true });
    // 洗牌动效约 500ms 后发牌
    setTimeout(() => {
      const ids = deck.drawMany(count);
      const newItems = ids.map((id) => {
        const card = cardsById[id];
        return { card, flipped: false, favorited: storage.isFavorite(id) };
      });
      const start = this.data.hand.length;
      const hand = this.data.hand.concat(newItems);

      if (count === 1) {
        // 单抽：直接放大这一张
        this.setData({
          hand,
          isDrawing: false,
          remaining: deck.remaining(),
          overlayMode: 'single',
          fromDrum: false,
          drumRunning: false,
          drumStart: start,
          focusIndex: start,
          focusCard: newItems[0],
          showOverlay: true,
          closing: false,
          dealPaused: true,
        });
        this._startDealIn();
      } else {
        // 连抽：进入滚筒轮播
        this.setData({
          hand,
          isDrawing: false,
          remaining: deck.remaining(),
          overlayMode: 'drum',
          fromDrum: false,
          drumRunning: true,
          drumStart: start,
          drumCards: newItems.map((i) => i.card),
          focusIndex: -1,
          focusCard: null,
          showOverlay: true,
          closing: false,
        });
      }
    }, 500);
  },

  // 遮罩空白处：按模式返回
  onOverlayBlank() {
    const { overlayMode, fromDrum } = this.data;
    if (overlayMode === 'drum') {
      this._closeOverlay();           // 滚筒 → 主界面
    } else if (overlayMode === 'focus' && fromDrum) {
      this.setData({ overlayMode: 'drum', drumRunning: true });  // 聚焦 → 滚筒
    } else {
      this._closeOverlay();           // 单抽 / 聚焦(非滚筒) → 主界面
    }
  },

  _closeOverlay() {
    if (this.data.closing) return;
    this.setData({ closing: true });
    setTimeout(() => {
      this.setData({
        showOverlay: false,
        closing: false,
        drumRunning: false,
        focusCard: null,
        focusIndex: -1,
      });
    }, 250);
  },

  // 从滚筒点选某张 → 放大聚焦并停止旋转
  onDrumSelect(e) {
    const idx = e.detail.index;            // 在 drumCards 中的下标
    const focusIndex = this.data.drumStart + idx;
    this.setData({
      overlayMode: 'focus',
      fromDrum: true,
      drumRunning: false,
      focusIndex,
      focusCard: this.data.hand[focusIndex],
      dealPaused: true,
    });
    this._startDealIn();
  },

  // 点击顶部已抽卡带 → 放大该张（单张聚焦）
  onStripTap(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      overlayMode: 'focus',
      fromDrum: false,
      drumRunning: false,
      focusIndex: idx,
      focusCard: this.data.hand[idx],
      showOverlay: true,
      closing: false,
      dealPaused: true,
    });
    this._startDealIn();
  },

  // 抽卡 720° 登场动画期间：暂停 flip-card 重力倾斜，避免干扰双圈翻转定格
  _startDealIn() {
    if (this._dealTimer) clearTimeout(this._dealTimer);
    this._dealTimer = setTimeout(() => this.setData({ dealPaused: false }), 1100);
  },

  onUnload() {
    if (this._dealTimer) clearTimeout(this._dealTimer);
  },

  // —— 放大卡牌的交互（翻转 / 收藏 / 笔记） ——
  onFocusToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const flipped = e.detail.flipped;
    this.setData({
      [`hand[${idx}].flipped`]: flipped,
      'focusCard.flipped': flipped,
    });
    if (flipped) {
      storage.addHistory(this.data.hand[idx].card.id);
    }
  },

  onFocusFav(e) {
    const idx = e.currentTarget.dataset.index;
    const id = this.data.hand[idx].card.id;
    const nowFav = storage.toggleFavorite(id);
    this.setData({
      [`hand[${idx}].favorited`]: nowFav,
      'focusCard.favorited': nowFav,
    });
    wx.showToast({ title: nowFav ? '已收藏' : '已取消', icon: 'none' });
  },

  onOpenNote(e) {
    const idx = e.currentTarget.dataset.index;
    const id = this.data.hand[idx].card.id;
    this.setData({ showNote: true, noteIndex: idx, noteText: storage.getNote(id) });
  },
  onNoteInput(e) { this.setData({ noteText: e.detail.value }); },
  noop() {},
  closeNote() { this.setData({ showNote: false, noteText: '', noteIndex: -1 }); },
  saveNote() {
    if (this.data.noteIndex < 0) return;
    const id = this.data.hand[this.data.noteIndex].card.id;
    storage.saveNote(id, this.data.noteText);
    storage.syncHistoryNote(id, this.data.noteText);
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({ showNote: false, noteText: '', noteIndex: -1 });
  },
});
