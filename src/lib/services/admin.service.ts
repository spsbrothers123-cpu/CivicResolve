import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Issue,
  IssueUpdate,
  IssueCategory,
  IssueStatus,
  IssuePriority,
  MunicipalDepartment,
  DashboardMetrics,
} from "@/types";
import { Database } from "@/types/database";
import { createSignedEvidenceUrl } from "./storage.service";
import { AdminUpdateIssueInput, AdminAddUpdateInput } from "@/lib/validations/admin";
import { getAdminClient } from "@/lib/supabase/admin";

export interface AdminIssueFilterOptions {
  category?: string | null;
  status?: string | null;
  priority?: string | null;
  department?: string | null;
  search?: string | null;
  sortBy?: "created_at" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export class AdminServiceError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "AdminServiceError";
    this.status = status;
  }
}

/**
 * Retrieves all municipal complaints for administrators with search, filter, and sort.
 */
export async function getAllIssues(
  filters: AdminIssueFilterOptions = {},
  client: SupabaseClient<Database>
): Promise<{ issues: Issue[]; total: number }> {
  let query = client
    .from("issues")
    .select("*, issue_updates(*)", { count: "exact" });

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

  const ascending = filters.sortOrder === "asc";
  const sortCol = filters.sortBy === "priority" ? "priority" : "created_at";
  query = query.order(sortCol, { ascending });

  const { data, count, error } = await query;

  if (error) {
    console.error("Database error in getAllIssues:", error);
    throw new AdminServiceError(`Failed to fetch municipal complaints: ${error.message}`, 500);
  }

  let list = (data || []) as unknown as Issue[];

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
 * Derives real dashboard statistics from Supabase database.
 */
export async function getDashboardStats(
  client: SupabaseClient<Database>
): Promise<DashboardMetrics> {
  // Query issues to calculate accurate live aggregation
  const { data, error } = await client
    .from("issues")
    .select("status, priority, category, department");

  if (error) {
    console.error("Database error in getDashboardStats:", error);
    throw new AdminServiceError(`Failed to aggregate metrics: ${error.message}`, 500);
  }

  const rows = data || [];
  const metrics: DashboardMetrics = {
    total: rows.length,
    reported: 0,
    in_progress: 0,
    resolved: 0,
    critical_high: 0,
    by_category: {},
    by_department: {},
  };

  for (const row of rows) {
    if (row.status === "Reported") metrics.reported++;
    if (row.status === "In Progress") metrics.in_progress++;
    if (row.status === "Resolved") metrics.resolved++;

    if (row.priority === "Critical" || row.priority === "High") {
      metrics.critical_high++;
    }

    if (row.category) {
      metrics.by_category[row.category] = (metrics.by_category[row.category] || 0) + 1;
    }
    if (row.department) {
      metrics.by_department[row.department] = (metrics.by_department[row.department] || 0) + 1;
    }
  }

  return metrics;
}

/**
 * Updates a complaint's administrative fields (status, department, priority, severity, notes).
 * Triggers atomic audit logging in issue_updates.
 */
export async function updateIssue(
  issueId: string,
  adminId: string,
  adminName: string,
  input: AdminUpdateIssueInput,
  client: SupabaseClient<Database>
): Promise<Issue> {
  const cleanId = issueId.trim().toUpperCase();

  // 1. Verify existence
  const { data: existing, error: fetchErr } = await client
    .from("issues")
    .select("id, status, department, priority, severity")
    .eq("id", cleanId)
    .single();

  if (fetchErr || !existing) {
    throw new AdminServiceError("Complaint not found.", 404);
  }

  // 2. Prepare payload
  const updatePayload: Database["public"]["Tables"]["issues"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.status) updatePayload.status = input.status;
  if (input.department) updatePayload.department = input.department;
  if (input.priority) updatePayload.priority = input.priority;
  if (input.severity) updatePayload.severity = input.severity;
  if (input.resolution_note) updatePayload.resolution_note = input.resolution_note.trim();
  if (input.resolution_image_path) {
    updatePayload.resolution_image_path = input.resolution_image_path.trim();
  }

  const { data: updated, error: updateErr } = await client
    .from("issues")
    .update(updatePayload)
    .eq("id", cleanId)
    .select("*, issue_updates(*)")
    .single();

  if (updateErr || !updated) {
    console.error("Admin update issue error:", updateErr);
    throw new AdminServiceError(`Failed to update complaint: ${updateErr?.message}`, 500);
  }

  // If status changed or explicit remark provided, and trigger didn't insert (or for explicit notes),
  // ensure audit record is captured
  if (input.status && input.status !== existing.status) {
    // Verified: Database trigger trg_issue_status_audit fires on BEFORE UPDATE when OLD.status IS DISTINCT FROM NEW.status
  } else if (input.resolution_note) {
    // Explicit admin note without status change - insert manual audit entry via privileged admin client if needed
    const adminPriv = getAdminClient();
    if (adminPriv) {
      await adminPriv.from("issue_updates").insert({
        issue_id: cleanId,
        updated_by: adminId,
        updated_by_name: adminName,
        old_status: existing.status,
        new_status: (input.status || existing.status) as IssueStatus,
        note: input.resolution_note,
      });
    }
  }

  const res = updated as unknown as Issue;
  res.reference_number = res.id;
  if (res.image_path) {
    res.image_url = await createSignedEvidenceUrl(res.image_path, 3600, client);
  }
  if (res.resolution_image_path) {
    res.resolution_image_url = await createSignedEvidenceUrl(res.resolution_image_path, 3600, client);
  }

  return res;
}

/**
 * Adds an explicit administrative progress update / remark to the complaint timeline.
 */
export async function addIssueUpdate(
  issueId: string,
  adminId: string,
  adminName: string,
  input: AdminAddUpdateInput,
  client: SupabaseClient<Database>
): Promise<IssueUpdate> {
  const cleanId = issueId.trim().toUpperCase();

  const { data: existing, error: fetchErr } = await client
    .from("issues")
    .select("id, status")
    .eq("id", cleanId)
    .single();

  if (fetchErr || !existing) {
    throw new AdminServiceError("Complaint not found.", 404);
  }

  // Update status on the issue if different
  if (input.new_status !== existing.status) {
    await client
      .from("issues")
      .update({
        status: input.new_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cleanId);
  }

  // Insert audit record via service role client (since public table issue_updates revokes client direct insert for tamper-proofing)
  const privilegedClient = getAdminClient() || client;
  const { data: newUpdate, error: insertErr } = await privilegedClient
    .from("issue_updates")
    .insert({
      issue_id: cleanId,
      updated_by: adminId,
      updated_by_name: adminName,
      old_status: existing.status,
      new_status: input.new_status,
      note: input.note.trim(),
      evidence_path: input.evidence_path ? input.evidence_path.trim() : null,
    })
    .select()
    .single();

  if (insertErr || !newUpdate) {
    console.error("Failed to add issue update:", insertErr);
    throw new AdminServiceError(`Failed to insert audit update: ${insertErr?.message}`, 500);
  }

  const result = newUpdate as unknown as IssueUpdate;
  if (result.evidence_path) {
    result.evidence_url = await createSignedEvidenceUrl(result.evidence_path, 3600, client);
  }

  return result;
}
