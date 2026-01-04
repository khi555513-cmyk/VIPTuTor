
import { GoogleGenAI } from "@google/genai";
import { Attachment, TutorMode } from '../types';
import { getSystemInstruction } from '../constants';

/**
 * Generates a response from the AI tutor based on text prompt, attachments and selected mode.
 */
export const generateTutorResponse = async (
  text: string,
  attachments: Attachment[],
  mode: TutorMode
): Promise<string> => {
  try {
    // Initialize the GoogleGenAI client right before use as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const parts: any[] = [];
    let promptText = text;

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        // Safe guard against empty data
        if (!att.data) return;

        // If it's a text attachment (e.g. converted DOCX), append to prompt
        if (att.isText) {
          promptText += `\n\n[Attached Document Content - ${att.name || 'Doc'}]:\n${att.data}\n`;
        } 
        // If it's a regular supported binary (Image, PDF)
        else {
          try {
             // Remove data:image/png;base64, prefix if present for clean base64
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

    // Add text prompt
    if (promptText) {
      parts.push({ text: promptText });
    } else if (parts.length === 0) {
       return "Vui lòng nhập câu hỏi hoặc tải lên hình ảnh để bắt đầu.";
    }

    const systemInstruction = getSystemInstruction(mode);

    // Using gemini-3 series models as per guidelines.
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `**Lỗi kết nối với Gia sư AI:**\n\n${error instanceof Error ? error.message : JSON.stringify(error)}`;
  }
};
