import { SignalLayer } from "./layers/SignalLayer";
import { ReasoningLayer } from "./layers/ReasoningLayer";
import { IMemoryAdapter } from "./layers/MemoryLayer";

export interface TripzyConfig {
  apiKey: string; // For Gemini/AI
  memoryAdapter: IMemoryAdapter; // The Plug-and-Play Database Adapter
  debug?: boolean;
  reasoningConfig?: {
    domain: string;
    constraintsLabel: string;
    customInstructions?: string;
  };
}

export class TripzyClient {
  // The 3 Core Layers
  public signals: SignalLayer;
  public brain: ReasoningLayer;
  public memory: IMemoryAdapter;

  private config: TripzyConfig;

  constructor(config: TripzyConfig) {
    this.config = config;

    // Initialize Layers with Dependency Injection
    this.memory = config.memoryAdapter;
    this.brain = new ReasoningLayer(config.apiKey, config.reasoningConfig);
    this.signals = new SignalLayer(this.memory);

    if (config.debug) {
      console.log("🚀 Tripzy Autonomous SDK Initialized");
    }
  }

  /**
   * Universal "Track" method for any app
   */
  public track(eventType: string, metadata: any = {}) {
    this.signals.track(eventType, metadata);
  }

  /**
   * The "Magic" method: Returns recommendations based on the session
   */
  public async getRecommendations(query?: string) {
    // 1. Get raw signals
    const userSignals = this.signals.getSessionSignals();

    // 2. Use Brain to analyze signals + query
    // Returns: intent, keywords, reasoning, searchVector
    const reasoning = await this.brain.analyze(query, userSignals);

    // 3. Fetch data based on reasoning (using the agnostic memory adapter)
    let content: any[] = [];

    if (reasoning.searchVector && reasoning.searchVector.length > 0) {
      // a. Perform Vector Search (returns { id, similarity })
      const searchResults = await this.memory.searchVectors(
        reasoning.searchVector
      );

      if (searchResults.length > 0) {
        // b. Hydrate with real content
        const ids = searchResults.map((r) => r.id);
        const posts = await this.memory.getContentByIds(ids);

        // c. Merge similarity scores and sort
        content = posts
          .map((post) => {
            const match = searchResults.find((r) => r.id === post.id);
            return {
              ...post,
              match_score: match ? match.similarity : 0,
            };
          })
          .sort((a, b) => b.match_score - a.match_score);
      }
    }

    return {
      ...reasoning,
      content, // Hydrated real data
    };
  }
}
