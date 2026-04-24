import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type SupabaseGlobal = typeof globalThis & {
  __atomsLiteSupabaseAdmin?: SupabaseClient;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!supabaseGlobal.__atomsLiteSupabaseAdmin) {
    supabaseGlobal.__atomsLiteSupabaseAdmin = createClient(
      getSupabaseUrl(),
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return supabaseGlobal.__atomsLiteSupabaseAdmin;
}

export async function getRequestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
