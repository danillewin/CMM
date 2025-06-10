CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "positions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "research_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'In Progress';--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "gcc" text;--> statement-breakpoint
ALTER TABLE "researches" ADD COLUMN "color" text DEFAULT '#3b82f6' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_respondent_position_positions_name_fk" FOREIGN KEY ("respondent_position") REFERENCES "public"."positions"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "researches" ADD CONSTRAINT "researches_team_teams_name_fk" FOREIGN KEY ("team") REFERENCES "public"."teams"("name") ON DELETE no action ON UPDATE no action;