import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { candidates, projects, roles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { storeResume } from "@/lib/storage/resumes";
import { extractResumeText } from "@/lib/resume/parse";
import {
  ANALYSIS_MODEL,
  analyzeResume,
  generateResumeQuestions,
  generateStandardQuestions,
} from "@/lib/ai";
import { screenings } from "@/lib/db/schema";
import { logEvent } from "@/lib/events";
import { apiError, rateLimit, requireApiRole } from "@/lib/api/helpers";
import { getCandidateDetail } from "@/lib/db/queries";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const { id } = await params;
  const detail = await getCandidateDetail(session.user.organizationId, id);
  if (!detail) return apiError("Not found", 404);
  return NextResponse.json(detail);
}

const screenSchema = z.object({
  action: z.enum(["analyze", "questions", "decide"]),
  comments: z.string().optional(),
  decision: z.enum(["proceed", "hold", "reject"]).optional(),
  resumeText: z.string().optional(),
});

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  if (!rateLimit(`ai:${session.user.id}`, 30)) {
    return apiError("Rate limit exceeded", 429);
  }

  const { id } = await params;
  const body = screenSchema.parse(await req.json());

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.id, id),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);
  if (!candidate) return apiError("Not found", 404);

  const [project] = candidate.projectId
    ? await db
        .select()
        .from(projects)
        .where(eq(projects.id, candidate.projectId))
        .limit(1)
    : [null];
  const [role] = candidate.roleId
    ? await db
        .select()
        .from(roles)
        .where(eq(roles.id, candidate.roleId))
        .limit(1)
    : [null];

  const techStack = (project?.techStack as string[]) ?? [];
  const requirements = role?.requirements ?? "";

  if (body.action === "analyze") {
    const resumeText = body.resumeText ?? "";
    if (!resumeText) return apiError("Resume text required", 400);
    const metrics = await analyzeResume(resumeText, techStack, requirements);

    const [existing] = await db
      .select()
      .from(screenings)
      .where(eq(screenings.candidateId, id))
      .limit(1);

    if (existing) {
      await db
        .update(screenings)
        .set({ metrics, screenedById: session.user.id })
        .where(eq(screenings.id, existing.id));
    } else {
      await db.insert(screenings).values({
        id: uuid(),
        candidateId: id,
        organizationId: session.user.organizationId,
        metrics,
        screenedById: session.user.id,
      });
    }

    await db
      .update(candidates)
      .set({ status: "screening", updatedAt: new Date() })
      .where(eq(candidates.id, id));

    await logEvent({
      organizationId: session.user.organizationId,
      actorId: session.user.id,
      entityType: "candidate",
      entityId: id,
      action: "screening.analyzed",
      payload: { score: metrics.tech_match_score },
    });

    return NextResponse.json({ metrics, model: ANALYSIS_MODEL });
  }

  if (body.action === "questions") {
    const [screening] = await db
      .select()
      .from(screenings)
      .where(eq(screenings.candidateId, id))
      .limit(1);
    const resumeText = body.resumeText ?? "";
    const std = await generateStandardQuestions(
      role?.name ?? "Engineer",
      techStack,
      5,
    );
    const resumeQ = resumeText
      ? await generateResumeQuestions(resumeText, requirements, 5)
      : [];

    await db
      .update(screenings)
      .set({
        standardQuestions: std,
        resumeQuestions: resumeQ,
      })
      .where(eq(screenings.candidateId, id));

    return NextResponse.json({ standardQuestions: std, resumeQuestions: resumeQ });
  }

  if (body.action === "decide") {
    if (!body.decision) return apiError("Decision required", 400);
    const statusMap = {
      proceed: "ready_for_interview" as const,
      hold: "screened_hold" as const,
      reject: "screened_rejected" as const,
    };

    await db
      .update(screenings)
      .set({
        decision: body.decision,
        comments: body.comments ?? "",
        screenedAt: new Date(),
        screenedById: session.user.id,
      })
      .where(eq(screenings.candidateId, id));

    await db
      .update(candidates)
      .set({
        status: statusMap[body.decision],
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id));

    await logEvent({
      organizationId: session.user.organizationId,
      actorId: session.user.id,
      entityType: "candidate",
      entityId: id,
      action: "screening.decided",
      payload: { decision: body.decision },
    });

    return NextResponse.json({ ok: true });
  }

  return apiError("Invalid action");
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const form = await req.formData();
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "");
  const projectId = String(form.get("projectId") ?? "") || null;
  const roleId = String(form.get("roleId") ?? "") || null;
  const file = form.get("resume") as File | null;

  let resumeStorageKey: string | undefined;
  let resumeFilename: string | undefined;
  let resumeText: string | undefined;

  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return apiError("Resume must be under 10MB", 400);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    resumeFilename = file.name;
    try {
      resumeStorageKey = await storeResume(buf, file.name);
    } catch (err) {
      console.error("Resume storage failed", err);
    }
    resumeText = await extractResumeText(buf, file.name);
  }

  const [existing] = await db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.id, id),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(candidates)
      .set({
        name: name || existing.name,
        email: email || existing.email,
        projectId: projectId ?? existing.projectId,
        roleId: roleId ?? existing.roleId,
        resumeStorageKey: resumeStorageKey ?? existing.resumeStorageKey,
        resumeFilename: resumeFilename ?? existing.resumeFilename,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id));
    return NextResponse.json({ id, resumeText });
  }

  const newId = id === "new" ? uuid() : id;
  await db.insert(candidates).values({
    id: newId,
    organizationId: session.user.organizationId,
    name,
    email,
    projectId,
    roleId,
    resumeStorageKey,
    resumeFilename: resumeFilename ?? "",
    status: "draft",
    createdById: session.user.id,
  });

  return NextResponse.json({ id: newId, resumeText }, { status: 201 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.id, id),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);

  if (!existing) return apiError("Not found", 404);

  // Related screenings, assignments, reviews and drafts cascade on delete.
  await db
    .delete(candidates)
    .where(
      and(
        eq(candidates.id, id),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    );

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "candidate",
    entityId: id,
    action: "candidate.deleted",
    payload: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
