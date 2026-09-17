# Timequest · 时间管理 App

Vue 3 + Vite 时间管理 / 活动记录应用。曾规划 Android / H5 打包，**当前已停止开发**。

## 怎么打开（仅前端调试）

```bash
npm install
npm run dev
```

浏览器开 http://localhost:5173

> 实际 Android 打包走 Capacitor + HBuilderX：`npm run build:hb` 会把 `dist/` 拷到 `C:\Users\terri\Desktop\前端-项目\vibe-coding\trecord\tm.record\dist`，再在 HBuilderX 中云打包。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3 + TypeScript + Pinia |
| UI | Vant 4（移动端组件库） |
| 构建 | Vite 7 + vue-tsc |
| 端 | Capacitor（Android）+ HBuilderX 云打包 |
| Lint | ESLint + Oxlint + Prettier |

## 目录结构

| 目录 / 文件 | 说明 |
|------|------|
| `src/` | 源码（App.vue / main.ts / router / stores / views / components / utils / assets） |
| `android/` | Capacitor 生成的 Android 工程 |
| `docs/` | 设计文档 |
| `public/` | 静态资源 |
| `Timequest PRD.docx` | 产品 PRD |
| `Timequest_DarkTech_小红书.pptx` | DarkTech 风格小红书推广 |
| `Timequest_SwissGrid_小红书.pptx` | SwissGrid 风格小红书推广 |
| `Timequest_介绍.html` | 项目介绍页 |
| `result/` | 结果产物 |

## 状态

⏸ **已停止**（2026-09-05 标记）。
- 上一版本 v0.0.0
- 项目结构与 PRD / 推广物料已沉淀保留
- 未来如重启，沿用现有 Capacitor 流程即可