// components/drum-carousel/drum-carousel.js
// 滚筒式 3D 卡牌轮播：整体倾斜、自动缓慢绕中轴旋转 + 手指跟手拖拽滚动、松手吸附到最近一张、点按切换。
// 仅负责"转"与"选"，放大详情由父页面（pages/index）接管。
// 自动旋转：setInterval(50ms) 每帧 -0.25°（≈每秒 5°，约 72 秒一圈）；拖拽中暂停、松手缓冲 1.5s 后恢复。
// 箔层：_init 时按每张 card.rarity 解析 foilLayers（程序化 SVG 纹理，见 data/rarity.js）。
const { RARITY_CONFIG, buildFoilLayers } = require('../../data/rarity.js');

Component({
  properties: {
    cards: { type: Array, value: [] },
    running: {
      type: Boolean,
      value: true,
      observer(val) {
        // 兼容旧的 running 属性：现在不再自动转，仅保留接口避免父页报错
        if (val) this._start();
        else this._stop();
      },
    },
  },
  data: {
    angle: 0,
    current: 0,
    step: 120,
    radius: 320,
    drumStyle: 'rotateX(-14deg) rotateY(0deg)',
    cardsView: [],   // [{ card, step, index }]
    dragging: false,
  },
  lifetimes: {
    attached() { this._init(); },
    detached() { this._stop(); },
  },
  pageLifetimes: {
    show() { if (this.data.running) this._start(); },
    hide() { this._stop(); },
  },
  methods: {
    _init() {
      const cards = this.data.cards || [];
      const n = cards.length;
      const step = n > 0 ? 360 / n : 120;
      // 半径随张数微调，保证倾斜滚筒里卡片不挤、不散
      const radius = n >= 3 ? 330 : (n === 2 ? 280 : 300);
      const cardsView = cards.map((card, i) => {
        const rarity = (card && card.rarity) || 'holo';
        const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.holo;
        return {
          card,
          step: i * step,
          index: i,
          foilLayers: buildFoilLayers(rarity),
          clipClass: 'clip-' + (cfg.clip || 'full'),
        };
      });
      this.setData({ cardsView, step, radius }, () => {
        this._render();
        if (this.data.running) this._start();
      });
    },

    _render() {
      const a = this.data.angle;
      const step = this.data.step || 120;
      const n = this.data.cardsView.length;
      let current = 0;
      if (step > 0 && n > 0) {
        current = ((Math.round(-a / step) % n) + n) % n;
      }
      this.setData({
        drumStyle: `rotateX(-14deg) rotateY(${a.toFixed(2)}deg)`,
        current,
      });
    },

    // 自动缓慢旋转：50ms 一帧、每帧 -0.25°（≈每秒 5°，约 72 秒一圈）。
    // 拖拽中（dragging）或松手缓冲期（_resumeAt 之前）跳过，不打断用户操作。
    _start() {
      if (this._spinTimer) return;
      this._resumeAt = 0;
      this._spinTimer = setInterval(() => {
        if (this.data.dragging) return;
        if (Date.now() < (this._resumeAt || 0)) return;
        this.data.angle -= 0.25;
        this._render();
      }, 50);
    },
    _stop() {
      if (this._spinTimer) { clearInterval(this._spinTimer); this._spinTimer = null; }
    },

    // 父页面在聚焦某卡牌时调用（兼容保留）
    pause() { this._stop(); },
    // 返回滚筒时调用（兼容保留）
    resume() { this._start(); },

    onCardTap(e) {
      const idx = e.currentTarget.dataset.index;
      this.triggerEvent('select', { index: idx });
    },

    // 手指跟手拖拽：记录起点，move 时按系数累加 angle，松手吸附到最近的 step
    onTouchStart(e) {
      const t = e.touches[0];
      this._lastX = t.clientX;
      this._lastY = t.clientY;
      this.setData({ dragging: true });
    },
    onTouchMove(e) {
      const t = e.touches[0];
      if (this._lastX === undefined) { this._lastX = t.clientX; return; }
      const dx = t.clientX - this._lastX;
      this._lastX = t.clientX;
      // 跟手系数：0.3 让横向滑动自然映射到滚筒角度
      const k = 0.3;
      this.data.angle += dx * k;
      this._render();
    },
    onTouchEnd(e) {
      this.setData({ dragging: false });
      // 吸附到最近的 step（松手后 .drum 的 transition 提供平滑回弹动画）
      const step = this.data.step || 120;
      this.data.angle = Math.round(this.data.angle / step) * step;
      this._render();
      this._lastX = undefined;
      // 缓冲 1.5s 再恢复自动旋转，给用户端详当前卡的时间
      this._resumeAt = Date.now() + 1500;
    },
  },
});
