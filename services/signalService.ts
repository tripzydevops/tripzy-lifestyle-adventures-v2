// services/signalService.ts
import { supabase } from "../lib/supabase";

/**
 * PHASE 1: THE GLOBAL PROXY (Layer 1 Collection)
 * Using window['tripzyTrack'] to bypass ALL minification/mangling issues.
 */

declare global {
  interface Window {
    tripzyTrack: (params: any) => void;
    _tripzyFlush: () => void;
    _tripzyQueue: any[];
  }
}

/**
 * Universal CRASH-PROOF track function.
 */
export const track = (params: {
  event_type: string;
  target_type: string;
  target_id: string;
  user_id?: string;
  metadata?: Record<string, any>;
}) => {
  if (typeof window !== "undefined" && window.tripzyTrack) {
    window.tripzyTrack(params);
  } else {
    // Fallback if index.html script failed for some reason
    console.debug("[Signal Library Not Ready]: Queueing internally.");
    if (typeof window !== "undefined") {
      window._tripzyQueue = window._tripzyQueue || [];
      window._tripzyQueue.push({ ...params, ts: new Date().toISOString() });
    }
  }
};

/**
 * Flushes the global queue to Supabase
 */
const flushSignals = async () => {
  if (typeof window === "undefined") return;
  const queue = window._tripzyQueue;
  if (!queue || queue.length === 0) return;

  const batch = [...queue];
  window._tripzyQueue = [];

  try {
    const sessionId =
      sessionStorage.getItem("tripzy_session_id") || "anonymous";

    const preparedSignals = batch.map((s) => ({
      user_id: s.user_id || null,
      session_id: sessionId,
      signal_type: s.event_type || "view",
      target_id: s.target_id || null,
      metadata: {
        ...s.metadata,
        target_type: s.target_type,
        fallback_ts: s.ts,
      },
      created_at: s.ts || new Date().toISOString(),
    }));

    const { error } = await supabase
      .schema("blog")
      .from("user_signals")
      .insert(preparedSignals);

    if (error) console.warn("[L1 Flush Error]:", error.message);
  } catch (err) {
    // Retry: Put back in queue
    window._tripzyQueue = [...batch, ...window._tripzyQueue];
  }
};

// Initialize Processor
if (typeof window !== "undefined") {
  window._tripzyFlush = flushSignals;
  setInterval(flushSignals, 5000);
}

// Named object for backward compatibility
export const signalService = {
  track: track,
  trackSignal: (s: any) =>
    track({
      event_type: s.signalType,
      target_id: s.targetId,
      user_id: s.userId,
      target_type: s.metadata?.contentType || "post",
      metadata: s.metadata,
    }),
  trackPostEngagement: (id: string, m: any) =>
    track({
      event_type: "engagement",
      target_id: id,
      target_type: "post",
      metadata: m,
    }),
};

/**
 * Direct function exports for hooks
 */
export const trackSignal = (s: any) => signalService.trackSignal(s);
export const trackPostEngagement = (id: string, m: any) =>
  signalService.trackPostEngagement(id, m);

export default signalService;
