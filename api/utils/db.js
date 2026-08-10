import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

/**
 * Get or initialize Supabase PostgreSQL Singleton Client
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.SUPABASE_SECRET_KEY ||
              process.env.SUPABASE_KEY ||
              process.env.SUPABASE_ANON_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url.trim(), key.trim(), {
        auth: { persistSession: false },
        db: { schema: "public" },
        global: {
          headers: { "x-application-name": "hodls-admissions-engine" },
        },
      });
      return supabaseClient;
    } catch (e) {
      console.error("Database connection initialization error:", e);
    }
  }
  return null;
}


