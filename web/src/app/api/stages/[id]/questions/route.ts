import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { candidates, candidateStages, projects, roles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError, rateLimit } from "@/lib/api/helpers";
import {
  generateCategoryQuestions,
  QUESTION_CATEGORIES,
  type QuestionCategory,
} from "@/lib/ai";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  category: z.string(),
  count: z.number().int().min(1).max(10).optional(),
});

const CATEGORY_IDS = QUESTION_CATEGORIES.map((c) => c.id) as string[];

/** The assigned panel member generates questions for a given category. */
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id: stageId } = await params;
  const body = schema.parse(await req.json());
  if (!CATEGORY_IDS.includes(body.category)) {
    return apiError("Unknown category", 400);
  }

  if (!rateLimit(`ai:${session.user.id}`, 30)) {
    return apiError("Rate limit exceeded", 429);
  }

  const [stage] = await db
    .select()
    .from(candidateStages)
    .where(
      and(
        eq(candidateStages.id, stageId),
        eq(candidateStages.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);
  if (!stage) return apiError("Not found", 404);

  const isOwner = stage.assignedToId === session.user.id;
  const isLead = session.user.role === "admin" || session.user.role === "ta";
  if (!isOwner && !isLead) {
    return apiError("You are not assigned to this stage", 403);
  }

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, stage.candidateId))
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
    ? await db.select().from(roles).where(eq(roles.id, candidate.roleId)).limit(1)
    : [null];

  const questions = await generateCategoryQuestions(
    body.category as QuestionCategory,
    {
      roleName: role?.name,
      techStack: (project?.techStack as string[]) ?? [],
      resumeText: candidate.resumeText ?? "",
      roleRequirements: role?.requirements ?? "",
    },
    body.count ?? 5,
  );

  return NextResponse.json({ questions });
}
