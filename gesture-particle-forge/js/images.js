/* =========================================================
 * images.js — 程序化生成两张「AI 风格」示例图（无需外部文件）
 * 导出 window.ForgeImages = { A, B }
 * 两张图均为 4:3（640x480），保证粒子网格一致、切换平滑
 * ========================================================= */
(function () {
  'use strict';

  // 图 A：极光星云
  function makeNebula() {
    const w = 640, h = 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');

    x.fillStyle = '#05060a';
    x.fillRect(0, 0, w, h);

    // 星云团
    const blobs = [
      [180, 160, '59,47,143', 260],
      [440, 300, '15,111,143', 300],
      [300, 360, '122,47,143', 240],
      [470, 150, '47,143,111', 220],
    ];
    x.globalCompositeOperation = 'lighter';
    for (const [bx, by, col, r] of blobs) {
      const g = x.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, 'rgba(' + col + ',0.9)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill();
    }

    // 明亮核心
    const cg = x.createRadialGradient(320, 240, 0, 320, 240, 130);
    cg.addColorStop(0, 'rgba(255,240,210,0.85)');
    cg.addColorStop(1, 'rgba(255,240,210,0)');
    x.fillStyle = cg;
    x.beginPath(); x.arc(320, 240, 130, 0, Math.PI * 2); x.fill();

    // 星点
    x.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 460; i++) {
      const sx = Math.random() * w, sy = Math.random() * h;
      const s = Math.random() * 1.6 + 0.2;
      x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.8 + 0.2) + ')';
      x.fillRect(sx, sy, s, s);
    }
    return c;
  }

  // 图 B：色流光谱
  function makeChromatic() {
    const w = 640, h = 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');

    // 底色
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0a0f1f');
    g.addColorStop(0.5, '#241033');
    g.addColorStop(1, '#03202a');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    // 流动曲线
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const hue = (i * 24) % 360;
      x.strokeStyle = 'hsla(' + hue + ',80%,62%,0.5)';
      x.lineWidth = Math.random() * 9 + 3;
      x.beginPath();
      const y0 = Math.random() * h;
      x.moveTo(0, y0);
      for (let xx = 0; xx <= w; xx += 36) {
        x.lineTo(xx, y0 + Math.sin(xx * 0.011 + i) * 62 + Math.cos(xx * 0.005 + i * 2) * 42);
      }
      x.stroke();
    }

    // 光球
    for (let i = 0; i < 9; i++) {
      const bx = Math.random() * w, by = Math.random() * h, r = Math.random() * 120 + 60;
      const col = 'hsl(' + ((i * 40) % 360) + ',85%,60%)';
      const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg;
      x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill();
    }

    x.globalCompositeOperation = 'source-over';
    return c;
  }

  window.ForgeImages = { A: makeNebula, B: makeChromatic };
})();
