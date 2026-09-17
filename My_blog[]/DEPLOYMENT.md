# 部署指南

## Vercel 部署 (推荐)

### 1. 使用 Vercel 控制台部署

1. 访问 [Vercel](https://vercel.com/) 并登录
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动检测项目配置并部署

### 2. 使用 Vercel CLI 部署

```bash
# 登录 Vercel
npx vercel login

# 预览部署
npm run vercel-preview

# 生产环境部署
npm run vercel-deploy
```

### 3. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：
- `GEMINI_API_KEY`: 你的 Google Gemini API 密钥

### 4. 项目配置

- `vercel.json`: Vercel 部署配置文件
- `vite.config.ts`: 已优化支持 Vercel 部署
- `.gitignore`: 包含 Vercel 相关忽略项

## GitHub Pages 部署 (备选)

### 1. 使用 GitHub Actions 自动部署

1. 推送代码到 GitHub
2. 在 GitHub 仓库设置中启用 GitHub Pages
3. 选择 GitHub Actions 作为部署源

### 2. 使用 npm 脚本手动部署

```bash
npm run build
npm run deploy
```

### 3. 环境变量配置

在 GitHub 仓库设置中添加 `GEMINI_API_KEY` 密钥

## 项目结构

```
My_blog/
├── .github/workflows/deploy.yml  # GitHub Actions 工作流
├── vercel.json                   # Vercel 配置文件
├── vite.config.ts               # Vite 构建配置
├── package.json                 # 项目依赖和脚本
└── ...                          # 其他项目文件
```

## 注意事项

- 确保在部署前设置好环境变量
- Vercel 会自动处理路由重写
- GitHub Pages 需要手动配置 base 路径