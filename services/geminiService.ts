import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileWithData, GeneratedExam, QuestionType, ExamConfig, Question } from "../types";

const AI_MODEL_ANALYSIS = "gemini-2.5-flash"; 
const AI_MODEL_GENERATION = "gemini-2.5-flash";

const getAIClient = (apiKey?: string) => {
  const key = apiKey ? apiKey.trim() : process.env.API_KEY;
  if (!key) {
    throw new Error("Vui lòng nhập API Key trong phần cấu hình.");
  }
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

// Helper to normalize question types from AI
const normalizeQuestionType = (type: string): QuestionType => {
  const lower = type.toLowerCase();
  if (lower.includes('type 1') || lower.includes('nhiều lựa chọn') || lower.includes('multiple')) return QuestionType.MULTIPLE_CHOICE;
  if (lower.includes('type 2') || lower.includes('đúng') || lower.includes('sai') || lower.includes('true')) return QuestionType.TRUE_FALSE;
  if (lower.includes('type 3') || lower.includes('ngắn') || lower.includes('short')) return QuestionType.SHORT_ANSWER;
  if (lower.includes('part 2') || lower.includes('tự luận') || lower.includes('essay')) return QuestionType.ESSAY;
  
  // Default fallback
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

// --- FEATURE: REGENERATE IMAGE (PYTHON -> PNG) ---
export const regenerateQuestionImage = async (
  questionContent: string,
  apiKey: string
): Promise<string> => {
  const ai = getAIClient(apiKey);
  
  let textPrompt = questionContent;
  if (textPrompt.includes("<svg")) textPrompt = textPrompt.split("<svg")[0].trim();
  if (textPrompt.includes("<img")) textPrompt = textPrompt.split("<img")[0].trim();

  const promptText = `
    Bạn là chuyên gia vẽ hình minh hoạ (Toán/Lý/Hoá) sử dụng NGÔN NGỮ LẬP TRÌNH PYTHON.
    Nhiệm vụ:
    1. Đọc nội dung câu hỏi: "${textPrompt}"
    2. Viết và THỰC THI (Execute) mã Python (sử dụng matplotlib, numpy...) để vẽ hình minh hoạ.
    3. Yêu cầu:
       - Hình ảnh phải chính xác, trực quan.
       - Sử dụng thư viện matplotlib để vẽ và hiển thị (plt.show()).
       - **Quan trọng**: Hệ thống sẽ tự động bắt hình ảnh đầu ra từ code python.
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_GENERATION,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      tools: [{ codeExecution: {} }],
      config: { responseMimeType: "text/plain" }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
           const base64 = part.inlineData.data;
           const mime = part.inlineData.mimeType;
           return `<img src="data:${mime};base64,${base64}" alt="Hình minh hoạ Python" style="max-width: 100%; height: auto; display: block; margin: 10px auto;" />`;
        }
      }
    }

    const text = response.text || "";
    if (text.includes("<svg")) {
       const svgStart = text.indexOf("<svg");
       const svgEnd = text.lastIndexOf("</svg>");
       return text.substring(svgStart, svgEnd + 6);
    }

    throw new Error("Python đã chạy nhưng không trả về hình ảnh nào.");
  } catch (error) {
    console.error("Lỗi vẽ hình Python:", error);
    return "(Không thể tạo hình bằng Python. Vui lòng thử lại)";
  }
};

export const analyzeFiles = async (files: FileWithData[], apiKey: string): Promise<{ schoolName: string; examName: string; detectedSubjects?: string[] }> => {
  const ai = getAIClient(apiKey);
  
  const promptText = `
    Bạn là một trợ lý giáo viên thông minh. 
    Hãy phân tích các tài liệu đính kèm.
    Nhiệm vụ:
    1. Tìm tên Trường (hoặc Sở GD&ĐT).
    2. Tìm tên Kỳ thi.
    3. **Quan trọng**: Hãy tìm xem đây là đề/ma trận cho một môn (Đơn môn) hay tổ hợp môn (Liên môn/KHTN/KHXH).
       - Liệt kê tên các môn học thành phần nếu tìm thấy (Ví dụ: ["Vật lý", "Hoá học", "Sinh học"]).
       - Nếu chỉ có 1 môn, trả về danh sách chứa 1 môn đó.
    
    OUTPUT JSON: { "schoolName": "...", "examName": "...", "detectedSubjects": ["Môn A", "Môn B"] }
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
    if (!text) return { schoolName: '', examName: '' };
    return safeJsonParse(cleanJson(text));
  } catch (error) {
    return { schoolName: '', examName: '' };
  }
};

export const generateExamContent = async (
  files: FileWithData[],
  config: ExamConfig,
  apiKey: string
): Promise<GeneratedExam> => {
  const ai = getAIClient(apiKey);

  const essayPoints = config.essayPoints || 3.0;
  
  // Integrated Exam Logic Preparation
  let integratedPrompt = "";
  if (config.subjectType === 'integrated' && config.subjects.length > 0) {
    const subjectDetails = config.subjects.map(s => `
    --- MÔN: ${s.name} ---
    Yêu cầu số lượng câu hỏi CHÍNH XÁC:
      - TN Nhiều lựa chọn (Type 1): ${s.mcCount ?? 0} câu
      - TN Đúng/Sai (Type 2): ${s.tfCount ?? 0} câu
      - TN Trả lời ngắn (Type 3): ${s.saCount ?? 0} câu
      - Tự luận (Essay): ${s.essayCount ?? 0} câu
      - Điểm tự luận riêng môn này: ${s.essayPoints || 0} điểm
    `).join('\n');

    integratedPrompt = `
    ĐÂY LÀ ĐỀ LIÊN MÔN (TÍCH HỢP).
    Cấu trúc chi tiết từng môn như sau:
    ${subjectDetails}
    
    YÊU CẦU NGHIÊM NGẶT VỀ SỐ LƯỢNG (STRICT COUNT):
    1. Bạn PHẢI tạo ĐÚNG và ĐỦ số lượng câu hỏi cho TỪNG MÔN như đã liệt kê ở trên. KHÔNG ĐƯỢC THIẾU, KHÔNG ĐƯỢC THỪA.
    2. Trong mảng "questions" trả về, hãy trộn các môn lại với nhau hoặc để theo thứ tự đều được, nhưng Tổng số lượng phải khớp tuyệt đối.
    `;
  }

  const promptText = `
    Bạn là chuyên gia soạn đề thi theo CÔNG VĂN 7991/BGDĐT-GDTrH.
    Nhiệm vụ: Tạo đề kiểm tra bám sát Chương trình GDPT 2018 và tạo MA TRẬN ĐẶC TẢ.

    THÔNG TIN CHUNG:
    - Trường: ${config.schoolName}
    - Kỳ thi: ${config.examName}
    - Độ khó: ${config.difficulty}
    - Thời gian: ${config.examTime} phút
    - Ghi chú: ${config.matrixNotes}
    ${integratedPrompt}
    
    TỔNG HỢP TOÀN BÀI (SỐ LƯỢNG CẦN ĐẠT):
    PHẦN 1: TRẮC NGHIỆM
    - Tổng Type 1 (Nhiều lựa chọn): ${config.mcCount} câu
    - Tổng Type 2 (Đúng/Sai): ${config.tfCount} câu
    - Tổng Type 3 (Trả lời ngắn): ${config.saCount} câu
    
    PHẦN 2: TỰ LUẬN
    - Tổng Tự luận: ${config.essayCount} câu

    QUAN TRỌNG VỀ SỐ LƯỢNG:
    - Nếu là đề Liên môn: Ưu tiên tuân thủ số lượng chi tiết của từng môn. Tổng lại phải khớp với số liệu Tổng hợp toàn bài.
    - Nếu là đề Đơn môn: Tuân thủ số liệu Tổng hợp toàn bài.
    
    YÊU CẦU KỸ THUẬT VÀ LATEX (BẮT BUỘC):
    1. **LATEX TOÁN HỌC**: Mọi công thức Toán/Lý/Hoá (phân số, mũ, vector, tích phân...) **PHẢI** được kẹp giữa cặp dấu $.
       - Ví dụ Đúng: $\\frac{1}{2}$, $x^2 + 2x$, $\\vec{a}$.
       - KHÔNG dùng: \\( ... \\) hoặc \\[ ... \\]. Chỉ dùng dấu $.
    2. **ESCAPE BACKSLASH**: Khi viết JSON, nhớ dùng 2 dấu gạch chéo (\\\\) cho lệnh LaTeX. Ví dụ: $\\\\frac{a}{b}$.
    3. Hình học: Dùng $\\\\widehat{ABC}$.
    4. **VẼ HÌNH**: Ưu tiên chèn mã **SVG** (từ TikZ) vào content nếu cần minh hoạ.
    5. MA TRẬN (Matrix HTML): Tạo bảng HTML chuẩn font Times New Roman.
    
    OUTPUT JSON FORMAT:
    {
      "schoolName": "...",
      "examName": "...",
      "questions": [ ... ],
      "matrixHtml": "..."
    }
  `;

  const parts: any[] = files.map(f => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.base64
    }
  }));
  
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
            type: { type: Type.STRING, description: "Must be exactly: 'Trắc nghiệm nhiều lựa chọn', 'Trắc nghiệm đúng sai', 'Trắc nghiệm trả lời ngắn', or 'Tự luận'" },
            content: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            solution: { type: Type.STRING },
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

    // Normalize types AND Sort questions
    let questions: Question[] = (parsed.questions || []).map((q: any) => ({
      ...q,
      type: normalizeQuestionType(q.type)
    }));

    // SORT: MC (1,2,3) -> Essay
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
    console.error("Lỗi tạo đề:", error);
    throw error;
  }
};