/**
 * One-time migration from legacy Streamlit PostgreSQL schema.
 *
 * Prerequisites:
 * - New schema applied (npm run db:push)
 * - LEGACY_DATABASE_URL points at old Streamlit DB (optional; defaults to DATABASE_URL if same server)
 *
 * Usage: npm run migrate:streamlit
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  organizations,
  organizationMembers,
  users,
  projects,
  roles,
  questions,
  candidates,
  screenings,
  drafts,
  interviewReviews,
  interviewAssignments,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

type LegacyUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;
  if (!legacyUrl || !targetUrl) throw new Error("DATABASE_URL required");

  const legacy = postgres(legacyUrl, { prepare: false });
  const target = postgres(targetUrl, { prepare: false });
  const db = drizzle(target);

  const slug = process.env.ORG_SLUG ?? "kanini";
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    const orgId = uuid();
    await db.insert(organizations).values({
      id: orgId,
      name: process.env.ORG_NAME ?? "KANINI",
      slug,
    });
    org = { id: orgId, name: process.env.ORG_NAME ?? "KANINI", slug, createdAt: new Date() };
    console.log("Created org", orgId);
  }

  const legacyUsers = await legacy<LegacyUser[]>`
    SELECT id, email, name, password_hash FROM users
  `;

  const userIdMap = new Map<string, string>();

  for (const u of legacyUsers) {
    const [exists] = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email.toLowerCase()))
      .limit(1);
    const newId = exists?.id ?? u.id;
    userIdMap.set(u.id, newId);

    if (!exists) {
      await db.insert(users).values({
        id: newId,
        email: u.email.toLowerCase(),
        name: u.name,
        passwordHash: u.password_hash,
      });
    }

    const [mem] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, newId))
      .limit(1);
    if (!mem) {
      await db.insert(organizationMembers).values({
        id: uuid(),
        organizationId: org.id,
        userId: newId,
        role: "ta",
      });
    }
  }

  const legacyProjects = await legacy<
    { id: string; user_id: string; name: string; tech_stack: string }[]
  >`SELECT id, user_id, name, tech_stack FROM projects`;

  const projectMap = new Map<string, string>();
  for (const p of legacyProjects) {
    projectMap.set(p.id, p.id);
    try {
      await db.insert(projects).values({
        id: p.id,
        organizationId: org.id,
        name: p.name,
        techStack: JSON.parse(p.tech_stack || "[]"),
        createdById: userIdMap.get(p.user_id) ?? p.user_id,
      });
    } catch {
      console.warn("Skip project", p.id);
    }
  }

  const legacyRoles = await legacy<
    {
      id: string;
      user_id: string;
      name: string;
      requirements: string;
      project_id: string | null;
      project_ids: string;
    }[]
  >`SELECT id, user_id, name, requirements, project_id, project_ids FROM roles`;

  for (const r of legacyRoles) {
    try {
      await db.insert(roles).values({
        id: r.id,
        organizationId: org.id,
        name: r.name,
        requirements: r.requirements ?? "",
        projectId: r.project_id,
        projectIds: JSON.parse(r.project_ids || "[]"),
      });
    } catch {
      console.warn("Skip role", r.id);
    }
  }

  const legacyQuestions = await legacy<
    {
      id: string;
      user_id: string;
      question_text: string;
      category: string;
      difficulty: string;
      role_id: string | null;
      role_ids: string;
    }[]
  >`SELECT id, user_id, question_text, category, difficulty, role_id, role_ids FROM questions`;

  for (const q of legacyQuestions) {
    try {
      await db.insert(questions).values({
        id: q.id,
        organizationId: org.id,
        questionText: q.question_text,
        category: q.category,
        difficulty: q.difficulty,
        roleId: q.role_id,
        roleIds: JSON.parse(q.role_ids || "[]"),
      });
    } catch {
      console.warn("Skip question", q.id);
    }
  }

  const legacyEvals = await legacy<
    {
      id: string;
      user_id: string;
      candidate_name: string;
      candidate_email: string;
      resume_filename: string;
      project_id: string | null;
      role_id: string | null;
      initial_metrics: string;
      standard_questions: string;
      resume_questions: string;
      role_questions: string;
      comments: string;
      status: string;
      interviewer_name: string;
    }[]
  >`SELECT id, user_id, candidate_name, candidate_email, resume_filename, project_id, role_id,
    initial_metrics, standard_questions, resume_questions, role_questions, comments, status, interviewer_name
    FROM evaluations`;

  for (const e of legacyEvals) {
    const candId = e.id;
    const statusMap: Record<string, string> = {
      Selected: "selected",
      Rejected: "rejected",
      Hold: "hold",
      Pending: "screening",
      Shortlisted: "ready_for_interview",
      Cancelled: "screened_rejected",
    };
    try {
      await db.insert(candidates).values({
        id: candId,
        organizationId: org.id,
        name: e.candidate_name,
        email: e.candidate_email ?? "",
        resumeFilename: e.resume_filename ?? "",
        projectId: e.project_id,
        roleId: e.role_id,
        status: (statusMap[e.status] ?? "screening") as "screening",
        createdById: userIdMap.get(e.user_id) ?? e.user_id,
      });

      await db.insert(screenings).values({
        id: uuid(),
        candidateId: candId,
        organizationId: org.id,
        metrics: JSON.parse(e.initial_metrics || "{}"),
        standardQuestions: JSON.parse(e.standard_questions || "[]"),
        resumeQuestions: JSON.parse(e.resume_questions || "[]"),
        roleQuestions: JSON.parse(e.role_questions || "[]"),
        comments: e.comments ?? "",
        screenedById: userIdMap.get(e.user_id) ?? e.user_id,
        screenedAt: new Date(),
        decision:
          e.status === "Rejected"
            ? "reject"
            : e.status === "Hold"
              ? "hold"
              : "proceed",
      });
    } catch {
      console.warn("Skip evaluation", e.id);
    }
  }

  const legacyDrafts = await legacy<
    {
      id: string;
      user_id: string;
      candidate_name: string;
      step: number;
      data: string;
    }[]
  >`SELECT id, user_id, candidate_name, step, data FROM evaluation_drafts`;

  for (const d of legacyDrafts) {
    try {
      await db.insert(drafts).values({
        id: d.id,
        organizationId: org.id,
        userId: userIdMap.get(d.user_id) ?? d.user_id,
        step: d.step,
        data: JSON.parse(d.data || "{}"),
      });
    } catch {
      console.warn("Skip draft", d.id);
    }
  }

  for (const e of legacyEvals) {
    if (!e.interviewer_name) continue;
    const [interviewer] = await db
      .select()
      .from(users)
      .where(eq(users.name, e.interviewer_name))
      .limit(1);
    if (!interviewer) {
      console.warn("Unmapped interviewer:", e.interviewer_name, "for eval", e.id);
      continue;
    }
    try {
      await db.insert(interviewAssignments).values({
        id: uuid(),
        candidateId: e.id,
        organizationId: org.id,
        assignedToId: interviewer.id,
        assignedById: userIdMap.get(e.user_id) ?? e.user_id,
        status: "completed",
      });
      if (["Selected", "Rejected", "Hold"].includes(e.status)) {
        await db.insert(interviewReviews).values({
          id: uuid(),
          candidateId: e.id,
          organizationId: org.id,
          comments: e.comments ?? "",
          decision:
            e.status === "Selected"
              ? "selected"
              : e.status === "Rejected"
                ? "rejected"
                : "hold",
          reviewedById: interviewer.id,
          reviewedAt: new Date(),
        });
      }
    } catch {
      console.warn("Skip interview mapping", e.id);
    }
  }

  console.log("Migration complete.");
  await legacy.end();
  await target.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
