import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({ 
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert marketing copywriter for a tool called flowchat. Generate engaging, high-converting copy for chat automations."
      }
    });

    res.status(200).json({ text: result.text });
  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
}
