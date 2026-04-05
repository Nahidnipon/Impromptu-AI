import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTopics(language: string, count: number = 3) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    contents: `Generate ${count} unique, engaging impromptu speaking topics in ${language}. 
    The topics should be thought-provoking but accessible. 
    Return them as a JSON array of strings.`,
  });
  
  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    return ["A random topic"];
  }
}

export async function getFeedback(transcript: string, topic: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert public speaking coach. 
    Topic: "${topic}"
    Language: ${language}
    User Transcript: "${transcript}"
    
    Provide constructive feedback in ${language} to help the user improve their thinking and speaking.
    Focus on:
    1. Structure (Introduction, Body, Conclusion)
    2. Clarity and Flow
    3. Vocabulary and Grammar
    4. Content Quality
    
    Format the feedback using Markdown. Use encouraging but professional tone.`,
  });
  return response.text || "No feedback available.";
}
