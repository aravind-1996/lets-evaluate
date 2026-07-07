CREATE TYPE "public"."stage_kind" AS ENUM('screening', 'technical', 'manager', 'hr', 'final', 'custom');--> statement-breakpoint
CREATE TYPE "public"."stage_status" AS ENUM('pending', 'active', 'passed', 'failed', 'skipped');--> statement-breakpoint
ALTER TYPE "public"."member_role" ADD VALUE 'manager';--> statement-breakpoint
ALTER TYPE "public"."member_role" ADD VALUE 'hr';--> statement-breakpoint
CREATE TABLE "candidate_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"label" text NOT NULL,
	"kind" "stage_kind" DEFAULT 'custom' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "stage_status" DEFAULT 'pending' NOT NULL,
	"assigned_to_id" text,
	"assigned_by_id" text,
	"due_at" timestamp with time zone,
	"handoff_note" text DEFAULT '',
	"decision" text,
	"comments" text DEFAULT '',
	"decided_by_id" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text,
	"label" text NOT NULL,
	"kind" "stage_kind" DEFAULT 'custom' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_stages_candidate_idx" ON "candidate_stages" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_stages_org_idx" ON "candidate_stages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidate_stages_assignee_idx" ON "candidate_stages" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "pipeline_stages_org_idx" ON "pipeline_stages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pipeline_stages_project_idx" ON "pipeline_stages" USING btree ("project_id");