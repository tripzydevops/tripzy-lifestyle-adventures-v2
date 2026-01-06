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
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    this.domain = config.domain;
    this.constraintsLabel = config.constraintsLabel;
    this.customInstructions = config.customInstructions || "";
  }

  public async analyze(query: string = "", userSignals: any[]) {
    try {
      let analysis: any;

      try {
        // Try Python Backend first
        const backendResponse = await this.callBackendReasoning(
          query,
          userSignals
        );

        analysis = {
          intent: backendResponse.content || backendResponse.intent,
          keywords: backendResponse.keywords || [],
          lifestyleVibe: backendResponse.lifestyleVibe,
          constraints: backendResponse.constraints,
          reasoning: backendResponse.reasoning,
          searchQuery: query,
          confidence: backendResponse.confidence || 0.8,
        };
      } catch (backendError) {
        console.warn(
          "Backend failed, falling back to local reasoning:",
          backendError
        );
        // Local LLM Fallback
        analysis = await this.executeLocalLLM(query, userSignals);
      }

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
    // Force lowercase for better matching
    const API_URL = import.meta.env.VITE_BACKEND_URL;

    // If no backend URL configured, skip the fetch attempt to avoid noise
    if (!API_URL || API_URL.includes("localhost")) {
      throw new Error("No remote backend available");
    }

    const response = await fetch(`${API_URL}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: "client-" + Date.now(),
        query: query,
        user_context: { signals: signals },
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Performs reasoning directly in-browser using Gemini
   * This ensures the app works even if the Python backend is not deployed.
   */
  private async executeLocalLLM(query: string, signals: any[]) {
    const prompt = `
      System: You are the Tripzy Reasoning Engine (Local Mode).
      Goal: Extract intent, vibes, and constraints from the user query and history.
      
      User Query: "${query}"
      User Recent Activity: ${JSON.stringify(signals.slice(-5))}
      
      Instructions:
      1. Infer the "Lifestyle Vibe" (e.g., Adventure, Luxury, Budget, Culture).
      2. Detect Constraints (e.g., Family, Solo, Fast-paced).
      3. Summarize the intent.
      
      Return ONLY valid JSON in this format:
      {
        "intent": "string",
        "lifestyleVibe": "string",
        "constraints": ["string"],
        "reasoning": "string",
        "confidence": 0.9
      }
    `;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Clean markdown code blocks if any
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse local LLM response:", text);
      throw e;
    }
  }

  private async generateVector(analysis: any, originalQuery: string) {
    const text =
      analysis.intent +
      " " +
      (analysis.lifestyleVibe || "") +
      " " +
      originalQuery;
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
