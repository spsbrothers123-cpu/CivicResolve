import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth/permissions";
import { analyzeCivicIssue } from "@/lib/gemini/analyzer";
import { getAdminClient } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const analyzeRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  image_path: z.string().optional(),
  issue_id: z.string().optional(),
  force: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limiting: max 10 AI re-analysis requests per minute per IP
  const { response: rateLimitResponse } = applyRateLimit(req, {
    limit: 10,
    windowMs: 60 * 1000,
    prefix: "ai:analyze",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 1. Enforce authenticated context (citizen or administrator)
    const { user, profile, client } = await requireCitizen(req);

    // 2. Parse & validate request payload
    const body = await req.json();
    const validated = analyzeRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload for AI analysis.",
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      imageBase64,
      imageMimeType,
      image_path,
      issue_id,
      force,
    } = validated.data;

    // 3. Evidence path sanitization: Reject external URLs and directory traversal
    if (image_path) {
      if (image_path.startsWith("http://") || image_path.startsWith("https://")) {
        return NextResponse.json(
          { error: "External image URLs are not permitted. Evidence must be uploaded to private civic storage." },
          { status: 400 }
        );
      }
      if (image_path.includes("..") || image_path.includes("\\")) {
        return NextResponse.json(
          { error: "Invalid evidence storage path: Directory traversal sequences are strictly rejected." },
          { status: 400 }
        );
      }
    }

    let effectiveImagePath = image_path;
    let existingAnalysis: any = null;

    // 4. Resource authorization and ownership verification
    if (issue_id) {
      // Query the specific complaint record
      const { data: issueRecord, error: fetchErr } = await client
        .from("issues")
        .select("id, citizen_id, image_path, ai_analysis")
        .eq("id", issue_id)
        .single();

      if (fetchErr || !issueRecord) {
        return NextResponse.json(
          { error: `Complaint reference "${issue_id}" was not found.` },
          { status: 404 }
        );
      }

      const isAdmin = profile.role === "admin";
      const isOwner = issueRecord.citizen_id === user.id;

      // Strict authorization: Citizens can ONLY analyze complaints they submitted
      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to analyze or modify this complaint." },
          { status: 403 }
        );
      }

      // Evidence binding check: Verify supplied image_path belongs to the complaint
      if (image_path && issueRecord.image_path && image_path !== issueRecord.image_path) {
        return NextResponse.json(
          { error: "Forbidden: Provided evidence path does not match the evidence on file for this complaint." },
          { status: 403 }
        );
      }

      // Default to complaint's verified storage path
      if (!effectiveImagePath && issueRecord.image_path) {
        effectiveImagePath = issueRecord.image_path;
      }

      existingAnalysis = issueRecord.ai_analysis;

      // Deduplication: Avoid duplicate concurrent AI analysis if valid analysis already exists
      if (existingAnalysis && !force && existingAnalysis.confidence >= 0.7) {
        return NextResponse.json(
          {
            analysis: existingAnalysis,
            provider: existingAnalysis.provider || "gemini",
            modelName: existingAnalysis.model || "cached",
            cached: true,
            message: "Existing AI triage record returned. Pass force: true to re-analyze.",
          },
          { status: 200 }
        );
      }
    } else {
      // Ad-hoc analysis before complaint submission:
      // Verify storage path belongs to the authenticated user
      if (effectiveImagePath && !effectiveImagePath.startsWith(`${user.id}/`)) {
        return NextResponse.json(
          { error: "Forbidden: You are only authorized to analyze evidence uploaded within your own user storage scope." },
          { status: 403 }
        );
      }
    }

    // 5. Execute Gemini / Fallback analysis with cancellation support
    const result = await analyzeCivicIssue({
      title,
      description,
      category,
      imageBase64,
      imageMimeType,
      imagePath: effectiveImagePath,
      supabaseClient: client,
      timeoutMs: 15000,
    });

    // 6. Safe persistence: Only update database if analysis is valid and no error occurred
    if (issue_id && result.analysis && !result.error) {
      try {
        const adminClient = getAdminClient();
        const updateClient = profile.role === "admin" ? client : (adminClient || client);
        await updateClient
          .from("issues")
          .update({ ai_analysis: result.analysis as unknown as import("@/types/database").Json })
          .eq("id", issue_id);
      } catch (updateErr) {
        console.warn(`Could not persist ai_analysis to issue ${issue_id}:`, updateErr);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("API /api/ai/analyze error:", error);
    const statusCode = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to analyze civic issue." },
      { status: statusCode }
    );
  }
}
