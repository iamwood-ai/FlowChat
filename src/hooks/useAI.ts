import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (prompt: string, systemInstruction?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an expert marketing copywriter for a tool called flowchat. Generate engaging, high-converting copy for chat automations.",
        },
      });
      return response.text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown AI error';
      setError(msg);
      console.error('Gemini Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFlowSuggestion = async (topic: string) => {
    const prompt = `Create a marketing automation flow for: ${topic}. 
    Provide a list of steps. 
    1. Trigger
    2. Message 1
    3. Delay
    4. Message 2
    5. Action (e.g., tag user)`;
    
    return generateResponse(prompt, "You are an automation expert. Return a structured flow configuration.");
  };

  return {
    generateResponse,
    getFlowSuggestion,
    loading,
    error,
  };
}
