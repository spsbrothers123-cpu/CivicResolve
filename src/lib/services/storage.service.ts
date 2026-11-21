import "server-only";
import { randomUUID } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";
import { validateImageBuffer } from "@/lib/validations/image";
import { Database } from "@/types/database";

export const EVIDENCE_BUCKET = "civic-evidence";

export interface UploadEvidenceResult {
  path: string;
  signedUrl: string;
}

export class StorageServiceError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "StorageServiceError";
    this.status = status;
  }
}

/**
 * Validates, securely renames, and uploads an evidence image to the private civic-evidence bucket.
 */
export async function uploadEvidence(
  userId: string,
  buffer: Buffer,
  originalFilename: string,
  userClient?: SupabaseClient<Database> | null
): Promise<UploadEvidenceResult> {
  if (!userId) {
    throw new StorageServiceError("Unauthorized: Missing user identity.", 401);
  }

  // 1. Binary & format validation via Sharp and magic bytes
  const validation = await validateImageBuffer(buffer, originalFilename);
  if (!validation.valid || !validation.detectedMime) {
    throw new StorageServiceError(
      validation.error || "Invalid evidence image format.",
      400
    );
  }

  // 2. Safe, non-predictable path organized by authenticated user UUID
  const ext =
    validation.detectedMime === "image/jpeg"
      ? "jpg"
      : validation.detectedMime === "image/png"
      ? "png"
      : "webp";
  const safeFilename = `${Date.now()}-${randomUUID()}.${ext}`;
  const storagePath = `${userId}/${safeFilename}`;

  // Use userClient (enforcing RLS folder check) or fallback to adminClient if not provided
  const client = userClient || getAdminClient();
  if (!client) {
    throw new StorageServiceError("Storage service unavailable.", 503);
  }

  const { error: uploadError } = await client.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: validation.detectedMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new StorageServiceError(
      `Failed to upload evidence to storage: ${uploadError.message}`,
      500
    );
  }

  // 3. Generate signed URL for immediate preview (valid for 1 hour)
  const signedUrl = await createSignedEvidenceUrl(storagePath, 3600, client);

  return {
    path: storagePath,
    signedUrl,
  };
}

/**
 * Creates a temporary signed URL for authorized viewing of private evidence.
 */
export async function createSignedEvidenceUrl(
  storagePath: string,
  expiresInSeconds: number = 3600,
  client?: SupabaseClient<Database> | null
): Promise<string> {
  if (!storagePath) return "";

  // If already an HTTP/HTTPS URL (e.g. legacy/external link), return directly
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  const effectiveClient = client || getAdminClient();
  if (!effectiveClient) {
    return "";
  }

  const { data, error } = await effectiveClient.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.warn(`Failed to create signed URL for path ${storagePath}:`, error);
    return "";
  }

  return data.signedUrl;
}

/**
 * Cleanup orphaned evidence in case database insert fails.
 */
export async function deleteOrphanedEvidence(
  storagePath: string,
  client?: SupabaseClient<Database> | null
): Promise<void> {
  if (!storagePath) return;
  const effectiveClient = client || getAdminClient();
  if (!effectiveClient) return;

  try {
    await effectiveClient.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
  } catch (err) {
    console.error(`Failed to delete orphaned evidence at ${storagePath}:`, err);
  }
}
