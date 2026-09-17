# 五字日记（Fiday）

每天用五个字记录生活，温柔、克制、有质感。

## 怎么打开

npm install 一次，之后 npm run dev → 浏览器自动开 http://localhost:3000
## ✨ 功能特性

- **每日记录**：输入五个字记录当天的心情或事件（支持中文输入法组合事件，拼音输入过程不截断）
- **心情评分**：0–10 分滑块，HSL 色相从蓝灰（平静）连续过渡到暖珊瑚（热烈），刻意避开绿色；带质感渐变轨道 + 刻度 + 大分值显示
- **补记历史**：选择任意过往日期补记遗忘的日记，日期卡片顶栏内置「返回今天」按钮
- **历史查看**：朋友圈风格卡片（昵称 + 心情评分胶囊 + 正文 + 日期），长按/点击显示删除按钮
- **未读角标（微信式）**：右上角历史图标显示未读条数 = 总记录 − 已读记录；点开历史即清零并持久化（`localStorage` 存储 `diary_seen_count`），**重启 App 不再误报**；自己新增的记录算已读，不触发角标
- **数据持久化**：App 内使用 SQLite 原生存储，数据不会因 WebView 缓存清除或应用更新而丢失
- **响应式设计**：适配各种屏幕尺寸，移动端手势/按压反馈完整
- **昵称系统**：首次启动设置昵称（存 `localStorage`），历史卡片以昵称展示

> ⚠️ **已移除定位/城市功能**：原版尝试了「5+ API → 浏览器 Geolocation → IP」三层定位，实测定位不准，已按需求删除全部地理位置逻辑（存储字段、UI 显示、定位服务类），顶栏与历史卡片不再显示城市。

## 🛠 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS v4
- **构建工具**：Vite 6
- **动画**：Framer Motion（motion）
- **日期处理**：date-fns
- **图标**：Lucide React
- **数据存储**：SQLite（5+ App）/ localStorage（浏览器降级）
- **打包工具**：HBuilderX（5+ App / Wap2App）

## 📂 项目结构

```
五字日记/
├── index.html            # 根入口：当前为「生产版」（引用 ./assets/*.js）
├── index.dev.html        # 开发版入口备份（引用 /src/main.tsx），改源码后重建前先恢复它
├── assets/               # 生产构建产物（JS/CSS），由 build 生成并归位到此
├── src/
│   ├── App.tsx           # 主组件：输入/心情/历史/角标/日历等全部 UI
│   ├── stores/diary.ts   # 存储层：SQLite + localStorage 双层、数据迁移、响应式状态
│   ├── seed-data.ts      # ⚠️ 临时种子数据（24 条），打包验证后删除（见下方说明）
│   ├── main.tsx          # React 挂载入口
│   └── index.css         # 全局样式
├── icons/
│   └── icon_standalone_v2.png  # 自定义 App 图标母版（暖色书法「五」字，尚未接入打包）
├── manifest.json         # 5+ App 配置（应用名/版本/图标/appid）
├── vite.config.ts
└── package.json
```

## 📦 构建与打包

> **关键约定**：Vite 以根 `index.html` 为入口。当前根 `index.html` 已是**生产版**（引用 `./assets/...`），
> 所以本项目处于「打包就绪」状态——直接用 HBuilderX 打开即可打包，无需再次 build。
> 若你改了 `src/` 源码，需按下方流程重新构建并**归位**到根目录（否则旧 JS 会被重新打包、改动不生效）。

### 开发预览

```bash
npm install
# 若根 index.html 是生产版，先恢复开发入口：
cp index.dev.html index.html
npm run dev
# 访问 http://localhost:3000 （端口被占自动顺延）
```

### 修改源码后重新构建并归位

```bash
cp index.dev.html index.html          # 1. 恢复开发版入口（让 Vite 真正编译 src）
npm run build                         # 2. 产物输出到 dist/
cp dist/index.html index.html         # 3. 覆盖根目录为生产版（HBuilderX 读取它）
cp -r dist/assets/* assets/           # 4. 归位 JS/CSS 资源
# 之后即可用 HBuilderX 打包
```

### HBuilderX 打包 Android

1. 打开 HBuilderX → 文件 → 打开目录 → 选择 `我的项目/五字日记`（整个文件夹）
2. 登录 DCloud 账号；若 `manifest.json` 的 `appid`（`__UNI__F5C7A9B1`）非你账号，点「重新获取」生成你自己的
3. 顶部菜单 **发行 → 原生App-云打包**
4. 平台：**Android**，打包方式：**云端打包**；证书选「使用公共测试证书」（自用足够，不能上架）
5. 提交后等待几分钟，控制台显示成功 → 点「打开目录」，APK 在
   `我的项目/五字日记/unpackage/release/apk/`
6. 装手机：USB 调试直装，或把 apk 传到手机安装。**勿用微信传**（文件名会被加 `.1` 导致装不了）

## 💾 数据存储

**双层存储架构**：

1. **5+ App 环境 → SQLite（原生数据库）**
   - 数据保存在应用私有目录，不会因 WebView 缓存清除、应用更新而丢失
   - 应用启动时自动将旧 `localStorage` 数据（`diaryEntries` / `diary_entries`）迁移到 SQLite 并清除旧键
2. **浏览器/降级 → localStorage**
   - 当 SQLite 不可用时自动降级，数据以 JSON 格式存储

### 数据表结构（SQLite）

```sql
CREATE TABLE diary_entries (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  date TEXT NOT NULL,        -- "yyyy年MM月dd日"，自然日维度
  timestamp INTEGER NOT NULL,
  mood INTEGER               -- 0-10 心情评分，旧数据可无此列（建表带 ALTER 兼容）
);
```

## 📱 使用指南

1. 首次启动设置昵称 → 每日输入五个字 → 拖动心情滑块 → 点击「完成记录」
2. 点日期卡片顶栏「补记历史」选过往日期补记；补记态下顶栏左侧显示「返回今天」
3. 点右上角历史图标 → 浏览所有记录，点开即清除未读角标（持久化）
4. 历史卡片点击/长按 → 出现删除按钮，可删除某条记录

## 🎨 图标

已设计自定义 App 图标：`icons/icon_standalone_v2.png`（圆角方形、奶油米→蜜桃→柔珊瑚暖色渐变、书法感「五」字 + 极淡纸角折痕 + 纸纹磨砂质感）。

> ⏳ **待接入打包**：当前 `manifest.json` 仍引用 HBuilderX 默认图标路径（`unpackage/res/icons/*.png`）。要将自定义图标生效，需把母版导出为 Android 各尺寸并替换 `manifest.json` 的 `plus.icons.android` 配置。

## ⚠️ 临时种子数据（打包验证用）

`src/seed-data.ts` 内含 **24 条**示例日记（2026-04-13 ~ 2026-07-07），用于你首次打包后在手机上验证存储与角标逻辑。
数据在 App 首次启动时自动写入（SQLite/localStorage），并打 `__diary_seed_done__` 标记防重复。

> 自用正式版**不需要**这些示例数据。验证无误后，告知我删除 `seed-data.ts` 及其在 `diary.ts` 中的调用，重新 build 归位，再打一版干净的包。

## 📝 版本与待办

### 版本号说明
- 代码实际功能已演进到 **v3.x**（心情系统、角标持久化、去定位），但 `package.json` 与 `manifest.json` 的 `version`/`versionName` 仍为 `2.0.0`，**待对齐**。

### 已知待办
- [ ] 将 `package.json` / `manifest.json` 版本号对齐到实际版本
- [ ] 接入自定义图标（`icons/icon_standalone_v2.png` → 导出各尺寸 → `manifest.json` 的 `plus.icons`）
- [ ] 清理 `manifest.json` 残留的定位权限（`ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`）与 Geolocation 模块（UI 已删，原生配置未清）
- [ ] 移除临时种子 `seed-data.ts`（见上）

### 变更记录

#### v3.1（代码实际状态）
- ✅ 修复：未读角标持久化——点开历史写入 `diary_seen_count`，重启不再误报
- ✅ 移除：全部定位/城市功能（逻辑 + UI + 定位服务类）
- ✅ 新增：心情评分系统（0–10，HSL 色相映射）
- ✅ 新增：保存/删除 Toast 反馈、启动加载态、`useSyncExternalStore` 响应式存储
- ✅ 优化：同日覆盖逻辑、历史卡片删除交互（移动端可见）

#### v2.0.0（manifest 当前记录）
- ✅ 存储层 SQLite + localStorage 双层架构
- ✅ 历史未读角标、Toast 反馈、启动态

#### v1.0.0
- 基础功能：每日记录五个字、历史查看、仅 localStorage 持久化
