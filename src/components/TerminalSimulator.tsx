import React, { useState } from 'react';
import { MinerUParams, ProcessingLog, FileStatus } from '../types';
import { Play, RotateCcw, AlertCircle, CheckCircle, Terminal, HelpCircle, HardDrive, Plus, Trash2 } from 'lucide-react';

interface TerminalSimulatorProps {
  params: MinerUParams;
}

const defaultFiles: FileStatus[] = [
  { path: '财务报表/2026_q2_report.pdf', relativePath: '财务报表', size: '4.2 MB', status: 'pending', mode: 'auto', progress: 0 },
  { path: '技术文档/architecture_design.docx', relativePath: '技术文档', size: '2.5 MB', status: 'pending', mode: 'auto', progress: 0 },
  { path: '产品展示/launch_presentation.pptx', relativePath: '产品展示', size: '8.4 MB', status: 'pending', mode: 'auto', progress: 0 },
  { path: '图表分析/accuracy_chart.png', relativePath: '图表分析', size: '1.1 MB', status: 'pending', mode: 'auto', progress: 0 },
  { path: '数据表格/sales_records.xlsx', relativePath: '数据表格', size: '0.9 MB', status: 'pending', mode: 'auto', progress: 0 }
];

export default function TerminalSimulator({ params }: TerminalSimulatorProps) {
  const [files, setFiles] = useState<FileStatus[]>(defaultFiles);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileDir, setNewFileDir] = useState<string>('');
  const [newFileSize, setNewFileSize] = useState<string>('2.5');

  const [activeInterval, setActiveInterval] = useState<any>(null);

  const addFile = () => {
    if (!newFileName) return;
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(newFileName);
    const cleanName = hasExtension ? newFileName : `${newFileName}.pdf`;
    const newFile: FileStatus = {
      path: (newFileDir ? `${newFileDir}/` : '') + cleanName,
      relativePath: newFileDir || '根目录',
      size: `${newFileSize} MB`,
      status: 'pending',
      mode: params.mode,
      progress: 0
    };
    setFiles([...files, newFile]);
    setNewFileName('');
    setNewFileDir('');
  };

  const deleteFile = (idx: number) => {
    if (isRunning) return;
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleStop = () => {
    if (!isRunning) return;
    if (activeInterval) {
      clearInterval(activeInterval);
      setActiveInterval(null);
    }
    setIsRunning(false);
    setActiveFileIdx(-1);

    const formattedTime = () => new Date().toLocaleTimeString();
    const stopLogs: ProcessingLog[] = [
      {
        id: `stop-${Date.now()}-1`,
        timestamp: formattedTime(),
        level: 'error',
        message: `==========================================================`
      },
      {
        id: `stop-${Date.now()}-2`,
        timestamp: formattedTime(),
        level: 'error',
        message: `🛑 [中止警告] 用户手动强制终止了批量转换模拟进程！`
      },
      {
        id: `stop-${Date.now()}-3`,
        timestamp: formattedTime(),
        level: 'warning',
        message: `   └─ 已终止 magic-pdf 的 CLI 子进程，释放正在占用的 .venv。`
      },
      {
        id: `stop-${Date.now()}-4`,
        timestamp: formattedTime(),
        level: 'warning',
        message: `   └─ 剩余等待中的文件解析已自动取消。`
      },
      {
        id: `stop-${Date.now()}-5`,
        timestamp: formattedTime(),
        level: 'error',
        message: `==========================================================`
      }
    ];
    setLogs(prev => [...prev, ...stopLogs]);

    // Mark active/pending files as failed/cancelled
    setFiles(prev => prev.map(f => f.status === 'processing' || f.status === 'pending' ? { ...f, status: 'failed', progress: 0 } : f));
  };

  const handleSimulate = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setActiveFileIdx(0);

    // Set files to pending
    setFiles(prev => prev.map(f => ({ ...f, status: 'pending', progress: 0 })));

    try {
      const response = await fetch('/api/simulate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, files })
      });
      const data = await response.json();

      if (data.success) {
        // Stream the logs into the UI sequentially to look like real execution!
        let currentLogIndex = 0;
        const allLogs: ProcessingLog[] = data.logs;

        const interval = setInterval(() => {
          if (currentLogIndex < allLogs.length) {
            const nextLog = allLogs[currentLogIndex];
            setLogs(prev => [...prev, nextLog]);

            // Map logs to visual progress and file status updates
            if (nextLog.message.includes('正在解析')) {
              const matchedFile = files.find(f => nextLog.message.includes(f.path.split('/').pop() || ''));
              if (matchedFile) {
                const idx = files.indexOf(matchedFile);
                setActiveFileIdx(idx);
                setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'processing', progress: 30 } : f));
              }
            } else if (nextLog.message.includes('解析成功')) {
              const matchedFile = files.find(f => nextLog.message.includes(f.path.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''));
              if (matchedFile) {
                const idx = files.indexOf(matchedFile);
                setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'completed', progress: 100 } : f));
              }
            } else if (nextLog.message.includes('解析失败')) {
              const matchedFile = files.find(f => nextLog.message.includes(f.path.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''));
              if (matchedFile) {
                const idx = files.indexOf(matchedFile);
                setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'failed', progress: 100 } : f));
              }
            }

            // Simple incremental total progress bar calculation
            setProgress(Math.round(((currentLogIndex + 1) / allLogs.length) * 100));
            currentLogIndex++;
          } else {
            clearInterval(interval);
            setActiveInterval(null);
            setIsRunning(false);
            setActiveFileIdx(-1);
          }
        }, 300); // Add next log line every 300ms

        setActiveInterval(interval);
      }
    } catch (e) {
      console.error(e);
      setIsRunning(false);
    }
  };

  const resetAll = () => {
    if (isRunning) return;
    setFiles(defaultFiles);
    setLogs([]);
    setProgress(0);
    setActiveFileIdx(-1);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 shadow-xl space-y-4 text-slate-300" id="terminal-simulator">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">批量转换模拟 (Simulator)</h2>
            <p className="text-[10px] text-slate-500">模拟本地 .venv 激活并运行 magic-pdf 的控制台打印</p>
          </div>
        </div>

        <div className="flex space-x-1.5">
          <button
            onClick={resetAll}
            disabled={isRunning}
            className="p-1.5 bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded text-[10px] transition-all flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            重置
          </button>
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold rounded flex items-center gap-1 transition-all"
            >
              <AlertCircle className="h-3 w-3" />
              停止模拟
            </button>
          ) : (
            <button
              onClick={handleSimulate}
              disabled={files.length === 0}
              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-[10px] font-semibold rounded flex items-center gap-1 transition-all"
            >
              <Play className="h-3 w-3" />
              启动模拟
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Side: Mock Files Controller */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-black/20 border border-slate-800/80 rounded p-3 space-y-2.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-blue-400" />
              待处理 PDF 队列 ({files.length} 个)
            </h3>

            {/* List of Files */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {files.length === 0 ? (
                <div className="text-[10px] text-slate-500 text-center py-4">无待处理文件，请在下方添加</div>
              ) : (
                files.map((file, i) => (
                  <div
                    key={i}
                    className={`p-1.5 rounded border text-[11px] flex justify-between items-center transition-all ${
                      activeFileIdx === i
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : file.status === 'completed'
                        ? 'bg-[#111827]/40 border-slate-800/80'
                        : 'bg-black/30 border-slate-900'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-mono text-slate-300 truncate font-semibold">{file.path.split('/').pop()}</div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">
                        层级: {file.relativePath} | 体积: {file.size}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                      <span className={`text-[9px] px-1 py-0.2 rounded ${
                        file.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : file.status === 'processing'
                          ? 'bg-blue-500/10 text-blue-400 animate-pulse'
                          : file.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {file.status === 'completed' && '成功'}
                        {file.status === 'processing' && '解析中'}
                        {file.status === 'failed' && '失败'}
                        {file.status === 'pending' && '等待中'}
                      </span>

                      <button
                        onClick={() => deleteFile(i)}
                        disabled={isRunning}
                        className="text-slate-600 hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* File Adding Form */}
            <div className="pt-2 border-t border-slate-900/80 grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="文件名 (例如: doc_01.pdf)"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-2 py-1 bg-black/40 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="子文件夹层级"
                  value={newFileDir}
                  onChange={(e) => setNewFileDir(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-2 py-1 bg-black/40 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="大小(MB)"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-2 py-1 bg-black/40 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addFile}
                  disabled={isRunning || !newFileName}
                  className="px-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded text-xs transition-all flex items-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Running State Board */}
          <div className="bg-black/20 border border-slate-800/80 rounded p-3 space-y-2.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              提取全局进度
            </h3>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>批处理总体完成度</span>
                <span className="font-mono text-emerald-400 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px] text-slate-400">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span>成功数: {files.filter(f => f.status === 'completed').length} 个</span>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-rose-400" />
                <span>失败数: {files.filter(f => f.status === 'failed').length} 个</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log Console emulator */}
        <div className="lg:col-span-3 bg-black border border-slate-850 rounded-lg shadow-2xl flex flex-col h-[320px]">
          {/* CLI window header bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 select-none">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-400 font-mono text-[10px] ml-1">
                PowerShell - MinerU Batch Simulator
              </span>
            </div>
            <HelpCircle className="h-3 w-3 text-slate-600" />
          </div>

          {/* Console content */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] sm:text-[11px] text-slate-300 space-y-0.5 bg-black/95 select-all">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-1.5">
                <Terminal className="h-6 w-6 text-slate-700 stroke-[1.5]" />
                <div className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">等待点击上方 【一键启动模拟】</div>
                <div className="text-[9px] text-slate-600 text-center max-w-[240px] leading-relaxed">
                  模拟程序将完整还原 PowerShell 在激活 .venv 运行 magic-pdf 命令时的打印输出
                </div>
              </div>
            ) : (
              logs.map((log) => {
                let colorClass = 'text-slate-300';
                if (log.level === 'success') colorClass = 'text-emerald-400 font-semibold';
                if (log.level === 'warning') colorClass = 'text-yellow-400';
                if (log.level === 'error') colorClass = 'text-rose-400 font-semibold';
                
                // Keep dividing line neutral
                if (log.message.startsWith('==') || log.message.startsWith('--')) {
                  colorClass = 'text-slate-600';
                }

                return (
                  <div key={log.id} className="flex space-x-1.5 select-text">
                    <span className="text-slate-700 select-none text-[9px] pt-0.5">{log.timestamp}</span>
                    <span className={colorClass}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
