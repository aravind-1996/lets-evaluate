ALTER TABLE "candidate_stages" ADD COLUMN "questions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD COLUMN "report_key" text;--> statement-breakpoint
ALTER TABLE "candidate_stages" ADD COLUMN "report_filename" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "visibility" text DEFAULT 'org' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "code" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "created_by_id" text;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questions_creator_idx" ON "questions" USING btree ("created_by_id");
