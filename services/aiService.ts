
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get API key from Env or LocalStorage
const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'PLACEHOLDER_API_KEY' && envKey.length > 10) return envKey;
  
  try {
    const localKey = localStorage.getItem('TRIPZY_AI_KEY');
    if (localKey && localKey.length > 10) return localKey;
  } catch (e) {
    // Ignore storage errors
  }
  return "";
};

const getGenAIModel = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY or save it in settings.");
    throw new Error("Gemini API Key is missing");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const aiService = {
  async generateExcerpt(content: string): Promise<string> {
    try {
      const model = getGenAIModel();
      const prompt = `Summarize the following travel blog content into a catchy, SEO-friendly excerpt of maximum 160 characters. Provide only the text result without any quotes or preamble: \n\n ${content.replace(/<[^>]*>?/gm, '')}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text()?.trim() || "";
    } catch (error) {
      console.error("Gemini Error (generateExcerpt):", error);
      throw error;
    }
  },

  async generateFeaturedImage(title: string): Promise<string> {
    console.log("Image generation requested for:", title);
    return "";
  },

  async generateSEOKeywords(title: string, content: string): Promise<string> {
    try {
      const model = getGenAIModel();
      const prompt = `Generate 5-8 relevant, high-traffic SEO keywords for a blog post with title "${title}" and content preview: "${content.substring(0, 500)}". Return ONLY the keywords separated by commas, no other text.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text()?.trim() || "";
    } catch (error) {
      console.error("Gemini Error (generateSEOKeywords):", error);
      throw error;
    }
  },

  async generatePostOutline(title: string): Promise<string> {
    try {
      const model = getGenAIModel();
      const prompt = `Create a comprehensive, structured outline for a travel blog post titled: "${title}". Include suggestions for headings (H2, H3), key points to cover in each section, and photo opportunities. Return the result in a clean Markdown-like list.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "";
    } catch (error) {
      console.error("Gemini Error (generatePostOutline):", error);
      throw error;
    }
  },

  async proofreadContent(content: string): Promise<string> {
    try {
      const model = getGenAIModel();
      const prompt = `Proofread and improve the following blog content for grammar, tone, and engagement. Maintain the original structure but make it sound more professional and evocative. Content: \n\n ${content}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || content;
    } catch (error) {
      console.error("Gemini Error (proofreadContent):", error);
      throw error;
    }
  },

  async getSearchGrounding(query: string) {
    try {
      const model = getGenAIModel();
      const prompt = `Provide a brief, helpful overview and latest updates about: "${query}".`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return {
        text: response.text(),
        sources: []
      };
    } catch (error) {
      console.error("Gemini Error (getSearchGrounding):", error);
      return null;
    }
  },

  async getNearbyAttractions(locationName: string, _lat?: number, _lng?: number) {
    try {
      const model = getGenAIModel();
      const prompt = `Recommend 3-5 must-visit places, restaurants, or attractions near "${locationName}". For each, provide a brief description of why it is special.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;

      return {
        text: response.text(),
        sources: []
      };
    } catch (error) {
      console.error("Gemini Error (getNearbyAttractions):", error);
      return null;
    }
  },

  async generateAudio(_text: string): Promise<string> {
    console.log("Audio generation not available in current SDK");
    return "";
  }
};
