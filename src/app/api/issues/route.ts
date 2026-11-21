import { NextRequest, NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth/permissions";
import { createIssue, getCitizenIssues } from "@/lib/services/issue.service";
import { getAllIssues } from "@/lib/services/admin.service";
import { createIssueSchema } from "@/lib/validations/issue";
import { analyzeCivicIssue } from "@/lib/gemini/analyzer";
import { getAdminClient } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, profile, client } = await requireCitizen(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    const filters = {
      category,
      status,
      priority,
      department,
      search,
    };

    // If admin requests, allow fetching all issues; if citizen, fetch strictly their own
    if (profile.role === "admin") {
      const { issues, total } = await getAllIssues(filters, client);
      return NextResponse.json({ issues, total });
    } else {
      const { issues, total } = await getCitizenIssues(user.id, filters, client);
      return NextResponse.json({ issues, total });
    }
  } catch (error: any) {
    console.error("GET /api/issues error:", error);
    const statusCode = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch complaints." },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting: max 15 complaint submissions per minute per IP
  const { response: rateLimitResponse, result: rateLimitResult } = applyRateLimit(req, {
    limit: 15,
    windowMs: 60 * 1000,
    prefix: "issues:submit",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { user, client } = await requireCitizen(req);
    const body = await req.json();

    const validated = createIssueSchema.parse(body);

    // 1. Complaint is saved securely to Supabase first
    const newIssue = await createIssue(user.id, validated, client);

    // 2. Best-effort AI triage — submission NEVER fails if Gemini is down or fails
    try {
      const triage = await analyzeCivicIssue({
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category,
        location_text: newIssue.location_text || undefined,
        imagePath: newIssue.image_path || undefined,
        supabaseClient: client,
        timeoutMs: 8000,
      });

      if (triage?.analysis) {
        const adminClient = getAdminClient();
        const updateClient = adminClient || client;
        await updateClient
          .from("issues")
          .update({
            ai_analysis: triage.analysis as unknown as import("@/types/database").Json,
          })
          .eq("id", newIssue.id);

        newIssue.ai_analysis = triage.analysis;
      }
    } catch (aiErr: any) {
      console.warn(
        `[CivicResolve AI] Non-blocking AI triage skipped for complaint ${newIssue.id}:`,
        aiErr?.message
      );
    }

    const isAiAvailable = Boolean(newIssue.ai_analysis);
    const userMessage = isAiAvailable
      ? "Complaint submitted successfully."
      : "Your complaint has been submitted successfully. AI analysis is temporarily unavailable. Your complaint can still be reviewed by the municipal team.";

    return NextResponse.json(
      {
        issue: newIssue,
        reference_number: newIssue.id,
        ai_available: isAiAvailable,
        message: userMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/issues error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid complaint payload." },
        { status: 400 }
      );
    }
    const statusCode = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to submit complaint." },
      { status: statusCode }
    );
  }
}
