import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  !supabaseUrl.includes("placeholder")
);

// Privileged service-role client: ONLY for trusted server-side procedures
export const supabaseServer = isSupabaseServerConfigured
  ? createSupabaseClient<Database>(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Creates an SSR server client utilizing Next.js cookies() store.
 * Suitable for Route Handlers and Server Components.
 */
export function createServerSupabaseClient(): ReturnType<typeof createServerClient<Database>> | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can be called from Server Component where cookies cannot be written
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Can be called from Server Component where cookies cannot be written
        }
      },
    },
  });
}

/**
 * User-scoped client: carries the verified citizen/admin bearer session token
 * so that PostgreSQL auth.uid(), RLS policies, and triggers receive the actual authenticated identity
 */
export function createUserScopedClient(accessToken: string): SupabaseClient<Database> | null {
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
    return null;
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
