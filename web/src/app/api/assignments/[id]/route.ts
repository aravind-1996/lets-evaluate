import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  candidates,
  interviewAssignments,
  interviewReviews,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { apiError, requireApiRole } from "@/lib/api/helpers";
import { logEvent } from "@/lib/events";
const assignSchema = z.object({
  assignedToId: z.string().min(1),
  handoffNote: z.string().optional(),
  dueAt: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const forbidden = requireApiRole(session.user.role, ["admin", "ta"]);
  if (forbidden) return forbidden;

  const { id: candidateId } = await params;
  const body = assignSchema.parse(await req.json());

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);
  if (!candidate) return apiError("Not found", 404);
  if (candidate.status !== "ready_for_interview") {
    return apiError("Candidate must pass TA screening first", 400);
  }

  const assignmentId = uuid();
  await db.insert(interviewAssignments).values({
    id: assignmentId,
    candidateId,
    organizationId: session.user.organizationId,
    assignedToId: body.assignedToId,
    assignedById: session.user.id,
    handoffNote: body.handoffNote ?? "",
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
    status: "pending",
  });

  await db
    .update(candidates)
    .set({ status: "assigned", updatedAt: new Date() })
    .where(eq(candidates.id, candidateId));

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "candidate",
    entityId: candidateId,
    action: "interview.assigned",
    payload: { assignedToId: body.assignedToId },
  });

  return NextResponse.json({ assignmentId });
}

const reviewSchema = z.object({
  comments: z.string().min(1),
  decision: z.enum(["selected", "rejected", "hold"]),
  questionNotes: z.array(z.unknown()).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id: candidateId } = await params;
  const body = reviewSchema.parse(await req.json());

  const [assignment] = await db
    .select()
    .from(interviewAssignments)
    .where(
      and(
        eq(interviewAssignments.candidateId, candidateId),
        eq(interviewAssignments.assignedToId, session.user.id),
        eq(interviewAssignments.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);

  if (!assignment && session.user.role === "interviewer") {
    return apiError("Not assigned to this candidate", 403);
  }

  const statusMap = {
    selected: "selected" as const,
    rejected: "rejected" as const,
    hold: "hold" as const,
  };

  const [existing] = await db
    .select()
    .from(interviewReviews)
    .where(eq(interviewReviews.candidateId, candidateId))
    .limit(1);

  if (existing) {
    await db
      .update(interviewReviews)
      .set({
        comments: body.comments,
        decision: body.decision,
        questionNotes: body.questionNotes ?? [],
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      })
      .where(eq(interviewReviews.id, existing.id));
  } else {
    await db.insert(interviewReviews).values({
      id: uuid(),
      candidateId,
      organizationId: session.user.organizationId,
      assignmentId: assignment?.id,
      comments: body.comments,
      decision: body.decision,
      questionNotes: body.questionNotes ?? [],
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    });
  }

  if (assignment) {
    await db
      .update(interviewAssignments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(interviewAssignments.id, assignment.id));
  }

  await db
    .update(candidates)
    .set({
      status: statusMap[body.decision],
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, session.user.organizationId),
      ),
    );

  await logEvent({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    entityType: "candidate",
    entityId: candidateId,
    action: "interview.reviewed",
    payload: { decision: body.decision },
  });

  return NextResponse.json({ ok: true });
}
