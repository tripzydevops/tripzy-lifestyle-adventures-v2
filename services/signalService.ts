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
 * Primary method to track any user signal (View, Click, Search, etc.)
 */
export async function trackSignal(signal: Omit<UserSignal, "sessionId">) {
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
}

/**
 * Compatibility method for legacy/hook-based tracking (the .track function)
 */
export async function track(params: any) {
  return trackSignal({
    signalType: params.event_type || "view",
    targetId: params.target_id,
    userId: params.user_id,
    metadata: { ...params.metadata, target_type: params.target_type },
  });
}

/**
 * Specifically tracks high-resolution engagement metrics
 */
export async function trackPostEngagement(postId: string, metrics: any) {
  return trackSignal({
    signalType: "engagement",
    targetId: postId,
    metadata: metrics,
  });
}

// Named object export for backward compatibility
export const signalService = {
  track,
  trackSignal,
  trackPostEngagement,
};

export default signalService;
