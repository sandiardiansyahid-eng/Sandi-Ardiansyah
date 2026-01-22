
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartSuggestions = async (content: string): Promise<AIResponse> => {
  if (!content || content.length < 10) return {};

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this note and provide a concise title, a short summary (1 sentence), and the most appropriate category (Personal, Work, Ideas, Urgent, or General). Content: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestedCategory: { 
              type: Type.STRING,
              description: "Must be one of: Personal, Work, Ideas, Urgent, General"
            }
          },
          required: ["title", "summary", "suggestedCategory"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {};
  }
};

export const enhanceNote = async (content: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Clean up the grammar and formatting of the following note while keeping its original meaning. Use bullet points if helpful. Content: "${content}"`,
      });
      return response.text || content;
    } catch (error) {
      console.error("AI Enhancement Error:", error);
      return content;
    }
};
