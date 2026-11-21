import { NextRequest, NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth/permissions";
import { updateProfile } from "@/lib/services/profile.service";
import { updateProfileSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireCitizen(req);
    return NextResponse.json({ profile });
  } catch (error: unknown) {
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to retrieve profile." },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, client } = await requireCitizen(req);
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await updateProfile(user.id, validated, client);
    return NextResponse.json({ profile: updated });
  } catch (error: unknown) {
    const errObj = error as { name?: string; errors?: Array<{ message: string }>; status?: number; message?: string };
    if (errObj?.name === "ZodError" && errObj.errors) {
      return NextResponse.json(
        { error: errObj.errors[0]?.message || "Invalid profile data." },
        { status: 400 }
      );
    }
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to update profile." },
      { status }
    );
  }
}
