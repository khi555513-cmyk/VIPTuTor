
import { GoogleGenAI } from "@google/genai";
import { Attachment, TutorMode } from '../types';
import { getSystemInstruction } from '../constants';

/**
 * Generates a response from the AI tutor based on text prompt, attachments and selected mode.
 */
export const generateTutorResponse = async (
  text: string,
  attachments: Attachment[],
  mode: TutorMode,
  onApiError?: () => void
): Promise<string> => {
  try {
    // CRITICAL: Always use process.env.API_KEY directly as per SDK guidelines.
    // The key is injected automatically by the environment.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
       return "**LỖI CẤU HÌNH:** Không tìm thấy API Key. Vui lòng kiểm tra lại cấu hình hệ thống.";
    }

    // Always use named parameter for apiKey initialization.
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const parts: any[] = [];
    let promptText = text;

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        if (!att.data) return;

        if (att.isText) {
          promptText += `\n\n[Attached Document Content - ${att.name || 'Doc'}]:\n${att.data}\n`;
        } 
        else {
          try {
             const base64Data = att.data.includes(',') ? att.data.split(',')[1] : att.data;
             if (base64Data) {
                parts.push({
                  inlineData: {
                    mimeType: att.mimeType,
                    data: base64Data
                  }
                });
             }
          } catch (err) {
             console.error("Error processing attachment:", err);
          }
        }
      });
    }

    if (promptText) {
      parts.push({ text: promptText });
    } else if (parts.length === 0) {
       return "Vui lòng nhập câu hỏi hoặc tải lên hình ảnh để bắt đầu.";
    }

    const systemInstruction = getSystemInstruction(mode);

    // Using gemini-3-flash-preview for general chat to save quota, and Pro only for complex tasks
    const modelName = (mode === TutorMode.EXERCISE || mode === TutorMode.THEORY) 
      ? 'gemini-3-pro-preview' 
      : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
      }
    });

    // Access .text property directly (not a method).
    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời vào lúc này.";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // Detect Quota Exceeded (429)
    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      return `**LỖI QUÁ TẢI (429):** API Key của bạn đã hết hạn mức sử dụng (Quota) cho model Pro trong giây lát hoặc trong ngày hôm nay.

**Cách khắc phục:**
1. **Chờ đợi:** Vui lòng thử lại sau khoảng 30-60 giây.
2. **Chọn lại API Key:** Quay lại màn hình chính và chọn lại API Key có hạn mức cao hơn nếu cần.
3. **Dùng model Flash:** Thử chuyển sang chế độ Chat thường để sử dụng model Flash có hạn mức cao hơn.`;
    }

    // Detect Invalid API Key (401/403)
    // Fix: Using backticks for multi-line string to resolve errors on lines 94-98
    if (error?.message?.includes("Requested entity was not found") || error?.status === 404 || error?.status === 403 || error?.message?.includes("API_KEY_INVALID")) {
      if (onApiError) onApiError();
      return `**LỖI XÁC THỰC:** API Key không hợp lệ, đã hết hạn hoặc bị vô hiệu hóa. 

**Vui lòng:**
- Kiểm tra lại trạng thái thanh toán của Project trên Google Cloud Console.
- Chọn lại API Key mới từ AI Studio thông qua màn hình khởi động của ứng dụng.`;
    }

    return `**Lỗi kết nối với Gia sư AI:**\n\n${error instanceof Error ? error.message : "Đã có lỗi không xác định xảy ra. Vui lòng thử lại sau."}`;
  }
};
