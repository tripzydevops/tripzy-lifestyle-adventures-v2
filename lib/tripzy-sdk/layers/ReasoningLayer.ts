import { GoogleGenerativeAI } from "@google/generative-ai";

export class ReasoningLayer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private embeddingModel: any;

  private domain: string;
  private constraintsLabel: string;
  private customInstructions: string;

  constructor(
    apiKey: string,
    config: {
      domain: string;
      constraintsLabel: string;
      customInstructions?: string;
    } = {
      domain: "Travel & Lifestyle",
      constraintsLabel:
        "Infer constraints: Budget (Cheap/Luxury), Travelers (Family/Solo), Pace (Fast/Slow).",
    }
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    this.domain = config.domain;
    this.constraintsLabel = config.constraintsLabel;
    this.customInstructions = config.customInstructions || "";
  }

  public async analyze(query: string = "", userSignals: any[]) {
    try {
      const mode = userSignals.length === 0 ? "COLD_START" : "CONTEXTUAL";
      const prompt = this.buildPrompt(mode, query, userSignals);
      const analysis = await this.executeLLM(prompt);
      const vector = await this.generateVector(analysis, query);

      return {
        ...analysis,
        searchVector: vector,
      };
    } catch (error) {
      console.error("Tripzy Brain Error:", error);
      return this.getFallbackResponse(query, error);
    }
  }

  private buildPrompt(mode: string, query: string, signals: any[]): string {
    const context =
      mode === "CONTEXTUAL"
        ? `User History: ${JSON.stringify(signals.slice(-10))}` // Deep history
        : "User History: NONE (New User / Cold Start)";

    return `
      ACT AS: Tripzy Autonomous Agent (Layer 2)
      DOMAIN: ${this.domain}
      MODE: ${mode}
      
      CONTEXT:
      Query: "${query}"
      ${context}
      
      TASKS:
      1. ANALYZE INTENT: What is the user looking for in the context of ${this.domain}?
      2. COLD START INFERENCE:
         - If MODE is COLD_START, infer "Lifestyle Vibe" from the query keywords alone.
      3. CROSS-DOMAIN MAPPING:
         - Map abstract concepts to concrete attributes in ${this.domain}.
         ${this.customInstructions}
      4. CONSTRAINT DETECTION:
         - ${this.constraintsLabel}
      
      OUTPUT (JSON ONLY):
      {
        "intent": "Short summary",
        "keywords": ["tag1", "tag2", "tag3"],
        "lifestyleVibe": "Inferred vibe (e.g. Luxury, Adventure)",
        "constraints": ["Constraint 1", "Constraint 2"],
        "reasoning": "Why you chose this",
        "searchQuery": "Optimized semantic search string",
        "confidence": 0.0-1.0
      }
    `;
  }

  private async executeLLM(prompt: string): Promise<any> {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(text);
  }

  private async generateVector(analysis: any, originalQuery: string) {
    const text =
      analysis.searchQuery ||
      `${analysis.intent} ${analysis.keywords.join(" ")}`;
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  private async getFallbackResponse(query: string, error: any) {
    let fallbackVector: number[] = [];
    try {
      const result = await this.embeddingModel.embedContent(query || "travel");
      fallbackVector = result.embedding.values;
    } catch (e) {
      console.error("Fallback embed failed", e);
    }

    return {
      intent: "Fallback Search",
      keywords: [query],
      reasoning: "Error in reasoning engine. Using raw query.",
      searchQuery: query,
      confidence: 0.1,
      searchVector: fallbackVector,
    };
  }
}
