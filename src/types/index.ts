export type IssueCategory =
  | "Pothole"
  | "Road Damage"
  | "Garbage"
  | "Streetlight"
  | "Water Leakage"
  | "Drainage"
  | "Other";

export type IssuePriority = "Critical" | "High" | "Medium" | "Low";

export type IssueSeverity = "Critical" | "High" | "Medium" | "Low";

export type IssueStatus = "Reported" | "In Progress" | "Resolved";

export type MunicipalDepartment =
  | "Roads"
  | "Sanitation"
  | "Electricity"
  | "Water Supply"
  | "Drainage"
  | "Other";

export interface AIAnalysis {
  category: IssueCategory;
  severity: IssueSeverity;
  priority: IssuePriority;
  department: MunicipalDepartment;
  summary?: string;
  recommended_action: string;
  public_safety_risk: string | boolean;
  confidence: number;
  needs_human_review?: boolean;
  reasoning: string;
  requires_human_review?: boolean; // Backwards-compatible alias
  analyzed_at?: string;
  provider?: "gemini" | "deterministic_fallback";
  model?: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  updated_by?: string | null;
  updated_by_name?: string | null;
  old_status?: IssueStatus | null;
  new_status: IssueStatus;
  note?: string | null;
  evidence_path?: string | null;
  evidence_url?: string | null;
  created_at: string;
}

export interface Issue {
  id: string; // Acts as the unique human-readable complaint reference, e.g. "CIV-1001"
  reference_number?: string; // Canonical alias for id
  citizen_id: string | null;
  citizen_name?: string;
  citizen_email?: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  priority: IssuePriority;
  department: MunicipalDepartment;
  status: IssueStatus;
  latitude?: number | null;
  longitude?: number | null;
  location_text: string;
  image_path?: string | null;
  image_url?: string | null; // Ephemeral signed URL for private evidence viewing
  ai_analysis?: AIAnalysis | null;
  resolution_image_path?: string | null;
  resolution_image_url?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
  updates?: IssueUpdate[];
  issue_updates?: IssueUpdate[];
}

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone?: string | null;
  role: "citizen" | "admin";
  created_at: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  total: number;
  reported: number;
  in_progress: number;
  resolved: number;
  critical_high: number;
  by_category: Record<string, number>;
  by_department: Record<string, number>;
}
