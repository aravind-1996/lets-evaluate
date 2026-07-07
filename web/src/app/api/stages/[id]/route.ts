import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { candidates, candidateStages } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api/helpers";
import { getCandidateStages } from "@/lib/db/queries";
import { logEvent } from "@/lib/events";

type Params = { params: Promise<{ id: string }> };

const decisionSchema = z.object({
  decision: z.enum(["yes", "no"]),
  comments: z.string().optional(),
});

/** The assigned panel member records their Yes/No verdict for a stage. */
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id: stageId } = await params;
  const body = decisionSchema.parse(await req.json());

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

  // Only the assigned person can record their own verdict.
  if (stage.assignedToId !== session.user.id) {
    return apiError("You are not assigned to this stage", 403);
  }
  if (stage.status !== "active") {
    return apiError("This stage is not awaiting a decision", 400);
  }

  await db
    .update(candidateStages)
    .set({
      status: body.decision === "yes" ? "passed" : "failed",
      decision: body.decision,
      comments: body.comments ?? "",
      decidedById: session.user.id,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(candidateStages.id, stageId));

  const candidateId = stage.candidateId;
  let candidateStatus:
    | "assigned"
    | "ready_for_interview"
    | "interview_complete"
    | "selected"
    | "rejected";

  if (body.decision === "no") {
    // Reject the candidate and skip any remaining stages.
    candidateStatus = "rejected";
    const stages = await getCandidateStages(candidateId);
    for (const s of stages) {
      if (s.stage.position > stage.position && s.stage.status === "pending") {
        await db
          .update(candidateStages)
          .set({ status: "skipped", updatedAt: new Date() })
          .where(eq(candidateStages.id, s.stage.id));
      }
    }
  } else {
    const stages = await getCandidateStages(candidateId);
    const next = stages.find(
      (s) => s.stage.position > stage.position && s.stage.status === "pending",
    );
    if (!next) {
      candidateStatus = "selected";
    } else if (next.stage.kind === "final") {
      await db
        .update(candidateStages)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(candidateStages.id, next.stage.id));
      candidateStatus = "interview_complete";
    } else {
      await db
        .update(candidateStages)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(candidateStages.id, next.stage.id));
      // Next interview round needs a fresh assignee → back to TA's booking queue.
      candidateStatus = "ready_for_interview";
    }
  }

  await db
    .update(candidates)
    .set({ status: candidateStatus, updatedAt: new Date() })
    .where(eq(candidates.id, candidateId));

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "candidate",
    entityId: candidateId,
    action: "stage.decided",
    payload: { stage: stage.label, decision: body.decision },
  });

  return NextResponse.json({ ok: true, candidateStatus });
}
