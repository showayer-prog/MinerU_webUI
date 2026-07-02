import React, { useState } from 'react';
import { MinerUParams } from './types';
import ParameterPanel from './components/ParameterPanel';
import CodeGenerator from './components/CodeGenerator';
import TerminalSimulator from './components/TerminalSimulator';
import Playground from './components/Playground';
import { Layers, Terminal, FileCode, Cpu, Sparkles, BookOpen, ExternalLink, RefreshCw, FolderClosed, ShieldCheck } from 'lucide-react';

const defaultParams: MinerUParams = {
  inputPath: './input',
  outputPath: './output',
  mode: 'auto',
  recursive: true,
  extractFormula: true,
  extractTable: true,
  language: 'ch_sim',
  outputLayoutImages: false,
  concurrency: 2,
  deviceMode: 'cpu',
  processingMethod: 'pipeline'
};

export default function App() {
  const [params, setParams] = useState<MinerUParams>(defaultParams);
  const [activeRightTab, setActiveRightTab] = useState<'scripts' | 'simulation' | 'ai_sandbox'>('scripts');

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-300 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* High Density Header */}
      <header className="h-14 border-b border-slate-800 bg-[#111827] flex items-center justify-between px-4 sm:px-6 shrink-0 z-10" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-100 flex items-center gap-2">
              MinerU Batch Engine <span className="text-slate-500 font-normal text-xs">v0.10.2</span>
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-500">
              PDF 高清排版 & 公式多维提取控制台 (PowerShell + Python .venv)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-slate-400">.venv: active</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono text-blue-400">
            <span>PS&gt; powershell.exe</span>
          </div>
          <a 
            href="https://github.com/opendatalab/MinerU" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded flex items-center gap-1 transition-all"
          >
            <BookOpen className="h-3 w-3" />
            <span className="hidden sm:inline">开源仓库</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col space-y-4">
        
        {/* Feature Stat Highlight Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="stats-dashboard">
          <div className="bg-[#0f172a]/60 border border-slate-800/80 p-3 rounded-lg flex items-center space-x-3 shadow-sm">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
              <FolderClosed className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">目录结构</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">保持原目录递归重建</div>
            </div>
          </div>

          <div className="bg-[#0f172a]/60 border border-slate-800/80 p-3 rounded-lg flex items-center space-x-3 shadow-sm">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">自动化加载</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">自动探测激活虚拟环境</div>
            </div>
          </div>

          <div className="bg-[#0f172a]/60 border border-slate-800/80 p-3 rounded-lg flex items-center space-x-3 shadow-sm">
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">控制支持</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">PS 脚本 & Gradio UI</div>
            </div>
          </div>

          <div className="bg-[#0f172a]/60 border border-slate-800/80 p-3 rounded-lg flex items-center space-x-3 shadow-sm">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">隔离机制</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">输出物理路径隔离保护</div>
            </div>
          </div>
        </div>

        {/* Dashboard Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* Left Parameter Panel (1 span) */}
          <div className="lg:col-span-1">
            <ParameterPanel params={params} onChange={setParams} />
          </div>

          {/* Right Interactive Area (2 spans) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* View Selector Tabs */}
            <div className="bg-[#0f172a] border border-slate-800 p-1 rounded-lg flex space-x-1 shadow-md">
              <button
                onClick={() => setActiveRightTab('scripts')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'scripts'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>脚本与配置生成器</span>
              </button>
              <button
                onClick={() => setActiveRightTab('simulation')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'simulation'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>批处理模拟终端</span>
              </button>
              <button
                onClick={() => setActiveRightTab('ai_sandbox')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'ai_sandbox'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>提取沙盒 Playground</span>
              </button>
            </div>

            {/* Render Active Tab */}
            {activeRightTab === 'scripts' && <CodeGenerator params={params} />}
            {activeRightTab === 'simulation' && <TerminalSimulator params={params} />}
            {activeRightTab === 'ai_sandbox' && <Playground params={params} />}

          </div>
        </div>

        {/* Informative Step-by-Step setup footer */}
        <section className="bg-[#0f172a]/30 border border-slate-800 rounded-lg p-4 space-y-3" id="workflow-section">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            本地部署与运行完整工作流
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-400">
            <div className="space-y-1.5 p-3 bg-black/40 border border-slate-900 rounded">
              <div className="flex items-center space-x-2">
                <span className="w-4.5 h-4.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-[9px]">1</span>
                <span className="font-semibold text-slate-300">安装核心依赖</span>
              </div>
              <p className="leading-relaxed">本地 PowerShell 创建虚拟环境并安装 MinerU 模型：</p>
              <pre className="p-1.5 bg-black text-[9px] font-mono text-slate-400 rounded border border-slate-800 overflow-x-auto">
                {`python -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npip install --upgrade pip\npip install uv\nuv pip install -U "${params.deviceMode === 'cpu' ? 'mineru' : 'mineru[all]'}"`}
              </pre>
            </div>

            <div className="space-y-1.5 p-3 bg-black/40 border border-slate-900 rounded">
              <div className="flex items-center space-x-2">
                <span className="w-4.5 h-4.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-[9px]">2</span>
                <span className="font-semibold text-slate-300">配置并获取脚本</span>
              </div>
              <p className="leading-relaxed">在左侧可视化参数面板中微调输入、输出目录和提取控制。然后选择最适合您的控制中心：</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400">
                <li>下载 <code className="bg-black/80 text-slate-300 px-1 rounded">run_mineru.ps1</code> 进行原生命令行无损多线程转换。</li>
                <li>下载 <code className="bg-black/80 text-slate-300 px-1 rounded">webui.py</code> 在本地启动独立的可视化浏览器交互页面。</li>
              </ul>
            </div>

            <div className="space-y-1.5 p-3 bg-black/40 border border-slate-900 rounded">
              <div className="flex items-center space-x-2">
                <span className="w-4.5 h-4.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-[9px]">3</span>
                <span className="font-semibold text-slate-300">享受排版输出</span>
              </div>
              <p className="leading-relaxed">运行对应的脚本文件。无论层级多深、目录多复杂，提取出的 Markdown、高清公式及表格图表都会被原封不动保存：</p>
              <pre className="p-1.5 bg-black text-[9px] font-mono text-slate-400 rounded border border-slate-800 overflow-x-auto">
                {`# 运行本地可视化界面\npython webui.py\n\n# 运行 PowerShell 批处理\n.\\run_mineru.ps1`}
              </pre>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center text-[10px] text-slate-500 pt-3 border-t border-slate-900 select-none">
          <p>MinerU 批量提取可视化控制中心 © 2026. 专为 PDF / 影印排版高清提取设计。</p>
        </footer>
      </div>
    </div>
  );
}
