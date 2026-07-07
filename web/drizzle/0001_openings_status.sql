CREATE TYPE "public"."role_status" AS ENUM('open', 'closed');--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "status" "role_status" DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
