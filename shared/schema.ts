import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const MeetingStatus = {
  NEGOTIATION: "Meeting Negotiation",
  SET: "Meeting Set",
  DONE: "Meeting Done",
  DECLINED: "Declined",
} as const;

export type MeetingStatusType = typeof MeetingStatus[keyof typeof MeetingStatus];

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  respondentName: text("respondent_name").notNull(),
  cnum: text("cnum").notNull(),
  date: timestamp("date").notNull(),
  agenda: text("agenda").notNull(),
  status: text("status").notNull().default(MeetingStatus.NEGOTIATION),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
}).extend({
  date: z.string().transform(str => new Date(str)),
  cnum: z.string().min(1, "CNUM is required"),
  status: z.enum([MeetingStatus.NEGOTIATION, MeetingStatus.SET, MeetingStatus.DONE, MeetingStatus.DECLINED])
    .default(MeetingStatus.NEGOTIATION),
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;