import { NextRequest, NextResponse } from "next/server";
import { requireCitizen, requireAdmin } from "@/lib/auth/permissions";
import { getIssueById } from "@/lib/services/issue.service";
import { updateIssue } from "@/lib/services/admin.service";
import { adminUpdateIssueSchema } from "@/lib/validations/admin";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting: max 60 complaint lookups per minute per IP
  const { response: rateLimitResponse } = applyRateLimit(req, {
    limit: 60,
    windowMs: 60 * 1000,
    prefix: "issues:get",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { user, profile, client } = await requireCitizen(req);
    const issue = await getIssueById(params.id, client);

    if (!issue) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    // Role check: citizen can only view their own complaint
    if (profile.role !== "admin" && issue.citizen_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this complaint." },
        { status: 403 }
      );
    }

    return NextResponse.json({ issue });
  } catch (error: unknown) {
    console.error("GET /api/issues/[id] error:", error);
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to fetch complaint." },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, client } = await requireAdmin(req);
    const body = await req.json();

    const validated = adminUpdateIssueSchema.parse(body);

    const updatedIssue = await updateIssue(
      params.id,
      user.id,
      profile.full_name,
      validated,
      client
    );

    return NextResponse.json({
      issue: updatedIssue,
      message: "Complaint updated successfully.",
    });
  } catch (error: unknown) {
    console.error("PATCH /api/issues/[id] error:", error);
    const errObj = error as { name?: string; errors?: Array<{ message: string }>; status?: number; message?: string };
    if (errObj?.name === "ZodError" && errObj.errors) {
      return NextResponse.json(
        { error: errObj.errors[0]?.message || "Invalid update payload." },
        { status: 400 }
      );
    }
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to update complaint." },
      { status }
    );
  }
}
