// services/signalService.ts
import { supabase } from "../lib/supabase";

/**
 * PHASE 1: THE GLOBAL PROXY (Layer 1 Collection)
 * This pattern ensures that tracking calls NEVER fail, even if scripts are still loading.
 * It's modeled after how Google Analytics and Facebook Pixel handle high-traffic signals.
 */

// Define the signal interface
export interface UserSignal {
  signalType: string;
  targetId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

// 1. Initialize the global queue safely
if (typeof window !== "undefined") {
  (window as any)._tripzySignalQueue = (window as any)._tripzySignalQueue || [];
}

/**
 * Universal CRASH-PROOF track function.
 * Instead of calling an object directly, we push to a global queue.
 */
export const track = (params: any) => {
  if (typeof window === "undefined") return;

  const signal: UserSignal = {
    signalType: params.event_type || "view",
    targetId: params.target_id,
    userId: params.user_id,
    metadata: {
      ...params.metadata,
      target_type: params.target_type,
    },
    timestamp: new Date().toISOString(),
  };

  (window as any)._tripzySignalQueue.push(signal);

  // High-performance trigger: If the processor is ready, flush the queue
  if ((window as any)._tripzyFlushSignals) {
    (window as any)._tripzyFlushSignals();
  }
};

/**
 * Layer 1 Internal: Flushes the global queue to Supabase
 */
const flushQueue = async () => {
  const queue = (window as any)._tripzySignalQueue;
  if (!queue || queue.length === 0) return;

  // Take current batch and clear queue
  const batch = [...queue];
  (window as any)._tripzySignalQueue = [];

  try {
    const sessionId =
      sessionStorage.getItem("tripzy_session_id") || "anonymous";

    const preparedSignals = batch.map((s) => ({
      user_id: s.userId || null,
      session_id: sessionId,
      signal_type: s.signalType,
      target_id: s.targetId || null,
      metadata: s.metadata || {},
      created_at: s.timestamp,
    }));

    const { error } = await supabase
      .schema("blog")
      .from("user_signals")
      .insert(preparedSignals);

    if (error) console.warn("[L1 Signal Overflow]:", error.message);
  } catch (err) {
    // If it fails, move back to queue (retry)
    (window as any)._tripzySignalQueue = [
      ...batch,
      ...(window as any)._tripzySignalQueue,
    ];
    console.debug("[L1 Signal Retry]: Buffer preserved.");
  }
};

// Start the processor if in browser
if (typeof window !== "undefined") {
  // Expose the flush method so track() can trigger it
  (window as any)._tripzyFlushSignals = flushQueue;

  // Background heartbeat (flush every 5 seconds)
  setInterval(flushQueue, 5000);
}

// Backward compatibility object
export const signalService = {
  track: track,
  trackSignal: (s: any) =>
    track({
      event_type: s.signalType,
      target_id: s.targetId,
      user_id: s.userId,
      metadata: s.metadata,
    }),
  trackPostEngagement: (id: string, m: any) =>
    track({
      event_type: "engagement",
      target_id: id,
      metadata: m,
    }),
};

export default signalService;
