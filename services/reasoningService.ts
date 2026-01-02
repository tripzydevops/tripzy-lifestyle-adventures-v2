import { getGenAIModel } from "./aiService";

export interface ReasonedRecommendation {
  content: string;
  reasoning: string;
  confidence: number;
}

class ReasoningService {
  /**
   * The "Brain" of the application (Layer 2).
   * Uses Gemini to perform Cross-Domain Reasoning:
   * Translating lifestyle signals/queries into travel intentions.
   */
  public async getRecommendation(
    query: string
  ): Promise<ReasonedRecommendation | null> {
    try {
      const model = getGenAIModel();

      // Get user language from local storage or default to English
      const language = localStorage.getItem("tripzy_language") || "en";
      const isTurkish = language === "tr";

      // System Instructions for the Agent
      const prompt = `
        You are the Tripzy Autonomous Reasoning Engine.
        Your goal is to solve the "Cold Start" problem in travel recommendations.
        
        INPUT:
        User Query: "${query}"
        Language Context: ${isTurkish ? "Turkish (Türkçe)" : "English"}

        TASK:
        1. Analyze the user's query for latent signals (lifestyle, mood, hobbies, aesthetic preferences).
        2. Perform "Cross-Domain Transfer": Connect these non-travel signals to specific travel destinations or activities.
           (e.g., "I love sci-fi" -> Recommend Tokyo/Seoul for futurism).
        3. Formulate a recommendation (Content) and explain the logical connection (Reasoning).
        
        OUTPUT FORMAT (JSON ONLY):
        {
          "content": "A high-level recommendation title (e.g., 'Neon-Lit Cyberpunk Tour of Tokyo')",
          "reasoning": "A brief explanation starting with 'Because you...' linking their interest to the place.",
          "confidence": A number between 0.0 and 1.0 indicating match strength
        }

        Provide the JSON strictly. Ensure the 'content' and 'reasoning' are in ${
          isTurkish ? "Turkish" : "English"
        }.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up markdown code blocks if present
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(text) as ReasonedRecommendation;

      return {
        content:
          data.content ||
          (isTurkish ? "Öneri Hazırlanıyor" : "Preparing Recommendation"),
        reasoning:
          data.reasoning ||
          (isTurkish
            ? "İlgi alanlarınız analiz ediliyor..."
            : "Analyzing your interests..."),
        confidence: data.confidence || 0.8,
      };
    } catch (err) {
      console.warn("Reasoning engine error:", err);
      // Fallback for UI stability
      const language = localStorage.getItem("tripzy_language") || "en";
      return {
        content:
          language === "tr" ? "Size Özel Öneri" : "Personalized Recommendation",
        reasoning:
          language === "tr"
            ? "Arama terimlerinize dayanarak en iyi eşleşmeleri buluyoruz."
            : "We are matching the best destinations based on your search terms.",
        confidence: 0.5,
      };
    }
  }
}

export const reasoningService = new ReasoningService();
