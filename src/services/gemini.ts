import { GoogleGenAI, Type } from "@google/genai";
import { MaterialType } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function generateStudyMaterial(topic: string, type: MaterialType) {
  const model = "gemini-3-flash-preview";
  
  const isRgpvMode = topic.includes('[RGPV EXAM MODE]');
  const cleanTopic = topic.replace('[RGPV EXAM MODE] ', '');
  
  let prompt = "";
  let responseSchema: any = null;

  const rgpvContext = isRgpvMode ? " specifically for RGPV (Rajiv Gandhi Proudyogiki Vishwavidyalaya) university standards and exam patterns" : "";

  if (type === 'summary') {
    prompt = `Generate a concise, exam-ready study guide for the topic: "${cleanTopic}"${rgpvContext}.
    Keep it around 700-900 words and include:
    1. Short introduction and context.
    2. Core concepts with simple explanations.
    3. Important sub-topics with practical examples.
    4. Key formulas or technical points if relevant.
    5. Quick comparison with related concepts.
    6. Final revision bullets for exams.
    Format in clean Markdown.`;
  } else if (type === 'quiz') {
    prompt = `Generate an 8-question multiple-choice quiz for the topic: "${cleanTopic}"${rgpvContext}.
    Use mixed difficulty (easy to moderate).
    Each question should have 4 options, one correct answer, and a short explanation.`;
    responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    };
  } else if (type === 'flashcards') {
    prompt = `Generate 12 high-quality flashcards for the topic: "${cleanTopic}"${rgpvContext}.
    Each flashcard should have a "front" question or term and a concise "back" explanation with one example when useful.`;
    responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING }
        },
        required: ["front", "back"]
      }
    };
  } else if (type === 'pyq') {
    prompt = `Generate a compact set of 12 "Previous Year Style" exam questions for the topic: "${cleanTopic}" specifically for RGPV (Rajiv Gandhi Proudyogiki Vishwavidyalaya) university standards.
    Include:
    - 4 long-answer questions (10-15 marks style) with key expected points.
    - 4 short-answer questions (5-7 marks style).
    - 4 very short answer questions (2 marks style).
    - Provide brief answer hints for each question.
    Format the output in Markdown with clear sections.`;
  } else if (type === 'roadmap') {
    prompt = `Create a practical 14-day roadmap for mastering the topic: "${cleanTopic}"${rgpvContext}.
    Keep it concise and actionable.
    Please follow this EXACT structure for each day:
    
    ### Day X: [Sub-topic Name]
    - **Learning Objectives**: Detailed goals for the day.
    - **In-Depth Topics**: A comprehensive list of specific concepts to master.
    - **Study Hours**: Recommended time (e.g., 4-6 hours).
    - **Key Resources**: Specific books, documentation links, or keywords.
    - **Practical Task**: A hands-on exercise or problem to solve.
    - **Self-Assessment**: 3-5 questions to check understanding.
    - **Checklist**: Items to verify completion.
    
    Include a "Weekly Review" on day 7 and a final revision plan in the last 2 days.
    Format the output in Markdown.`;
  }

  const maxOutputTokens =
    type === 'summary' ? 2200 :
    type === 'roadmap' ? 2000 :
    1600;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: responseSchema ? "application/json" : "text/plain",
      responseSchema: responseSchema || undefined,
      maxOutputTokens,
      temperature: 0.4,
    },
  });

  return response.text;
}

export async function deepDive(content: string, topic: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `The following is a study material for the topic "${topic}":
  
  ${content}
  
  Please provide a MUCH MORE DETAILED and IN-DEPTH expansion of the content above. 
  Focus on explaining complex concepts more thoroughly, adding more examples, and providing deeper technical insights. 
  The goal is to provide a "Read More" or "Deep Dive" experience for a student who wants to master the topic.
  Format the output in Markdown.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "text/plain",
    },
  });

  return response.text;
}
