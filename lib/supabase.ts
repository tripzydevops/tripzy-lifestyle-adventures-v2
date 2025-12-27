import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Supabase credentials are missing! Check your .env.local or Vercel Environment Variables.');
}

// Initialize with placeholders ONLY if values are missing, but log the error
export const supabase = createClient(
  supabaseUrl || 'https://MISSING_URL.supabase.co',
  supabaseAnonKey || 'MISSING_KEY'
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== 'your_supabase_url_here' &&
         supabaseAnonKey !== 'your_supabase_anon_key_here';
};
