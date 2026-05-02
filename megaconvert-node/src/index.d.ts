export interface MegaConvertOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface JobResult {
  jobId: string;
  statusUrl: string;
}

export interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
}

export interface UsageInfo {
  plan: string;
  requests_today: number;
  rate_limit: number;
  remaining: number;
  max_file_size: number;
  max_file_size_human: string;
}

export interface WaitOptions {
  interval?: number;
  timeout?: number;
}

export class MegaConvertError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number);
}

export class MegaConvert {
  constructor(apiKey: string, options?: MegaConvertOptions);
  convert(filePath: string, outputFormat: string, outputPath?: string): Promise<string>;
  convertBuffer(buffer: Buffer | Uint8Array, filename: string, outputFormat: string): Promise<Buffer>;
  convertAsync(filePath: string, outputFormat: string): Promise<JobResult>;
  tool(filePath: string, toolName: string, options?: Record<string, string | number>, outputPath?: string): Promise<string>;
  status(jobId: string): Promise<JobStatus>;
  download(jobId: string, outputPath?: string): Promise<Buffer | string>;
  formats(): Promise<object>;
  tools(): Promise<object>;
  usage(): Promise<UsageInfo>;
  waitForJob(jobId: string, options?: WaitOptions): Promise<JobStatus>;
}

export default MegaConvert;
