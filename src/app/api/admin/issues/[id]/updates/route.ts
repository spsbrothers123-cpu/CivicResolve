import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { addIssueUpdate } from "@/lib/services/admin.service";
import { adminAddUpdateSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

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
      { update: updateRecord, message: "Administrative update logged successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid update input." },
        { status: 400 }
      );
    }
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to record update." },
      { status }
    );
  }
}
