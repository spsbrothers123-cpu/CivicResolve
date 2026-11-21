import { NextRequest, NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth/permissions";
import { uploadEvidence } from "@/lib/services/storage.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user, client } = await requireCitizen(req);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing or invalid file in upload request." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalFilename = typeof file === "object" && file && "name" in file ? String(file.name) : "evidence.jpg";

    const result = await uploadEvidence(user.id, buffer, originalFilename, client);

    return NextResponse.json({
      path: result.path,
      signedUrl: result.signedUrl,
      message: "Evidence uploaded successfully.",
    });
  } catch (error: unknown) {
    console.error("Evidence upload API error:", error);
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to upload evidence." },
      { status }
    );
  }
}
