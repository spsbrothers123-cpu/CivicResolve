import { NextRequest, NextResponse } from "next/server";
import { requireCitizen, requireAdmin } from "@/lib/auth/permissions";
import { getIssueById, getIssueUpdates } from "@/lib/services/issue.service";
import { addIssueUpdate } from "@/lib/services/admin.service";
import { adminAddUpdateSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, client } = await requireCitizen(req);
    const issue = await getIssueById(params.id, client);

    if (!issue) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    if (profile.role !== "admin" && issue.citizen_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view updates for this complaint." },
        { status: 403 }
      );
    }

    const updates = await getIssueUpdates(params.id, client);
    return NextResponse.json({ updates });
  } catch (error: unknown) {
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to fetch updates." },
      { status }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, client } = await requireAdmin(req);
    const body = await req.json();

    const validated = adminAddUpdateSchema.parse(body);

    const updateRecord = await addIssueUpdate(
      params.id,
      user.id,
      profile.full_name,
      validated,
      client
    );

    return NextResponse.json(
      { update: updateRecord, message: "Complaint update recorded successfully." },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errObj = error as { name?: string; errors?: Array<{ message: string }>; status?: number; message?: string };
    if (errObj?.name === "ZodError" && errObj.errors) {
      return NextResponse.json(
        { error: errObj.errors[0]?.message || "Invalid update input." },
        { status: 400 }
      );
    }
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to record complaint update." },
      { status }
    );
  }
}
