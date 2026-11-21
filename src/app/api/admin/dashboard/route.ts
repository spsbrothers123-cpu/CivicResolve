import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { getDashboardStats } from "@/lib/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { client } = await requireAdmin(req);
    const metrics = await getDashboardStats(client);
    return NextResponse.json({ metrics });
  } catch (error: unknown) {
    console.error("GET /api/admin/dashboard error:", error);
    const errObj = error as { status?: number; message?: string };
    const status = errObj.status || 500;
    return NextResponse.json(
      { error: errObj.message || "Failed to load dashboard metrics." },
      { status }
    );
  }
}
