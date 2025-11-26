export interface ProcessedFile {
  id: string;
  originalFile: File;
  status: 'idle' | 'processing' | 'success' | 'error';
  extractedContent?: string; // Markdown/LaTeX content
  errorMsg?: string;
}

export interface AppConfig {
  apiKey: string;
}

export enum GeminiModel {
  PRO = 'gemini-3-pro-preview',
  FLASH = 'gemini-2.5-flash',
}
