/* =========================================================
 * hands.js — 基于 MediaPipe Hands 的手势识别
 * 把 21 个关键点解析为力场控制状态 ctrl。
 * 导出 window.HandTracker
 * ========================================================= */
class HandTracker {
  constructor(base) {
    this.base = base || 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
    this.hands = null;
    this.ready = false;
    this.latest = [];          // 最新一帧的多手关键点
    this.baseD = null;         // 双手基准间距（拉伸基准）
    this.prevPalm = null;      // 上一帧掌心位置（计算速度）
    this.video = null;
    this._sending = false;
    this.lastErr = null;       // 最近一次 send 的错误（用于调试）
    // 离屏画布：把视频帧画到画布再喂给 MediaPipe，避免直接喂 video 在某些环境下读不到帧
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640; this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d');
  }

  init() {
    return new Promise((resolve, reject) => {
      if (typeof Hands === 'undefined') { reject(new Error('Hands undefined')); return; }
      try {
        const h = new Hands({
          locateFile: (f) => this.base + '/' + f
        });
        h.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        h.onResults((r) => { this.latest = r.multiHandLandmarks || []; });
        this.hands = h;
        this.ready = true;
        resolve();
      } catch (e) { reject(e); }
    });
  }

  start(video) {
    this.video = video;
    this._loop();
  }

  _loop() {
    if (this.video && this.ready && this.video.readyState >= 2 && !this._sending) {
      this._sending = true;
      try { this.ctx.drawImage(this.video, 0, 0, 640, 480); } catch (e) { /* 视频帧未就绪，跳过本帧 */ }
      Promise.race([
        this.hands.send({ image: this.canvas }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('send-timeout')), 6000))
      ])
        .then(() => { this._sending = false; this.lastErr = null; })
        .catch((e) => { this._sending = false; this.lastErr = (e && e.message) ? e.message : ('' + e); console.warn('[GestureForge] hands.send error:', this.lastErr); });
    }
    requestAnimationFrame(() => this._loop());
  }

  /* 把当前关键点解析为 ctrl（力场状态） */
  interpret(W, H, mirror) {
    const lms = this.latest || [];
    if (lms.length === 0) {
      this.baseD = null; this.prevPalm = null;
      return { mode: 'idle', active: false, cx: 0, cy: 0, pvx: 0, pvy: 0, sx: 1, sy: 1 };
    }

    const toC = (p) => {
      let xx = p.x; if (mirror) xx = 1 - xx;
      return { x: xx * W, y: p.y * H };
    };

    // 双手 -> 整体拉伸
    if (lms.length >= 2) {
      const a = palm(lms[0]), b = palm(lms[1]);
      const ca = toC(a), cb = toC(b);
      const d = Math.hypot(ca.x - cb.x, ca.y - cb.y);
      if (!this.baseD) this.baseD = d;
      const base = this.baseD || d || 1;
      const scale = Math.max(0.4, Math.min(3.2, d / base));
      return {
        mode: 'stretch', active: true,
        cx: (ca.x + cb.x) / 2, cy: (ca.y + cb.y) / 2,
        pvx: 0, pvy: 0,
        sx: scale, sy: 1 / Math.sqrt(scale)
      };
    }

    // 单手
    const lm = lms[0];
    const pc = palm(lm);
    const c = toC(pc);
    const ec = extCount(lm);
    const pinch = pinchDist(lm) < 0.07;

    let mode;
    if (pinch) mode = 'stir';
    else if (ec >= 3) mode = 'repulse';
    else if (ec <= 1) mode = 'attract';
    else mode = 'repulse';

    let pv = { x: 0, y: 0 };
    if (this.prevPalm) {
      pv.x = c.x - this.prevPalm.x;
      pv.y = c.y - this.prevPalm.y;
    }
    this.prevPalm = c;

    return { mode, active: true, cx: c.x, cy: c.y, pvx: pv.x, pvy: pv.y, sx: 1, sy: 1 };
  }
}

/* ---- 几何辅助 ---- */
function palm(lm) {
  let sx = 0, sy = 0;
  const ids = [0, 5, 9, 13, 17];
  for (const i of ids) { sx += lm[i].x; sy += lm[i].y; }
  return { x: sx / ids.length, y: sy / ids.length };
}
function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function extCount(lm) {
  const w = lm[0];
  let n = 0;
  const tips = [8, 12, 16, 20], pips = [6, 10, 14, 18];
  for (let i = 0; i < 4; i++) {
    if (dist(lm[tips[i]], w) > dist(lm[pips[i]], w) * 1.08) n++;
  }
  return n;
}
function pinchDist(lm) { return dist(lm[4], lm[8]); }

window.HandTracker = HandTracker;
