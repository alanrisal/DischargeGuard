import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(url && key);

let _client: SupabaseClient<Database> | null = null;

/** Browser-safe: returns null when env vars are missing (demo / local without Supabase). */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (!_client) _client = createClient<Database>(url, key);
  return _client;
}
