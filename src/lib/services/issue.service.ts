import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { Issue, IssueUpdate, IssueCategory, IssueStatus, IssuePriority, MunicipalDepartment } from "@/types";
import { Database } from "@/types/database";
import { createSignedEvidenceUrl, deleteOrphanedEvidence } from "./storage.service";
import { z } from "zod";
import { createIssueSchema } from "@/lib/validations/issue";

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export interface IssueFilterOptions {
  category?: string | null;
  status?: string | null;
  priority?: string | null;
  department?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

export class IssueServiceError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "IssueServiceError";
    this.status = status;
  }
}

/**
 * Creates a civic complaint in Supabase.
 * Enforces authenticated identity and database-driven default fields.
 */
export async function createIssue(
  citizenId: string,
  input: CreateIssueInput,
  client: SupabaseClient<Database>
): Promise<Issue> {
  if (!citizenId) {
    throw new IssueServiceError("Unauthorized: Missing citizen identity.", 401);
  }

  // Insert into public.issues
  // Note: Database sequence generate_issue_id() assigns id (e.g. CIV-1001)
  // Database trigger sanitize_citizen_issue_insert forces initial defaults (status='Reported', etc.)
  // Database trigger trg_issue_insert_audit records the initial audit row in issue_updates
  const { data: insertedIssue, error } = await client
    .from("issues")
    .insert({
      citizen_id: citizenId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      location_text: input.location_text.trim(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      image_path: input.image_path ? input.image_path.trim() : null,
      status: "Reported",
      severity: "Medium",
      priority: "Medium",
      department: "Other",
      ai_analysis: input.ai_analysis ? (input.ai_analysis as unknown as import("@/types/database").Json) : null,
    })
    .select()
    .single();

  if (error || !insertedIssue) {
    console.error("Database error creating issue:", error);
    // If an image was staged, attempt cleanup
    if (input.image_path) {
      await deleteOrphanedEvidence(input.image_path, client);
    }
    throw new IssueServiceError(
      `Failed to create complaint: ${error?.message || "Database insert failed"}`,
      500
    );
  }

  const result = insertedIssue as unknown as Issue;
  result.reference_number = result.id;

  if (result.image_path) {
    result.image_url = await createSignedEvidenceUrl(result.image_path, 3600, client);
  }

  return result;
}

/**
 * Retrieves issues belonging to the authenticated citizen with filtering.
 */
export async function getCitizenIssues(
  citizenId: string,
  filters: IssueFilterOptions = {},
  client: SupabaseClient<Database>
): Promise<{ issues: Issue[]; total: number }> {
  let query = client
    .from("issues")
    .select("*, issue_updates(*)", { count: "exact" })
    .eq("citizen_id", citizenId);

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category as IssueCategory);
  }
  if (filters.status && filters.status !== "All") {
    query = query.eq("status", filters.status as IssueStatus);
  }
  if (filters.priority && filters.priority !== "All") {
    query = query.eq("priority", filters.priority as IssuePriority);
  }
  if (filters.department && filters.department !== "All") {
    query = query.eq("department", filters.department as MunicipalDepartment);
  }

  const { data, count, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Database error fetching citizen issues:", error);
    throw new IssueServiceError(`Failed to fetch complaints: ${error.message}`, 500);
  }

  let list = (data || []) as unknown as Issue[];

  // In-memory text search over title, id, description, location
  if (filters.search) {
    const s = filters.search.toLowerCase().trim();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(s) ||
        i.id.toLowerCase().includes(s) ||
        i.description.toLowerCase().includes(s) ||
        i.location_text.toLowerCase().includes(s)
    );
  }

  // Populate reference_number alias and signed URLs
  for (const issue of list) {
    issue.reference_number = issue.id;
    if (issue.image_path) {
      issue.image_url = await createSignedEvidenceUrl(issue.image_path, 3600, client);
    }
    if (issue.resolution_image_path) {
      issue.resolution_image_url = await createSignedEvidenceUrl(
        issue.resolution_image_path,
        3600,
        client
      );
    }
  }

  return {
    issues: list,
    total: count ?? list.length,
  };
}

/**
 * Retrieves single issue by ID with its audit trail.
 */
export async function getIssueById(
  issueId: string,
  client: SupabaseClient<Database>
): Promise<Issue | null> {
  const { data, error } = await client
    .from("issues")
    .select("*, issue_updates(*)")
    .eq("id", issueId.trim().toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  const issue = data as unknown as Issue;
  issue.reference_number = issue.id;

  // Sort issue_updates chronologically
  if (issue.issue_updates && Array.isArray(issue.issue_updates)) {
    issue.updates = issue.issue_updates.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  if (issue.image_path) {
    issue.image_url = await createSignedEvidenceUrl(issue.image_path, 3600, client);
  }
  if (issue.resolution_image_path) {
    issue.resolution_image_url = await createSignedEvidenceUrl(
      issue.resolution_image_path,
      3600,
      client
    );
  }

  return issue;
}

/**
 * Retrieves audit updates for a given issue.
 */
export async function getIssueUpdates(
  issueId: string,
  client: SupabaseClient<Database>
): Promise<IssueUpdate[]> {
  const { data, error } = await client
    .from("issue_updates")
    .select("*")
    .eq("issue_id", issueId.trim().toUpperCase())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Database error fetching updates:", error);
    throw new IssueServiceError(`Failed to fetch updates: ${error.message}`, 500);
  }

  const updates = (data || []) as unknown as IssueUpdate[];
  for (const upd of updates) {
    if (upd.evidence_path) {
      upd.evidence_url = await createSignedEvidenceUrl(upd.evidence_path, 3600, client);
    }
  }

  return updates;
}
