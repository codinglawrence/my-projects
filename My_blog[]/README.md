## 以《Intersteller》为灵感的个人博客网站

主要由 React + TypeScript + Vite 构建的科幻宇宙。

## 怎么打开

npm install 一次，之后 npm run dev → 浏览器开 http://localhost:3000
## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS 4
- **动画库**: Framer Motion (motion/react)
- **UI 图标**: Lucide React
- **AI 集成**: Google GenAI SDK

## 项目结构

```
My_blog/
├── src/
│   ├── App.tsx              # 主应用组件，包含所有页面区块
│   ├── GargantuaSimulation.tsx  # WebGL 黑洞模拟背景组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式与 Tailwind 配置
├── public/                  # 静态资源（图片等）
├── dist/                    # 构建输出目录
├── package.json             # 项目依赖配置
├── vite.config.ts           # Vite 构建配置
├── tsconfig.json            # TypeScript 配置
└── README.md                # 项目说明
```

## 页面模块

1. **Hero 首页** - 欢迎区域，带有"Enjoy the Universe"交互按钮
2. **关于我 (About)** - 个人介绍与代码风格信息卡片
3. **人生系统仪表盘 (Explorations)** - 五大系统可视化（输入/输出/成长/财务/能量）
4. **爱好 (Hobbies)** - 阅读、音乐、健身展示，支持展开书籍和专辑详情
5. **技能 & 简历 (Skills)** - 技能进度条与项目经历时间线
6. **联系方式 (Signal)** - 微信、QQ、邮箱、GitHub 联系入口

## 核心特性

- **WebGL 黑洞背景**: 使用 GLSL 着色器实现的实时渲染黑洞吸积盘动画
- **视差滚动效果**: 基于 Framer Motion 的滚动触发动画
- **3D 卡片交互**: 鼠标跟随的 3D 倾斜卡片效果
- **响应式设计**: 适配桌面与移动设备
- **导航系统**: 全屏侧边栏导航菜单

## 本地开发

**环境要求**: Node.js

1. 安装依赖:

   ```bash
   npm install
   ```

2. 启动开发服务器:

   ```bash
   npm run dev


## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (端口 3000) |
| `npm run build` | 构建生产版本 |

## 主题色彩

- **墨黑 (ink-black)**: #020203 - 主背景色
- **鎏金 (gilding-gold)**: #e5c07b - 强调色
- **炽焰 (burning-ember)**: #ff7e33 - 高亮色
- **星光 (starlight)**: #ffffff - 主文字色
- **星云灰 (nebula-gray)**: #e5e7eb - 次要文字色
