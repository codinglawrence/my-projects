# GlassMemo - 极简毛玻璃桌面便签

桌面悬浮的毛玻璃质感便签：按日期记录备忘，无边框透明窗口贴在桌面上，可拖到任意位置、可置顶、透明度可调。

## 怎么打开

桌面版：npm run electron:dev｜网页版：npm run dev（:3000）
## 功能

- **按日期记录**：默认展示今天，支持前后翻日、日历选日期，有备忘的日期显示小圆点
- **桌面悬浮**：无边框透明窗口，顶栏按住即可拖到桌面任意位置，位置自动记忆
- **窗口置顶**：默认置顶，可一键切换（📌 按钮）
- **透明度调节**：35% ~ 100%，调低后桌面壁纸隐约透出，真正的"毛玻璃"效果
- **丝滑交互**：条目添加 / 勾选 / 删除带微音效反馈，双击条目内联编辑
- **本地存储**：所有数据保存在本机（localStorage），不上传任何服务器

## 技术栈

Electron + React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + motion

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 启动 Vite 开发服务器（浏览器预览，无桌面能力按钮）
npm run electron:dev  # 另开终端，启动 Electron 窗口（需先跑 npm run dev）
```

## 打包 Windows 安装包

```bash
npm run dist       # vite build + electron-builder，产物在 release/
```

## 目录结构

```
electron/          # Electron 主进程（main.cjs）与 preload
src/               # React 渲染进程
  components/      # StickyNote 便签本体 / MinimalDatePicker 日历
  utils/           # date 日期 / storage 持久化 / audio 微音效合成
build/             # 打包资源（图标）
_template_backup/  # AI Studio 模板残留备份（可删）
```
