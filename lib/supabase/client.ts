import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client or throw warning so app can render mock data if envs are missing
    console.warn("Supabase credentials missing in NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  }

  return createBrowserClient(
    supabaseUrl || "https://placeholder-url.supabase.co",
    supabaseAnonKey || "placeholder-key"
  );
};
