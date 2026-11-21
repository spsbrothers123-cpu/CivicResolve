import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { getIssueById } from "@/lib/services/issue.service";
import { updateIssue } from "@/lib/services/admin.service";
import { adminUpdateIssueSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { client } = await requireAdmin(req);
    const issue = await getIssueById(params.id, client);

    if (!issue) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch complaint." },
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

    const updated = await updateIssue(
      params.id,
      user.id,
      profile.full_name,
      validated,
      client
    );

    return NextResponse.json({
      issue: updated,
      message: "Complaint updated successfully.",
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid update payload." },
        { status: 400 }
      );
    }
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to update complaint." },
      { status }
    );
  }
}
