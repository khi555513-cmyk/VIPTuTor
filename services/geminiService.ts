
import { GoogleGenAI } from "@google/genai";
import { Attachment, TutorMode } from '../types';
import { getSystemInstruction } from '../constants';

/**
 * Validates an API key by making a minimal request.
 */
export const validateApiKey = async (key: string): Promise<boolean> => {
  if (!key || key.length < 30) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    // Use gemini-3-flash-preview for a light-weight validation request
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return !!response.text;
  } catch (error) {
    console.error("API Validation Failed:", error);
    return false;
  }
};

/**
 * Generates a response from the AI tutor.
 * Removed apiKey parameter to use process.env.API_KEY directly.
 */
export const generateTutorResponse = async (
  text: string,
  attachments: Attachment[],
  mode: TutorMode,
  onApiError?: () => void
): Promise<string> => {
  try {
    // Correctly initializing GoogleGenAI with the environment variable.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const parts: any[] = [];
    let promptText = text;

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        if (!att.data) return;
        if (att.isText) {
          promptText += `\n\n[Attached Content]:\n${att.data}\n`;
        } else {
          const base64Data = att.data.includes(',') ? att.data.split(',')[1] : att.data;
          parts.push({
            inlineData: { mimeType: att.mimeType, data: base64Data }
          });
        }
      });
    }

    if (promptText) parts.push({ text: promptText });
    if (parts.length === 0) return "Vui lòng nhập nội dung.";

    const systemInstruction = getSystemInstruction(mode);
    const modelName = (mode === TutorMode.EXERCISE || mode === TutorMode.THEORY) 
      ? 'gemini-3-pro-preview' 
      : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: { systemInstruction: systemInstruction, temperature: 0.7 }
    });

    return response.text || "No response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle invalid API key or permission errors gracefully
    if (error?.message?.includes("API_KEY_INVALID") || error?.status === 400 || error?.status === 403) {
      if (onApiError) onApiError();
      return "**LỖI API:** Khóa API không hợp lệ hoặc đã hết hạn.";
    }
    return `**Lỗi:** ${error instanceof Error ? error.message : "Kết nối thất bại"}`;
  }
};