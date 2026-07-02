import React from 'react';
import { MinerUParams } from '../types';
import { FolderOpen, Settings, Sliders, ToggleLeft, Layers, BookOpen, Cpu } from 'lucide-react';

interface ParameterPanelProps {
  params: MinerUParams;
  onChange: (newParams: MinerUParams) => void;
}

export default function ParameterPanel({ params, onChange }: ParameterPanelProps) {
  const handleChange = (key: keyof MinerUParams, value: any) => {
    onChange({
      ...params,
      [key]: value
    });
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 shadow-xl space-y-4 text-slate-300" id="parameter-panel">
      {/* Panel Header */}
      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
          <Settings className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">配置参数 (Config)</h2>
          <p className="text-[10px] text-slate-500">可视化调整 magic-pdf 解析偏好</p>
        </div>
      </div>

      {/* Directory Config */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
          路径设置
        </h3>
        
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">输入目录 (PDF/Word/PPT/图片等)</label>
            <div className="relative">
              <input
                type="text"
                value={params.inputPath}
                onChange={(e) => handleChange('inputPath', e.target.value)}
                placeholder="./input"
                className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-2.5 top-1.5 text-[9px] text-slate-600 select-none">本地路径</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">解析输出目录</label>
            <div className="relative">
              <input
                type="text"
                value={params.outputPath}
                onChange={(e) => handleChange('outputPath', e.target.value)}
                placeholder="./output"
                className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-2.5 top-1.5 text-[9px] text-slate-600 select-none">输出位置</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-slate-800/80 mt-1">
            <div className="flex flex-col pr-2">
              <span className="text-[11px] font-medium text-slate-300">递归扫描子目录</span>
              <span className="text-[9px] text-slate-500">完美扫描并重建子级层级结构</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={params.recursive}
                onChange={(e) => handleChange('recursive', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Parser Mode Selection */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-blue-400" />
          解析模式 (Method)
        </h3>
        
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'auto', title: '智能研判', desc: 'Auto' },
            { id: 'ocr', title: '强制 OCR', desc: '影印版' },
            { id: 'txt', title: '文本提取', desc: '极速' }
          ].map((modeOption) => (
            <button
              key={modeOption.id}
              onClick={() => handleChange('mode', modeOption.id)}
              className={`p-1.5 rounded border text-center transition-all duration-250 ${
                params.mode === modeOption.id
                  ? 'bg-blue-600/20 border-blue-600 text-blue-400 font-semibold'
                  : 'bg-[#1e293b]/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="text-[11px]">{modeOption.title}</div>
              <div className="text-[9px] opacity-70 mt-0.5">{modeOption.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Extraction Options */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          提取精细控制
        </h3>

        <div className="space-y-1.5">
          {/* Table */}
          <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-slate-800/80">
            <div>
              <span className="text-[11px] font-medium text-slate-300 block">高精度表格结构识别</span>
              <span className="text-[9px] text-slate-500 block">还原表格至标准 MD 表格式</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={params.extractTable}
                onChange={(e) => handleChange('extractTable', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Formula */}
          <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-slate-800/80">
            <div>
              <span className="text-[11px] font-medium text-slate-300 block">数学公式/符号 LaTeX 转换</span>
              <span className="text-[9px] text-slate-500 block">数学公式还原成 LaTeX $ 形式</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={params.extractFormula}
                onChange={(e) => handleChange('extractFormula', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Save Layout images */}
          <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-slate-800/80">
            <div>
              <span className="text-[11px] font-medium text-slate-300 block">保存版面分析分割图</span>
              <span className="text-[9px] text-slate-500 block">输出分割边界(save-layout-images)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={params.outputLayoutImages}
                onChange={(e) => handleChange('outputLayoutImages', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* OCR & Model Config */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-blue-400" />
          OCR 与并发设置
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">OCR 主语言</label>
            <select
              value={params.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 rounded p-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="ch_sim">中文 (ch_sim)</option>
              <option value="en">英文 (en)</option>
              <option value="ja">日语 (ja)</option>
              <option value="ko">韩语 (ko)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">并行线程数</label>
            <select
              value={params.concurrency}
              onChange={(e) => handleChange('concurrency', Number(e.target.value))}
              className="w-full bg-[#1e293b] border border-slate-700 rounded p-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value={1}>1 (单线程)</option>
              <option value={2}>2 (建议)</option>
              <option value={4}>4 (多核)</option>
              <option value={8}>8 (集群)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Mode Config */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-blue-400" />
          运行显卡设备 (Device)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onChange({
                ...params,
                deviceMode: 'cpu',
                processingMethod: 'pipeline'
              });
            }}
            className={`p-2 rounded border text-left transition-all duration-250 flex flex-col justify-between h-full ${
              params.deviceMode === 'cpu'
                ? 'bg-blue-600/20 border-blue-600 text-blue-400 font-semibold'
                : 'bg-[#1e293b]/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="text-[11px] font-bold">仅 CPU (无独立显卡)</div>
            <div className="text-[9px] opacity-75 mt-0.5 leading-relaxed">安全兼容，推荐无独立显卡机器使用 (安装 mineru)</div>
          </button>

          <button
            onClick={() => handleChange('deviceMode', 'cuda')}
            className={`p-2 rounded border text-left transition-all duration-250 flex flex-col justify-between h-full ${
              params.deviceMode === 'cuda'
                ? 'bg-blue-600/20 border-blue-600 text-blue-400 font-semibold'
                : 'bg-[#1e293b]/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="text-[11px] font-bold">NVIDIA GPU (CUDA加速)</div>
            <div className="text-[9px] opacity-75 mt-0.5 leading-relaxed">极速运行，需配备 NVIDIA 独显 (安装 mineru[all])</div>
          </button>
        </div>
      </div>

      {/* Processing Engine Config */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-blue-400" />
          处理算法/引擎 (Engine)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleChange('processingMethod', 'pipeline')}
            className={`p-2 rounded border text-left transition-all duration-250 flex flex-col justify-between h-full ${
              params.processingMethod === 'pipeline'
                ? 'bg-blue-600/20 border-blue-600 text-blue-400 font-semibold'
                : 'bg-[#1e293b]/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="text-[11px] font-bold">Pipeline (常规解析)</div>
            <div className="text-[9px] opacity-75 mt-0.5 leading-relaxed">
              基于 YOLO/Layout/OCR 传统排版。支持 CPU/GPU，兼容性好，适合普通电脑。
            </div>
          </button>

          <button
            onClick={() => {
              onChange({
                ...params,
                processingMethod: 'hybrid',
                deviceMode: 'cuda'
              });
            }}
            className={`p-2 rounded border text-left transition-all duration-250 flex flex-col justify-between h-full ${
              params.processingMethod === 'hybrid'
                ? 'bg-blue-600/20 border-blue-600 text-blue-400 font-semibold'
                : 'bg-[#1e293b]/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="text-[11px] font-bold">Hybrid (VLM多模态)</div>
            <div className="text-[9px] opacity-75 mt-0.5 leading-relaxed">
              最新大模型图文交互。解析更精准，但<strong>强制要求 GPU/CUDA</strong>。
            </div>
          </button>
        </div>
      </div>

      {/* Local Environment Tips */}
      <div className="p-2.5 bg-[#1e293b]/10 rounded border border-slate-800/60 space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Cpu className="h-3 w-3 text-emerald-400" />
          运行环境提示
        </h4>
        <p className="text-[9px] text-slate-500 leading-relaxed">
          这些设置在生成 PowerShell 脚本和 Gradio WebUI 程序时将实时生效，完美适配您的本地环境。
        </p>
      </div>
    </div>
  );
}
