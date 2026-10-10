import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileWithData, GeneratedExam, QuestionType, ExamConfig, Question } from "../types";
import { generateLocalExam } from "./localExamGenerator";
import { mergeChainedQuestions, stripChainedHypothesis } from "./questionChaining";

// Per @google/genai standards, use gemini-3.8-flash for high quality and speed
const AI_MODEL_ANALYSIS = "gemini-3.8-flash"; 
const AI_MODEL_GENERATION = "gemini-3.8-flash";

const getValidApiKey = (apiKey?: string): string | null => {
  const custom = apiKey ? apiKey.trim() : '';
  if (custom && custom !== 'PLACEHOLDER_API_KEY') return custom;

  const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (envKey && envKey !== 'PLACEHOLDER_API_KEY') return envKey;

  return null;
};

const getAIClient = (apiKey?: string): GoogleGenAI | null => {
  const key = getValidApiKey(apiKey);
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

// Robust JSON cleaner
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  if (text === "[object Object]") return "{}";
  
  let clean = text.trim();
  
  if (clean.includes("```json")) {
    clean = clean.replace(/```json/g, "").replace(/```/g, "");
  } else if (clean.includes("```")) {
    clean = clean.replace(/```/g, "");
  }

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  return clean.trim();
};

const safeJsonParse = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("JSON parse failed, trying escape fix...");
    const fixed = jsonString.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
    try { return JSON.parse(fixed); } catch (e2) { throw e; }
  }
};

// Helper to normalize question types from AI, recognizing CV 7991 acronyms (NLC, Đ/S, TLN, TL)
const normalizeQuestionType = (type: string): QuestionType => {
  const lower = (type || '').toLowerCase();
  if (lower.includes('nlc') || lower.includes('nhiều lựa chọn') || lower.includes('nhieu lua chon') || lower.includes('type 1') || lower.includes('multiple')) {
    return QuestionType.MULTIPLE_CHOICE;
  }
  if (lower.includes('đ/s') || lower.includes('đ-s') || lower.includes('d/s') || lower.includes('d-s') || lower.includes('đúng') || lower.includes('dung') || lower.includes('sai') || lower.includes('true') || lower.includes('type 2')) {
    return QuestionType.TRUE_FALSE;
  }
  if (lower.includes('tln') || lower.includes('trả lời ngắn') || lower.includes('tra loi ngan') || lower.includes('short') || lower.includes('type 3')) {
    return QuestionType.SHORT_ANSWER;
  }
  if (lower.includes('tl') || lower.includes('tự luận') || lower.includes('tu luan') || lower.includes('essay') || lower.includes('part 2')) {
    return QuestionType.ESSAY;
  }
  
  return QuestionType.MULTIPLE_CHOICE;
};

// Helper to sort questions: MC (Type 1, 2, 3) first, then Essay
const sortQuestionsByType = (questions: Question[]): Question[] => {
  const order = {
    [QuestionType.MULTIPLE_CHOICE]: 1,
    [QuestionType.TRUE_FALSE]: 2,
    [QuestionType.SHORT_ANSWER]: 3,
    [QuestionType.ESSAY]: 4
  };

  return questions.sort((a, b) => {
    return (order[a.type] || 5) - (order[b.type] || 5);
  });
};

// Helper to extract text & numbers from PDF binary stream / filename heuristics
const extractTextFromPdfBase64 = (base64: string): string => {
  try {
    const binary = atob(base64);
    // Extract text in PDF parentheses (text)
    const matches = binary.match(/\(([^()]{2,120})\)/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.slice(1, -1)).join(' ');
    }
    // Fallback: extract readable ascii chunks
    const asciiChunks = binary.match(/[a-zA-Z0-9\u00C0-\u1EF9\s\.,;:_/\-]{4,100}/g);
    return asciiChunks ? asciiChunks.join(' ') : '';
  } catch (e) {
    return '';
  }
};

// Heuristic file analyzer when running without API Key
const analyzeFilesLocally = (files: FileWithData[]): import('../types').AnalyzedDocumentInfo => {
  let detectedSchool = 'TRƯỜNG THPT CHUYÊN LÊ HỒNG PHONG';
  let detectedExam = 'ĐỀ KIỂM TRA ĐỊNH KỲ THEO CÔNG VĂN 7991';
  let subjects: string[] = ['Toán học'];
  let examTime = 45;
  let mcCount = 12; // Mặc định NLC chuẩn 12 câu
  let tfCount = 4;  // Mặc định Đ/S chuẩn 4 câu
  let saCount = 6;  // Mặc định TLN chuẩn 6 câu
  let essayCount = 0;
  let essayPoints = 0;
  let matrixNotes = 'Cấu trúc đề kiểm tra được trích xuất bám sát yêu cầu tài liệu nguồn và CV 7991.';

  for (const f of files) {
    const name = f.file.name.toLowerCase();
    const pdfText = extractTextFromPdfBase64(f.base64).toLowerCase();
    const combined = `${name} ${pdfText}`;

    // 1. Detect subject
    if (combined.includes('khtn') || combined.includes('tích hợp') || combined.includes('khoa học tự nhiên')) {
      subjects = ['Vật lý', 'Hoá học', 'Sinh học'];
      detectedExam = 'ĐỀ KIỂM TRA ĐÁNH GIÁ MÔN KHTN (CV 7991)';
      detectedSchool = 'TRƯỜNG THCS NGUYỄN TẤT THÀNH';
      examTime = 60;
    } else if (combined.includes('vật lý') || combined.includes('vatly') || combined.includes('vật lí') || name.includes('ly')) {
      subjects = ['Vật lý'];
      detectedExam = 'ĐỀ KIỂM TRA MÔN VẬT LÝ';
      examTime = 50;
    } else if (combined.includes('hoá') || combined.includes('hóa') || combined.includes('hoahoc')) {
      subjects = ['Hoá học'];
      detectedExam = 'ĐỀ KIỂM TRA MÔN HOÁ HỌC';
      examTime = 50;
    } else if (combined.includes('sinh') || combined.includes('sinhhoc')) {
      subjects = ['Sinh học'];
      detectedExam = 'ĐỀ KIỂM TRA MÔN SINH HỌC';
      examTime = 50;
    } else if (combined.includes('toan') || combined.includes('toán')) {
      subjects = ['Toán học'];
      detectedExam = 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN';
      examTime = 90;
    }

    if (combined.includes('giua ky') || combined.includes('giữa kì') || combined.includes('gk')) {
      detectedExam += ' - GIỮA HỌC KỲ';
    } else if (combined.includes('cuoi ky') || combined.includes('cuối kì') || combined.includes('hk')) {
      detectedExam += ' - CUỐI HỌC KỲ';
    }

    // 2. Detect exam time (phút)
    const timeMatch = combined.match(/(\d{2,3})\s*(?:phút|p\b)/i) || combined.match(/(?:thời gian|thời lượng)[^\d]{1,15}(\d{2,3})/i);
    if (timeMatch && timeMatch[1]) {
      const parsedTime = parseInt(timeMatch[1], 10);
      if ([15, 30, 45, 50, 60, 90, 120].includes(parsedTime)) {
        examTime = parsedTime;
      }
    }

    // 3. Detect NLC (Multiple Choice count)
    const nlcMatch = combined.match(/(\d{1,2})\s*(?:câu)?\s*(?:nlc|nhiều lựa chọn)/i) || 
                     combined.match(/(?:nlc|nhiều lựa chọn)[^\d]{1,20}(\d{1,2})/i);
    if (nlcMatch && nlcMatch[1]) {
      const val = parseInt(nlcMatch[1], 10);
      if (val > 0 && val <= 50) mcCount = val;
    }

    // 4. Detect Đ/S (True/False count)
    const tfMatch = combined.match(/(\d{1,2})\s*(?:câu)?\s*(?:đ\/s|đ-s|đúng sai|dung sai)/i) || 
                    combined.match(/(?:đ\/s|đ-s|đúng sai|dung sai)[^\d]{1,20}(\d{1,2})/i);
    if (tfMatch && tfMatch[1]) {
      const val = parseInt(tfMatch[1], 10);
      if (val > 0 && val <= 20) tfCount = val;
    }

    // 5. Detect TLN (Short Answer count)
    const saMatch = combined.match(/(\d{1,2})\s*(?:câu)?\s*(?:tln|trả lời ngắn|tra loi ngan)/i) || 
                    combined.match(/(?:tln|trả lời ngắn|tra loi ngan)[^\d]{1,20}(\d{1,2})/i);
    if (saMatch && saMatch[1]) {
      const val = parseInt(saMatch[1], 10);
      if (val > 0 && val <= 30) saCount = val;
    }

    // 6. Detect TL (Essay count & points)
    const essayMatch = combined.match(/(\d{1,2})\s*(?:câu)?\s*(?:tự luận|tu luan|tl\b)/i) || 
                       combined.match(/(?:tự luận|tu luan|tl\b)[^\d]{1,20}(\d{1,2})\s*câu/i);
    if (essayMatch && essayMatch[1]) {
      const val = parseInt(essayMatch[1], 10);
      if (val > 0 && val <= 10) essayCount = val;
    }

    const pointsMatch = combined.match(/(?:tự luận|tu luan|tl)[^\d]{1,20}(\d+(?:[.,]\d+)?)\s*(?:đ|điểm)/i);
    if (pointsMatch && pointsMatch[1]) {
      const pts = parseFloat(pointsMatch[1].replace(',', '.'));
      if (pts > 0 && pts <= 10) essayPoints = pts;
    } else if (essayCount > 0 && essayPoints === 0) {
      essayPoints = 3.0; // Default standard essay points if essay questions exist
    }
  }

  const summary = `Phát hiện: ${subjects.join(', ')} | NLC: ${mcCount} câu, Đ/S: ${tfCount} câu, TLN: ${saCount} câu${essayCount > 0 ? `, TL: ${essayCount} câu (${essayPoints}đ)` : ''} | Thời gian: ${examTime} phút`;

  return {
    schoolName: detectedSchool,
    examName: detectedExam,
    detectedSubjects: subjects,
    subjectType: subjects.length > 1 ? 'integrated' : 'single',
    examTime,
    difficulty: 'Trung bình',
    mcCount,
    tfCount,
    saCount,
    essayCount,
    essayPoints,
    matrixNotes,
    excludedTopics: '',
    summary
  };
};

export const analyzeFiles = async (
  files: FileWithData[], 
  apiKey?: string
): Promise<import('../types').AnalyzedDocumentInfo> => {
  const ai = getAIClient(apiKey);
  
  if (!ai || files.length === 0) {
    return analyzeFilesLocally(files);
  }

  const promptText = `
    Bạn là một trợ lý giáo viên chuyên nghiệp phân tích tài liệu và ma trận đề thi chuẩn Bộ GD&ĐT Việt Nam (Công văn 7991/BGDĐT-GDTrH).
    Hãy đọc kĩ toàn bộ file đính kèm (ma trận, bản đặc tả hoặc đề kiểm tra).

    NHIỆM VỤ ĐẶC BIỆT QUAN TRỌNG - ĐỌC VÀ TRÍCH XUẤT CẤU HÌNH ĐƠN MÔN:
    1. Tên Trường (hoặc Sở GD&ĐT) nếu có.
    2. Tên Kỳ thi / Tên môn học.
    3. Đơn môn hay Liên môn: Nếu có 1 môn là "single", nếu có từ 2 môn trở lên (như KHTN: Lý, Hóa, Sinh) là "integrated".
    4. SỐ LƯỢNG CÂU HỎI TỪNG DẠNG (Bắt buộc tìm trong ma trận/tài liệu):
       - mcCount: Số lượng câu Trắc nghiệm Nhiều Lựa Chọn (viết tắt là NLC hoặc Phần I). (Ví dụ: 12, 16, 18, 20...).
       - tfCount: Số lượng câu Trắc nghiệm Đúng/Sai (viết tắt là Đ/S hoặc Phần II). (Ví dụ: 2, 4, 6...).
       - saCount: Số lượng câu Trắc nghiệm Trả Lời Ngắn (viết tắt là TLN hoặc Phần III). (Ví dụ: 4, 6, 8...).
       - essayCount: Số lượng câu Tự luận (viết tắt là TL hoặc Phần IV nếu có). (Ví dụ: 0, 1, 2, 3...).
       - essayPoints: Tổng điểm dành cho phần Tự luận (Ví dụ: 0, 2.0, 3.0...). Nếu không có Tự luận thì là 0.
       - examTime: Thời gian làm bài theo phút (15, 30, 45, 50, 60, 90, 120).
    5. matrixNotes: Tóm tắt yêu cầu ma trận, mức độ nhận biết/thông hiểu/vận dụng hoặc phạm vi bài học.
    6. excludedTopics: Tìm xem tài liệu có ghi nội dung giảm tải, dạng bài loại trừ, không kiểm tra (nếu có thì ghi rõ, nếu không thì để rỗng).
    7. summary: Một câu tóm tắt cấu trúc trích xuất được.

    OUTPUT JSON FORMAT:
    {
      "schoolName": "...",
      "examName": "...",
      "detectedSubjects": ["Toán học"],
      "subjectType": "single",
      "examTime": 45,
      "difficulty": "Trung bình",
      "mcCount": 12,
      "tfCount": 4,
      "saCount": 6,
      "essayCount": 2,
      "essayPoints": 3.0,
      "matrixNotes": "...",
      "excludedTopics": "...",
      "summary": "..."
    }
  `;

  const parts: any[] = [];
  files.forEach(f => {
    parts.push({
      inlineData: {
        mimeType: f.mimeType,
        data: f.base64
      }
    });
  });
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_ANALYSIS,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) return analyzeFilesLocally(files);
    const parsed = safeJsonParse(cleanJson(text));
    
    return {
      schoolName: parsed.schoolName || 'TRƯỜNG THPT CHUYÊN LÊ HỒNG PHONG',
      examName: parsed.examName || 'ĐỀ KIỂM TRA ĐỊNH KỲ THEO CÔNG VĂN 7991',
      detectedSubjects: parsed.detectedSubjects && parsed.detectedSubjects.length > 0 
        ? parsed.detectedSubjects 
        : ['Toán học'],
      subjectType: parsed.subjectType || (parsed.detectedSubjects && parsed.detectedSubjects.length > 1 ? 'integrated' : 'single'),
      examTime: typeof parsed.examTime === 'number' ? parsed.examTime : 45,
      difficulty: parsed.difficulty || 'Trung bình',
      mcCount: typeof parsed.mcCount === 'number' ? parsed.mcCount : 12,
      tfCount: typeof parsed.tfCount === 'number' ? parsed.tfCount : 4,
      saCount: typeof parsed.saCount === 'number' ? parsed.saCount : 6,
      essayCount: typeof parsed.essayCount === 'number' ? parsed.essayCount : 0,
      essayPoints: typeof parsed.essayPoints === 'number' ? parsed.essayPoints : 0,
      matrixNotes: parsed.matrixNotes || 'Trích xuất từ ma trận tài liệu nguồn theo Công văn 7991.',
      excludedTopics: parsed.excludedTopics || '',
      summary: parsed.summary || 'Đã đọc thành công cấu trúc đề từ tài liệu đính kèm.'
    };
  } catch (error) {
    console.warn("AI analysis fallback to local parser:", error);
    return analyzeFilesLocally(files);
  }
};

export const generateExamContent = async (
  files: FileWithData[],
  config: ExamConfig,
  apiKey?: string
): Promise<GeneratedExam> => {
  const ai = getAIClient(apiKey);

  // If no AI key provided or AI is offline, seamlessly generate using the built-in CV 7991 matrix engine
  if (!ai) {
    console.info("Tạo đề thi trực tiếp qua bộ sinh chuẩn Công văn 7991 (Không cần API Key)");
    return generateLocalExam(config);
  }

  // Integrated Exam Logic Preparation
  let integratedPrompt = "";
  if (config.subjectType === 'integrated' && config.subjects.length > 0) {
    const subjectDetails = config.subjects.map(s => `
    --- MÔN: ${s.name} ---
    Yêu cầu số lượng câu hỏi CHÍNH XÁC:
      - TN Nhiều lựa chọn (Phần I - Dạng 1): ${s.mcCount ?? 0} câu
      - TN Đúng/Sai (Phần I - Dạng 2): ${s.tfCount ?? 0} câu
      - TN Trả lời ngắn (Phần I - Dạng 3): ${s.saCount ?? 0} câu
      - Tự luận (Phần II): ${s.essayCount ?? 0} câu
      - Điểm tự luận riêng môn này: ${s.essayPoints || 0} điểm
    `).join('\n');

    integratedPrompt = `
    ĐÂY LÀ ĐỀ LIÊN MÔN (TÍCH HỢP).
    Cấu trúc chi tiết từng môn như sau:
    ${subjectDetails}
    
    YÊU CẦU NGHIÊM NGẶT VỀ SỐ LƯỢNG (STRICT COUNT):
    1. Bạn PHẢI tạo ĐÚNG và ĐỦ số lượng câu hỏi cho TỪNG MÔN như đã liệt kê ở trên.
    2. Trong mảng "questions" trả về, sắp xếp theo đúng thứ tự dạng câu hỏi chuẩn Công văn 7991.
    `;
  }

  const excludedTopicsPrompt = config.excludedTopics && config.excludedTopics.trim() ? `
    LỆNH BẮT BUỘC VỀ KIẾN THỨC LOẠI TRỪ (STRICT EXCLUSION INSTRUCTION):
    Giáo viên yêu cầu TUYỆT ĐỐI LOẠI TRỪ các dạng bài toán / chuyên đề / phần kiến thức sau:
    "${config.excludedTopics.trim()}"
    QUY TẮC CẤM: Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC ra bất kỳ câu hỏi nào (cả ở Phần Trắc nghiệm và Phần Tự luận) thuộc các dạng toán hoặc kiến thức bị loại trừ trên. Hãy chọn các dạng toán và đơn vị kiến thức khác trong SGK/chương trình để thay thế hoàn toàn!
  ` : "";

  const promptText = `
    Bạn là chuyên gia soạn đề kiểm tra chuẩn CÔNG VĂN 7991/BGDĐT-GDTrH của Bộ Giáo dục và Đào tạo Việt Nam.
    Nhiệm vụ: Tạo đề kiểm tra bám sát Chương trình GDPT 2018 và tạo MA TRẬN ĐẶC TẢ CHI TIẾT.

    THÔNG TIN CHUNG:
    - Trường: ${config.schoolName || 'TRƯỜNG THPT CHUYÊN'}
    - Kỳ thi: ${config.examName || 'ĐỀ KIỂM TRA ĐỊNH KỲ THEO CÔNG VĂN 7991'}
    - Độ khó: ${config.difficulty}
    - Thời gian làm bài: ${config.examTime} phút
    - Ghi chú/Ma trận: ${config.matrixNotes}
    ${integratedPrompt}
    ${excludedTopicsPrompt}
    
    QUY ƯỚC TỪ VIẾT TẮT TRONG TÀI LIỆU & MA TRẬN THEO CÔNG VĂN 7991:
    - NLC: Trắc nghiệm Nhiều Lựa Chọn (4 phương án A, B, C, D)
    - Đ/S (hoặc Đ-S): Trắc nghiệm Đúng Sai (mỗi câu gồm 4 ý a, b, c, d)
    - TLN: Trắc nghiệm Trả Lời Ngắn (học sinh tính toán và điền đáp số ngắn)
    - TL: Tự Luận (lời giải chi tiết và barem điểm)
    Khi xử lý tài liệu đính kèm, các nhãn hoặc câu hỏi có đánh dấu [NLC], [Đ/S], [TLN], [TL] PHẢI được nhận diện và phân vào đúng dạng tương ứng.
    
    TỔNG HỢP CẤU TRÚC ĐỀ CẦN TẠO:
    PHẦN 1: TRẮC NGHIỆM
    - Dạng 1: Trắc nghiệm nhiều lựa chọn (NLC): đúng ${config.mcCount} câu
    - Dạng 2: Trắc nghiệm Đúng/Sai (Đ/S, mỗi câu 4 ý a,b,c,d): đúng ${config.tfCount} câu
    - Dạng 3: Trắc nghiệm trả lời ngắn (TLN, điền đáp số): đúng ${config.saCount} câu
    
    PHẦN 2: TỰ LUẬN
    - Số lượng câu Tự luận (TL): đúng ${config.essayCount} câu (${config.essayPoints} điểm)

    QUY ĐỊNH KỸ THUẬT VÀ LATEX (BẮT BUỘC):
    1. Mọi công thức Toán/Lý/Hoá (phân số, số mũ, căn thức, vectơ, tích phân, góc...) PHẢI được kẹp trong cặp dấu $ đơn. Ví dụ: $\\frac{a}{b}$, $x^2 + 2x$, $\\vec{a}$.
    2. Escape dấu backslash (\\\\) trong JSON chuỗi hợp lệ.
    3. Câu hỏi Dạng 2 (Đúng/Sai) PHẢI có đủ 4 lệnh hỏi a, b, c, d với giá trị boolean true (Đúng) hoặc false (Sai).
    4. Bảng ma trận HTML (matrixHtml) phải thiết kế chuẩn mực theo Công văn 7991 với 3 mức độ: Nhận biết (40%), Thông hiểu (30%), Vận dụng (30%).
    5. TUYỆT ĐỐI KHÔNG để các ký tự [NLC], [TLN], [Đ/S], [TL], (TL] trong phần text nội dung câu hỏi (content) hay các phương án (options). Nội dung câu hỏi chỉ chứa đề bài tự nhiên.
    6. ĐỐI VỚI DẠNG 1 (TRẮC NGHIỆM NHIỀU LỰA CHỌN): Trường "correctAnswer" BẮT BUỘC PHẢI CÓ và chỉ ghi chữ cái đại diện phương án đúng: "A", "B", "C", hoặc "D".
    7. THANG ĐIỂM CÂU HỎI (score): Căn cứ ma trận phân bổ thang điểm 10, gán điểm chính xác cho trường "score" của mỗi câu hỏi:
       - Phần I: Dạng 1 (NLC): thường là 0.25 điểm mỗi câu.
       - Phần I: Dạng 2 (Đúng/Sai): thường là 1.0 điểm mỗi câu (gồm 4 ý a,b,c,d).
        - Phần I: Dạng 3 (TLN): thường là 0.25 - 0.5 điểm mỗi câu.
        - Phần II: Tự luận: chia đều hoặc theo độ khó tổng ${config.essayPoints} điểm (ví dụ: 1.0đ, 1.5đ, 2.0đ/câu).
    8. QUY TẮC BÀI TOÁN CHÙM / LIÊN HOÀN (BẮT BUỘC):
       - TUYỆT ĐỐI KHÔNG sinh các câu hỏi rời rạc chứa cụm "(Tiếp tục giả thiết Câu 16a)", "(Tiếp tục giả thiết...)" hoặc tương tự.
       - Những bài có chung giả thiết hoặc câu hỏi nối tiếp phải được gộp trọn vẹn thành câu a, b, c, d của bài trước đó:
         + Đối với trắc nghiệm: đưa vào Dạng 2 (Trắc nghiệm Đúng/Sai) với thân bài là giả thiết chung và 4 ý a, b, c, d (mỗi ý là một lệnh hỏi).
         + Đối với tự luận: đưa vào làm các ý a, b, c, d của bài tự luận đó.
       - Xóa bỏ hoàn toàn cụm từ "(Tiếp tục giả thiết...)" để lời dẫn tự nhiên, chuyên nghiệp.
    9. CHUẨN HÓA VĂN BẢN VÀ ĐỊNH DẠNG (BẮT BUỘC):
       - TUYỆT ĐỐI KHÔNG để chuỗi ký tự "\\n" dạng chữ thô bên trong nội dung câu hỏi (content).
       - TUYỆT ĐỐI KHÔNG thêm các tiền tố thừa như "Câu 1:", "Bài 1:", "Bài toán:", "Toán:", hay "Theo giả thiết bài toán:" ở đầu nội dung câu hỏi (content). Nội dung câu hỏi phải bắt đầu trực tiếp vào đề bài (ví dụ: "Cho hình chóp...", "Tìm tập xác định...", "Trong mặt phẳng...").
  `;

  const parts: any[] = [];
  if (files && files.length > 0) {
    files.forEach(f => {
      parts.push({
        inlineData: {
          mimeType: f.mimeType,
          data: f.base64
        }
      });
    });
  }
  parts.push({ text: promptText });

  const examSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      schoolName: { type: Type.STRING },
      examName: { type: Type.STRING },
      matrixHtml: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, description: "Must be: 'Trắc nghiệm nhiều lựa chọn', 'Trắc nghiệm đúng sai', 'Trắc nghiệm trả lời ngắn', or 'Tự luận'" },
            content: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING, description: "For Multiple Choice: 'A', 'B', 'C', or 'D'. For Short Answer: the numeric or text answer." },
            solution: { type: Type.STRING },
            score: { type: Type.NUMBER, description: "Points for this question according to matrix (e.g. 0.25, 0.5, 1.0, 1.5)" },
            subQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  content: { type: Type.STRING },
                  answer: { type: Type.BOOLEAN }
                },
                required: ["id", "content", "answer"]
              }
            }
          },
          required: ["id", "type", "content"]
        }
      }
    },
    required: ["schoolName", "examName", "questions", "matrixHtml"]
  };

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_GENERATION,
      contents: [{ role: 'user', parts: parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được phản hồi từ AI");
    
    const parsed = safeJsonParse(cleanJson(text));

    let questions: Question[] = (parsed.questions || []).map((q: any) => ({
      ...q,
      type: normalizeQuestionType(q.type)
    }));

    // Merge any chained questions like "(Tiếp tục giả thiết Câu 16a)" into sub-questions (a, b, c, d)
    questions = mergeChainedQuestions(questions);

    questions = sortQuestionsByType(questions);

    return {
      schoolName: parsed.schoolName || config.schoolName,
      examName: parsed.examName || config.examName,
      examTime: config.examTime,
      essayPoints: config.essayPoints, 
      questions: questions,
      rawText: text,
      matrixHtml: parsed.matrixHtml || "<p>Không có thông tin ma trận</p>"
    };
  } catch (error) {
    console.warn("AI generation failed or quota reached. Seamlessly falling back to local Công văn 7991 engine:", error);
    return generateLocalExam(config);
  }
};