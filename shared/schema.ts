import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const MeetingStatus = {
  IN_PROGRESS: "In Progress",
  SET: "Meeting Set",
  DONE: "Done",
  DECLINED: "Declined",
} as const;

export const ResearchStatus = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
} as const;

export type MeetingStatusType = typeof MeetingStatus[keyof typeof MeetingStatus];
export type ResearchStatusType = typeof ResearchStatus[keyof typeof ResearchStatus];

export const researches = pgTable("researches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  researcher: text("researcher").notNull(),
  description: text("description").notNull(),
  dateStart: timestamp("date_start").notNull(),
  dateEnd: timestamp("date_end").notNull(),
  status: text("status").notNull().default(ResearchStatus.PLANNED),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  respondentName: text("respondent_name").notNull(), // Keep the database column name the same
  respondentPosition: text("respondent_position"),
  cnum: text("cnum").notNull(),
  gcc: text("gcc"),
  companyName: text("company_name"),
  manager: text("manager").notNull(),
  date: timestamp("date").notNull(),
  researchId: integer("research_id").references(() => researches.id),
  status: text("status").notNull().default(MeetingStatus.IN_PROGRESS),
});

export const insertResearchSchema = createInsertSchema(researches).omit({
  id: true,
}).extend({
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  researcher: z.string().min(1, "Researcher is required"),
  status: z.enum([ResearchStatus.PLANNED, ResearchStatus.IN_PROGRESS, ResearchStatus.DONE])
    .default(ResearchStatus.PLANNED),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
  cnum: z.string()
    .min(1, "CNUM is required")
    .transform(val => val.toUpperCase()),
  gcc: z.string().optional(),
  status: z.enum([MeetingStatus.IN_PROGRESS, MeetingStatus.SET, MeetingStatus.DONE, MeetingStatus.DECLINED])
    .default(MeetingStatus.IN_PROGRESS),
  respondentName: z.string().min(1, "Respondent is required"),
  respondentPosition: z.string().optional(),
  companyName: z.string().optional(),
  manager: z.string().min(1, "Manager is required"),
  researchId: z.number().optional(),
});

export type InsertResearch = z.infer<typeof insertResearchSchema>;
export type Research = typeof researches.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;