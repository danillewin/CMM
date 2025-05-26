ALTER TABLE "meetings" RENAME COLUMN "manager" TO "relationship_manager";--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "respondent_position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "researcher" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "recruiter" text NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "notes" text;