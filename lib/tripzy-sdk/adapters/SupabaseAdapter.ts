import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { IMemoryAdapter } from "../layers/MemoryLayer";

export class SupabaseMemoryAdapter implements IMemoryAdapter {
  private supabase: SupabaseClient;
  private config: {
    signalsTable: string;
    contentTable: string;
    vectorFunction: string;
  };

  constructor(
    url: string,
    key: string,
    config = {
      signalsTable: "blog.user_signals",
      contentTable: "blog.posts",
      vectorFunction: "match_posts",
    }
  ) {
    this.supabase = createClient(url, key);
    this.config = config;
  }

  async saveSignal(signal: any): Promise<void> {
    return this.saveSignals([signal]);
  }

  async saveSignals(signals: any[]): Promise<void> {
    // Map SDK (CamelCase) -> Supabase DB (snake_case)
    const formattedSignals = signals.map((s) => ({
      session_id: s.sessionId,
      signal_type: s.type,
      metadata: s.data,
      // Try to extract content ID if present in metadata
      target_id: s.data?.targetId || s.data?.postId || null,
      created_at: s.timestamp,
    }));

    // Handle Schema Selection (e.g. "blog.user_signals" -> schema("blog").from("user_signals"))
    const [schema, table] = this.config.signalsTable.includes(".")
      ? this.config.signalsTable.split(".")
      : ["public", this.config.signalsTable];

    const { error } = await this.supabase
      .schema(schema)
      .from(table)
      .insert(formattedSignals);

    if (error) {
      console.warn(
        `[SupabaseAdapter] Failed to save batch signals: ${error.message}`
      );
    }
  }

  async searchVectors(vector: number[], limit = 5): Promise<any[]> {
    const { data, error } = await this.supabase.rpc(
      this.config.vectorFunction,
      {
        query_embedding: vector,
        match_threshold: 0.5, // strictness
        match_count: limit,
      }
    );

    if (error) {
      console.error(`[SupabaseAdapter] Vector search failed: ${error.message}`);
      return [];
    }

    return data || [];
  }

  async getContentByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];

    const [schema, table] = this.config.contentTable.includes(".")
      ? this.config.contentTable.split(".")
      : ["public", this.config.contentTable];

    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .select("*")
      .in("id", ids);

    if (error) {
      console.error(`[SupabaseAdapter] Content fetch failed: ${error.message}`);
      return [];
    }

    return data || [];
  }
}
