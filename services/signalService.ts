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

const getSessionId = () => {
  if (typeof window === "undefined") return "guest";
  let sid = sessionStorage.getItem("tripzy_session_id");
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("tripzy_session_id", sid);
  }
  return sid;
};

/**
 * Singleton Signal Service for Layer 1 collection.
 */
export const signalService = {
  async trackSignal(signal: Omit<UserSignal, "sessionId">) {
    try {
      const { error } = await supabase
        .schema("blog")
        .from("user_signals")
        .insert([
          {
            user_id: signal.userId || null,
            session_id: getSessionId(),
            signal_type: signal.signalType,
            target_id: signal.targetId || null,
            metadata: signal.metadata || {},
            created_at: new Date().toISOString(),
          },
        ]);
      if (error) console.warn("Track Error:", error.message);
    } catch (e) {
      console.warn("Track Exception:", e);
    }
  },

  // Legacy compatibility for hooks
  async track(params: any) {
    return this.trackSignal({
      signalType: params.event_type,
      targetId: params.target_id,
      userId: params.user_id,
      metadata: { ...params.metadata, target_type: params.target_type },
    });
  },

  async trackPostEngagement(postId: string, metrics: any) {
    return this.trackSignal({
      signalType: "engagement",
      targetId: postId,
      metadata: metrics,
    });
  },
};

export default signalService;
