import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { apiError, requireApiRole } from "@/lib/api/helpers";
import {
  DEFAULT_STAGE_TEMPLATE,
  getPipelineStageRows,
  savePipelineStages,
} from "@/lib/db/queries";
import { logEvent } from "@/lib/events";

const stageKinds = ["screening", "technical", "manager", "hr", "final", "custom"] as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const rows = await getPipelineStageRows(
    session.user.organizationId,
    projectId || null,
  );

  const generalRows = projectId
    ? await getPipelineStageRows(session.user.organizationId, null)
    : rows;

  return NextResponse.json({
    scope: projectId ? "project" : "general",
    configured: rows.map((r) => ({ label: r.label, kind: r.kind })),
    generalConfigured: generalRows.map((r) => ({ label: r.label, kind: r.kind })),
    defaults: DEFAULT_STAGE_TEMPLATE,
  });
}

const saveSchema = z.object({
  projectId: z.string().nullable().optional(),
  stages: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        kind: z.enum(stageKinds),
      }),
    )
    .max(20),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin"]);
  if (forbidden) return forbidden;

  const body = saveSchema.parse(await req.json());

  await savePipelineStages(
    session.user.organizationId,
    body.projectId || null,
    body.stages,
  );

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "pipeline",
    entityId: body.projectId || "general",
    action: "pipeline.updated",
    payload: { count: body.stages.length },
  });

  return NextResponse.json({ ok: true });
}
