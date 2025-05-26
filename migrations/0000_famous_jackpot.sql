CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"respondent_name" text NOT NULL,
	"respondent_position" text,
	"cnum" text NOT NULL,
	"company_name" text,
	"manager" text NOT NULL,
	"date" timestamp NOT NULL,
	"agenda" text NOT NULL,
	"status" text DEFAULT 'Negotiation' NOT NULL
);
