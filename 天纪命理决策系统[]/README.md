# 天纪命理决策系统

> 基于倪海厦《天纪》体系的命理决策 Web 应用。以「紫微斗数 + 阳宅风水 + 四化流年 + 易经六十四卦 + 面相」五术合一，践行「以果决行、君子问祸不问福」的决策哲学。

## 怎么打开

npm install 一次，之后 npm run dev → 自带后端，浏览器开 http://localhost:3000
## 技术栈

- **前端**：React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4
- **后端**：Express 4（Vite 中间件模式，`server.ts` 由 `tsx` 运行，端口 3000）
- **AI 引擎**：`@google/genai`（Gemini 3.7 Flash）
  - 配置 `GEMINI_API_KEY` 后由后端代理生成「天纪决策咨询 / 五维深度白皮书」
  - **无 API key 时自动离线降级**，返回内置规则化命理文本，应用完整可跑

## 六大模块

| 模块 | 核心引擎 | 说明 |
|------|----------|------|
| 紫微斗数排盘 | `ziweiEngine.ts` | 五行局、紫微落点、安星、格局判定（杀破狼/三奇嘉会/紫府同宫/羊陀夹忌/巨日同宫）、倪师逐宫精解 |
| 命格分析 | `fateAnalysisEngine.ts` | 命格原型解析 + 8 维度运势（性格/事业/财富/婚姻/健康/策略…） |
| 阳宅风水 | `yangzhaiEngine.ts` | 九宫方位 × 家庭成员长幼角色诊断 |
| 四化流年 | `SiHuaTimeline` | 禄权科忌 + 大限/流年时间轴 |
| 易经六十四卦 | `ichingEngine.ts` + `tianjiIchingNumerology.ts` | 天机道洛书河图数理推先天/后天命卦 + 人间道无字天书图解 |
| 面相 | `faceReadingData.ts` | 天庭/印堂/双目/眉/鼻/卧蚕/地阁 七部位面诊 |

## 运行

```bash
npm install
cp .env.example .env.local   # 可选：填入 GEMINI_API_KEY，不填则离线降级
npm run dev                  # 启动后访问 http://localhost:3000
```

构建与启动生产版：

```bash
npm run build
npm start
```

## 数据来源说明（重要）

- 六十四卦的**卦辞、象传取自公共《周易》通行本**（公有领域）。
- 卦象的「天纪风格指引」「人间道详解」为基于公开易理的「天纪风格」**整理版**，**非倪海厦原版授课内容**，仅供传统文化学习研究。
- 紫微斗数安星、五行局、四化等算法为通用流派**近似实现**，庙旺利陷为简化表，严谨性请以专业命理典籍为准。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（返回 `hasApiKey` 状态） |
| POST | `/api/tianji/consult` | 单次决策咨询（temperature 0.7） |
| POST | `/api/tianji/deep-report` | 五大模块深度白皮书（temperature 0.6） |

## 免责声明

本应用为传统文化研究与原型演示工具，所有输出**不构成任何医疗、财务、法律或人生决策建议**。请理性对待，切勿迷信。
