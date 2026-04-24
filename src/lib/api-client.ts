import { getBrowserSupabaseClient, isBrowserSupabaseConfigured } from "./supabase-browser";

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (isBrowserSupabaseConfigured()) {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers
  });
}
