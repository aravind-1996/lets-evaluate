import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { getOrgRoles } from "@/lib/db/queries";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { apiError, requireApiRole } from "@/lib/api/helpers";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const rows = await getOrgRoles(session.user.organizationId, projectId);
  return NextResponse.json(rows);
}

const schema = z.object({
  name: z.string().min(1),
  projectId: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
  level: z.string().optional(),
  requirements: z.string().optional(),
});

function normalizeProjectIds(body: z.infer<typeof schema>): string[] {
  const ids = body.projectIds ?? (body.projectId ? [body.projectId] : []);
  return Array.from(new Set(ids.filter(Boolean)));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const body = schema.parse(await req.json());
  const projectIds = normalizeProjectIds(body);
  const id = uuid();
  await db.insert(roles).values({
    id,
    organizationId: session.user.organizationId,
    name: body.name,
    projectId: projectIds[0] ?? null,
    level: body.level ?? "",
    requirements: body.requirements ?? "",
    projectIds,
  });
  return NextResponse.json({ id });
}
