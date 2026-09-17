# PromptMaster - 智能提示词管理器

<div align="center">
<img width="1200" height="475" alt="PromptMaster Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

一个现代化的智能提示词管理应用，结合 React 前端和 Express 后端，集成 Google Gemini AI 和 Firebase 认证，帮助用户高效管理和优化 AI 提示词。

## 怎么打开

npm install 一次，之后 npm run dev → 自带后端，浏览器开 http://localhost:3000
## ✨ 功能特性

- 📝 **提示词管理**：创建、编辑、删除和收藏提示词
- 🤖 **AI 辅助生成**：使用 Google Gemini AI 生成和优化提示词
- 🏷️ **标签系统**：为提示词添加标签，便于分类和搜索
- 🔍 **智能搜索**：快速搜索和过滤提示词
- ☁️ **云端同步**：基于 Firebase 的用户认证和数据同步
- 🎨 **现代化 UI**：使用 Tailwind CSS 和 Framer Motion 的流畅界面
- 📱 **响应式设计**：支持桌面和移动设备

## 🛠️ 技术栈

- **前端**：React 19, TypeScript, Vite
- **后端**：Express.js, Node.js
- **AI**：Google Gemini AI
- **数据库**：SQLite (better-sqlite3)
- **认证**：Firebase Authentication
- **样式**：Tailwind CSS, Framer Motion
- **图标**：Lucide React

## 🚀 快速开始

### 环境要求

- Node.js (推荐版本 18+)
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd promptmaster---智能提示词管理器
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**

   创建 `.env.local` 文件并配置以下环境变量：

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. **运行开发服务器**
   ```bash
   npm run dev
   ```

   应用将在 [http://localhost:5173](http://localhost:5173) 启动，点击链接即可访问

### 构建生产版本

```bash
npm run build
npm run preview
```

### 部署

```bash
npm run start
```

## 📁 项目结构

```
promptmaster---智能提示词管理器/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 应用入口
│   ├── index.css        # 全局样式
│   ├── types.ts         # TypeScript 类型定义
│   └── lib/
│       └── utils.ts     # 工具函数
├── server.ts            # Express 后端服务器
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
├── package.json         # 项目依赖和脚本
└── README.md            # 项目文档
```

## 🔧 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run start` - 启动生产服务器
- `npm run clean` - 清理构建文件
- `npm run lint` - 运行 TypeScript 类型检查

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。
