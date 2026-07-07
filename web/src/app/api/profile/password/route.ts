import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiError, rateLimit } from "@/lib/api/helpers";
import { changePasswordBodySchema, formatZodError } from "@/lib/auth/validation";
import { logEvent } from "@/lib/events";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  if (!rateLimit(`password:${session.user.id}`, 5, 60_000)) {
    return apiError("Too many attempts. Please try again in a minute.", 429);
  }

  let body;
  try {
    body = changePasswordBodySchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return apiError(formatZodError(e), 400);
    }
    return apiError("Invalid request", 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return apiError("Not found", 404);

  // SSO-provisioned accounts have no local password to manage here.
  if (!user.passwordHash) {
    return apiError(
      "Your password is managed by your single sign-on provider.",
      400,
    );
  }

  const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!ok) return apiError("Current password is incorrect", 400);

  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, session.user.id));

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "user",
    entityId: session.user.id,
    action: "user.password_changed",
  });

  return NextResponse.json({ ok: true });
}
