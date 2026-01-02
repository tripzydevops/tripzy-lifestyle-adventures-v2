import { useRef, useMemo } from "react";
import { TripzyClient } from "../lib/tripzy-sdk/TripzyClient";
import { SupabaseMemoryAdapter } from "../lib/tripzy-sdk/adapters/SupabaseAdapter";

/**
 * Singleton-like hook to access the Tripzy Intelligence SDK.
 * This ensures we only instantiate the heavy client once.
 */
export const useTripzy = () => {
  const clientRef = useRef<TripzyClient | null>(null);

  const sdk = useMemo(() => {
    if (clientRef.current) return clientRef.current;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Graceful fallback for missing keys (dev mode)
    if (!apiKey || !supabaseUrl || !supabaseKey) {
      console.warn("Tripzy SDK Missing Keys: Skipping initialization");
      return null;
    }

    const memory = new SupabaseMemoryAdapter(supabaseUrl, supabaseKey);
    const client = new TripzyClient({
      apiKey,
      memoryAdapter: memory,
      debug: import.meta.env.DEV, // Log in dev mode
    });

    clientRef.current = client;
    return client;
  }, []);

  return sdk;
};
