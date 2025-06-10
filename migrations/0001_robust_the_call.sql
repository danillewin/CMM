CREATE TABLE "researches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team" text NOT NULL,
	"researcher" text NOT NULL,
	"description" text NOT NULL,
	"date_start" timestamp NOT NULL,
	"date_end" timestamp NOT NULL,
	"status" text DEFAULT 'Planned' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetings" RENAME COLUMN "agenda" TO "research_id";--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;