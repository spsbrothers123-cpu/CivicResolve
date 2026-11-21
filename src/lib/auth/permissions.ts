import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext, AuthenticatedContext } from "./session";
import { Profile } from "@/types";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function isUserAdmin(profile?: Profile | null): boolean {
  return profile?.role === "admin";
}

/**
 * Requires an authenticated user (citizen or admin).
 * Throws AuthError(401) if not authenticated.
 */
export async function requireCitizen(req?: NextRequest): Promise<AuthenticatedContext> {
  const context = await getAuthenticatedContext(req);
  if (!context) {
    throw new AuthError("Unauthorized: Authentication required.", 401);
  }
  return context;
}

/**
 * Requires an authenticated administrator.
 * Throws AuthError(401) if not authenticated, or AuthError(403) if role is not admin.
 */
export async function requireAdmin(req?: NextRequest): Promise<AuthenticatedContext> {
  const context = await getAuthenticatedContext(req);
  if (!context) {
    throw new AuthError("Unauthorized: Authentication required.", 401);
  }
  if (context.profile.role !== "admin") {
    throw new AuthError("Forbidden: Administrator privileges required.", 403);
  }
  return context;
}
