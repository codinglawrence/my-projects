/* =========================================================
 * particles.js — 粒子系统
 * 将图片按网格采样为海量粒子，受 ctrl（力场状态）驱动。
 * 物理参数通过 ps.cfg 注入（由 main.js 设置）。
 * ========================================================= */
class ParticleSystem {
  constructor() {
    this.count = 0;
    this.ox = null; this.oy = null;     // 原始目标位置
    this.x = null; this.y = null;       // 当前位置
    this.vx = null; this.vy = null;     // 速度
    this.phase = null;                  // 呼吸相位
    this.color = null;                  // 颜色字符串数组
    this.cx0 = 0; this.cy0 = 0;         // 图像中心（拉伸基准）
    this.cfg = null;
  }

  /* 从源图构建粒子网格
   * src: 离屏 canvas（640x480）
   * W,H: 主画布尺寸
   * cols,rows: 网格分辨率
   * keep: 是否保留现有粒子位置（用于切换图片/窗口缩放时平滑过渡）
   */
  build(src, W, H, cols, rows, keep) {
    const boxW = W * 0.6, boxH = H * 0.6;
    const scale = Math.min(boxW / src.width, boxH / src.height);
    const dispW = src.width * scale, dispH = src.height * scale;
    const dx = (W - dispW) / 2, dy = (H - dispH) / 2;

    // 采样到网格分辨率
    const sc = document.createElement('canvas');
    sc.width = cols; sc.height = rows;
    const sctx = sc.getContext('2d');
    sctx.drawImage(src, 0, 0, cols, rows);
    const data = sctx.getImageData(0, 0, cols, rows).data;

    const count = cols * rows;
    const ox = new Float32Array(count);
    const oy = new Float32Array(count);
    const color = new Array(count);
    const cw = dispW / cols, ch = dispH / rows;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = (r * cols + c) * 4;
        const red = data[p], gr = data[p + 1], bl = data[p + 2];
        ox[idx] = dx + (c + 0.5) * cw;
        oy[idx] = dy + (r + 0.5) * ch;
        color[idx] = 'rgb(' + red + ',' + gr + ',' + bl + ')';
        idx++;
      }
    }

    let x, y, vx, vy, phase;
    if (keep && this.count === count && this.x) {
      // 复用现有位置，让粒子飞向新目标
      x = this.x; y = this.y; vx = this.vx; vy = this.vy; phase = this.phase;
    } else {
      x = new Float32Array(count);
      y = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);
      phase = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        x[i] = ox[i]; y[i] = oy[i];
        phase[i] = Math.random() * 6.28;
      }
    }

    this.ox = ox; this.oy = oy;
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.phase = phase;
    this.color = color;
    this.count = count;
    this.cx0 = W / 2; this.cy0 = H / 2;
  }

  /* 每帧更新：根据 ctrl 计算力场并积分
   * ctrl = { mode, active, cx, cy, pvx, pvy, sx, sy }
   * mode: idle | repulse | attract | stir | stretch
   */
  update(ctrl, t) {
    const C = this.cfg;
    if (!C) return;
    const x = this.x, y = this.y, vx = this.vx, vy = this.vy;
    const ox = this.ox, oy = this.oy, ph = this.phase;
    const cx0 = this.cx0, cy0 = this.cy0;
    const n = this.count;

    const mode = ctrl.mode, active = ctrl.active;
    const ccx = ctrl.cx, ccy = ctrl.cy;
    const sx = ctrl.sx, sy = ctrl.sy;
    const pvx = ctrl.pvx, pvy = ctrl.pvy;

    for (let i = 0; i < n; i++) {
      let tx = ox[i], ty = oy[i];

      if (mode === 'stretch') {
        tx = cx0 + (ox[i] - cx0) * sx;
        ty = cy0 + (oy[i] - cy0) * sy;
      }

      let k = C.SPRING;
      let fx = 0, fy = 0;

      if (active) {
        const dxp = x[i] - ccx, dyp = y[i] - ccy;
        const d2 = dxp * dxp + dyp * dyp;
        const R = (mode === 'stir') ? C.R_STIR : C.R_REPULSE;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) + 0.001;
          const fo = 1 - d / R;            // 0(边缘)->1(中心)
          if (mode === 'repulse') {
            k = C.SPRING * (1 - 0.9 * fo);  // 掌心附近弹簧减弱，粒子被推开融化
            fx = (dxp / d) * C.F_REPULSE * fo;
            fy = (dyp / d) * C.F_REPULSE * fo;
          } else if (mode === 'attract') {
            k = C.SPRING + 0.07 * fo;       // 强化回吸，重组清晰原图
            fx = -(dxp / d) * C.F_ATTRACT * fo;
            fy = -(dyp / d) * C.F_ATTRACT * fo;
          } else if (mode === 'stir') {
            k = C.SPRING * (1 - 0.5 * fo);  // 漩涡 + 跟随拖动
            fx = (-dyp / d) * C.F_STIR * fo + pvx * C.FOLLOW * fo;
            fy = (dxp / d) * C.F_STIR * fo + pvy * C.FOLLOW * fo;
          }
        }
      }

      if (mode === 'idle') {
        const b = Math.sin(t * 0.0012 + ph[i]) * C.BREATHE;
        tx += b; ty += b * 0.7;
      }

      const ax = (tx - x[i]) * k + fx;
      const ay = (ty - y[i]) * k + fy;
      const nvx = (vx[i] + ax) * C.DAMP;
      const nvy = (vy[i] + ay) * C.DAMP;
      vx[i] = nvx; vy[i] = nvy;
      x[i] = x[i] + nvx;
      y[i] = y[i] + nvy;
    }
  }
}

window.ParticleSystem = ParticleSystem;
