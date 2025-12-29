// services/signalService.ts
import { supabase } from "../lib/supabase";

export type SignalType =
  | "view"
  | "click"
  | "hover"
  | "scroll"
  | "search"
  | "engagement"
  | "language_change"
  | "page_view";

export interface UserSignal {
  userId?: string;
  sessionId?: string;
  signalType: SignalType;
  targetId?: string;
  metadata?: Record<string, any>;
}

// Session ID persistence
const getSessionId = () => {
  if (typeof window === "undefined") return "server";
  let sessionId = sessionStorage.getItem("tripzy_session_id");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("tripzy_session_id", sessionId);
  }
  return sessionId;
};

/**
 * Layer 1: Signal Collection Service
 * This service manages user signals for the Autonomous Reasoning Engine.
 */
export class SignalService {
  /**
   * Primary method to track any user signal
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
        console.warn("Signal tracking error:", error.message);
      }
    } catch (err) {
      console.warn("Signal tracking exception:", err);
    }
  }

  /**
   * Compatibility method for legacy/hook-based tracking
   */
  async track(params: {
    event_type: string;
    target_type: string;
    target_id: string;
    user_id?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    return this.trackSignal({
      signalType: params.event_type as SignalType,
      targetId: params.target_id,
      userId: params.user_id,
      metadata: {
        ...params.metadata,
        target_type: params.target_type,
      },
    });
  }

  /**
   * Tracks high-resolution engagement metrics
   */
  async trackPostEngagement(
    postId: string,
    metrics: { scrollDepth: number; timeSpentSeconds: number }
  ): Promise<void> {
    return this.trackSignal({
      signalType: "engagement",
      targetId: postId,
      metadata: metrics,
    });
  }
}

// Export both a named instance and a default instance for maximum compatibility
export const signalService = new SignalService();
export default signalService;
