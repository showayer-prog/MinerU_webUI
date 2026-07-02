import React, { useState } from 'react';
import { MinerUParams } from '../types';
import { Sparkles, FileText, Cpu, Check, Code, Eye, RefreshCw } from 'lucide-react';

interface PlaygroundProps {
  params: MinerUParams;
}

export default function Playground({ params }: PlaygroundProps) {
  const [docName, setDocName] = useState<string>('sample_formula_sheet.pdf');
  const [prompt, setPrompt] = useState<string>('机器学习梯度下降、Hessian矩阵公式，以及相关的超参数对比表格');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ markdown: string; layoutStructure: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'layout'>('preview');

  const handleAIExtract = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: docName,
          contentPrompt: prompt,
          mode: params.mode,
          extractTable: params.extractTable,
          extractFormula: params.extractFormula
        })
      });
      const data = await response.json();
      if (data.success) {
        setResult({
          markdown: data.markdown,
          layoutStructure: data.layoutStructure
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Pre-populate if empty on click
  const triggerExample = (examplePrompt: string, name: string) => {
    setPrompt(examplePrompt);
    setDocName(name);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 shadow-xl space-y-4 text-slate-300" id="ai-playground">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">提取沙盒 (Playground)</h2>
            <p className="text-[10px] text-slate-500">结合 Gemini AI 模拟并可视化 magic-pdf 的版面分析与提取</p>
          </div>
        </div>

        <button
          onClick={handleAIExtract}
          disabled={loading || !prompt}
          className={`px-3 py-1.5 text-[10px] font-semibold rounded flex items-center gap-1.5 transition-all ${
            loading
              ? 'bg-indigo-900/30 text-indigo-400 cursor-wait'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              分析版面中...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              模拟生成版面
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Input Configuration */}
        <div className="lg:col-span-2 space-y-3">
          <div className="space-y-2.5 bg-black/20 p-3 rounded border border-slate-800/80">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              虚拟文档属性
            </h3>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">虚拟文件名称 (含后缀)</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-2 py-1 bg-black/40 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="document_spec.pdf / docx / pptx / png"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">内容大纲 / 要包含的公式或表格</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1 bg-black/40 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-normal"
                  placeholder="例如: 关于梯度下降的数学推导公式，包含一个损失函数对比表格..."
                />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-medium block">快捷加载多格式模板:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '神经网络推导 (PDF)', name: 'cnn_backprop.pdf', desc: '卷积神经网络前向传播数学推导' },
                  { label: '量子学大纲 (DOCX)', name: 'quantum_theory.docx', desc: '量子力学薛定谔方程与算符本征态解Word结构文档' },
                  { label: '商业规划 (PPTX)', name: 'business_strategy.pptx', desc: '未来五年核心季度营收状况与各产品线利润率分析演示幻灯片' },
                  { label: '手写物理公式 (PNG)', name: 'scanned_physics_card.png', desc: '包含麦克斯韦方程组手写扫描版物理卡片公式及文字识别' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerExample(preset.desc, preset.name)}
                    className="text-[9px] px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/60 rounded text-slate-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded space-y-0.5">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              YOLO 提取原理
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              MinerU 使用 **YOLOv8-Layout** 模型来精确定位数学公式、表格及正文区域，并由底层解析器转换为高清 Markdown 格式。
            </p>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-3 bg-black border border-slate-850 rounded-lg flex flex-col min-h-[300px] max-h-[330px] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-850">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 text-[10px] rounded transition-all flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-slate-800 text-slate-100 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Eye className="h-3 w-3" />
                排版效果
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 text-[10px] rounded transition-all flex items-center gap-1 ${
                  activeTab === 'code'
                    ? 'bg-slate-800 text-slate-100 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Code className="h-3 w-3" />
                MD 源码
              </button>
              <button
                onClick={() => setActiveTab('layout')}
                className={`px-2 py-1 text-[10px] rounded transition-all flex items-center gap-1 ${
                  activeTab === 'layout'
                    ? 'bg-slate-800 text-slate-100 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Cpu className="h-3 w-3" />
                YOLO 标注
              </button>
            </div>
            {result && (
              <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                <Check className="h-3 w-3" />
                模拟分析完成
              </span>
            )}
          </div>

          <div className="flex-1 p-3 overflow-y-auto bg-slate-950/95 text-slate-200 text-xs">
            {!result ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-600 space-y-1.5">
                <Sparkles className="h-6 w-6 text-slate-700 animate-pulse" />
                <div className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">暂无内容</div>
                <div className="text-[9px] text-slate-600 text-center max-w-[240px] leading-relaxed">
                  填写左侧的大纲特征，点击上方 【模拟生成版面】 预览提取结果
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'preview' && (
                  <div className="space-y-4 prose prose-invert select-text leading-relaxed font-mono text-[10px] sm:text-[11px] text-slate-300">
                    <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">
                      {result.markdown}
                    </pre>
                  </div>
                )}

                {activeTab === 'code' && (
                  <pre className="text-[10px] sm:text-[11px] font-mono text-slate-300 whitespace-pre-wrap select-all p-2 bg-slate-900 rounded">
                    {result.markdown}
                  </pre>
                )}

                {activeTab === 'layout' && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 mb-1.5 bg-slate-900 p-2 rounded border border-slate-800/60 font-semibold uppercase tracking-wider">
                      🎯 YOLO-Layout 检测区域结果：
                    </div>
                    <div className="relative border border-slate-800/80 bg-slate-900/40 p-2 rounded space-y-1.5 max-h-[200px] overflow-y-auto">
                      {result.layoutStructure?.map((item: any, i: number) => {
                        let colorClass = 'border-blue-500 bg-blue-500/10 text-blue-400';
                        if (item.type === 'formula') colorClass = 'border-purple-500 bg-purple-500/10 text-purple-400';
                        if (item.type === 'table') colorClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                        if (item.type === 'header') colorClass = 'border-orange-500 bg-orange-500/10 text-orange-400';
                        
                        return (
                          <div key={i} className={`p-1.5 border rounded flex flex-col space-y-0.5 ${colorClass}`}>
                            <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
                              <span>{item.type} block</span>
                              <span>BBOX: [{item.bbox ? item.bbox.join(', ') : '0, 0, 0, 0'}]</span>
                            </div>
                            <div className="text-[10px] font-semibold truncate">{item.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
