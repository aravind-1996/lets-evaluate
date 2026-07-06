import { db } from "@/lib/db";
import {
  candidates,
  projects,
  roles,
  questions,
  screenings,
  interviewAssignments,
  interviewReviews,
  evaluationEvents,
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { MemberRole } from "@/lib/auth/config";

export async function getOrgProjects(organizationId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(projects.name);
}

export async function getOrgRoles(organizationId: string, projectId?: string) {
  const rows = await db
    .select()
    .from(roles)
    .where(eq(roles.organizationId, organizationId));
  if (!projectId) return rows;
  return rows.filter(
    (r) =>
      r.projectId === projectId ||
      (r.projectIds as string[] | null)?.includes(projectId),
  );
}

export async function getOrgQuestions(
  organizationId: string,
  roleId?: string,
) {
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.organizationId, organizationId))
    .orderBy(questions.createdAt);
  if (!roleId) return rows;
  return rows.filter(
    (q) =>
      q.roleId === roleId ||
      (q.roleIds as string[] | null)?.includes(roleId),
  );
}

export async function getCandidatesForUser(
  organizationId: string,
  userId: string,
  role: MemberRole,
) {
  if (role === "admin" || role === "ta") {
    return db
      .select()
      .from(candidates)
      .where(eq(candidates.organizationId, organizationId))
      .orderBy(desc(candidates.updatedAt));
  }

  const assignedIds = await db
    .select({ candidateId: interviewAssignments.candidateId })
    .from(interviewAssignments)
    .where(
      and(
        eq(interviewAssignments.organizationId, organizationId),
        eq(interviewAssignments.assignedToId, userId),
      ),
    );

  const ids = assignedIds.map((a) => a.candidateId);
  if (!ids.length) return [];

  return db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.organizationId, organizationId),
        inArray(candidates.id, ids),
      ),
    )
    .orderBy(desc(candidates.updatedAt));
}

export async function getCandidateDetail(
  organizationId: string,
  candidateId: string,
) {
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(
      and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!candidate) return null;

  const [screening] = await db
    .select()
    .from(screenings)
    .where(eq(screenings.candidateId, candidateId))
    .limit(1);

  const [review] = await db
    .select()
    .from(interviewReviews)
    .where(eq(interviewReviews.candidateId, candidateId))
    .limit(1);

  const assignments = await db
    .select({
      assignment: interviewAssignments,
      assigneeName: users.name,
      assigneeEmail: users.email,
    })
    .from(interviewAssignments)
    .innerJoin(users, eq(interviewAssignments.assignedToId, users.id))
    .where(eq(interviewAssignments.candidateId, candidateId));

  return { candidate, screening, review, assignments };
}

export async function getActivityFeed(organizationId: string, limit = 20) {
  return db
    .select({
      event: evaluationEvents,
      actorName: users.name,
    })
    .from(evaluationEvents)
    .leftJoin(users, eq(evaluationEvents.actorId, users.id))
    .where(eq(evaluationEvents.organizationId, organizationId))
    .orderBy(desc(evaluationEvents.createdAt))
    .limit(limit);
}

export async function getInterviewers(organizationId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        or(
          eq(organizationMembers.role, "interviewer"),
          eq(organizationMembers.role, "admin"),
        ),
      ),
    );
}

export async function getUserStats(
  organizationId: string,
  userId: string,
  role: MemberRole,
) {
  const base = eq(candidates.organizationId, organizationId);
  const all = await db.select().from(candidates).where(base);

  const mine = all.filter((c) => c.createdById === userId);
  const terminal = (list: typeof all, status: string) =>
    list.filter((c) => c.status === status).length;

  return {
    total: role === "admin" || role === "ta" ? all.length : mine.length,
    selected: terminal(role === "admin" || role === "ta" ? all : mine, "selected"),
    rejected: terminal(role === "admin" || role === "ta" ? all : mine, "rejected"),
    hold: terminal(role === "admin" || role === "ta" ? all : mine, "hold"),
    inProgress: all.filter((c) =>
      ["screening", "assigned", "interview_in_progress", "ready_for_interview"].includes(
        c.status,
      ),
    ).length,
  };
}

export async function getAssignmentsForUser(
  organizationId: string,
  userId: string,
) {
  return db
    .select({
      assignment: interviewAssignments,
      candidate: candidates,
    })
    .from(interviewAssignments)
    .innerJoin(candidates, eq(interviewAssignments.candidateId, candidates.id))
    .where(
      and(
        eq(interviewAssignments.organizationId, organizationId),
        eq(interviewAssignments.assignedToId, userId),
      ),
    )
    .orderBy(desc(interviewAssignments.createdAt));
}
