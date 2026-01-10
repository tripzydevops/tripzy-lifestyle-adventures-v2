import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { TripzyClient } from "../lib/tripzy-sdk/TripzyClient";
import { SupabaseMemoryAdapter } from "../lib/tripzy-sdk/adapters/SupabaseAdapter";

interface TripzyContextType {
  client: TripzyClient | null;
  isReady: boolean;
  track: (eventType: string, metadata?: any) => void;
  getRecommendations: (query?: string) => Promise<any>;
  streamRecommendation: (
    query: string,
    ignoredContext: any[],
    onEvent: (e: any) => void
  ) => Promise<void>;
}

const TripzyContext = createContext<TripzyContextType | undefined>(undefined);

export const TripzyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [client, setClient] = useState<TripzyClient | null>(null);

  useEffect(() => {
    // Cast strict env access to avoid TS build errors in some environments
    const env = (import.meta as any).env;
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
    const geminiKey = env.VITE_GEMINI_API_KEY;

    if (supabaseUrl && supabaseKey && geminiKey) {
      const adapter = new SupabaseMemoryAdapter(supabaseUrl, supabaseKey);
      const sdk = new TripzyClient({
        apiKey: geminiKey,
        memoryAdapter: adapter,
        debug: true,
      });
      setClient(sdk);

      // Mount to window for global access (signalService compatibility)
      if (typeof window !== "undefined") {
        (window as any).tripzyTrack = (params: any) => {
          const eventType = params.event_type || params.type || "unknown";
          sdk.track(eventType, params);
        };
      }
    } else {
      console.warn(
        "Tripzy SDK: Missing Environment Variables. Ensure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_GEMINI_API_KEY are set."
      );
    }
  }, []);

  const track = (eventType: string, metadata: any = {}) => {
    if (client) {
      client.track(eventType, metadata);
    } else {
      console.warn("Tripzy SDK: Client not initialized yet.");
    }
  };

  const getRecommendations = async (query?: string) => {
    if (client) {
      return await client.getRecommendations(query);
    }
    return { content: [], reasoning: "Client not ready" };
  };

  const streamRecommendation = async (
    query: string,
    ignoredContext: any[],
    onEvent: (e: any) => void
  ) => {
    if (client) {
      return await client.streamRecommendation(query, onEvent);
    }
    onEvent({ type: "error", data: "Client not ready" });
  };

  return (
    <TripzyContext.Provider
      value={{
        client,
        isReady: !!client,
        track,
        getRecommendations,
        streamRecommendation,
      }}
    >
      {children}
    </TripzyContext.Provider>
  );
};

export const useTripzy = (): TripzyContextType => {
  const context = useContext(TripzyContext);
  if (context === undefined) {
    throw new Error("useTripzy must be used within a TripzyProvider");
  }
  return context;
};
