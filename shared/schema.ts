import { pgTable, text, serial, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
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

// Add teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const researches = pgTable("researches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").references(() => teams.name).notNull(),
  researcher: text("researcher").notNull(),
  description: text("description").notNull(),
  dateStart: timestamp("date_start").notNull(),
  dateEnd: timestamp("date_end").notNull(),
  status: text("status").notNull().default(ResearchStatus.PLANNED),
  color: text("color").notNull().default("#3b82f6"), // Add color field with default blue
  researchType: text("research_type").notNull().default("Interviews"),
  products: text("products").array(),
  brief: text("brief"),
  guide: text("guide"),
  fullText: text("full_text"),
  clientsWeSearchFor: text("clients_we_search_for"),
  inviteTemplate: text("invite_template"),
});

// Jobs to be Done table
export const jtbds = pgTable("jtbds", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  jobStatement: text("job_statement"),
  jobStory: text("job_story"),
  description: text("description").notNull(),
  category: text("category"),
  priority: text("priority"),
  parentId: integer("parent_id").default(0), // 0 means root level item
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Research to JTBD many-to-many relation
export const researchJtbds = pgTable("research_jtbds", {
  researchId: integer("research_id").notNull().references(() => researches.id, { onDelete: 'cascade' }),
  jtbdId: integer("jtbd_id").notNull().references(() => jtbds.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.researchId, t.jtbdId] }),
}));

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  respondentName: text("respondent_name").notNull(),
  respondentPosition: text("respondent_position").references(() => positions.name).notNull(),
  cnum: text("cnum").notNull(),
  gcc: text("gcc"),
  companyName: text("company_name"),
  email: text("email"),
  researcher: text("researcher"), // Field inherited from Research
  relationshipManager: text("relationship_manager").notNull(),
  salesPerson: text("recruiter").notNull(),
  date: timestamp("date").notNull(),
  researchId: integer("research_id").references(() => researches.id).notNull(),
  status: text("status").notNull().default(MeetingStatus.IN_PROGRESS),
  notes: text("notes"),
  fullText: text("full_text"),
  hasGift: text("has_gift").default("no"), // Gift indicator field (yes/no)
});

// Meeting to JTBD many-to-many relation
export const meetingJtbds = pgTable("meeting_jtbds", {
  meetingId: integer("meeting_id").notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  jtbdId: integer("jtbd_id").notNull().references(() => jtbds.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.meetingId, t.jtbdId] }),
}));

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertResearchSchema = createInsertSchema(researches).omit({
  id: true,
}).extend({
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  researcher: z.string().min(1, "Researcher is required"),
  team: z.string().min(1, "Team is required"),
  status: z.enum([ResearchStatus.PLANNED, ResearchStatus.IN_PROGRESS, ResearchStatus.DONE])
    .default(ResearchStatus.PLANNED),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  researchType: z.enum([
    "CATI (Telephone Survey)",
    "CAWI (Online Survey)", 
    "Moderated usability testing",
    "Unmoderated usability testing",
    "Co-creation session",
    "Interviews",
    "Desk research"
  ]).default("Interviews"),
  brief: z.string().optional(),
  guide: z.string().optional(),
  fullText: z.string().optional(),
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
  respondentPosition: z.string().min(1, "Position is required"),
  companyName: z.string().optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email format"
  }),
  researcher: z.string().optional(), // Field inherited from Research (not editable)
  relationshipManager: z.string().min(1, "Relationship Manager is required"),
  salesPerson: z.string().min(1, "Recruiter is required"),
  researchId: z.number({ required_error: "Research is required" }),
  notes: z.string().optional(),
  hasGift: z.enum(["yes", "no"]).default("no"),
});

// JTBD insert schema
export const insertJtbdSchema = createInsertSchema(jtbds).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  jobStatement: z.string().optional(),
  jobStory: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  priority: z.string().optional(),
});

// Types
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertResearch = z.infer<typeof insertResearchSchema>;
export type Research = typeof researches.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertJtbd = z.infer<typeof insertJtbdSchema>;
export type Jtbd = typeof jtbds.$inferSelect;
export type ResearchJtbd = typeof researchJtbds.$inferSelect;
export type MeetingJtbd = typeof meetingJtbds.$inferSelect;