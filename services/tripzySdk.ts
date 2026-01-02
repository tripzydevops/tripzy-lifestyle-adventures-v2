import { TripzyClient } from "../lib/tripzy-sdk/TripzyClient";
import { SupabaseMemoryAdapter } from "../lib/tripzy-sdk/adapters/SupabaseAdapter";

// config
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// 1. Initialize the specific storage adapter (Supabase in this case)
const memoryAdapter = new SupabaseMemoryAdapter(SUPABASE_URL, SUPABASE_KEY);

// 2. Initialize the SDK with the adapter
export const tripzy = new TripzyClient({
  apiKey: GEMINI_API_KEY,
  memoryAdapter: memoryAdapter, // Dependency Injection
  debug: import.meta.env.DEV,
});
