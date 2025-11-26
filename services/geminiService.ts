
import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from '../types';
import { fileToBase64 } from '../utils/fileHelpers';

export const analyzeImage = async (apiKey: string, file: File): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);
  
  const prompt = `
  Bạn là một hệ thống OCR và chuyển đổi nội dung số chính xác tuyệt đối. Nhiệm vụ của bạn là trích xuất nội dung từ hình ảnh/PDF thành văn bản Markdown.

  QUY TẮC QUAN TRỌNG VỀ ĐỊNH DẠNG (BẮT BUỘC TUÂN THỦ):
  1. **PHÂN BIỆT LATEX VÀ VĂN BẢN:**
     - **KHÔNG** dùng định dạng LaTeX ($...$) cho văn bản tiếng Việt, chữ cái thông thường, số bài (Bài 1, Câu 1), hoặc các ký tự không phải toán học.
     - **CHỈ** dùng LaTeX cho: phương trình, biểu thức toán học, biến số (x, y, z), phân số, căn bậc, tích phân, ký hiệu hình học.
     - Ví dụ SAI: $Cho$ $tam$ $giác$ $ABC$.
     - Ví dụ ĐÚNG: Cho tam giác $ABC$ có cạnh $AB = 3cm$.

  2. **KHÔNG** viết bất kỳ lời dẫn nhập nào (Ví dụ: "Dưới đây là nội dung...", "Kết quả số hoá...", "File này chứa...").
  3. **KHÔNG** viết lời kết thúc hay nhận xét.
  4. **CHỈ** xuất ra nội dung đề thi/bài tập trích xuất được. Bắt đầu ngay vào nội dung.

  Yêu cầu chi tiết nội dung:
  1. **Văn bản:** Trích xuất lại nguyên văn từng chữ, ký hiệu. Giữ nguyên định dạng câu hỏi.
  2. **Toán học:** Viết chuẩn LaTeX. 
     - Dòng: $...$
     - Riêng dòng: $$...$$
  3. **Hình vẽ:** 
     - Nếu có hình vẽ minh hoạ (hình học, đồ thị...), hãy MÔ TẢ LẠI bằng mã **TikZ**.
     - Đặt mã TikZ **NGAY SAU** nội dung câu hỏi/bài tập liên quan.
     - Đặt mã trong block: \`\`\`tikz ... \`\`\`.
     - **QUAN TRỌNG:** Nếu là hình học phẳng (tam giác, đường tròn, tiếp tuyến...), **BẮT BUỘC** sử dụng thư viện \`tkz-euclide\` để vẽ. Đây là tiêu chuẩn giáo khoa Việt Nam. 
     - Mã TikZ phải đầy đủ, vẽ chính xác tỉ lệ, toạ độ, nhãn điểm (A, B, C...) như hình gốc.

  Hãy bắt đầu ngay lập tức vào nội dung chính.
  `;

  try {
    const modelId = GeminiModel.PRO; 
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refineTikzCode = async (apiKey: string, file: File, currentCode: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);

  const prompt = `
  Tôi có một đoạn mã TikZ được tạo ra từ hình ảnh này, nhưng nó chưa chính xác hoặc chưa đẹp.
  
  Mã hiện tại:
  \`\`\`latex
  ${currentCode}
  \`\`\`

  NHIỆM VỤ CỦA BẠN:
  1. Quan sát thật kỹ hình ảnh gốc.
  2. Sửa lại mã TikZ trên sao cho hình vẽ GIỐNG HỆT hình ảnh gốc (về tỉ lệ, vị trí điểm, các ký hiệu vuông góc/bằng nhau, nhãn, kiểu đường nét liền/đứt).
  3. **BẮT BUỘC**: Sử dụng thư viện \`tkz-euclide\` nếu là hình học phẳng để hình vẽ đẹp và chuẩn.
  4. CHỈ TRẢ VỀ mã nguồn TikZ đã sửa, nằm trong block code \`\`\`tikz ... \`\`\`. Không giải thích gì thêm.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: {
        parts: [
            { text: prompt },
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });
    
    // Extract code block
    const text = response.text || "";
    const match = text.match(/```(?:tikz|latex)?([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  } catch (error) {
    console.error("Refine TikZ Error:", error);
    throw error;
  }
};
