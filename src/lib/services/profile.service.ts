import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { Database } from "@/types/database";
import { UpdateProfileInput } from "@/lib/validations/profile";

export class ProfileServiceError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ProfileServiceError";
    this.status = status;
  }
}

export async function getProfile(
  userId: string,
  client: SupabaseClient<Database>
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as Profile;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  client: SupabaseClient<Database>
): Promise<Profile> {
  const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.full_name !== undefined) {
    updateData.full_name = input.full_name.trim();
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone ? input.phone.trim() : null;
  }

  // Never update role here
  const { data, error } = await client
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("id, full_name, email, phone, role, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Update profile database error:", error);
    throw new ProfileServiceError(`Failed to update profile: ${error?.message}`, 500);
  }

  return data as unknown as Profile;
}
