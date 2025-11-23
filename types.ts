
export enum QuestionType {
  MULTIPLE_CHOICE = 'Trắc nghiệm nhiều lựa chọn', // Type 1
  TRUE_FALSE = 'Trắc nghiệm đúng sai',            // Type 2
  SHORT_ANSWER = 'Trắc nghiệm trả lời ngắn',      // Type 3
  ESSAY = 'Tự luận'                               // Part 2
}

export interface SubQuestion {
  id: string; // a, b, c, d
  content: string;
  answer: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  // For Type 1 (MC)
  options?: string[]; 
  correctAnswer?: string; 
  // For Type 2 (True/False)
  subQuestions?: SubQuestion[];
  // For Type 3 & Essay
  solution?: string; 
}

export interface ExamConfig {
  schoolName: string;
  examName: string;
  examTime: number; // Time in minutes
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  // CV 7991 Structure
  mcCount: number;        // Part 1 - Type 1
  tfCount: number;        // Part 1 - Type 2
  saCount: number;        // Part 1 - Type 3
  essayCount: number;     // Part 2
  matrixNotes: string;
}

export interface GeneratedExam {
  schoolName: string;
  examName: string;
  examTime?: number;
  questions: Question[];
  rawText: string;
  matrixHtml?: string;
}

export interface FileWithData {
  file: File;
  base64: string;
  mimeType: string;
}
