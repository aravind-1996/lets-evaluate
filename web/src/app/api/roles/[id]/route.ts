import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError, requireApiRole } from "@/lib/api/helpers";
import { logEvent } from "@/lib/events";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
  level: z.string().optional(),
  requirements: z.string().optional(),
});

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const projectIds = Array.from(
    new Set(
      (body.projectIds ?? (body.projectId ? [body.projectId] : [])).filter(Boolean),
    ),
  );

  await db
    .update(roles)
    .set({
      name: body.name,
      projectId: projectIds[0] ?? null,
      level: body.level ?? "",
      requirements: body.requirements ?? "",
      projectIds,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(roles.id, id),
        eq(roles.organizationId, session.user.organizationId),
      ),
    );

  return NextResponse.json({ id });
}

const statusSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = statusSchema.parse(await req.json());

  const now = new Date();
  await db
    .update(roles)
    .set({
      status: body.status,
      closedAt: body.status === "closed" ? now : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(roles.id, id),
        eq(roles.organizationId, session.user.organizationId),
      ),
    );

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "role",
    entityId: id,
    action: body.status === "closed" ? "opening.closed" : "opening.reopened",
  });

  return NextResponse.json({ id, status: body.status });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin"]);
  if (forbidden) return forbidden;

  const { id } = await params;

  await db
    .delete(roles)
    .where(
      and(
        eq(roles.id, id),
        eq(roles.organizationId, session.user.organizationId),
      ),
    );

  return NextResponse.json({ ok: true });
}
