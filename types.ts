

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

export interface SubjectConfig {
  name: string;
  score: number; // Max score for this subject
  
  // Specific structure for this subject
  mcCount: number;
  tfCount: number;
  saCount: number;
  essayCount: number;
  essayPoints: number; // Points allocated for essay in this subject
}

export interface ExamConfig {
  schoolName: string;
  examName: string;
  examTime: number; // Time in minutes
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  
  // Subject Mode
  subjectType: 'single' | 'integrated';
  subjects: SubjectConfig[]; // List of subjects for integrated mode

  // CV 7991 Structure (Global or Sum of subjects)
  mcCount: number;        // Part 1 - Type 1
  tfCount: number;        // Part 1 - Type 2
  saCount: number;        // Part 1 - Type 3
  
  essayCount: number;     // Part 2 - Count
  essayPoints: number;    // Part 2 - Points

  matrixNotes: string;
}

export interface GeneratedExam {
  schoolName: string;
  examName: string;
  examTime?: number;
  essayPoints?: number; 
  questions: Question[];
  rawText: string;
  matrixHtml?: string;
}

export interface FileWithData {
  file: File;
  base64: string;
  mimeType: string;
}