/* =========================================================
 * main.js — 主控：画布 / 输入 / 摄像头 / 渲染循环 / UI
 * ========================================================= */
(function () {
  'use strict';

  const stage = document.getElementById('stage');
  const ctx = stage.getContext('2d', { alpha: false });
  const camCanvas = document.getElementById('cam');
  const camCtx = camCanvas.getContext('2d');

  let W = 0, H = 0;
  const COLS = 100, ROWS = 75;     // 粒子网格（4:3）
  const PARTICLE_SIZE = 2;
  let enableBloom = true;

  // 物理参数（注入粒子系统）
  const CFG = {
    SPRING: 0.020, DAMP: 0.85,
    R_REPULSE: 190, F_REPULSE: 2.9,
    F_ATTRACT: 2.4,
    R_STIR: 170, F_STIR: 3.6, FOLLOW: 0.15,
    BREATHE: 5
  };

  // 力场控制状态
  let ctrl = { mode: 'idle', active: false, cx: 0, cy: 0, pvx: 0, pvy: 0, sx: 1, sy: 1 };

  // 运行模式
  let cameraOn = false, mouseMode = false, mirror = true;
  let mpBase = null;   // 动态解析出的 MediaPipe CDN 基址
  let currentImage = 0, mouseDown = false, lastMove = 0;

  const images = [];
  const ps = new ParticleSystem();
  ps.cfg = CFG;
  let tracker = null;

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;

  // DOM
  const elStatus = document.getElementById('status');
  const elFps = document.getElementById('fps');
  const elOverlay = document.getElementById('overlay');
  const elOverlayMsg = document.getElementById('overlay-msg');
  const elSkip = document.getElementById('skip');
  const elPreviews = document.getElementById('previews');
  const elToast = document.getElementById('toast');
  const elDebug = document.getElementById('debug');

  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------- 构建 / 尺寸 ---------- */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    stage.width = W; stage.height = H;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);
    ps.build(images[currentImage], W, H, COLS, ROWS, ps.count === COLS * ROWS);
  }

  function buildPreviews() {
    images.forEach((img, i) => {
      const cv = document.createElement('canvas');
      cv.width = 84; cv.height = 63; cv.className = 'thumb';
      cv.getContext('2d').drawImage(img, 0, 0, 84, 63);
      cv.addEventListener('click', () => switchImage(i));
      elPreviews.appendChild(cv);
    });
    updatePreviewActive();
  }
  function updatePreviewActive() {
    Array.prototype.forEach.call(elPreviews.children, (c, i) => c.classList.toggle('active', i === currentImage));
  }
  function switchImage(i) {
    if (i === currentImage) return;
    currentImage = i;
    ps.build(images[i], W, H, COLS, ROWS, true);
    updatePreviewActive();
  }

  /* ---------- 状态文案 ---------- */
  function statusText() {
    if (cameraOn) {
      switch (ctrl.mode) {
        case 'repulse': return '✋ 手掌张开 · 融解';
        case 'attract': return '✊ 握拳 · 回吸重组';
        case 'stir': return '🤏 捏合搅动 · 局部漩涡';
        case 'stretch': return '🤲 双手拉开 · 整体拉伸';
        default: return '○ 未检测到手 · 待机';
      }
    }
    if (mouseMode) {
      if (mouseDown) return '🖱 鼠标拖动 · 搅动';
      if (ctrl.active) return '🖱 鼠标移动 · 融解';
      return '○ 鼠标待机 · 呼吸';
    }
    return '○ 待机';
  }

  let lastUI = 0;
  function updateUI() {
    elStatus.textContent = statusText();
    elFps.textContent = 'FPS ' + Math.round(fps);
    elStatus.className = (cameraOn || mouseMode) ? ('s-' + ctrl.mode) : 's-idle';
  }

  function toast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    clearTimeout(elToast._t);
    elToast._t = setTimeout(() => elToast.classList.remove('show'), 2200);
  }

  /* ---------- 手势库动态加载（多 CDN 容错，国内可用） ---------- */
  const MP_VERSION = '0.4.1675469240';
  // 加载顺序：本地 vendor（同源、零 CORS、国内/离线可用）→ jsdelivr → npmmirror(国内) → unpkg
  const MP_SOURCES = [
    'js/vendor/hands',
    'https://cdn.jsdelivr.net/npm/@mediapipe/hands@' + MP_VERSION,
    'https://registry.npmmirror.com/@mediapipe/hands/' + MP_VERSION + '/files',
    'https://unpkg.com/@mediapipe/hands@' + MP_VERSION
  ];
  function loadScriptSrc(src, timeout) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + '/hands.js';
      const to = setTimeout(() => { clearTimeout(to); reject(new Error('timeout')); s.remove(); }, timeout || 6000);
      s.onload = () => {
        setTimeout(() => {
          if (window.Hands) { clearTimeout(to); resolve(src); }
          else reject(new Error('no Hands'));
          s.remove();
        }, 60);
      };
      s.onerror = () => { clearTimeout(to); reject(new Error('error')); s.remove(); };
      document.head.appendChild(s);
    });
  }
  async function loadHands() {
    for (const base of MP_SOURCES) {
      try { const ok = await loadScriptSrc(base, 6000); return ok; }
      catch (e) { /* 尝试下一个 CDN */ }
    }
    return null;
  }

  /* ---------- 摄像头 ---------- */
  function showOverlay(msg) { elOverlayMsg.textContent = msg || '请求权限中…'; elOverlay.classList.add('show'); }
  function hideOverlay() { elOverlay.classList.remove('show'); }
  function setCamBtn(on) { document.getElementById('btn-cam').classList.toggle('on', on); }

  function attachVideo() {
    if (video.parentNode) return;
    video.style.cssText = 'position:absolute;left:-20px;top:-20px;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(video);
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      failCamera('本环境不支持摄像头 API（请用 http://localhost 或 https 打开，不要用 file:// 直接双击）');
      return;
    }
    try {
      showOverlay('正在加载手势识别库…\n（若长时间无反应，可能是网络拦截了 CDN）');
      const base = await loadHands();
      if (!base) {
        failCamera('手势识别库加载失败：所有 CDN 均不可达（国内常因 jsdelivr 被墙）。可换网络后点 CAM 重试，或先用鼠标模式');
        return;
      }
      mpBase = base;

      showOverlay('请在浏览器弹窗中点击「允许」以启用摄像头…');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      video.srcObject = stream;
      await new Promise((res) => {
        if (video.readyState >= 2) return res();
        video.onloadeddata = res;
        setTimeout(res, 4000);
      });
      await video.play();
      attachVideo();

      cameraOn = true; mouseMode = false;
      tracker = new HandTracker(mpBase);
      try {
        await Promise.race([
          tracker.init(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('模型加载超时（可能网络慢或 CDN 被拦截）')), 12000))
        ]);
      } catch (e) {
        failCamera('手势模型初始化失败：' + (e && e.message ? e.message : e));
        return;
      }
      tracker.start(video);
      hideOverlay();
      setCamBtn(true);
      toast('摄像头已开启 · 手势模式');
    } catch (e) {
      let msg = '摄像头开启失败';
      if (e && e.name === 'NotAllowedError') msg = '摄像头权限被拒绝 — 点地址栏左侧摄像头图标选「允许」，再点 CAM 重试';
      else if (e && e.name === 'NotFoundError') msg = '未检测到摄像头设备';
      else if (e && e.name === 'NotReadableError') msg = '摄像头被其他程序占用，请关闭后重试';
      else if (e && e.message) msg = e.message;
      failCamera(msg);
    }
  }

  function stopCamera() {
    cameraOn = false;
    if (video.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null; }
    ctrl = { mode: 'idle', active: false, cx: 0, cy: 0, pvx: 0, pvy: 0, sx: 1, sy: 1 };
  }

  // 摄像头不可用 / 用户跳过：明确提示原因，并切到鼠标模式（非阻塞，不卡界面）
  function failCamera(reason) {
    stopCamera();
    mouseMode = true; mouseDown = false;
    hideOverlay();
    setCamBtn(false);
    elStatus.textContent = '⚠ 摄像头不可用 · 鼠标模式';
    elStatus.className = 's-idle';
    toast('摄像头不可用：' + reason);
    console.warn('[GestureForge] camera unavailable:', reason);
  }

  function drawCam() {
    if (!cameraOn) { camCtx.clearRect(0, 0, camCanvas.width, camCanvas.height); return; }
    if (video.readyState < 2) return;
    const cw = camCanvas.width, ch = camCanvas.height;
    camCtx.clearRect(0, 0, cw, ch);
    camCtx.save();
    if (mirror) { camCtx.translate(cw, 0); camCtx.scale(-1, 1); }
    camCtx.drawImage(video, 0, 0, cw, ch);
    camCtx.restore();
    if (tracker && tracker.latest) {
      camCtx.fillStyle = '#5fe3c8';
      for (const lm of tracker.latest) {
        for (const p of lm) {
          const px = (mirror ? (1 - p.x) : p.x) * cw;
          const py = p.y * ch;
          camCtx.fillRect(px - 1.5, py - 1.5, 3, 3);
        }
      }
    }
  }

  /* ---------- 输入 ---------- */
  function wireUI() {
    document.getElementById('btn-cam').addEventListener('click', () => {
      if (cameraOn) { stopCamera(); mouseMode = true; setCamBtn(false); toast('摄像头已关闭 · 鼠标模式'); }
      else { showOverlay('正在启动摄像头…'); startCamera(); }
    });
    document.getElementById('btn-mirror').addEventListener('click', (e) => {
      mirror = !mirror;
      e.currentTarget.classList.toggle('on', mirror);
      toast('镜像 ' + (mirror ? '开' : '关'));
    });
    document.getElementById('btn-switch').addEventListener('click', () => {
      switchImage(currentImage === 0 ? 1 : 0);
    });
    elSkip.addEventListener('click', () => failCamera('用户跳过，已切换鼠标模式'));

    window.addEventListener('keydown', (e) => {
      if (e.key === '1') switchImage(0);
      else if (e.key === '2') switchImage(1);
      else if (e.key === 'b' || e.key === 'B') { enableBloom = !enableBloom; toast('辉光 ' + (enableBloom ? '开' : '关')); }
    });

    // 鼠标（鼠标交互模式）
    stage.addEventListener('mousemove', (e) => {
      if (cameraOn) return;
      const r = stage.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      lastMove = performance.now();
      if (mouseDown) {
        ctrl.mode = 'stir'; ctrl.active = true;
        ctrl.pvx = mx - ctrl.cx; ctrl.pvy = my - ctrl.cy;
      } else {
        ctrl.mode = 'repulse'; ctrl.active = true; ctrl.pvx = 0; ctrl.pvy = 0;
      }
      ctrl.cx = mx; ctrl.cy = my;
    });
    stage.addEventListener('mousedown', (e) => {
      if (cameraOn) return;
      mouseDown = true;
      const r = stage.getBoundingClientRect();
      ctrl.cx = e.clientX - r.left; ctrl.cy = e.clientY - r.top;
    });
    window.addEventListener('mouseup', () => { mouseDown = false; });
    stage.addEventListener('mouseleave', () => { if (!cameraOn) { ctrl.active = false; ctrl.mode = 'idle'; } });

    // 触摸（鼠标交互模式降级）
    stage.addEventListener('touchmove', (e) => {
      if (cameraOn) return;
      e.preventDefault();
      const t = e.touches[0]; const r = stage.getBoundingClientRect();
      const mx = t.clientX - r.left, my = t.clientY - r.top;
      lastMove = performance.now();
      ctrl.mode = 'stir'; ctrl.active = true;
      ctrl.pvx = mx - ctrl.cx; ctrl.pvy = my - ctrl.cy; ctrl.cx = mx; ctrl.cy = my;
    }, { passive: false });
    stage.addEventListener('touchstart', (e) => {
      if (cameraOn) return;
      const t = e.touches[0]; const r = stage.getBoundingClientRect();
      ctrl.cx = t.clientX - r.left; ctrl.cy = t.clientY - r.top; ctrl.active = true; lastMove = performance.now();
    });
    stage.addEventListener('touchend', () => { if (!cameraOn) { ctrl.active = false; ctrl.mode = 'idle'; } });
  }

  /* ---------- 主循环 ---------- */
  let lastT = performance.now(), fps = 60;
  function loop(now) {
    const dt = now - lastT; lastT = now;
    if (dt > 0) fps = fps * 0.92 + (1000 / dt) * 0.08;

    // 更新控制状态
    if (cameraOn && tracker) {
      ctrl = tracker.interpret(W, H, mirror);
    } else if (mouseMode) {
      if (!mouseDown && performance.now() - lastMove > 700) { ctrl.mode = 'idle'; ctrl.active = false; }
    } else {
      ctrl.mode = 'idle'; ctrl.active = false;
    }

    // 搅动速度衰减（避免陈旧速度叠加）
    ctrl.pvx *= 0.85; ctrl.pvy *= 0.85;

    ps.update(ctrl, now);

    // 拖尾淡出（运动模糊 / 呼吸感）
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(7,9,14,0.30)';
    ctx.fillRect(0, 0, W, H);

    // 绘制粒子
    const x = ps.x, y = ps.y, col = ps.color;
    for (let i = 0; i < ps.count; i++) {
      ctx.fillStyle = col[i];
      ctx.fillRect(x[i] | 0, y[i] | 0, PARTICLE_SIZE, PARTICLE_SIZE);
    }

    // 辉光（bloom）
    if (enableBloom) {
      try {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4;
        ctx.filter = 'blur(6px)';
        ctx.drawImage(stage, 0, 0, W, H);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      } catch (e) { /* 不支持 filter 时静默降级 */ }
    }

    drawCam();

    if (now - lastUI > 120) {
      updateUI();
      const hh = tracker ? tracker.latest.length : 0;
      const err = tracker ? (tracker.lastErr || '-') : '-';
      const mp = mpBase ? (mpBase.indexOf('/') >= 0 ? mpBase.split('/').pop() : mpBase) : '-';
      elDebug.textContent = 'MODE  ' + ctrl.mode + '\nHANDS ' + hh + '\nERR   ' + err + '\nMP    ' + mp + '\nFPS   ' + Math.round(fps);
      lastUI = now;
    }

    requestAnimationFrame(loop);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    images[0] = window.ForgeImages.A();
    images[1] = window.ForgeImages.B();
    buildPreviews();
    resize();
    window.addEventListener('resize', debounce(resize, 200));
    wireUI();
    document.getElementById('btn-mirror').classList.toggle('on', mirror);
    setCamBtn(false);
    requestAnimationFrame(loop);

    showOverlay('请求权限中…');
    if (!window.isSecureContext) {
      elOverlayMsg.textContent = '当前非 localhost/https 环境，自动切换鼠标模式';
      setTimeout(() => failCamera('当前非 localhost/https 环境，摄像头不可用'), 1200);
    } else {
      startCamera();
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('DOMContentLoaded', init);
})();
