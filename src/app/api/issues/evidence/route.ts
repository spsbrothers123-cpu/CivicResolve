import { NextRequest, NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth/permissions";
import { createSignedEvidenceUrl } from "@/lib/services/storage.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, profile, client } = await requireCitizen(req);
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing storage path parameter." }, { status: 400 });
    }

    // Path safety check
    if (path.includes("..") || path.includes("\\")) {
      return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    }

    // Folder check: citizen can only view their own user folder unless admin or linked to issue
    const segments = path.split("/");
    const isAdmin = profile.role === "admin";
    const isOwnerFolder = segments[0] === user.id;

    if (!isAdmin && !isOwnerFolder) {
      // Check if this path is linked to an issue owned by this citizen
      const { data: linkedIssue } = await client
        .from("issues")
        .select("id")
        .eq("citizen_id", user.id)
        .or(`image_path.eq.${path},resolution_image_path.eq.${path}`)
        .maybeSingle();

      if (!linkedIssue) {
        return NextResponse.json(
          { error: "Forbidden: Unauthorized to access this evidence." },
          { status: 403 }
        );
      }
    }

    const signedUrl = await createSignedEvidenceUrl(path, 3600, client);
    if (!signedUrl) {
      return NextResponse.json({ error: "Evidence not found or expired." }, { status: 404 });
    }

    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to generate evidence access URL." },
      { status }
    );
  }
}
