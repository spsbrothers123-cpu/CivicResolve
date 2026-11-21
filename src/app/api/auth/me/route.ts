import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const context = await getAuthenticatedContext(req);
    if (!context) {
      return NextResponse.json(
        { user: null, profile: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: {
        id: context.user.id,
        email: context.user.email,
      },
      profile: context.profile,
      isAuthenticated: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to resolve session." },
      { status: 500 }
    );
  }
}
