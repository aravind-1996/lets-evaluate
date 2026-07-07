import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError, requireApiRole } from "@/lib/api/helpers";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1),
  techStack: z.array(z.string()).default([]),
});

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = updateSchema.parse(await req.json());

  await db
    .update(projects)
    .set({ name: body.name, techStack: body.techStack, updatedAt: new Date() })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.organizationId, session.user.organizationId),
      ),
    );

  return NextResponse.json({ id });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const { id } = await params;

  await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.organizationId, session.user.organizationId),
      ),
    );

  return NextResponse.json({ ok: true });
}
