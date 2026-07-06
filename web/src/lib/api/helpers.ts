import { NextResponse } from "next/server";
import type { MemberRole } from "@/lib/auth/config";

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function requireApiRole(role: MemberRole, allowed: MemberRole[]) {
  if (!allowed.includes(role)) {
    return apiError("Forbidden", 403);
  }
  return null;
}
