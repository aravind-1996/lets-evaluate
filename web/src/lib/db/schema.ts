import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const memberRoleEnum = pgEnum("member_role", [
  "admin",
  "ta",
  "interviewer",
]);

export const candidateStatusEnum = pgEnum("candidate_status", [
  "draft",
  "screening",
  "screened_hold",
  "screened_rejected",
  "ready_for_interview",
  "assigned",
  "interview_in_progress",
  "interview_complete",
  "selected",
  "rejected",
  "hold",
]);

export const screeningDecisionEnum = pgEnum("screening_decision", [
  "proceed",
  "hold",
  "reject",
]);

export const interviewDecisionEnum = pgEnum("interview_decision", [
  "selected",
  "rejected",
  "hold",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("ta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("org_member_unique").on(t.organizationId, t.userId),
    index("org_member_user_idx").on(t.userId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    techStack: jsonb("tech_stack").$type<string[]>().default([]).notNull(),
    createdById: text("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("projects_org_idx").on(t.organizationId)],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    level: text("level").default(""),
    requirements: text("requirements").default(""),
    projectIds: jsonb("project_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("roles_org_idx").on(t.organizationId)],
);

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleId: text("role_id").references(() => roles.id, { onDelete: "set null" }),
    questionText: text("question_text").notNull(),
    category: text("category").default("Technical"),
    difficulty: text("difficulty").default("Medium"),
    roleIds: jsonb("role_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("questions_org_idx").on(t.organizationId)],
);

export const candidates = pgTable(
  "candidates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    roleId: text("role_id").references(() => roles.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").default(""),
    resumeStorageKey: text("resume_storage_key"),
    resumeFilename: text("resume_filename").default(""),
    status: candidateStatusEnum("status").notNull().default("draft"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("candidates_org_idx").on(t.organizationId),
    index("candidates_status_idx").on(t.status),
  ],
);

export const screenings = pgTable(
  "screenings",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" })
      .unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metrics: jsonb("metrics").$type<Record<string, unknown>>().default({}),
    standardQuestions: jsonb("standard_questions").$type<unknown[]>().default([]),
    resumeQuestions: jsonb("resume_questions").$type<unknown[]>().default([]),
    roleQuestions: jsonb("role_questions").$type<unknown[]>().default([]),
    qSatisfaction: jsonb("q_satisfaction").$type<Record<string, unknown>>().default({}),
    decision: screeningDecisionEnum("decision"),
    comments: text("comments").default(""),
    screenedById: text("screened_by_id").references(() => users.id),
    screenedAt: timestamp("screened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("screenings_org_idx").on(t.organizationId)],
);

export const interviewAssignments = pgTable(
  "interview_assignments",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assignedToId: text("assigned_to_id")
      .notNull()
      .references(() => users.id),
    assignedById: text("assigned_by_id")
      .notNull()
      .references(() => users.id),
    status: assignmentStatusEnum("status").notNull().default("pending"),
    handoffNote: text("handoff_note").default(""),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("assignments_org_idx").on(t.organizationId),
    index("assignments_assignee_idx").on(t.assignedToId),
  ],
);

export const interviewReviews = pgTable(
  "interview_reviews",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" })
      .unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(
      () => interviewAssignments.id,
      { onDelete: "set null" },
    ),
    comments: text("comments").default(""),
    questionNotes: jsonb("question_notes").$type<unknown[]>().default([]),
    decision: interviewDecisionEnum("decision"),
    reviewedById: text("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("reviews_org_idx").on(t.organizationId)],
);

export const evaluationEvents = pgTable(
  "evaluation_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("events_org_idx").on(t.organizationId),
    index("events_created_idx").on(t.createdAt),
  ],
);

export const drafts = pgTable(
  "drafts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id").references(() => candidates.id, {
      onDelete: "cascade",
    }),
    step: integer("step").notNull().default(1),
    data: jsonb("data").$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("drafts_user_idx").on(t.userId)],
);

/* Auth.js tables */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  projects: many(projects),
  candidates: many(candidates),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
}));
