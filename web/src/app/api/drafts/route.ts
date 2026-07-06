import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { drafts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { apiError } from "@/lib/api/helpers";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId");

  if (candidateId) {
    const [row] = await db
      .select()
      .from(drafts)
      .where(
        and(
          eq(drafts.organizationId, session.user.organizationId),
          eq(drafts.userId, session.user.id),
          eq(drafts.candidateId, candidateId),
        ),
      )
      .limit(1);
    return NextResponse.json(row ?? null);
  }

  const rows = await db
    .select()
    .from(drafts)
    .where(
      and(
        eq(drafts.organizationId, session.user.organizationId),
        eq(drafts.userId, session.user.id),
      ),
    );
  return NextResponse.json(rows);
}

const saveSchema = z.object({
  candidateId: z.string().optional(),
  step: z.number().int().min(1).max(4),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const body = saveSchema.parse(await req.json());

  const [existing] = body.candidateId
    ? await db
        .select()
        .from(drafts)
        .where(
          and(
            eq(drafts.organizationId, session.user.organizationId),
            eq(drafts.userId, session.user.id),
            eq(drafts.candidateId, body.candidateId),
          ),
        )
        .limit(1)
    : [null];

  if (existing) {
    await db
      .update(drafts)
      .set({
        step: body.step,
        data: body.data,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, existing.id));
    return NextResponse.json({ id: existing.id });
  }

  const id = uuid();
  await db.insert(drafts).values({
    id,
    organizationId: session.user.organizationId,
    userId: session.user.id,
    candidateId: body.candidateId,
    step: body.step,
    data: body.data,
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("id required", 400);

  await db
    .delete(drafts)
    .where(
      and(
        eq(drafts.id, id),
        eq(drafts.organizationId, session.user.organizationId),
        eq(drafts.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}
