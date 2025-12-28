// services/signalService.ts
import { supabase } from "../lib/supabase";

export type SignalType =
  | "view"
  | "click"
  | "hover"
  | "scroll"
  | "search"
  | "engagement";

export interface UserSignal {
  userId?: string;
  sessionId?: string;
  signalType: SignalType;
  targetId?: string;
  metadata?: Record<string, any>;
}

// Session ID persistence (temporary for anonymous tracking)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("tripzy_session_id");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("tripzy_session_id", sessionId);
  }
  return sessionId;
};

export const signalService = {
  /**
   * Tracks a user signal to Supabase for the Autonomous Reasoning Engine (Layer 1)
   */
  async trackSignal(signal: Omit<UserSignal, "sessionId">): Promise<void> {
    try {
      const sessionId = getSessionId();

      const { error } = await supabase
        .schema("blog")
        .from("user_signals")
        .insert([
          {
            user_id: signal.userId || null,
            session_id: sessionId,
            signal_type: signal.signalType,
            target_id: signal.targetId || null,
            metadata: signal.metadata || {},
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        // Silently fail to not disrupt user experience
        console.warn("Signal error:", error.message);
      }
    } catch (err) {
      console.warn("Failed to track signal:", err);
    }
  },

  /**
   * Specifically tracks post engagement (scroll depth, time spent)
   */
  async trackPostEngagement(
    postId: string,
    metrics: { scrollDepth: number; timeSpentSeconds: number }
  ) {
    return this.trackSignal({
      signalType: "engagement",
      targetId: postId,
      metadata: metrics,
    });
  },
};
