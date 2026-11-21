import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;
  const threshold = now - windowMs * 2;

  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > threshold);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Optional namespace/prefix for the identifier */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

/**
 * Checks and updates rate limit for a given key using a sliding window algorithm.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, prefix = "rl" } = options;
  const fullKey = `${prefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  cleanupStaleEntries(windowMs);

  let record = rateLimitMap.get(fullKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(fullKey, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const resetTimeMs = now + windowMs;
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining,
    resetTimeMs,
    retryAfterSeconds,
  };
}

/**
 * Extracts a client identifier from NextRequest (IP or fallback).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",")[0]?.trim();
    if (clientIp) return clientIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Next.js request IP if available
  if ((req as any).ip) {
    return (req as any).ip;
  }

  return "127.0.0.1";
}

/**
 * Applies rate limiting to an API route request.
 * Returns null if allowed, or a 429 NextResponse if rate limit is exceeded.
 */
export function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { response: NextResponse | null; result: RateLimitResult } {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip, options);

  if (!result.success) {
    const response = NextResponse.json(
      {
        error: "Too many requests. Please slow down and try again.",
        retry_after: result.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.retryAfterSeconds.toString(),
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(result.resetTimeMs / 1000).toString(),
        },
      }
    );
    return { response, result };
  }

  return { response: null, result };
}

/**
 * Resets all rate limit records (useful for test isolation).
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}
