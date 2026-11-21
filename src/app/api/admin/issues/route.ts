import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { getAllIssues } from "@/lib/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { client } = await requireAdmin(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") as "created_at" | "priority" | "status" | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    const { issues, total } = await getAllIssues(
      {
        category,
        status,
        priority,
        department,
        search,
        sortBy: sortBy || "created_at",
        sortOrder: sortOrder || "desc",
      },
      client
    );

    return NextResponse.json({ issues, total });
  } catch (error: unknown) {
    console.error("GET /api/admin/issues error:", error);
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to fetch complaints." },
      { status }
    );
  }
}
