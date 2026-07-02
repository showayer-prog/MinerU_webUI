import React, { useState } from 'react';
import { MinerUParams } from '../types';
import { generatePowerShellScript, generatePythonWebUI, generateMagicPdfConfig } from '../utils/generators';
import { Terminal, Download, Copy, Check, FileCode, Play, TerminalSquare, AlertTriangle } from 'lucide-react';

interface CodeGeneratorProps {
  params: MinerUParams;
}

export default function CodeGenerator({ params }: CodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'ps1' | 'py' | 'json'>('ps1');
  const [copied, setCopied] = useState<boolean>(false);

  const psScript = generatePowerShellScript(params);
  const pythonScript = generatePythonWebUI(params);
  const jsonConfig = generateMagicPdfConfig(params);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'ps1': return psScript;
      case 'py': return pythonScript;
      case 'json': return jsonConfig;
    }
  };

  const getFilename = () => {
    switch (activeTab) {
      case 'ps1': return 'run_mineru.ps1';
      case 'py': return 'webui.py';
      case 'json': return 'magic-pdf.json';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCode();
    const filename = getFilename();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden shadow-xl text-slate-300" id="code-generator">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-3 pt-1.5 justify-between items-center">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('ps1')}
            className={`px-3 py-1.5 text-[11px] font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ps1'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal className="h-3 w-3" />
            run_mineru.ps1 (PowerShell)
          </button>
          <button
            onClick={() => setActiveTab('py')}
            className={`px-3 py-1.5 text-[11px] font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'py'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileCode className="h-3 w-3" />
            webui.py (本地WebUI)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 text-[11px] font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileCode className="h-3 w-3" />
            magic-pdf.json (配置)
          </button>
        </div>

        <div className="flex space-x-1 pb-1.5">
          <button
            onClick={handleCopy}
            className="p-1 bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 rounded transition-all"
            title="复制到剪贴板"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1 bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 rounded transition-all flex items-center gap-1 text-[10px] px-2"
            title="下载该文件"
          >
            <Download className="h-3.5 w-3.5" />
            <span>下载</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative">
        <pre className="p-3.5 text-[10px] sm:text-[11px] font-mono text-slate-300 bg-slate-950 overflow-auto max-h-[380px] leading-relaxed select-all">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Instructions bottom panel */}
      <div className="p-3 bg-slate-900/50 border-t border-slate-800 space-y-2">
        {activeTab === 'ps1' && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-slate-200 flex items-center gap-1 uppercase tracking-wider">
              <TerminalSquare className="h-3.5 w-3.5 text-blue-400" />
              PowerShell 脚本使用教程
            </h4>
            <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-0.5">
              <li>点击右上角 <span className="text-blue-400">下载</span> 保存为 <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">run_mineru.ps1</code> 并放入项目根目录。</li>
              <li>在 PowerShell 运行该脚本，它将自动检索并激活现有 <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">.venv</code>。</li>
              <li>脚本会自动递归扫描 <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">{params.inputPath}</code> 的所有 PDF，在 <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">{params.outputPath}</code> 输出结果。</li>
            </ol>
            <div className="p-2 bg-yellow-500/5 border border-yellow-500/10 rounded flex gap-2 items-start text-[10px] text-yellow-400/90 leading-relaxed">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                注意：首次运行若遇到执行策略限制，管理员模式下运行：<code className="bg-slate-950 px-1 rounded text-white font-mono">Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</code> 即可解锁。
              </span>
            </div>
          </div>
        )}

        {activeTab === 'py' && (
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-slate-200 flex items-center gap-1 uppercase tracking-wider">
              <Play className="h-3.5 w-3.5 text-blue-400" />
              本地 Python WebUI 启动教程
            </h4>
            <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-0.5">
              <li>下载 <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded">webui.py</code> 保存到项目根目录下。</li>
              <li>PowerShell 激活虚拟环境: <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">.venv\Scripts\Activate.ps1</code></li>
              <li>运行启动: <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">python webui.py</code></li>
              <li>打开浏览器访问 <span className="text-blue-400 font-medium">http://127.0.0.1:7860</span> 即可开启本地精美可视化提取。</li>
            </ol>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-1 text-[10px] text-slate-400">
            <p>这是 MinerU 底层核心的参数配置文件。一般存放在您的系统用户目录中：<code className="text-slate-300 bg-slate-950 px-1 rounded">~/.magic-pdf.json</code> 或 <code className="text-slate-300 bg-slate-950 px-1 rounded">C:\Users\用户名\magic-pdf.json</code>。</p>
            <p>合并此 JSON 后，本地 magic-pdf 命令行工具也将完全使用您在左侧定制的高级参数配置（如 OCR 设定、公式 LaTeX 输出支持等）。</p>
          </div>
        )}
      </div>
    </div>
  );
}
