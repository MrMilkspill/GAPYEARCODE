import { createClient, type SupabaseClient } from "@supabase/supabase-js";


let browserClient: SupabaseClient | null = null;


export function getSupabaseConfigurationError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return (
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return null;
}


export function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const configurationError = getSupabaseConfigurationError();

  if (configurationError) {
    throw new Error(configurationError);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClient = createClient(url, anonKey, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
