import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Tian Ji Strategy & Consulting API
app.post("/api/tianji/consult", async (req, res) => {
  try {
    const { question, chartData, yangZhaiData, hexagramData, currentAge, conversationHistory } = req.body;

    const ai = getAI();
    if (!ai) {
      // Fallback rule-based smart response when API key is not yet set
      return res.json({
        reply: `【倪师天纪决策指引（内置离线智能引擎）】\n\n根据您的问题：“${question}”：\n\n1. **以果决行原则**：天纪之精义在知其果而后定其行。不论吉凶，凡动必有应。当吉运（科权禄）加临，宜主动出击、破局立功；若逢化忌、羊陀夹击，则宜退守修德、韬光养晦，切忌投机冒进。\n\n2. **天地人三才合参**：\n- 天命（紫微与四化）：观察今年流年命宫与三方四正之化忌与化权，化权为执念动力，化忌为阻滞与考验，顺应天道节律。\n- 地理（阳宅风水）：务必检视西北乾位（乾纲健全，不可污损）与西南坤位，长幼有序，居得其位，以厚德载物。\n- 人道（行为抉择）：积善之家必有余庆。君子问祸不问福，知险而避之，方为智者。\n\n（提示：配置 GEMINI_API_KEY 可获取专属深度定制推演报告与连续多轮深度决策解惑。）`,
      });
    }

    const systemInstruction = `你是一位精通倪海厦先生《天纪》体系的易学数理与辅助决策大师。
你的核心理论依托于倪海厦《天纪》1994年课程精髓：
1. 【核心宗旨】：“以果决行”、“天地万物运行之自然法则”、“君子问祸不问福”、“命运可调，知命而不认命”。
2. 【三纪框架】：天纪为自然法则（紫微斗数、易经六十四卦、风水地理），人纪为医术与人事行为规范，地纪为史实验证。
3. 【四化动力】：化禄（财禄机遇）、化权（权柄魄力）、化科（名声学术）、化忌（执念、阻碍、亏欠与转折点）。四化是命运之发动机。
4. 【阳宅原则】：先天八卦为体，后天八卦为用。强调乾坤震巽坎离艮兑八位对应家庭长幼序位（父居西北乾位为乾为天，长子居西北为天雷无妄提早当家，厨房厕所切忌火烧天门受克等）。
5. 【决策导向】：言语锋利透彻、直击本质、拒绝模棱两可或宿命迷信，重在给用户提供清晰、可执行的“进退取舍”行动策略。

请根据用户提供的命盘信息、阳宅配置、命卦以及当前具体诉求，进行精准、客观、启发性的天纪决策分析。`;

    const prompt = `用户提问或决策困惑：${question}

命盘与上下文信息：
- 年龄/流年运势阶段：${currentAge ? currentAge + "岁" : "未指定"}
- 紫微斗数核心概况：${chartData ? JSON.stringify(chartData) : "通用排盘"}
- 阳宅风水概况：${yangZhaiData ? JSON.stringify(yangZhaiData) : "标准九宫"}
- 易经命卦/当事卦：${hexagramData ? JSON.stringify(hexagramData) : "无"}

请运用倪海厦《天纪》的“以果决行”与“命相同参”思维，给出深入剖析与具有指导意义的行动建议（包含：天道时机判断、地利环境调整、人道抉择要点、避坑警示）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "未能生成有效分析，请稍后再试。",
    });
  } catch (err: any) {
    console.error("Consultation error:", err);
    res.status(500).json({ error: err.message || "生成报告时发生异常" });
  }
});

// Deep Strategic Report API
app.post("/api/tianji/deep-report", async (req, res) => {
  try {
    const { chartSummary, yangZhaiSummary, hexagramSummary, userFocus } = req.body;

    const ai = getAI();
    if (!ai) {
      return res.json({
        report: `【天纪·全维命理推演与决策管理白皮书】\n\n一、先天命格与格局总论（天命）\n- 本命三方四正吉星拱照，格局清奇。杀破狼主大开大合开拓，机月同梁主稳健持重，紫府朝垣主统御大局。\n- 核心动力四化星运行：以化权立业，以化科扬名，慎防化忌之盲区。\n\n二、阳宅九宫气场与空间调和（地利）\n- 乾位为父，坤位为母，各得其所方为天地相生（地天泰）。\n- 厨房避开西北乾门，主卧宜居生气之所，移星换斗，化煞为权。\n\n三、四化流年与大限吉凶关口（运程）\n- 逢吉运顺势扩张，逢凶运收敛蓄势。\n- 君子见微知著，避开羊陀相夹与化忌冲克。\n\n四、以果决行之战略行动指南（人道）\n1. 事业经营：知进退，不立危墙之下。\n2. 财富布局：见好即收，避免贪念引动化忌。\n3. 身心调理：脾胃为后天之本，心肾相交，形神兼备。`,
      });
    }

    const systemInstruction = `你是一位基于倪海厦《天纪》的资深战略推演导师。
请生成一份结构极其严密、专业详实、直切要害的《天纪·全维度命理决策推演深度报告》。
包含以下五大模块：
1. 【先天命格与核心格局裁定】：结合紫微斗数主星、庙旺、四化动力进行深度破译。
2. 【阳宅八卦空间能量评估与化解】：指出家庭各成员方位吉凶、六十四卦宅卦对应及化解方案。
3. 【四化流年关键转折与危机防御】：明确提示大运与流年中的化忌防范点（君子问祸不问福）。
4. 【先天易经命卦与行动卦象指引】：解析卦德、卦象情境及当下应对心法。
5. 【以果决行·终极行动决策方案】：输出可落地的阶段性策略（事业、财帛、疾厄、家庭）。`;

    const prompt = `输入数据：
- 紫微斗数摘要：${JSON.stringify(chartSummary)}
- 阳宅九宫摘要：${JSON.stringify(yangZhaiSummary)}
- 易经命卦摘要：${JSON.stringify(hexagramSummary)}
- 用户当前重点关注与决策诉求：${userFocus || "综合全景推演"}

请依据倪师《天纪》真传，给出透彻的研判报告。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    res.json({
      report: response.text || "推演生成完成。",
    });
  } catch (err: any) {
    console.error("Deep report error:", err);
    res.status(500).json({ error: err.message || "生成深度报告时发生异常" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`天纪命理决策系统 running on http://localhost:${PORT}`);
  });
}

startServer();
