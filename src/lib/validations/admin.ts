import { z } from "zod";

export const adminUpdateIssueSchema = z.object({
  status: z.enum(["Reported", "In Progress", "Resolved"]).optional(),
  department: z
    .enum(["Roads", "Sanitation", "Electricity", "Water Supply", "Drainage", "Other"])
    .optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  admin_notes: z.string().max(2000).optional(),
  resolution_note: z.string().max(2000).optional(),
  resolution_image_path: z.string().optional(),
});

export const adminAddUpdateSchema = z.object({
  new_status: z.enum(["Reported", "In Progress", "Resolved"]),
  note: z.string().min(1, "Remarks/notes are required").max(2000),
  evidence_path: z.string().optional(),
});

export type AdminUpdateIssueInput = z.infer<typeof adminUpdateIssueSchema>;
export type AdminAddUpdateInput = z.infer<typeof adminAddUpdateSchema>;
