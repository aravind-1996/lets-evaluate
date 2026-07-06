import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getOrgProjects } from "@/lib/db/queries";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { canManageSetup } from "@/lib/auth/rbac";
import { apiError, requireApiRole } from "@/lib/api/helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const rows = await getOrgProjects(session.user.organizationId);
  return NextResponse.json(rows);
}

const createSchema = z.object({
  name: z.string().min(1),
  techStack: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const body = createSchema.parse(await req.json());
  const id = uuid();
  await db.insert(projects).values({
    id,
    organizationId: session.user.organizationId,
    name: body.name,
    techStack: body.techStack,
    createdById: session.user.id,
  });
  return NextResponse.json({ id });
}
