# PromptMaster 微信小程序版（promptmaster-weapp）

基于 Taro 的微信小程序（PromptMaster 提示词管理器的小程序端）。

## 如何手动打开

### 步骤
```bash
cd promptmaster---智能提示词管理器/promptmaster-weapp
npm install
npm run build:weapp     # 产物输出到 dist/ 或 weapp/ 目录
```
然后用**微信开发者工具**「导入项目」选构建产物目录。

### 预期结果
微信开发者工具编译通过，可预览小程序。

### 验证状态
⚠️ 沙箱内 `build:weapp` 受 EPERM（删 .node）+ OpenSSL legacy 限制失败；本机 `npm install` + 微信开发者工具可正常构建。

### 注意事项
- 需要微信开发者工具，无法直接用浏览器打开。
