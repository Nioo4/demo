import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BrowserGlobal = typeof globalThis & {
  __atomsLiteSupabaseBrowser?: SupabaseClient;
};

const browserGlobal = globalThis as BrowserGlobal;

export function isBrowserSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getBrowserSupabaseClient() {
  if (!isBrowserSupabaseConfigured()) {
    throw new Error("Browser Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!browserGlobal.__atomsLiteSupabaseBrowser) {
    browserGlobal.__atomsLiteSupabaseBrowser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  return browserGlobal.__atomsLiteSupabaseBrowser;
}
