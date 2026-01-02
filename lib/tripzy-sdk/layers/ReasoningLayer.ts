import { GoogleGenerativeAI } from "@google/generative-ai";

export class ReasoningLayer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private embeddingModel: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: "text-embedding-004",
    });
  }

  public async analyze(query: string = "", userSignals: any[]) {
    try {
      // 1. Construct Context from Signals (if any)
      const signalContext =
        userSignals.length > 0
          ? `User History: ${JSON.stringify(userSignals.slice(-5))}`
          : "User History: None (Cold Start)";

      // 2. Build Agent Prompts
      const prompt = `
        ACT AS: Tripzy Autonomous Agent (Layer 2)
        
        CONTEXT:
        Query: "${query}"
        ${signalContext}
        
        TASK:
        Analyze the user's intent. If they have no history (Cold Start), infer preferences from the query style/keywords.
        Perform "Cross-Domain Mapping" (e.g. "Cyberpunk" -> Tokyo).
        
        OUTPUT (JSON):
        {
          "intent": "Short summary of what they want",
          "keywords": ["keyword1", "keyword2", "keyword3"],
          "reasoning": "Explanation of why this was chosen",
          "searchQuery": "Optimized sentence for semantic search",
          "confidence": 0.0-1.0
        }
      `;

      // 3. Execute Reasoning
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Sanitization
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const analysis = JSON.parse(text);

      // 4. Generate Embedding for Search
      // We use the "searchQuery" or combine intent + keywords
      const textToEmbed =
        analysis.searchQuery ||
        `${analysis.intent} ${analysis.keywords.join(" ")}`;
      const embeddingResult = await this.embeddingModel.embedContent(
        textToEmbed
      );
      const vector = embeddingResult.embedding.values;

      return {
        ...analysis,
        searchVector: vector,
      };
    } catch (error) {
      console.error("Tripzy Brain Error:", error);

      // Fallback: Generate embedding for the raw query
      let fallbackVector: number[] = [];
      try {
        const embeddingResult = await this.embeddingModel.embedContent(
          query || "travel"
        );
        fallbackVector = embeddingResult.embedding.values;
      } catch (e) {
        console.error("Embedding fallback failed", e);
      }

      return {
        intent: "General Discovery",
        keywords: [query],
        reasoning: "Fallback: Standard keyword search",
        searchQuery: query,
        confidence: 0.1,
        searchVector: fallbackVector,
      };
    }
  }
}
