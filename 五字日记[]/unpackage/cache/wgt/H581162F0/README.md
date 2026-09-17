# 五字日记

每天记录五个字，简单而有意义的生活记录应用。

## ✨ 功能特性

- **每日记录**：输入五个字记录当天的心情或事件
- **补记历史**：选择任意日期补记忘记的日记
- **历史查看**：浏览所有以往记录，可左滑删除
- **数据持久化**：App 内使用 SQLite 原生存储，数据不会因缓存清除而丢失
- **响应式设计**：适配各种屏幕尺寸

## 🛠 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS v4
- **构建工具**：Vite 6
- **动画**：Framer Motion
- **日期处理**：date-fns
- **图标**：Lucide React
- **数据存储**：SQLite（5+ App）/ localStorage（浏览器降级）
- **打包工具**：HBuilderX（Wap2App）

## 📦 构建与打包

### 开发环境

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
```
构建产物在 `dist/` 目录。

### HBuilderX 打包 Android

1. 打开 HBuilderX → 文件 → 打开目录 → 选择 `我的项目/五字日记`
2. 登录 DCloud 账号
3. 点击 **发行 → 原生App-云打包**
4. 平台：**Android**，打包方式：**云端打包**
5. 使用公共测试证书或自定义证书
6. 点击打包，等待完成后下载 `*.apk`

## 💾 数据存储（v2.0 改进）

**核心问题解决**：旧版使用 `localStorage` 存储，在 Android WebView 中经常因缓存清除或应用更新而丢失数据。

**新版双层存储架构**：

1. **5+ App 环境 → SQLite（原生数据库）**
   - 数据保存在应用私有目录 `_doc/diary.db`
   - 不会因 WebView 缓存清除、应用更新而丢失
   - 应用启动时自动将旧 `localStorage` 数据迁移到 SQLite

2. **浏览器/降级 → localStorage**
   - 当 SQLite 不可用时自动降级
   - 数据以 JSON 格式存储在浏览器本地

### 数据表结构

```sql
CREATE TABLE diary_entries (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  date TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
```

## 📱 使用指南

1. 输入五个字 → 点击「完成记录」
2. 点击「补记历史」→ 选择日期 → 保存
3. 点击右上角历史图标 → 浏览所有记录
4. 鼠标悬停/触摸记录 → 出现删除按钮

## 📝 版本记录

### v3.1.0（当前）
- ✅ 修复：存储层改用 SQLite + localStorage 双层架构，数据不再丢失
- ✅ 修复：历史未读角标持久化——点开历史后写入 `diary_seen_count`，重启 App 不再误报未读
- ✅ 移除：定位/城市相关功能（定位不准，已按需求删除全部地理位置逻辑与 UI）
- ✅ 新增：保存/删除操作的用户反馈（Toast 通知）
- ✅ 新增：应用启动加载状态
- ✅ 优化：使用 `useSyncExternalStore` 替代 `forceUpdate`
- ✅ 优化：清理项目结构，移除废弃构建产物和重复项目

### v1.0.0
- 基础功能：每日记录五个字
- 历史记录查看
- 数据持久化（仅 localStorage，有丢失风险）
