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

      // Call Python Backend for Reasoning
      const backendResponse = await this.callBackendReasoning(
        query,
        userSignals
      );

      const analysis = {
        intent: backendResponse.content, // Using recommendation content as intent summary for now
        keywords: [], // Backend doesn't return keywords yet
        lifestyleVibe: backendResponse.lifestyleVibe,
        constraints: backendResponse.constraints,
        reasoning: backendResponse.reasoning,
        searchQuery: query,
        confidence: backendResponse.confidence,
      };

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

  private async callBackendReasoning(query: string, signals: any[]) {
    try {
      // Use local backend or env var
      const API_URL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

      const response = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: "client-" + Date.now(), // Generate prompt session
          query: query,
          user_context: { signals: signals },
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      console.error("Failed to call backend:", e);
      // Fallback local execution if backend fails?
      // For now, let's throw to trigger the fallback response.
      throw e;
    }
  }

  // Legacy local prompt builder - kept for reference or hybrid mode if needed
  private buildPrompt(mode: string, query: string, signals: any[]): string {
    return "";
  }

  private async executeLLM(prompt: string): Promise<any> {
    // Deprecated in favor of callBackendReasoning
    return {};
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
