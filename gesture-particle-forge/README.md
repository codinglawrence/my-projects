# Gesture Particle Forge · 手势粒子熔炉

纯静态手势 + 粒子特效 demo（HTML + 原生 JS + CSS，零构建）。

## 怎么打开

直接双击 `output.html` 用浏览器打开。

> **重要**：浏览器要求 `localhost` 或 `https` 才能访问摄像头；用 `file://` 双击时手势不可用，会自动降级为鼠标模式（移动 = 融解，按住拖动 = 搅动）。
> 想用手势，请起本地服务：
> ```bash
> cd gesture-particle-forge
> python -m http.server 8000
> # 然后浏览器开 http://localhost:8000/output.html
> ```

## 设计手势（页面右上有操作指南）

| 手势 | 效果 |
|------|------|
| ✋ 张开手掌 | 斥力融解，图像化开 |
| ✊ 握拳 | 吸回重组清晰原图 |
| 🤏 捏合拖动 | 局部搅动像素 |
| 🤲 双手拉开 | 整体拉伸变形 |
| 🚫 无手 | 自动归位呼吸 |

## 文件结构

| 文件 | 用途 |
|------|------|
| `output.html` | 主入口（双击这个） |
| `css/` | 样式 |
| `js/main.js` | 主逻辑 |
| `js/particles.js` | 粒子引擎 |
| `js/hands.js` | MediaPipe hands 手势识别 |
| `js/images.js` | 源图加载与切换 |
| `js/vendor/` | 本地化的第三方库（含 MediaPipe） |

## 技术栈

- 原生 HTML + JS + CSS
- Canvas 2D 粒子系统
- MediaPipe Hands（vendored）做手势识别

## ⚠️ 状态：未完成（手势未跑通）

**当前卡点**：MediaPipe hands 在本机实测**未能成功运行**，手势识别流程未打通。
- ✅ 粒子特效本身可看（双击 `output.html` 即可欣赏动画）
- ❌ 手势控制不可用（核心交互缺位）
- ⏸ 鼠标降级模式可用，但与设计目标不符

**未完成原因**（用户已明确撤回完成标记 2026-09-05）。后续若要继续，需排查 MediaPipe 模型加载 / 摄像头权限 / 浏览器兼容性。

## 备选

可鼠标模式体验粒子融解效果；如需完整手势体验，需先修复 MediaPipe 集成。