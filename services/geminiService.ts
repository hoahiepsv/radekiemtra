import { GoogleGenAI, Type } from "@google/genai";
import { FileWithData, GeneratedExam, QuestionType, ExamConfig } from "../types";

const AI_MODEL_FLASH = "gemini-2.5-flash";

// Helper to get the AI client
const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeFiles = async (files: FileWithData[]): Promise<{ schoolName: string; examName: string }> => {
  const ai = getAIClient();
  
  const promptText = `
    Bạn là một trợ lý giáo viên thông minh. 
    Hãy phân tích các tài liệu đính kèm (ma trận đề thi hoặc ngân hàng câu hỏi).
    Nhiệm vụ:
    1. Tìm tên Trường (hoặc Sở GD&ĐT).
    2. Tìm tên Kỳ thi (ví dụ: Kiểm tra giữa học kỳ 1, Khảo sát chất lượng, v.v.).
    
    Trả về kết quả dưới dạng JSON chính xác với cấu trúc:
    {
      "schoolName": "Tên trường tìm thấy",
      "examName": "Tên kỳ thi tìm thấy"
    }
    Nếu không tìm thấy, hãy để trống.
  `;

  const contentParts = files.map(f => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.base64
    }
  }));

  contentParts.push({ inlineData: undefined, text: promptText } as any);

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_FLASH,
      contents: { parts: contentParts.map(p => p.inlineData ? { inlineData: p.inlineData } : { text: promptText }) },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schoolName: { type: Type.STRING },
            examName: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { schoolName: '', examName: '' };
    return JSON.parse(text);
  } catch (error) {
    console.error("Lỗi phân tích file:", error);
    return { schoolName: '', examName: '' };
  }
};

export const generateExamContent = async (
  files: FileWithData[],
  config: ExamConfig
): Promise<GeneratedExam> => {
  const ai = getAIClient();

  const promptText = `
    Bạn là chuyên gia soạn đề thi theo CÔNG VĂN 7991/BGDĐT-GDTrH của Bộ GD&ĐT Việt Nam (ban hành 17/12/2024).
    Nhiệm vụ: Tạo đề kiểm tra bám sát Chương trình GDPT 2018.

    THÔNG TIN ĐỀ BÀI:
    - Trường: ${config.schoolName}
    - Kỳ thi: ${config.examName}
    - Độ khó: ${config.difficulty}
    - Thời gian làm bài: ${config.examTime} phút
    - Yêu cầu Ma trận/Ghi chú: ${config.matrixNotes}
    
    CẤU TRÚC ĐỀ THI BẮT BUỘC (THEO CV 7991):
    
    PHẦN 1: TRẮC NGHIỆM (70% điểm số - 7.0 điểm)
    1. Dạng 1: Trắc nghiệm nhiều lựa chọn (${config.mcCount} câu). 
       - Yêu cầu: Có 4 phương án A, B, C, D. Chỉ 1 đáp án đúng.
    2. Dạng 2: Trắc nghiệm đúng/sai (${config.tfCount} câu).
       - Yêu cầu: Mỗi câu có 4 lệnh hỏi nhỏ (a, b, c, d). Mỗi lệnh phải xác định là ĐÚNG hoặc SAI.
       - Nội dung các lệnh phải liên kết với câu dẫn chung.
    3. Dạng 3: Trắc nghiệm trả lời ngắn (${config.saCount} câu).
       - Yêu cầu: Học sinh tính toán và điền kết quả (số hoặc cụm từ ngắn). Không có đáp án A,B,C,D.
    
    PHẦN 2: TỰ LUẬN (30% điểm số - 3.0 điểm) (${config.essayCount} câu).
       - Yêu cầu: Câu hỏi yêu cầu trình bày, giải thích.
       - Nếu câu hỏi có nhiều ý nhỏ (từ 2 ý trở lên), hãy phân thành a, b, c...
       - Ghi rõ số điểm tương ứng cho mỗi câu hoặc ý nhỏ ngay trong nội dung câu hỏi (Ví dụ: "(1.0 điểm)"). Tổng điểm phần này phải là 3.0.
       - Tạo hướng dẫn chấm chi tiết cho phần tự luận để in vào trang đáp án.

    YÊU CẦU KỸ THUẬT (QUAN TRỌNG):
    1. **LaTeX**: Công thức Toán/Lý/Hóa đặt trong dấu $. Ví dụ: $x^2 - 2x + 1 = 0$.
    2. **Hình học**: BẮT BUỘC dùng lệnh \`\\widehat{ABC}\` cho ký hiệu góc. TUYỆT ĐỐI KHÔNG dùng \`\\angle\`. Đây là chuẩn để in ấn OMML.
    3. **Phân hóa**: Đảm bảo tỷ lệ mức độ nhận thức: 40% Nhận biết - 30% Thông hiểu - 30% Vận dụng.
    4. **Nội dung**: Ưu tiên lấy dữ liệu từ file PDF đính kèm (Ma trận, Đặc tả) nếu có. Nếu không, tự sinh nội dung phù hợp môn học.

    OUTPUT JSON FORMAT:
    {
      "schoolName": "...",
      "examName": "...",
      "questions": [
        // Dạng 1
        {
          "id": "1",
          "type": "Trắc nghiệm nhiều lựa chọn",
          "content": "Nội dung câu hỏi...",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correctAnswer": "A",
          "solution": "Giải thích ngắn gọn..."
        },
        // Dạng 2
        {
          "id": "...",
          "type": "Trắc nghiệm đúng sai",
          "content": "Câu dẫn chung cho 4 ý...",
          "subQuestions": [
             { "id": "a", "content": "Nội dung ý a", "answer": true },
             { "id": "b", "content": "Nội dung ý b", "answer": false },
             { "id": "c", "content": "Nội dung ý c", "answer": false },
             { "id": "d", "content": "Nội dung ý d", "answer": true }
          ],
          "solution": "Giải thích chi tiết..."
        },
        // Dạng 3
        {
          "id": "...",
          "type": "Trắc nghiệm trả lời ngắn",
          "content": "Nội dung câu hỏi...",
          "correctAnswer": "15 cm",
          "solution": "Cách tính ra kết quả..."
        },
        // Tự luận
        {
          "id": "...",
          "type": "Tự luận",
          "content": "Câu 1 (1.0 điểm): Nội dung câu hỏi... a) ... b) ...",
          "solution": "Hướng dẫn chấm chi tiết: \n- Ý a (0.5đ): ... \n- Ý b (0.5đ): ..."
        }
      ]
    }
  `;

  const contentParts: any[] = files.map(f => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.base64
    }
  }));
  
  contentParts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_FLASH,
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được phản hồi từ AI");
    
    const parsed = JSON.parse(text);
    return {
      schoolName: parsed.schoolName || config.schoolName,
      examName: parsed.examName || config.examName,
      examTime: config.examTime,
      questions: parsed.questions || [],
      rawText: text
    };
  } catch (error) {
    console.error("Lỗi tạo đề:", error);
    throw error;
  }
};