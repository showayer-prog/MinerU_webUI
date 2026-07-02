export interface MinerUParams {
  inputPath: string;
  outputPath: string;
  mode: 'auto' | 'ocr' | 'txt';
  recursive: boolean;
  extractFormula: boolean;
  extractTable: boolean;
  language: string;
  outputLayoutImages: boolean;
  concurrency: number;
  deviceMode: 'cpu' | 'cuda';
  processingMethod: 'pipeline' | 'hybrid';
}

export interface ProcessingLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface FileStatus {
  path: string;
  relativePath: string;
  size: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mode: 'auto' | 'ocr' | 'txt';
  progress: number;
  duration?: string;
}
