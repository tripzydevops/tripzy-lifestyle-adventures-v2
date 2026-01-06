// services/signalService.ts
import { supabase } from "../lib/supabase";

/**
 * PHASE 1: THE GLOBAL PROXY (Layer 1 Collection)
 * This service bridges the React App with the Global Shield in index.html.
 */

declare global {
  interface Window {
    tripzyTrack: (params: any) => void;
    signalService: { track: (params: any) => void };
    _tripzyFlush: () => void;
    _tripzyQueue: any[];
  }
}

/**
 * Universal CRASH-PROOF track function.
 */
export const track = (params: any) => {
  if (typeof window !== "undefined") {
    // Try the global shield first (most reliable)
    if (window.tripzyTrack) {
      window.tripzyTrack(params);
    } else if (
      window.signalService &&
      typeof window.signalService.track === "function"
    ) {
      window.signalService.track(params);
    } else {
      // Emergency internal queue
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
      user_id: s.user_id || s.userId || null,
      session_id: sessionId,
      signal_type: s.event_type || s.signalType || "view",
      target_id: s.target_id || s.targetId || null,
      metadata: {
        ...s.metadata,
        target_type: s.target_type || s.targetType,
        fallback_ts: s.ts,
      },
      created_at: s.ts || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("user_signals")
      .insert(preparedSignals);

    if (error) console.warn("[L1 Flush Error]:", error.message);
  } catch (err) {
    window._tripzyQueue = [...batch, ...window._tripzyQueue];
  }
};

// Start Processor
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

  /**
   * Fetches aggregated signal usage stats for the admin dashboard.
   */
  getSignalStats: async (limit = 7) => {
    try {
      const { data, error } = await supabase.rpc("get_signal_stats", {
        limit_days: limit,
      });

      if (error) {
        console.warn("Stats RPC failed, falling back to raw query aggregation");

        // Fallback: Manually aggregate last 7 days from raw signals
        const { data: rawData, error: rawError } = await supabase
          .from("user_signals")
          .select("created_at, signal_type")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order("created_at", { ascending: true });

        if (rawError) throw rawError;

        // Group by day
        const grouped: Record<string, any> = {};
        rawData?.forEach((row) => {
          const date = new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (!grouped[date])
            grouped[date] = { date, views: 0, clicks: 0, searches: 0 };

          if (row.signal_type === "view") grouped[date].views++;
          else if (row.signal_type === "click") grouped[date].clicks++;
          else if (row.signal_type === "search") grouped[date].searches++;
        });

        return Object.values(grouped);
      }

      return data;
    } catch (e) {
      console.error("Failed to fetch signal stats:", e);
      return [];
    }
  },
};

// Direct exports
export const trackSignal = (s: any) => signalService.trackSignal(s);
export const trackPostEngagement = (id: string, m: any) =>
  signalService.trackPostEngagement(id, m);

export default signalService;
