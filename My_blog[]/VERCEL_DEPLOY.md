# Vercel 部署指南

## 简介

本项目已配置为支持 Vercel 部署。Vercel 是一个强大的前端部署平台，提供自动部署、预览部署和全球 CDN 加速等功能。

## 部署方式

### 方式一：使用 Vercel 网站（推荐）

1. 访问 [vercel.com](https://vercel.com/) 并注册账号
2. 点击 "New Project"
3. 选择你的 GitHub 仓库进行导入
4. Vercel 会自动检测项目配置并部署
5. 部署完成后会获得一个唯一的 URL

### 方式二：使用 Vercel CLI

1. 安装 Vercel CLI（已完成）：
   ```bash
   npm install -g vercel
   ```

2. 登录 Vercel：
   ```bash
   npx vercel login
   ```

3. 预览部署：
   ```bash
   npm run vercel-preview
   ```

4. 生产部署：
   ```bash
   npm run vercel-deploy
   ```

## 环境变量配置

由于项目使用了 Google Gemini AI API，需要在 Vercel 中配置环境变量：

1. 在 Vercel 项目控制台中，进入 "Settings" -> "Environment Variables"
2. 添加以下环境变量：
   - `GEMINI_API_KEY`: 你的 Google Gemini API 密钥

## 项目配置说明

- **vercel.json**: Vercel 部署配置文件，定义了构建命令、输出目录等
- **vite.config.ts**: 已优化为自动检测 Vercel 环境，在 Vercel 上使用根路径 "/"
- **package.json**: 添加了 Vercel 相关脚本命令

## 特性

- ✅ 自动部署：每次推送到 main 分支自动触发部署
- ✅ 预览部署：每个 PR 都有独立的预览链接
- ✅ 全球 CDN：自动分发到全球节点
- ✅ HTTPS：自动配置 SSL 证书
- ✅ 自定义域名：支持绑定自定义域名

## 注意事项

- 确保在部署前已正确配置环境变量
- 检查 API 密钥是否正确设置
- 部署后测试所有功能是否正常工作