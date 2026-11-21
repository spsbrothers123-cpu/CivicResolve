import { z } from "zod";

export const aiAnalysisSchema = z.object({
  category: z.enum([
    "Pothole",
    "Road Damage",
    "Garbage",
    "Streetlight",
    "Water Leakage",
    "Drainage",
    "Other",
  ]),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  department: z.enum([
    "Roads",
    "Sanitation",
    "Electricity",
    "Water Supply",
    "Drainage",
    "Other",
  ]),
  summary: z.string().min(3),
  recommended_action: z.string().min(5),
  public_safety_risk: z.union([
    z.string().min(2),
    z.boolean().transform((val) =>
      val ? "Imminent hazard identified." : "No immediate public safety risk identified."
    ),
  ]),
  confidence: z.number().min(0).max(1),
  needs_human_review: z.boolean().default(false),
  reasoning: z.string().min(5),
  requires_human_review: z.boolean().optional(),
  analyzed_at: z.string().optional(),
  provider: z.enum(["gemini", "deterministic_fallback"]).optional(),
  model: z.string().optional(),
});

export const createIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "Pothole",
    "Road Damage",
    "Garbage",
    "Streetlight",
    "Water Leakage",
    "Drainage",
    "Other",
  ]),
  location_text: z.string().min(3, "Location is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  image_path: z.string().optional(),
  ai_analysis: aiAnalysisSchema.optional(),
});

export const updateIssueStatusSchema = z.object({
  status: z.enum(["Reported", "In Progress", "Resolved"]),
  note: z.string().optional(),
  evidence_path: z.string().optional(),
  department: z.enum([
    "Roads",
    "Sanitation",
    "Electricity",
    "Water Supply",
    "Drainage",
    "Other",
  ]).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
});
