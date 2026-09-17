// components/flip-card/flip-card.js
// 数据驱动：直接接收 card 对象，内部渲染正反面，不依赖 slot / styleIsolation。
// 倾斜/全息：当前【由手指在卡面触摸拖动】驱动（见 onTouchStart/onTouchMove/onTouchEnd），
//   复用 _applyGyroTick 的核心映射逻辑（归一化 [-1,1] 输入）。
//
// 重力感应代码（wx.onAccelerometerChange 单例）【已禁用，保留备用】：
//   attached() 中的 startGyro() 调用已注释，默认不启动；需要恢复重力时取消注释即可。
//   模块级单例（_gyroState/_accelCb/_tickTimer/_deniedToastShown/_subs/_raw）及其所有
//   函数（ensureMotionAuth/startGyro/_startTick/_stopTick/_tick/stopGyro/_onGyroDenied/
//   _applyGyroTick）全部保留未删，仅停止使用。
//
// 本次修复要点：
//   1) iOS 权限：iOS 13+ 需 scope.motion。startGyro 前用 getSetting/authorize 申请，
//      拒绝则降级为静态 + 一次性 toast 提示（不崩溃，卡牌仍可翻转/查看）。
//   2) 幅度：±2.5° → ±30°，给出肉眼可见、但优雅的"重力感受"。
//   3) 平滑：传感器回调只更新原始值，由独立 tick（~30fps）做低通/lerp 缓动后 setData，
//      避免每帧直写导致的抖动突兀。
// 全息纹理：真实箔纹理由程序化 SVG 纹理（data/textures.js 的 getTexture）
//   经 <image src="{{dataUri}}"> 注入（见 wxml），不再内联 base64（会触发 minifyWXSS
//   编译异常 → 整页白屏），也不用 WXSS 本地背景图，更不依赖 <image> 的 mix-blend-mode。
const { RARITY_CONFIG, buildFoilLayers } = require('../../data/rarity.js');

// ---- 模块级重力单例 ----
let _gyroState = 'idle';   // 'idle' | 'requesting' | 'active' | 'denied'
let _accelCb = null;
let _tickTimer = null;
let _deniedToastShown = false; // 拒绝提示只弹一次，避免多卡附加时刷屏
const _subs = new Set();
const _raw = { x: 0, y: 0 };

// iOS 13+ 运动权限申请：cb(true)=可启动传感器，cb(false)=被拒（降级静态）。
// Android / 开发者工具无需 scope.motion，直接放行。
function ensureMotionAuth(cb) {
  let platform = 'ios'; // 默认按 iOS 处理（更严格、更安全）
  try {
    const info = wx.getSystemInfoSync() || {};
    if (info.platform) platform = info.platform;
  } catch (e) { /* 读不到就按 iOS 走授权 */ }

  if (platform !== 'ios') { cb(true); return; }

  wx.getSetting({
    success(res) {
      const auth = (res && res.authSetting) || {};
      if (auth['scope.motion'] === true) { cb(true); return; }
      if (auth['scope.motion'] === false) { cb(false); return; } // 之前已明确拒绝
      wx.authorize({
        scope: 'scope.motion',
        success() { cb(true); },
        fail() { cb(false); }, // iOS 用户拒绝
      });
    },
    fail() { cb(false); },
  });
}

function startGyro() {
  if (_gyroState === 'active' || _gyroState === 'requesting') return;
  if (_gyroState === 'denied') return;
  _gyroState = 'requesting';
  ensureMotionAuth((granted) => {
    if (!granted) {
      _gyroState = 'denied';
      if (!_deniedToastShown) {
        _deniedToastShown = true;
        wx.showToast({
          title: '请在设置中开启运动权限以体验镭射倾斜',
          icon: 'none',
          duration: 2200,
        });
      }
      _subs.forEach((comp) => { try { comp._onGyroDenied && comp._onGyroDenied(); } catch (e) {} });
      return;
    }
    _gyroState = 'active';
    _accelCb = (res) => {
      if (!res) return;
      _raw.x = (typeof res.x === 'number') ? res.x : 0;
      _raw.y = (typeof res.y === 'number') ? res.y : 0;
    };
    if (wx.startAccelerometer) {
      try { wx.startAccelerometer({ interval: 'game' }); } catch (e) {}
    }
    if (wx.onAccelerometerChange) {
      try { wx.onAccelerometerChange(_accelCb); } catch (e) {}
    }
    _startTick();
  });
}

function _startTick() {
  if (_tickTimer) return;
  _tickTimer = setInterval(_tick, 33); // ~30fps 缓动渲染
}
function _stopTick() {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }
}
function _tick() {
  _subs.forEach((comp) => {
    if (comp && typeof comp._applyGyroTick === 'function') {
      try { comp._applyGyroTick(_raw.x, _raw.y); } catch (e) { /* 单实例异常不影响其它 */ }
    }
  });
}

function stopGyro() {
  // 还有订阅者时不关闭传感器
  if (_subs.size > 0) return;
  _gyroState = 'idle';
  _stopTick();
  if (_accelCb) {
    if (wx.offAccelerometerChange) { try { wx.offAccelerometerChange(_accelCb); } catch (e) {} }
    _accelCb = null;
  }
  if (wx.stopAccelerometer) { try { wx.stopAccelerometer(); } catch (e) {} }
}

Component({
  properties: {
    card: { type: Object, value: {}, observer() { if (this._refreshFoil) this._refreshFoil(); } },
    rarity: { type: String, value: '' },  // 可直接传入；否则从 card.rarity 读
    flipped: { type: Boolean, value: false },
    favorited: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    // 父页在「抽卡 720° 登场动画」期间置 true：倾斜(rotateX/Y)归零，
    // 仅保留箔视差流动，避免重力 ±30° 干扰双圈翻转定格。动画结束由父页置回 false。
    tiltPaused: { type: Boolean, value: false },
  },
  data: {
    tiltStyle: 'rotateX(0deg) rotateY(0deg)', // 倾斜（rotateX/Y, ±30°，当前由手指触控驱动）
    fcFoilPos: '50% 50%',  // .fc-foil 紫金渐变位置（由 JS 驱动，快/灵敏）
    fcHoloShift: '0% 0%',  // 真实箔纹理 <image> 随触控平移（%）（慢/迟钝→视差）
    fcHoloOpc: '0.78',     // 纹理层整体透明度（基础值）
    foilLayers: [],        // 按 card.rarity 解析出的箔层（gradient view + texture image）
    clipClass: '',          // 箔膜裁剪范围（full=铺满 / frame=只镀四边金框）；初始''，由 _refreshFoil 写入 clip-full/clip-frame，SDK<2.11.1 时追加 no-clip-path 回退
    cssVars: '',           // 内联 CSS 变量（--mx/--my/--posx/--posy/--hyp），供新箔层增强
    dragging: false,
    idle: true,            // 触控兜底：重力已禁用，默认长亮紫金流动；手指拖动后由 tick 关掉
    clipSupported: true,   // clip-path 支持标记（SDK < 2.11.1 不支持 → false，回退无 overscan）
  },
  lifetimes: {
    attached() {
      this._st = { rx: 0, ry: 0, fx: 50, fy: 50, hx: 0, hy: 0 };
      this._touchStart = { x: 0, y: 0 };
      // 翻牌去重/防双击翻回：同一手势（touchEnd 主动翻 + 系统合成 tap 兜底）只翻一次。
      this._flipLockTs = 0;   // 上次成功翻牌的时间戳（ms）
      this._dragged = false;  // 本次手势是否发生 >阈值 位移（判定轻触/拖动）
      this._stx = 0;          // 本次手势起点 clientX
      this._sty = 0;          // 本次手势起点 clientY
      this._rect = null; // 卡面矩形缓存（clientX/Y 相对视口，与 boundingClientRect 同一坐标系）
      // 检测基础库版本是否支持 clip-path（< 2.11.1 不支持）。
      // 不支持时 .fc-layers 的 clip-path 会静默失效，回退 .flip-card.no-clip-path：
      // holo 不再 overscan，宁可牺牲视差也不溢出（见 flip-card.wxss 末尾回退规则）。
      const _sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      const _ver = (_sys.SDKVersion || '0.0.0').split('.');
      const _maj = parseInt(_ver[0] || '0', 10);
      const _min = parseInt(_ver[1] || '0', 10);
      const _pat = parseInt(_ver[2] || '0', 10);
      const _supported = _maj > 2 || (_maj === 2 && _min > 11) || (_maj === 2 && _min === 11 && _pat >= 1);
      this._noClipPath = !_supported;
      if (this._noClipPath) {
        const _cls = this.data.clipClass || '';
        this.setData({ clipClass: _cls + ' no-clip-path' });
      }
      // 缓存 .flip-card 矩形，供触控归一化计算使用；无返回值时降级为 {1,1,0,0}
      wx.createSelectorQuery().in(this).select('.flip-card').boundingClientRect((rect) => {
        if (rect && typeof rect.width === 'number' && rect.width > 0) {
          this._rect = { width: rect.width, height: rect.height, left: rect.left, top: rect.top };
        } else {
          this._rect = { width: 1, height: 1, left: 0, top: 0 };
        }
      }).exec();

      _subs.add(this);
      this._refreshFoil(); // 按 card.rarity 解析箔层（卡片挂上时即生成，避免首帧无箔）
      // 【重力已禁用，保留备用】需要恢复重力倾斜时取消下一行注释：
      // startGyro();
    },
    detached() {
      _subs.delete(this);
      stopGyro();
      if (this._returnTimer) { clearTimeout(this._returnTimer); this._returnTimer = null; }
    },
  },
  methods: {
    // 翻转核心（唯一翻牌出口）：
    //   1) 同手势去重：touchEnd 主动翻 + 系统合成 tap 兜底，靠 400ms 锁保证只翻一次，
    //      红线——防止「轻触」被 touchEnd 翻一次、随后合成 tap 再翻回（双击翻回）。
    //   2) disabled 拦截。
    //   注意：调用方（onTouchEnd 走轻触路径）调完 _flip() 后应【保留】_flipLockTs，
    //      让随后的合成 tap（catchtap）被去重跳过；decay 回正仍照常跑。
    _flip() {
      const now = Date.now();
      if (this._flipLockTs && now - this._flipLockTs < 400) return;
      this._flipLockTs = now;
      if (this.data.disabled) return;
      const next = !this.data.flipped;
      this.setData({ flipped: next });
      this.triggerEvent('toggle', { flipped: next });
    },
    onTap() {
      // 兜底路径：系统仍合成 tap 时翻牌（主路径是 onTouchEnd 判定轻触调用 _flip）。
      // 走 _flip() 去重，避免与 touchEnd 重复翻回。
      this._flip();
    },
    onFav() { this.triggerEvent('fav'); },
    onNote() { this.triggerEvent('note'); },

    // ---- 手指触控倾斜（当前主驱动，替代已禁用的重力感应）----
    onTouchStart(e) {
      this.setData({ dragging: true });
      this._touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      // 记录起点用于轻触/拖动判定；重置拖动标记
      this._stx = e.touches[0].clientX;
      this._sty = e.touches[0].clientY;
      this._dragged = false;
    },
    onTouchMove(e) {
      if (!this.data.dragging) return;
      const touch = e.touches[0];
      // 轻触/拖动判定：累计位移 > 10px 即判为拖动（轻触手指微移 ≤10px 视为点击）
      const dist = Math.hypot(touch.clientX - this._stx, touch.clientY - this._sty);
      if (dist > 10) this._dragged = true;
      const rect = this._rect || { width: 1, height: 1, left: 0, top: 0 };
      // 计算触摸点相对卡牌中心的归一化坐标 [-1, 1]
      const nx = (touch.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const ny = (touch.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      this._onTiltInput(nx, ny);
    },
    onTouchEnd() {
      this.setData({ dragging: false });
      // 轻触（无 >10px 位移）→ 主动翻牌（主路径，不依赖系统 tap 合成，解决真机轻触失效）。
      // 拖动 → 不翻，仅 decay 回正；随后若系统合成 tap，根节点 catchtap 兜底，但会被 _flip 去重跳过。
      if (!this._dragged) {
        this._flip();
      }
      // 松手后缓慢回正（自衰减，靠近 0 自动停止；系数 0.2 与需求一致）
      const decay = () => {
        this._st.rx += (0 - this._st.rx) * 0.2;
        this._st.ry += (0 - this._st.ry) * 0.2;
        if (this.data.tiltPaused) { this._st.rx = 0; this._st.ry = 0; }
        // 回正过程中倾斜同步归零
        this.setData({
          tiltStyle: `rotateX(${this._st.rx.toFixed(2)}deg) rotateY(${this._st.ry.toFixed(2)}deg)`,
        });
        if (Math.abs(this._st.rx) > 0.05 || Math.abs(this._st.ry) > 0.05) {
          this._returnTimer = setTimeout(decay, 16);
        } else {
          this._st.rx = 0; this._st.ry = 0;
          // 收敛终帧：倾斜精确归零，杜绝 0.05° 残差
          this.setData({
            tiltStyle: 'rotateX(0deg) rotateY(0deg)',
          });
        }
      };
      if (this._returnTimer) clearTimeout(this._returnTimer);
      decay();
    },

    // 归一化触控输入[-1,1] → 复用重力映射：_applyGyroTick 期望 raw.x/y∈[-1,1]
    _onTiltInput(nx, ny) {
      this._applyGyroTick(nx, ny);
    },

    // 权限被拒：降级为静态（不动、纹理归位），开启 idle 紫金流动兜底，卡牌仍可正常翻转/查看
    _onGyroDenied() {
      // 降级为静态（不动、纹理归位），开启 idle 紫金流动兜底，卡牌仍可正常翻转/查看
      this.setData({
        idle: true,
        tiltStyle: 'rotateX(0deg) rotateY(0deg)',
        fcHoloShift: '0% 0%',
      });
    },

    // 按 card.rarity 解析箔层并写入 data（供 wxml wx:for 渲染）。
    // 兼容两种来源：父页直接传 rarity 属性，或从 card.rarity 读取（cards.js 已注入）。
    // 同时算 clipClass（full/frame），供 .clip-frame 把金边箔限制在四边环带、中央留空给文字/符号。
    _refreshFoil() {
      const card = this.data.card || {};
      const rarity = this.data.rarity || card.rarity || 'holo';
      const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.holo;
      // 基础裁剪范围：full=铺满 / frame=只镀四边金框（中央留空给文字/符号）
      const baseClip = 'clip-' + (cfg.clip || 'full');
      // 低版本基础库（< 2.11.1）不支持 clip-path 时追加 no-clip-path，
      // 让 .flip-card.no-clip-path .fc-holo-layer 回退（holo 不再 overscan）。
      // this._noClipPath 在 attached() 检测 SDKVersion 时写入；
      // 若尚未初始化（极少数初始属性回调早于 attached）按支持处理，attached 会纠正。
      const clipClass = this._noClipPath ? baseClip + ' no-clip-path' : baseClip;
      this.setData({
        foilLayers: buildFoilLayers(rarity),
        clipClass: clipClass,
      });
    },

    // 每帧（tick）调用：把原始重力 (x,y∈[-1,1]) 经低通/lerp 缓动后映射到
    //   倾斜角（±MAX）、紫金渐变偏移、真实箔纹理平移，平滑跟随手机姿态。
    // 【当前由手指触控调用】_onTiltInput(nx,ny) 直接传入归一化触控坐标；
    //   重力感应已禁用保留，本函数映射逻辑不变，idle 关闭逻辑保留。
    // 双层速率差（视差）：渐变 FOILMOVE 大→快而灵敏；纹理 HOLOMOVE 小→慢而迟钝，
    //   两层不同速率流动 → 金属箔反光视差（参考 :before /1.5、:after /7 的本质）。
    _applyGyroTick(x, y) {
      const MAX = 30;        // 倾斜幅度（度）——明显但优雅
      const FOILMOVE = 10;   // 紫金渐变随触控偏移幅度（%，配合 background-size:120% 不形成单一色块）
      const HOLOMOVE = 12;   // 真实箔纹理随重力平移幅度（% → 慢、迟钝 → 视差）；原 16 在 +16% 时缩进卡内 10% 致四角漏光，降到 12 留足覆盖余量
      const K = 0.15;        // 缓动系数（越小越柔，越大越跟手）
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

      const s = this._st;
      const tRX = clamp(y * MAX, -MAX, MAX); // rotateX 由前后倾斜(y)驱动
      const tRY = clamp(x * MAX, -MAX, MAX); // rotateY 由左右倾斜(x)驱动
      const tFX = 50 + clamp(x * FOILMOVE, -FOILMOVE, FOILMOVE);
      const tFY = 50 + clamp(y * FOILMOVE, -FOILMOVE, FOILMOVE);
      const tHX = clamp(x * HOLOMOVE, -HOLOMOVE, HOLOMOVE);
      const tHY = clamp(y * HOLOMOVE, -HOLOMOVE, HOLOMOVE);

      s.fx += (tFX - s.fx) * K;
      s.fy += (tFY - s.fy) * K;
      s.hx += (tHX - s.hx) * K;
      s.hy += (tHY - s.hy) * K;

      // 重力兜底：首次真正驱动即关闭 idle 流动，让重力接管紫金渐变位置
      const hyp = Math.min(1, Math.hypot(x, y));
      const patch = {
        fcFoilPos: `${s.fx.toFixed(2)}% ${s.fy.toFixed(2)}%`,
        fcHoloShift: `${s.hx.toFixed(2)}% ${s.hy.toFixed(2)}%`,
        // 内联 CSS 变量（与 tiltStyle 同一次 setData）：供新箔层用 calc()+var() 增强；
        // 若真机 calc+var 不生效，新箔层仍靠 fcFoilPos/fcHoloShift 驱动，此处仅作优雅增强。
        cssVars: `--mx:${x.toFixed(3)};--my:${y.toFixed(3)};--posx:${(50 + x * FOILMOVE).toFixed(1)}%;--posy:${(50 + y * FOILMOVE).toFixed(1)}%;--hyp:${hyp.toFixed(3)}`,
      };
      if (this.data.idle) patch.idle = false;

      if (this.data.tiltPaused) {
        // 登场动画期间：倾斜归零，仅保留箔视差流动，不干扰 720° 翻转定格
        s.rx = 0; s.ry = 0;
        patch.tiltStyle = 'rotateX(0deg) rotateY(0deg)';
      } else {
        s.rx += (tRX - s.rx) * K;
        s.ry += (tRY - s.ry) * K;
        patch.tiltStyle = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      }

      this.setData(patch);
    },
  },
});
