
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
    // Priority: Custom Manual Key > Environment Variable
    const apiKey = localStorage.getItem('CUSTOM_GEMINI_KEY') || (process.env.API_KEY as string);
    
    if (!apiKey) {
       return "**LỖI CẤU HÌNH:** Không tìm thấy API Key. Vui lòng vào mục Hồ sơ để kết nối.";
    }

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

    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời vào lúc này.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error?.message?.includes("Requested entity was not found") || error?.status === 404 || error?.status === 403 || error?.message?.includes("API_KEY_INVALID")) {
      if (onApiError) onApiError();
      return "**LỖI XÁC THỰC:** API Key không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại Key thủ công hoặc chọn lại API Key mới từ AI Studio.";
    }

    return `**Lỗi kết nối với Gia sư AI:**\n\n${error instanceof Error ? error.message : JSON.stringify(error)}`;
  }
};
