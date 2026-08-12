import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-ref.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Neuratia/Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. " +
    "Using placeholder values — auth features will require a real Supabase project."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
