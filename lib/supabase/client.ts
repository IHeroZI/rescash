import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
    console.error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:", supabaseKey ? "SET" : "MISSING");
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
}
