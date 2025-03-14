import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const MeetingStatus = {
  NEGOTIATION: "Negotiation",
  SET: "Meeting Set",
  DONE: "Done",
  DECLINED: "Declined",
} as const;

export type MeetingStatusType = typeof MeetingStatus[keyof typeof MeetingStatus];

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  respondentName: text("respondent_name").notNull(),
  respondentPosition: text("respondent_position"),
  cnum: text("cnum").notNull(),
  companyName: text("company_name"),
  manager: text("manager").notNull(),
  date: timestamp("date").notNull(),
  research: text("research").notNull(),
  status: text("status").notNull().default(MeetingStatus.NEGOTIATION),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
  cnum: z.string()
    .min(1, "CNUM is required")
    .transform(val => val.toUpperCase()),
  status: z.enum([MeetingStatus.NEGOTIATION, MeetingStatus.SET, MeetingStatus.DONE, MeetingStatus.DECLINED])
    .default(MeetingStatus.NEGOTIATION),
  respondentPosition: z.string().optional(),
  companyName: z.string().optional(),
  manager: z.string().min(1, "Manager is required"),
  research: z.string().min(1, "Research is required"),
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;