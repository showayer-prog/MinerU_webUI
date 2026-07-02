import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (e) {
  console.warn("Failed to initialize GoogleGenAI:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // API Route - AI Layout Parsing Simulator (Mimics MinerU OCR using Gemini Flash)
  app.post("/api/ai-extract", async (req, res) => {
    const { filename, contentPrompt, mode, extractTable, extractFormula } = req.body;

    if (!ai) {
      // Return a simulated high-quality response if Gemini is not set up
      return res.json({
        success: true,
        markdown: `# ${filename || "sample_document.pdf"}\n\n## 1. 摘要与背景\n这是一个由 MinerU (magic-pdf) 提取出的高性能 Markdown 样例。\n\n由于系统检测到 **GEMINI_API_KEY** 尚未配置，此处呈现由本地模板生成的智能预览模式。\n\n### 提取状态\n- **文件名**: ${filename || "sample_document.pdf"}\n- **提取模式**: ${mode || "auto"}\n- **公式提取**: ${extractFormula ? "已开启" : "已关闭"}\n- **表格结构**: ${extractTable ? "已开启" : "已关闭"}\n\n---\n\n## 2. 数学公式展示\n当启用公式提取时，所有的数学公式都将被转化为标准的 LaTeX 格式。\n\n行内公式: $\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e$\n\n独立公式块:\n$$\\mathcal{L} = \\bar{\\psi}(i\\gamma^\\mu D_\\mu - m)\\psi - \\frac{1}{4}F_{\\mu\\nu}F^{\\mu\\nu}$$\n\n---\n\n## 3. 表格与网格布局\n系统会将 PDF 中的复杂表格自动转译为 Markdown 格式，极易阅读和导入:\n\n| 序号 | 字段名称 | 解析类型 | 状态 | 备注 |\n|---|---|---|---|---|\n| 1 | InputPath | string | ✅ | PDF存放路径 |\n| 2 | OutputPath | string | ✅ | Markdown输出位置 |\n| 3 | Mode | Enum | ✅ | auto / ocr / txt |\n\n---\n\n*提示: 配置您的 GEMINI_API_KEY 即可解锁真正在线 AI 文档提取与实时转换功能！*`,
        layoutStructure: [
          { type: "header", text: "1. 摘要与背景", bbox: [50, 80, 200, 100] },
          { type: "paragraph", text: "这是一个由 MinerU 提取出的高性能 Markdown 样例...", bbox: [50, 110, 500, 160] },
          { type: "formula", text: "L = ...", bbox: [100, 200, 400, 250] },
          { type: "table", text: "表格数据", bbox: [50, 300, 550, 420] }
        ]
      });
    }

    try {
      const prompt = `你是一个高级文档分析助手，现在请你扮演 MinerU (magic-pdf) 提取引擎。
用户提供了一个文件名: "${filename || "document.pdf"}" 
以及一些文件核心文字或内容提示: "${contentPrompt || "关于机器学习和微积分公式的说明"}"。
你的任务是将这些内容整理或虚构生成一份看起来极其真实、排版极其优美、结构极度完整、富含细节的 PDF 提取后的 Markdown 文档。

需要满足以下要求：
1. 根据用户配置：模式为 ${mode || "auto"}，表格提取为 ${extractTable}，公式提取为 ${extractFormula}。
2. 既然用户特别强调了公式提取(${extractFormula})，你必须在生成的 Markdown 中加入 2-3 个优雅的高级数学、物理或机器学习公式（使用 LaTeX 语法，如 $...$ 或 $$...$$）。
3. 既然用户强调了表格识别(${extractTable})，你必须包含一个 3-5 行的专业多列 Markdown 数据表。
4. 全文使用中文输出，采用学术界或工业界文档的高级语气。
5. 包含 3 个大标题，内容排版错落有致，使用现代 Markdown 风格（支持加粗、代码块、列表）。

另外，请生成一个简易的 Layout 布局 Bounding Box 数据，JSON 格式，格式为:
{
  "markdown": "生成的 Markdown 内容",
  "layoutStructure": [
    { "type": "header" | "paragraph" | "formula" | "table", "text": "简短摘要", "bbox": [x1, y1, x2, y2] }
  ]
}
Bounding Box 坐标在 [0, 800] 像素区间内即可。
请严格返回上述 JSON 格式，不要包含额外的 Markdown 外壳说明。可以使用 responseMimeType: "application/json" 的配置。`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a professional PDF document parser engine. Return only the requested JSON containing 'markdown' and 'layoutStructure'."
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json({
        success: true,
        markdown: result.markdown || "解析失败，未生成 Markdown",
        layoutStructure: result.layoutStructure || []
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "使用 AI 模拟提取时出错"
      });
    }
  });

  // API Route - Simulated batch execution logs to make a beautiful live terminal experience
  app.post("/api/simulate-batch", (req, res) => {
    const { params, files } = req.body;
    
    // Create random or structured logs simulating a MinerU execution
    const logs: Array<{ id: string; level: 'info' | 'success' | 'warning' | 'error'; message: string; timestamp: string }> = [];
    const formattedTime = () => new Date().toLocaleTimeString();

    logs.push({
      id: "1",
      level: "info",
      timestamp: formattedTime(),
      message: `==========================================================`
    });
    logs.push({
      id: "2",
      level: "info",
      timestamp: formattedTime(),
      message: `             MinerU 批量文档提取工具 (模拟运行中...)        `
    });
    logs.push({
      id: "3",
      level: "info",
      timestamp: formattedTime(),
      message: `==========================================================`
    });
    logs.push({
      id: "4",
      level: "info",
      timestamp: formattedTime(),
      message: `[1/3] 正在激活 Python 虚拟环境 (.venv)...`
    });
    logs.push({
      id: "5",
      level: "success",
      timestamp: formattedTime(),
      message: ` -> 激活成功! 使用环境: C:\\Users\\Administrator\\Project\\.venv\\Scripts\\Activate.ps1`
    });
    logs.push({
      id: "6",
      level: "info",
      timestamp: formattedTime(),
      message: `[2/3] 正在校验 'magic-pdf' 命令行工具可用性...`
    });
    logs.push({
      id: "7",
      level: "success",
      timestamp: formattedTime(),
      message: ` -> 检测到 'magic-pdf' 版本: 0.10.2 (cpu-mode=enabled)`
    });
    logs.push({
      id: "8",
      level: "info",
      timestamp: formattedTime(),
      message: `[3/3] 开始扫描源文件夹 [ ${params.inputPath} ] ...`
    });
    logs.push({
      id: "9",
      level: "success",
      timestamp: formattedTime(),
      message: ` -> 扫描完成！共发现 ${files?.length || 5} 个待处理文档与图片。`
    });
    logs.push({
      id: "10",
      level: "info",
      timestamp: formattedTime(),
      message: `----------------------------------------------------------`
    });

    let idCounter = 11;
    let successCount = 0;
    let failCount = 0;

    const fileList = files ? files.map((f: any) => {
      const parts = f.path.split('/');
      const name = parts.pop() || f.path;
      return {
        name,
        size: f.size,
        relDir: f.relativePath || "根目录"
      };
    }) : [
      { name: "2026_q2_report.pdf", size: "4.2 MB", relDir: "财务报表" },
      { name: "architecture_design.docx", size: "2.5 MB", relDir: "技术文档" },
      { name: "launch_presentation.pptx", size: "8.4 MB", relDir: "产品展示" },
      { name: "accuracy_chart.png", size: "1.1 MB", relDir: "图表分析" },
      { name: "sales_records.xlsx", size: "0.9 MB", relDir: "数据表格" }
    ];

    fileList.forEach((file: any, index: number) => {
      const idxStr = `[${index + 1}/${fileList.length}]`;
      const isFailed = file.name.includes("failed") || Math.random() < 0.1; // 10% chance of fail simulation
      
      logs.push({
        id: String(idCounter++),
        level: "info",
        timestamp: formattedTime(),
        message: `${idxStr} 📄 正在解析: ${file.name}`
      });
      logs.push({
        id: String(idCounter++),
        level: "info",
        timestamp: formattedTime(),
        message: `   ├─ 子目录结构: ${file.relDir || "根目录"}`
      });

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const currentMode = ext === '.pdf' ? params.mode : (ext.match(/\.(png|jpg|jpeg|bmp|webp)$/) ? 'ocr' : params.mode);
      
      logs.push({
        id: String(idCounter++),
        level: "info",
        timestamp: formattedTime(),
        message: `   ├─ 核心模式: magic-pdf -p "${file.name}" -o "${params.outputPath}/${file.relDir || ""}" -m ${currentMode}`
      });
      
      if (!isFailed) {
        successCount++;
        logs.push({
          id: String(idCounter++),
          level: "success",
          timestamp: formattedTime(),
          message: `   └─ ✅ 解析成功！写入文件夹: ${params.outputPath}/${file.relDir || ""}/${file.name.replace(/\.[^/.]+$/, "")}/`
        });
      } else {
        failCount++;
        logs.push({
          id: String(idCounter++),
          level: "error",
          timestamp: formattedTime(),
          message: `   └─ ❌ 解析失败！magic-pdf 进程中途崩溃 (退出代码: 1)`
        });
      }
      
      logs.push({
        id: String(idCounter++),
        level: "info",
        timestamp: formattedTime(),
        message: `----------------------------------------------------------`
      });
    });

    logs.push({
      id: String(idCounter++),
      level: "success",
      timestamp: formattedTime(),
      message: `==========================================================`
    });
    logs.push({
      id: String(idCounter++),
      level: "success",
      timestamp: formattedTime(),
      message: `                      批量任务处理完成                    `
    });
    logs.push({
      id: String(idCounter++),
      level: "success",
      timestamp: formattedTime(),
      message: `==========================================================`
    });
    logs.push({
      id: String(idCounter++),
      level: "info",
      timestamp: formattedTime(),
      message: `统计数据:`
    });
    logs.push({
      id: String(idCounter++),
      level: "info",
      timestamp: formattedTime(),
      message: ` - 扫描到文件数: ${fileList.length}`
    });
    logs.push({
      id: String(idCounter++),
      level: "success",
      timestamp: formattedTime(),
      message: ` - 成功解析数:   ${successCount}`
    });
    logs.push({
      id: String(idCounter++),
      level: "error",
      timestamp: formattedTime(),
      message: ` - 失败文件数:   ${failCount}`
    });
    logs.push({
      id: String(idCounter++),
      level: "success",
      timestamp: formattedTime(),
      message: ` - 最终结果已输出到: C:\\Users\\Administrator\\Project\\output`
    });

    res.json({
      success: true,
      logs,
      successCount,
      failCount
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
