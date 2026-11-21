import "server-only";
import { NextRequest } from "next/server";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient, createUserScopedClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { Profile } from "@/types";
import { Database } from "@/types/database";

export interface AuthenticatedContext {
  user: User;
  profile: Profile;
  client: SupabaseClient<any, any, any>;
}

/**
 * Derives verified authenticated identity and profile from either
 * the Authorization: Bearer <token> header or Next.js session cookies.
 *
 * Verifies role strictly against public.profiles table in PostgreSQL.
 */
export async function getAuthenticatedContext(
  req?: NextRequest
): Promise<AuthenticatedContext | null> {
  let client: SupabaseClient<any, any, any> | null = null;
  let user: User | null = null;

  // 1. Try Bearer token from Authorization header if request is provided
  if (req) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]?.trim();
      if (token) {
        client = createUserScopedClient(token);
        if (client) {
          const { data, error } = await client.auth.getUser(token);
          if (!error && data?.user) {
            user = data.user;
          }
        }
      }
    }
  }

  // 2. Try cookie-based session if no Bearer token was provided or valid
  if (!user) {
    const cookieClient = createServerSupabaseClient();
    if (cookieClient) {
      const { data, error } = await cookieClient.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
        client = cookieClient;
      }
    }
  }

  if (!user || !client) {
    return null;
  }

  // 3. Fetch verified profile from public.profiles
  // We can query using the client (which has auth.uid() = user.id) or fallback to admin client if needed
  let profile: Profile | null = null;

  const { data: profileData, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileData && !profileError) {
    profile = profileData as unknown as Profile;
  } else {
    // If profile row doesn't exist yet (e.g. edge case during initial trigger execution),
    // query or safely provision via admin client
    const admin = getAdminClient();
    if (admin) {
      const { data: adminProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (adminProfile) {
        profile = adminProfile as unknown as Profile;
      } else {
        // Fallback auto-provision profile if trigger hasn't fired
        const fullName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Citizen Resident";
        const { data: newProfile } = await admin
          .from("profiles")
          .insert({
            id: user.id,
            full_name: fullName,
            email: user.email ?? null,
            role: "citizen",
          })
          .select()
          .single();

        if (newProfile) {
          profile = newProfile as unknown as Profile;
        }
      }
    }
  }

  if (!profile) {
    // Profile could not be resolved
    return null;
  }

  return {
    user,
    profile,
    client,
  };
}
