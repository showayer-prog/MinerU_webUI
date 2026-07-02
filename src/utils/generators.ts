import { MinerUParams } from '../types';

export function generatePowerShellScript(params: MinerUParams): string {
  const recursiveStr = params.recursive ? '$true' : '$false';
  const tableStr = params.extractTable ? '$true' : '$false';
  const formulaStr = params.extractFormula ? '$true' : '$false';
  
  return `# run_mineru.ps1
# MinerU 批量处理脚本 (适用于 PowerShell + .venv 环境)
# 自动递归扫描指定目录下的 PDF/Office/图片并输出到目标 output 文件夹，保留子目录层级结构。

param (
    [string]$InputPath = "${params.inputPath}",
    [string]$OutputPath = "${params.outputPath}",
    [string]$Mode = "${params.mode}",
    [bool]$Recursive = ${recursiveStr},
    [bool]$EnableTable = ${tableStr},
    [bool]$EnableFormula = ${formulaStr},
    [string]$Language = "${params.language}"
)

# 清屏并设置编码，防止中文路径或名称乱码
Clear-Host
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             MinerU 多格式批量提取工具 (PowerShell)         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "输入目录: $InputPath" -ForegroundColor White
Write-Host "输出目录: $OutputPath" -ForegroundColor White
Write-Host "处理模式: $Mode (auto:自动 / ocr:强行OCR / txt:纯文本)" -ForegroundColor White
Write-Host "递归子目录: $Recursive" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

# 1. 自动寻找并激活虚拟环境
$venvActivated = $false
$venvPaths = @(
    ".venv\\Scripts\\Activate.ps1",
    "venv\\Scripts\\Activate.ps1",
    "..\\.venv\\Scripts\\Activate.ps1"
)

foreach ($path in $venvPaths) {
    if (Test-Path $path) {
        Write-Host "[1/3] 正在激活 Python 虚拟环境: $path..." -ForegroundColor Yellow
        . $path
        $venvActivated = $true
        break
    }
}

if (-not $venvActivated) {
    Write-Host "[1/3] [警告] 未在常规路径下找到 .venv 激活脚本，将在系统当前环境中执行..." -ForegroundColor DarkYellow
}

# 2. 检测 mineru 或 magic-pdf 是否可用 (优先推荐并采用 mineru 统一命令行包)
$minerUCmd = ""
$preferredCmd = "mineru"

if (Get-Command $preferredCmd -ErrorAction SilentlyContinue) {
    $minerUCmd = $preferredCmd
} elseif (Get-Command magic-pdf -ErrorAction SilentlyContinue) {
    Write-Host "[提示] 本地未找到 mineru 统一命令，自动降级为使用 magic-pdf 经典引擎进行管道提取..." -ForegroundColor Yellow
    $minerUCmd = "magic-pdf"
}

if ($minerUCmd -eq "") {
    Write-Host "[错误] 未在当前虚拟或全局 Python 环境下检测到 'mineru' 或任何兼容的 'magic-pdf' 命令行工具。" -ForegroundColor Red
    Write-Host "提示: 请确保你已正确安装 MinerU 核心依赖，最新版本 (v3.4.0+) 安装命令为:" -ForegroundColor White
    Write-Host "  pip install --upgrade pip" -ForegroundColor Cyan
    Write-Host "  pip install uv" -ForegroundColor Cyan
    Write-Host "  uv pip install -U ""${params.deviceMode === 'cpu' ? 'mineru' : 'mineru[all]'}"_"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "按下任意键退出脚本..." -ForegroundColor Gray
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host "[2/3] 检测并采用核心处理引擎: '$minerUCmd'。" -ForegroundColor Green

# 自动生成或更新本地配置文件 magic-pdf.json，解决无独立显卡的 CUDA 报错
$userHome = [System.Environment]::GetFolderPath('UserProfile')
$configPath = Join-Path $userHome "magic-pdf.json"
$configContent = @"
{
  "bucket_info": {
    "bucket_name": "magic-pdf",
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "endpoint_url": "YOUR_ENDPOINT_URL"
  },
  "device-mode": "${params.deviceMode}",
  "layout-model": "doclayout_yolo",
  "formula-enable": ${params.extractFormula ? 'true' : 'false'},
  "table-enable": ${params.extractTable ? 'true' : 'false'},
  "ocr-language": "${params.language}",
  "models-dir": "~/.magic-pdf/models",
  "save-layout-images": ${params.outputLayoutImages ? 'true' : 'false'}
}
"@

try {
    [System.IO.File]::WriteAllText($configPath, $configContent, [System.Text.Encoding]::UTF8)
    Write-Host "[配置] 已自动部署/更新 MinerU 运行参数配置文件: $configPath (设为 ${params.deviceMode} 运算模式)" -ForegroundColor DarkGreen
} catch {
    Write-Host "[警告] 自动写入配置文件 magic-pdf.json 失败，请检查写入权限。" -ForegroundColor Yellow
}

# 3. 收集并解析输入路径中的所有支持的文件 (PDF, Office, 图片)
$inputFullPath = [System.IO.Path]::GetFullPath($InputPath)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)

if (-not (Test-Path $inputFullPath)) {
    Write-Host "[错误] 输入目录不存在: $inputFullPath" -ForegroundColor Red
    exit
}

if (-not (Test-Path $outputFullPath)) {
    New-Item -ItemType Directory -Force -Path $outputFullPath | Out-Null
}

# MinerU 完美支持的后缀过滤
$extensions = @("*.pdf", "*.docx", "*.pptx", "*.xlsx", "*.png", "*.jpg", "*.jpeg", "*.bmp", "*.webp")

$files = @()
if ($Recursive) {
    $files = Get-ChildItem -Path $inputFullPath -Include $extensions -Recurse
} else {
    $files = Get-ChildItem -Path $inputFullPath -Include $extensions
}

if ($files.Count -eq 0) {
    Write-Host "[提示] 未在输入文件夹下扫描到任何 PDF, Word, PPT, Excel 或图片文件。" -ForegroundColor Yellow
    Write-Host "按下任意键退出..." -ForegroundColor Gray
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "[3/3] 成功扫描到待处理 MinerU 任务共: $($files.Count) 个文件" -ForegroundColor Green
Write-Host "开始提取任务..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

$index = 0
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $index++
    $relativeDir = ""
    
    # 获取文件的相对子目录层级，以便在 output 文件夹中完美复现
    if ($Recursive) {
        $parentPath = $file.DirectoryName
        if ($parentPath.Length -gt $inputFullPath.Length) {
            $relativeDir = $parentPath.Substring($inputFullPath.Length)
            # 去除开头的斜杠
            $relativeDir = $relativeDir -replace '^[\\/]', ''
        }
    }
    
    # 确定输出目标目录
    $targetOutputDir = if ($relativeDir -ne "") { Join-Path $outputFullPath $relativeDir } else { $outputFullPath }
    
    if (-not (Test-Path $targetOutputDir)) {
        New-Item -ItemType Directory -Force -Path $targetOutputDir | Out-Null
    }

    Write-Host "[$index/$($files.Count)] ⏳ 正在处理: $($file.Name)" -ForegroundColor Cyan
    if ($relativeDir -ne "") {
        Write-Host "   📁 子目录结构: $relativeDir" -ForegroundColor DarkGray
    }
    Write-Host "   📥 文件路径: $($file.FullName)" -ForegroundColor DarkGray
    Write-Host "   📤 输出目录: $targetOutputDir" -ForegroundColor DarkGray

    # 开始执行提取
    $procStart = Get-Date
    
    # 根据文件后缀及引擎决定提取策略
    $ext = $file.Extension.ToLower()
    $isMinerU = $minerUCmd -eq "mineru"
    
    if ($isMinerU) {
        if ($ext -in @(".png", ".jpg", ".jpeg", ".bmp", ".webp")) {
            Write-Host "   💡 检测到图片格式，通过 MinerU (Backend: ${params.processingMethod}) 开启统一 OCR 提取管线..." -ForegroundColor Yellow
            & $minerUCmd -p "$($file.FullName)" -o "$targetOutputDir" -b ${params.processingMethod} -m ocr
        } else {
            & $minerUCmd -p "$($file.FullName)" -o "$targetOutputDir" -b ${params.processingMethod} -m $Mode
        }
    } else {
        # 兼容老版/降级为 magic-pdf
        if ($ext -eq ".pdf") {
            & $minerUCmd -p "$($file.FullName)" -o "$targetOutputDir" -m $Mode
        } elseif ($ext -in @(".png", ".jpg", ".jpeg", ".bmp", ".webp")) {
            Write-Host "   💡 检测到图片格式，强制启用 OCR 版面提取模式..." -ForegroundColor Yellow
            & $minerUCmd -p "$($file.FullName)" -o "$targetOutputDir" -m ocr
        } else {
            & $minerUCmd -p "$($file.FullName)" -o "$targetOutputDir" -m $Mode
        }
    }

    if ($LASTEXITCODE -eq 0) {
        $procEnd = Get-Date
        $duration = ($procEnd - $procStart).ToString("hh\\:mm\\:ss")
        Write-Host "   -> [成功] 提取完成！耗时: $duration" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "   -> [错误] $minerUCmd 提取异常，退出代码: $LASTEXITCODE" -ForegroundColor Red
        $failCount++
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "                      批量任务处理完成                    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "统计数据:" -ForegroundColor White
Write-Host " - 扫描到文件数: $($files.Count)" -ForegroundColor White
Write-Host " - 成功解析数:   $successCount" -ForegroundColor Green
Write-Host " - 失败数:       $failCount" -ForegroundColor Red
Write-Host " - 提取结果目录: $outputFullPath" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "任务执行结束，按下任意键关闭窗口..." -ForegroundColor Gray
[void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
`;
}

export function generatePythonWebUI(params: MinerUParams): string {
  const recursiveStr = params.recursive ? 'True' : 'False';
  const tableStr = params.extractTable ? 'True' : 'False';
  const formulaStr = params.extractFormula ? 'True' : 'False';
  
  return `# -*- coding: utf-8 -*-
# webui.py
# MinerU 批量处理可视化程序 (专为 PowerShell + .venv 环境打造)
# 
# 运行方式:
# 1. 激活虚拟环境: .venv\\Scripts\\activate
# 2. 运行此脚本: python webui.py
# 3. 浏览器将自动打开 http://127.0.0.1:7860

import os
import sys
import subprocess
import time
from pathlib import Path

# 1. 尝试导入/自动安装 Gradio 依赖
try:
    import gradio as gr
except ImportError:
    print("[提示] 本地未检测到 gradio 库，正在通过 .venv 自动为您进行安装...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gradio"])
        import gradio as gr
        print("[成功] gradio 库安装完成！")
    except Exception as e:
        print(f"[错误] 自动安装 gradio 失败，请在命令行中手动执行: pip install gradio. 错误详情: {e}")
        sys.exit(1)

# 2. 全局参数及默认路径设定
processing_active = False
stop_requested = False
active_process = None
log_messages = []

def convert_image_to_pdf(img_path, pdf_path):
    try:
        from PIL import Image
        with Image.open(img_path) as im:
            if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[3] if im.mode == "RGBA" else None)
                bg.save(pdf_path, "PDF")
            else:
                im.convert("RGB").save(pdf_path, "PDF")
        return True
    except Exception as e:
        log_messages.append(f"   └─ ❌ 图像转换为 PDF 失败: {e}")
        return False

def get_default_paths():
    """获取程序所在的输入、输出文件夹默认路径"""
    root_path = Path.cwd()
    input_dir = root_path / "${params.inputPath}"
    output_dir = root_path / "${params.outputPath}"
    
    # 自动创建默认文件夹
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    return str(input_dir), str(output_dir)

def get_magic_pdf_cmd(processing_method):
    """获取可用的 MinerU 或 magic-pdf 命令。优先推荐并使用最稳定的 mineru 统一命令行包。"""
    venv_dir = Path(sys.executable).parent
    
    # 优先检测虚拟环境下的 mineru.exe / mineru
    candidates = [
        venv_dir / "mineru.exe",
        venv_dir / "mineru",
        venv_dir / "magic-pdf.exe",
        venv_dir / "magic-pdf",
        venv_dir / "magic_pdf.exe",
        venv_dir / "magic_pdf",
    ]
    
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return str(candidate)
            
    # 如果虚拟环境没有，优先检测全局 PATH 中是否存在 mineru，再检测 magic-pdf
    import shutil
    if shutil.which("mineru"):
        return "mineru"
    if shutil.which("magic-pdf"):
        return "magic-pdf"
        
    return "mineru"

def scan_files(input_path, recursive):
    """扫描指定目录下的所有 MinerU 支持的文件 (PDF, Office, 图片等)"""
    input_dir = Path(input_path)
    if not input_dir.exists() or not input_dir.is_dir():
        return []
    
    extensions = ["*.pdf", "*.docx", "*.pptx", "*.xlsx", "*.png", "*.jpg", "*.jpeg", "*.bmp", "*.webp"]
    files = []
    for ext in extensions:
        pattern = f"**/{ext}" if recursive else ext
        files.extend(input_dir.glob(pattern))
    
    # 根据文件名和路径排序，保证一致性
    return sorted(list(set(files)), key=lambda p: (p.parent, p.name))

def update_file_list_view(input_path, recursive):
    """在界面上刷新扫描到的文件列表"""
    files = scan_files(input_path, recursive)
    if not files:
        return "⚠️ 当前输入路径下没有找到任何支持的文件 (PDF/Word/PPT/图片等)。请放置文件后点击【扫描】。", []
    
    data = []
    for i, f in enumerate(files):
        try:
            # 获取相对路径，用于完美展示层级结构
            rel_path = f.relative_to(input_path)
        except ValueError:
            rel_path = f.name
            
        size_mb = round(f.stat().st_size / (1024 * 1024), 2)
        ext_type = f.suffix.upper()[1:]
        data.append([
            f.name,
            str(rel_path.parent) if str(rel_path.parent) != "." else "根目录",
            f"{size_mb} MB ({ext_type})",
            "等待处理"
        ])
        
    return f"🔍 扫描成功！共发现 {len(files)} 个待处理文件 (包含 PDF/Office/图片)。", data

def stop_batch_processing():
    """手动终止批处理进程"""
    global processing_active, stop_requested, active_process
    if not processing_active:
        return "ℹ️ 当前没有正在运行的提取任务。"
    
    stop_requested = True
    if active_process and active_process.poll() is None:
        try:
            active_process.terminate()
            active_process.wait(timeout=3)
        except Exception as e:
            if active_process and active_process.poll() is None:
                active_process.kill()
    return "🛑 已向提取进程发送终止信号，正在停止任务..."

def start_batch_processing(input_path, output_path, mode, recursive, table_rec, formula_rec, ocr_lang, device_mode, processing_method):
    """开始多文件批量提取主逻辑 (生成器函数，支持在 Gradio 界面实时刷新进度与日志)"""
    global processing_active, log_messages, stop_requested, active_process
    if processing_active:
        yield "⚠️ 任务已经在运行中，请勿重复点击！", gr.skip(), gr.skip()
        return
    
    processing_active = True
    stop_requested = False
    active_process = None
    log_messages = []
    
    input_dir = Path(input_path)
    output_dir = Path(output_path)
    
    if not input_dir.exists() or not input_dir.is_dir():
        processing_active = False
        yield f"❌ 输入路径不存在或不是文件夹: {input_path}", [], ""
        return
        
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 动态写入 magic-pdf.json 配置文件，确保运算模式和设备完美契合
    home_dir = Path.home()
    config_path = home_dir / "magic-pdf.json"
    config_content = f"""{{
  "bucket_info": {{
    "bucket_name": "magic-pdf",
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "endpoint_url": "YOUR_ENDPOINT_URL"
  }},
  "device-mode": "{device_mode}",
  "layout-model": "doclayout_yolo",
  "formula-enable": {str(formula_rec).lower()},
  "table-enable": {str(table_rec).lower()},
  "ocr-language": "{ocr_lang}",
  "models-dir": "~/.magic-pdf/models",
  "save-layout-images": "${params.outputLayoutImages ? 'true' : 'false'}"
}}"""
    try:
        config_path.write_text(config_content, encoding='utf-8')
        log_messages.append(f"ℹ️ [配置] 已动态刷新本地配置文件: {config_path} (运行设备偏好: {device_mode})")
    except Exception as e:
        log_messages.append(f"⚠️ [警告] 自动写入配置文件 magic-pdf.json 失败: {e}")

    # 3. 校验本机环境中是否存在 MinerU 核心 CLI 依赖
    magic_pdf_cmd = get_magic_pdf_cmd(processing_method)
    try:
        # 检测是否能找到 mineru/magic-pdf 命令 (在 Windows 上如果是原生名称则使用 shell=True)
        is_absolute = os.path.isabs(magic_pdf_cmd)
        subprocess.run(
            [magic_pdf_cmd, "--version"], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            shell=(os.name == "nt" and not is_absolute)
        )
    except FileNotFoundError:
        log_messages.append("❌ [核心错误] 本地环境未检测到 'mineru' 或 'magic-pdf' 可执行命令。")
        log_messages.append("请确保你的虚拟环境已正确激活，并按照 MinerU v3.4.0+ 官方指南完成安装：")
        log_messages.append("  当前 Python 路径: " + sys.executable)
        log_messages.append("  官方推荐安装流程:")
        log_messages.append("    pip install --upgrade pip")
        log_messages.append("    pip install uv")
        log_messages.append("    uv pip install -U \\"mineru[all]\\"\\n")
        processing_active = False
        yield "❌ 运行环境校验失败，缺少 MinerU / magic-pdf 依赖。", [], "\\n".join(log_messages)
        return

    # 4. 获取文件清单并初始化表格
    files = scan_files(input_path, recursive)
    if not files:
        processing_active = False
        yield "⚠️ 待处理文件为空，扫描后再启动。", [], ""
        return
        
    results_table = []
    for f in files:
        try:
            rel_path = f.relative_to(input_path)
        except ValueError:
            rel_path = f.name
        size_mb = round(f.stat().st_size / (1024 * 1024), 2)
        ext_type = f.suffix.upper()[1:]
        results_table.append([f.name, str(rel_path.parent) if str(rel_path.parent) != "." else "根目录", f"{size_mb} MB ({ext_type})", "队列中"])

    log_messages.append("==================================================================")
    log_messages.append("                      MinerU 批量提取任务启动                     ")
    log_messages.append("==================================================================")
    log_messages.append(f"📥 输入路径: {input_dir.resolve()}")
    log_messages.append(f"📤 输出结果路径: {output_dir.resolve()}")
    log_messages.append(f"🛠️ 处理模式: {mode} | 表格识别: {table_rec} | 公式识别: {formula_rec} | 主语言: {ocr_lang}")
    log_messages.append(f"📄 待处理文件总数: {len(files)}")
    log_messages.append("==================================================================\\n")
    
    yield "🚀 任务启动...", results_table, "\\n".join(log_messages)
    
    success_count = 0
    fail_count = 0
    
    for idx, f_path in enumerate(files):
        if stop_requested:
            log_messages.append("\\n🛑 [中止] 用户点击了终止按钮，后续文件提取已被中止！")
            for i in range(idx, len(files)):
                results_table[i][3] = "⏹️ 已中止"
            processing_active = False
            active_process = None
            yield "🛑 批量提取任务已被手动强行终止！", results_table, "\\n".join(log_messages)
            return

        # 标记当前文件为处理中
        results_table[idx][3] = "🔄 解析中..."
        log_messages.append(f"[{idx+1}/{len(files)}] 📄 正在解析: {f_path.name}")
        yield f"正在提取第 {idx+1}/{len(files)} 个文件...", results_table, "\\n".join(log_messages)
        
        # 5. 精确计算相对子目录，在 output 下完美复现目录结构
        try:
            relative_parent = f_path.parent.relative_to(input_dir)
            target_out_dir = output_dir / relative_parent
        except ValueError:
            target_out_dir = output_dir
            
        target_out_dir.mkdir(parents=True, exist_ok=True)
        
        log_messages.append(f"   └─ 结构层级: {relative_parent if str(relative_parent) != '.' else '根目录'}")
        log_messages.append(f"   └─ 目标输出: {target_out_dir.resolve()}")
        
        # 6. 组合并执行 magic-pdf / mineru 命令 (针对后缀自适应提取)
        magic_pdf_cmd = get_magic_pdf_cmd(processing_method)
        temp_pdf_path = None
        ext = f_path.suffix.lower()
        
        is_mineru_engine = "mineru" in Path(magic_pdf_cmd).name.lower()
        
        if is_mineru_engine:
            # 采用全新的 mineru 命令行统一入口
            cmd = [magic_pdf_cmd, "-p", str(f_path), "-o", str(target_out_dir), "-b", processing_method]
            if ext in [".png", ".jpg", ".jpeg", ".bmp", ".webp"]:
                cmd.extend(["-m", "ocr"])
                log_messages.append(f"   └─ 🚀 采用 MinerU 统一引擎直接解析图片 (Backend: {processing_method})，启用 OCR 提取管线...")
            else:
                cmd.extend(["-m", mode])
                log_messages.append(f"   └─ 🚀 采用 MinerU 统一引擎解析文档 (Backend: {processing_method}，模式: {mode})...")
        else:
            # 兼容老版本/降级环境采用 magic-pdf 命令行入口
            if ext == ".pdf":
                cmd = [magic_pdf_cmd, "-p", str(f_path), "-o", str(target_out_dir), "-m", mode]
            elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".webp"]:
                if device_mode == "cpu":
                    log_messages.append("   └─ 💡 检测到图片格式且运行于 CPU 模式下 (magic-pdf 降级方案)")
                    log_messages.append("   └─ 🔄 正在将图片无损转换为临时 PDF 文件以适配 CPU 提取管线...")
                    temp_pdf_path = f_path.with_suffix('.temp_img.pdf')
                    if convert_image_to_pdf(f_path, temp_pdf_path):
                        cmd = [magic_pdf_cmd, "-p", str(temp_pdf_path), "-o", str(target_out_dir), "-m", "ocr"]
                        log_messages.append("   └─ 🚀 转换成功！开始通过 CPU (magic-pdf) 进行 OCR 版面提取...")
                    else:
                        log_messages.append("   └─ ❌ 转换失败，回退尝试直接调用 (可能导致 CUDA 错误)...")
                        cmd = [magic_pdf_cmd, "-p", str(f_path), "-o", str(target_out_dir), "-m", "ocr"]
                else:
                    cmd = [magic_pdf_cmd, "-p", str(f_path), "-o", str(target_out_dir), "-m", "ocr"]
                    log_messages.append("   └─ 💡 检测到图片格式，强制启用 OCR 版面提取模式")
            else:
                cmd = [magic_pdf_cmd, "-p", str(f_path), "-o", str(target_out_dir), "-m", mode]
                log_messages.append(f"   └─ 💡 检测到 Office 格式 ({ext})，自适应调用 MinerU 提取转换引擎")
        
        proc_start = time.time()
        try:
            # 开启子进程，并重定向错误输出
            is_absolute = os.path.isabs(magic_pdf_cmd)
            active_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='ignore',
                shell=(os.name == "nt" and not is_absolute)
            )
            
            # 循环读取单行输出并动态反馈到 Web 界面上
            while True:
                if stop_requested:
                    if active_process and active_process.poll() is None:
                        active_process.terminate()
                        active_process.wait()
                    break
                line = active_process.stdout.readline()
                if not line and active_process.poll() is not None:
                    break
                if line:
                    clean_line = line.strip()
                    if clean_line:
                        # 过滤无用信息，将 MinerU 提取中的关键阶段 and 异常显示在界面
                        lower_line = clean_line.lower()
                        if any(kw in lower_line for kw in ["success", "fail", "error", "processing", "model", "page", "write", "extract"]):
                            log_messages.append(f"      [CLI] {clean_line}")
                            yield f"正在处理第 {idx+1}/{len(files)} 个文件: {f_path.name}", results_table, "\\n".join(log_messages)
            
            if stop_requested:
                log_messages.append("\\n🛑 [中止] 处理中途终止！")
                for i in range(idx, len(files)):
                    results_table[i][3] = "⏹️ 已中止"
                processing_active = False
                active_process = None
                yield "🛑 批量提取任务已被手动终止！", results_table, "\\n".join(log_messages)
                return

            active_process.wait()
            duration = round(time.time() - proc_start, 2)
            
            if active_process.returncode == 0:
                log_messages.append(f"   └─ ✅ 解析成功！(耗时: {duration}秒)\\n")
                results_table[idx][3] = f"✅ 成功 ({duration}s)"
                success_count += 1
            else:
                log_messages.append(f"   └─ ❌ 解析失败！退出代码: {active_process.returncode} (耗时: {duration}秒)\\n")
                results_table[idx][3] = "❌ 失败"
                fail_count += 1
                
        except Exception as ex:
            duration = round(time.time() - proc_start, 2)
            log_messages.append(f"   └─ ❌ 运行发生致命异常: {str(ex)}\\n")
            results_table[idx][3] = "❌ 异常"
            fail_count += 1
            
        finally:
            if temp_pdf_path and temp_pdf_path.exists():
                try:
                    temp_pdf_path.unlink()
                except Exception:
                    pass
            
        yield f"正在处理第 {idx+1}/{len(files)} 个文件", results_table, "\\n".join(log_messages)
        
    processing_active = False
    log_messages.append("==================================================================")
    log_messages.append(f"🎉 批量处理任务全部结束！")
    log_messages.append(f"📈 任务总计: {len(files)} 个 | 成功: {success_count} 个 | 失败: {fail_count} 个")
    log_messages.append("==================================================================")
    
    final_summary = f"🎉 任务已结束 | 成功: {success_count} | 失败: {fail_count}"
    yield final_summary, results_table, "\\n".join(log_messages)

# 7. 渲染 Gradio 界面
# 打造精美的 Modern 皮肤主题
theme = gr.themes.Soft(
    primary_hue="blue",
    secondary_hue="slate",
    neutral_hue="slate",
    font=[gr.themes.GoogleFont("Inter"), "system-ui", "sans-serif"]
)

def build_ui():
    default_in, default_out = get_default_paths()
    
    with gr.Blocks(title="MinerU 批量提取可视化工具") as demo:
        gr.Markdown(
            \"\"\"
            # 📄 MinerU 批量处理可视化控制台
            本程序专为 **PowerShell + Python .venv** 环境开发。可通过本界面**可视化配置**提取参数，并一键**批量递归处理**整个文件夹。
            - 🔄 **子文件夹保持**：在输出 \`output\` 目录时自动在本地重建原有的多层文件路径结构。
            - 📊 **实时进度日志**：高亮展示 MinerU (\`magic-pdf\`) CLI 调用输出、处理耗时与最终成功率。
            \"\"\"
        )
        
        with gr.Row():
            # 左侧控制面板
            with gr.Column(scale=2):
                with gr.Group():
                    gr.Markdown("### 📂 目录配置")
                    input_path_txt = gr.Textbox(
                        label="源文件目录 (支持 PDF, Word, PPT, Excel, 图片等)",
                        value=default_in,
                        placeholder="请输入待提取文件所在的目录路径"
                    )
                    output_path_txt = gr.Textbox(
                        label="解析输出目录 (结果将存放于此)",
                        value=default_out,
                        placeholder="请输入提取结果输出的目标路径"
                    )
                    recursive_chk = gr.Checkbox(
                        label="包含子文件夹(递归扫描)",
                        value=${recursiveStr},
                        info="勾选后将自动遍历所有子文件夹并保留层级结构"
                    )
                    scan_btn = gr.Button("🔍 扫描待处理文件清单", variant="secondary")
                    
                with gr.Group():
                    gr.Markdown("### ⚙️ MinerU 可视化参数设置")
                    mode_select = gr.Radio(
                        choices=["auto", "ocr", "txt"],
                        value="${params.mode}",
                        label="提取模式 (Parse Mode)",
                        info="auto: 自动研判(推荐) | ocr: 适合影印/图片/扫描文档 | txt: 适合原生高清晰文本PDF(极速)"
                    )
                    with gr.Row():
                        table_rec_chk = gr.Checkbox(label="识别提取复杂表格", value=${tableStr})
                        formula_rec_chk = gr.Checkbox(label="识别公式转化 LaTeX", value=${formulaStr})
                    
                    ocr_lang = gr.Dropdown(
                        choices=["ch_sim", "en", "ja", "ko"],
                        value="${params.language}",
                        label="OCR 识别默认语言偏好"
                    )
                    device_mode = gr.Radio(
                        choices=["cpu", "cuda"],
                        value="${params.deviceMode || "cpu"}",
                        label="运算设备偏好 (Device Mode)",
                        info="cpu: 适合仅有集成显卡/无独显机器 | cuda: 适合 NVIDIA 独立显卡加速"
                    )
                    processing_method = gr.Radio(
                        choices=["pipeline", "hybrid"],
                        value="${params.processingMethod || "pipeline"}",
                        label="处理算法/引擎 (Processing Engine)",
                        info="pipeline: 常规解析 (支持 CPU/GPU，兼容普通电脑) | hybrid: VLM大模型 (强制 GPU/CUDA)"
                    )
                    
                with gr.Row():
                    start_btn = gr.Button("🚀 一键开启批量提取", variant="primary")
                    stop_btn = gr.Button("🛑 停止/终止提取", variant="stop")
                
            # 右侧展示面板
            with gr.Column(scale=3):
                status_view = gr.Textbox(
                    label="📊 任务当前状态",
                    value="等待初始化...",
                    interactive=False
                )
                
                with gr.Tab("📄 待处理文件清单"):
                    file_list_table = gr.Dataframe(
                        headers=["文件名", "子文件夹层级", "文件体积", "当前状态"],
                        datatype=["str", "str", "str", "str"],
                        value=[],
                        interactive=False,
                        wrap=True
                    )
                    
                with gr.Tab("💻 终端输出日志"):
                    log_output = gr.TextArea(
                        label="Real-time Magic-PDF Terminal Output",
                        value="暂无运行日志。点击下方【一键开启批量提取】后，此处将呈现 MinerU 提取引擎的实时运行信息...",
                        lines=20,
                        interactive=False,
                        elem_classes=["font-mono"]
                    )
                    
        # 8. 事件触发绑定
        # 扫描按钮
        scan_btn.click(
            fn=update_file_list_view,
            inputs=[input_path_txt, recursive_chk],
            outputs=[status_view, file_list_table]
        )
        
        # 启动处理
        start_btn.click(
            fn=start_batch_processing,
            inputs=[
                input_path_txt,
                output_path_txt,
                mode_select,
                recursive_chk,
                table_rec_chk,
                formula_rec_chk,
                ocr_lang,
                device_mode,
                processing_method
            ],
            outputs=[status_view, file_list_table, log_output]
        )
        
        # 终止处理
        stop_btn.click(
            fn=stop_batch_processing,
            inputs=[],
            outputs=[status_view]
        )
        
        # 页面加载时自动扫描一次
        demo.load(
            fn=update_file_list_view,
            inputs=[input_path_txt, recursive_chk],
            outputs=[status_view, file_list_table]
        )
        
    return demo

if __name__ == "__main__":
    # 启动本地 Gradio 服务
    demo = build_ui()
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False, theme=theme)
`;
}

export function generateMagicPdfConfig(params: MinerUParams): string {
  return `{
  "bucket_info": {
    "bucket_name": "magic-pdf",
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "endpoint_url": "YOUR_ENDPOINT_URL"
  },
  "device-mode": "${params.deviceMode}",
  "layout-model": "doclayout_yolo",
  "formula-enable": ${params.extractFormula ? "true" : "false"},
  "table-enable": ${params.extractTable ? "true" : "false"},
  "ocr-language": "${params.language}",
  "models-dir": "~/.magic-pdf/models",
  "save-layout-images": ${params.outputLayoutImages ? "true" : "false"}
}`;
}
