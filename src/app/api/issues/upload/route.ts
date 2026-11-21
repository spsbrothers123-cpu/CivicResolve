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
    const originalFilename = (file as any).name || "evidence.jpg";

    const result = await uploadEvidence(user.id, buffer, originalFilename, client);

    return NextResponse.json({
      path: result.path,
      signedUrl: result.signedUrl,
      message: "Evidence uploaded successfully.",
    });
  } catch (error: any) {
    console.error("Evidence upload API error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to upload evidence." },
      { status }
    );
  }
}
