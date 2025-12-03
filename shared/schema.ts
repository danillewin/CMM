import { pgTable, text, serial, timestamp, integer, primaryKey, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const MeetingStatus = {
  IN_PROGRESS: "В процессе",
  SET: "Встреча назначена",
  DONE: "Завершено",
  DECLINED: "Отклонено",
  PLANNED: "Запланировано",
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
  customerFullName: text("customer_full_name"), // Customer's full name field
  additionalStakeholders: text("additional_stakeholders").array(), // Additional stakeholders field
  resultFormat: text("result_format").default("Презентация"), // Results format field
  customerSegmentDescription: text("customer_segment_description"), // Customer segment description
  projectBackground: text("project_background"), // Project background description
  problemToSolve: text("problem_to_solve"), // Problem to solve
  resultsUsage: text("results_usage"), // How results will be used
  productMetrics: text("product_metrics"), // Product metrics
  limitations: text("limitations"), // Limitations
  researchGoals: text("research_goals"), // Main research goals
  researchHypotheses: text("research_hypotheses"), // Research hypotheses
  keyQuestions: text("key_questions"), // Key questions to answer
  previousResources: text("previous_resources"), // Previous research resources field
  additionalMaterials: text("additional_materials"), // Additional materials field
  relatedResearches: text("related_researches").array(), // Related researches links field
  figmaPrototypeLink: text("figma_prototype_link"), // Figma prototype link field
  artifactLink: text("artifact_link"), // Artifact link field for Results tab
  brief: text("brief"),
  guide: text("guide"),
  // Guide structure fields
  guideIntroText: text("guide_intro_text"), // Вступительное слово
  guideIntroQuestions: text("guide_intro_questions"), // Вступительные вопросы (JSON string)
  guideMainQuestions: text("guide_main_questions"), // Основные вопросы (JSON string)
  guideConcludingQuestions: text("guide_concluding_questions"), // Заключительные вопросы (JSON string)
  guideRespondentRecommendations: text("guide_respondent_recommendations"), // Рекомендации для респондентов (Markdown)
  guideQuestionsSimple: text("guide_questions_simple"), // Вопросы (Simplified Markdown - bold headings and bullets)
  llmChatHistory: jsonb("llm_chat_history"), // LLM chat history for the guide tab (array of messages)
  fullText: text("full_text"),
  // New recruitment fields
  recruitmentQuantity: text("recruitment_quantity"), // Количество (text input)
  recruitmentRoles: text("recruitment_roles"), // Роли
  recruitmentSegments: text("recruitment_segments").array(), // Сегменты (multiple selection)
  recruitmentUsedProducts: text("recruitment_used_products").array(), // Используемые продукты
  recruitmentUsedChannels: text("recruitment_used_channels").array(), // Используемые каналы (multiple selection)
  recruitmentCqMin: integer("recruitment_cq_min"), // CQ минимум (0-10)
  recruitmentCqMax: integer("recruitment_cq_max"), // CQ максимум (0-10)
  recruitmentLegalEntityType: text("recruitment_legal_entity_type").array(), // Тип юридического лица (multiple selection)
  recruitmentRestrictions: boolean("recruitment_restrictions"), // Ограничения (да/нет)
});

// Jobs to be Done table
export const jtbds = pgTable("jtbds", {
  id: serial("id").primaryKey(),
  title: text("title"), // Only required for Level 1 & 2
  jobStatement: text("job_statement"), // Only for Level 3
  jobStory: text("job_story"), // Only for Level 3
  description: text("description"), // Only for Level 1 & 2
  category: text("category"),
  priority: text("priority"),
  parentId: integer("parent_id").default(0), // 0 means root level item
  level: integer("level").notNull().default(1), // 1, 2, or 3
  contentType: text("content_type"), // "job_story" or "job_statement" for Level 3
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
  phone: text("phone"),
  researcher: text("researcher"), // Field inherited from Research
  relationshipManager: text("relationship_manager").notNull(),
  salesPerson: text("recruiter").notNull(),
  date: timestamp("date").notNull(),
  time: text("time"), // Optional time field
  meetingLink: text("meeting_link"), // Optional meeting link/location field
  researchId: integer("research_id").references(() => researches.id).notNull(),
  status: text("status").notNull().default(MeetingStatus.IN_PROGRESS),
  notes: text("notes"),
  fullText: text("full_text"),
  hasGift: text("has_gift").default("no"), // Gift indicator field (yes/no)
  summarizationStatus: text("summarization_status").default("not_started"), // not_started, in_progress, completed, failed
  summarizationResult: jsonb("summarization_result"), // Stores the nested summarization result from Kafka service
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
  name: z.string().optional().default(""),
  dateStart: z.coerce.date().optional().default(() => new Date()),
  dateEnd: z.coerce.date().optional().default(() => new Date()),
  researcher: z.string().optional().default(""),
  team: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.enum([ResearchStatus.PLANNED, ResearchStatus.IN_PROGRESS, ResearchStatus.DONE])
    .default(ResearchStatus.PLANNED),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3b82f6"),
  researchType: z.enum([
    "CATI (Telephone Survey)",
    "CAWI (Online Survey)", 
    "Moderated usability testing",
    "Unmoderated usability testing",
    "Co-creation session",
    "Interviews",
    "Desk research",
    "Not assigned"
  ]).default("Not assigned"),
  products: z.array(z.string()).optional().default([]),
  customerFullName: z.string().optional(),
  additionalStakeholders: z.array(z.string()).optional(),
  resultFormat: z.enum(["Презентация", "Figma"]).default("Презентация"),
  projectBackground: z.string().optional(),
  problemToSolve: z.string().optional(),
  resultsUsage: z.string().optional(),
  productMetrics: z.string().optional(),
  limitations: z.string().optional(),
  brief: z.string().optional(),
  guide: z.string().optional(),
  guideIntroText: z.string().optional(),
  guideIntroQuestions: z.string().optional(),
  guideMainQuestions: z.string().optional(),
  guideConcludingQuestions: z.string().optional(),
  guideRespondentRecommendations: z.string().optional(),
  guideQuestionsSimple: z.string().optional(),
  llmChatHistory: z.any().optional(), // JSONB array of chat messages
  fullText: z.string().optional(),
  // New recruitment field validations
  recruitmentQuantity: z.string().nullable().optional(), // Changed to string (text input)
  recruitmentRoles: z.string().nullable().optional(),
  recruitmentSegments: z.array(z.string()).nullable().optional(), // Changed to array for multiple selection
  recruitmentUsedProducts: z.array(z.string()).nullable().optional(),
  recruitmentUsedChannels: z.array(z.string()).nullable().optional(), // Changed to array for multiple selection
  recruitmentCqMin: z.number().int().min(0).max(10).nullable().optional(),
  recruitmentCqMax: z.number().int().min(0).max(10).nullable().optional(),
  recruitmentLegalEntityType: z.array(z.string()).nullable().optional(), // Changed to array for multiple selection
  recruitmentRestrictions: z.boolean().nullable().optional(), // Changed to boolean for да/нет
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
  time: z.string().nullable().optional(), // Optional time field
  meetingLink: z.string().nullable().optional(), // Optional meeting link field
  cnum: z.string().optional().transform((val) => val ? val.toUpperCase() : val),
  gcc: z.string().optional(),
  status: z.enum([MeetingStatus.IN_PROGRESS, MeetingStatus.SET, MeetingStatus.DONE, MeetingStatus.DECLINED, MeetingStatus.PLANNED])
    .default(MeetingStatus.IN_PROGRESS),
  respondentName: z.string().min(1, "Respondent is required"),
  respondentPosition: z.string().min(1, "Position is required"),
  companyName: z.string().optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email format"
  }),
  phone: z.string().optional(),
  researcher: z.string().optional(), // Field inherited from Research (not editable)
  relationshipManager: z.string().min(1, "Relationship Manager is required"),
  salesPerson: z.string().min(1, "Recruiter is required"),
  researchId: z.number().optional(),
  notes: z.string().optional(),
  fullText: z.string().optional(),
  hasGift: z.enum(["yes", "no"]).default("no"),
  summarizationStatus: z.enum(["not_started", "in_progress", "completed", "failed"]).default("not_started"),
  summarizationResult: z.any().optional(), // Allow any JSON structure for summarization results
});

// JTBD insert schema
export const insertJtbdSchema = createInsertSchema(jtbds).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().optional(), // Only required for Level 1 & 2
  jobStatement: z.string().optional(), // Only for Level 3
  jobStory: z.string().optional(), // Only for Level 3
  description: z.string().optional(), // Only for Level 1 & 2
  category: z.string().optional(),
  priority: z.string().optional(),
  level: z.number().min(1).max(3).default(1),
  contentType: z.enum(["job_story", "job_statement"]).nullable().optional(),
});

// Types
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertResearch = z.input<typeof insertResearchSchema>;
export type Research = typeof researches.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect & {
  researchName?: string; // Optional research name from JOIN queries
};
export type InsertJtbd = z.infer<typeof insertJtbdSchema>;
export type Jtbd = typeof jtbds.$inferSelect;
export type ResearchJtbd = typeof researchJtbds.$inferSelect;
export type MeetingJtbd = typeof meetingJtbds.$inferSelect;

// Add custom filters table
// Meeting file attachments table
export const meetingAttachments = pgTable("meeting_attachments", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  objectPath: text("object_path").notNull(), // Path in object storage
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  transcriptionStatus: text("transcription_status").notNull().default("pending"), // pending, in_progress, completed, failed
  transcriptionText: text("transcription_text"), // New field for transcription separate from full_text
  transcriptionRetryCount: integer("transcription_retry_count").notNull().default(0),
  lastTranscriptionAttempt: timestamp("last_transcription_attempt"),
  errorMessage: text("error_message"), // Store error message for failed transcriptions
});

export const customFilters = pgTable("custom_filters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pageType: text("page_type").notNull(), // "meetings", "researches", "calendar"
  filters: jsonb("filters").notNull(), // JSON object containing filter configuration
  createdBy: text("created_by").notNull(), // User who created the filter
  shared: boolean("shared").notNull().default(false), // Whether filter is shared with team
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Text annotation error types
export const TextAnnotationErrorType = {
  SUBSTITUTION: "substitution",
  INSERTION: "insertion",
  DELETION: "deletion",
} as const;

export type TextAnnotationErrorTypeValue = typeof TextAnnotationErrorType[keyof typeof TextAnnotationErrorType];

// Text annotations table for marking errors in transcription text
export const textAnnotations = pgTable("text_annotations", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  attachmentId: integer("attachment_id").references(() => meetingAttachments.id, { onDelete: 'cascade' }), // Optional: links to specific attachment transcription
  errorType: text("error_type").notNull(), // substitution, insertion, deletion
  startOffset: integer("start_offset").notNull(), // Character offset where annotation starts
  endOffset: integer("end_offset").notNull(), // Character offset where annotation ends
  selectedText: text("selected_text").notNull(), // The actual text that was selected
  correctionText: text("correction_text"), // The correction word entered by user (for substitution/deletion errors)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Meeting attachment schema
export const insertMeetingAttachmentSchema = createInsertSchema(meetingAttachments).omit({
  id: true,
  uploadedAt: true,
  transcriptionRetryCount: true,
  lastTranscriptionAttempt: true,
}).extend({
  meetingId: z.number({ required_error: "Meeting ID is required" }),
  fileName: z.string().min(1, "File name is required"),
  originalName: z.string().min(1, "Original name is required"),
  fileSize: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  objectPath: z.string().min(1, "Object path is required"),
  transcriptionStatus: z.enum(["pending", "in_progress", "completed", "failed"]).default("pending"),
  transcriptionText: z.string().optional(),
  errorMessage: z.string().optional(),
});

// Custom filter schema
export const insertCustomFilterSchema = createInsertSchema(customFilters, {
  name: z.string().min(1, "Filter name is required"),
  description: z.string().optional(),
  pageType: z.enum(["meetings", "researches", "calendar"]),
  filters: z.record(z.any()),
  createdBy: z.string().min(1, "Creator is required"),
  shared: z.boolean().default(false),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MeetingAttachment = typeof meetingAttachments.$inferSelect;
export type InsertMeetingAttachment = z.infer<typeof insertMeetingAttachmentSchema>;

// Update type for meeting attachments that allows updating transcription fields
export const updateMeetingAttachmentSchema = insertMeetingAttachmentSchema.partial().extend({
  transcriptionRetryCount: z.number().optional(),
  lastTranscriptionAttempt: z.date().optional(),
});
export type UpdateMeetingAttachment = z.infer<typeof updateMeetingAttachmentSchema>;

export type CustomFilter = typeof customFilters.$inferSelect;
export type InsertCustomFilter = z.infer<typeof insertCustomFilterSchema>;

// Text annotation schema
export const insertTextAnnotationSchema = createInsertSchema(textAnnotations).omit({
  id: true,
  createdAt: true,
}).extend({
  meetingId: z.number({ required_error: "Meeting ID is required" }),
  attachmentId: z.number().optional(), // Optional: links to specific attachment transcription
  errorType: z.enum([TextAnnotationErrorType.SUBSTITUTION, TextAnnotationErrorType.INSERTION, TextAnnotationErrorType.DELETION]),
  startOffset: z.number().int().min(0, "Start offset must be non-negative"),
  endOffset: z.number().int().min(0, "End offset must be non-negative"),
  selectedText: z.string().min(1, "Selected text is required"),
  correctionText: z.string().optional(), // The correction word for substitution/deletion errors
});

export type TextAnnotation = typeof textAnnotations.$inferSelect;
export type InsertTextAnnotation = z.infer<typeof insertTextAnnotationSchema>;

// Pagination types
export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  researchId?: number;
  // Meeting filters
  status?: string;
  manager?: string;
  recruiter?: string;
  researcher?: string;
  position?: string;
  gift?: string;
  // Array-based filters for multi-select
  researchIds?: string;
  managers?: string;
  recruiters?: string;
  researchers?: string;
  positions?: string;
  // Research filters
  team?: string;
  teams?: string;
  researchResearchers?: string;
  researchType?: string;
  products?: string[];
};

export type PaginatedResponse<T> = {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
};

// Calendar-specific minimal types for optimized calendar view
export type CalendarMeeting = {
  id: number;
  respondentName: string;
  date: Date;
  researchId: number | null;
  status: string;
};

export type CalendarResearch = {
  id: number;
  name: string;
  team: string;
  researcher: string;
  dateStart: Date;
  dateEnd: Date;
  status: string;
  color: string;
};

// Lightweight versions for table view (only essential fields)
export type MeetingTableItem = Pick<Meeting, 
  'id' | 'respondentName' | 'respondentPosition' | 'companyName' | 'researcher' | 
  'relationshipManager' | 'salesPerson' | 'date' | 'status' | 'researchId' | 'cnum'
> & {
  researchName?: string; // Added from JOIN with researches table
};

export type ResearchTableItem = Pick<Research, 
  'id' | 'name' | 'team' | 'researcher' | 'dateStart' | 'dateEnd' | 'status' | 
  'color' | 'researchType' | 'products' | 'description'
>;

// OpenAPI-compatible schemas for external API integration
export const clientNameSchema = z.object({
  nameRu: z.string().nullable().optional(),
  nameEn: z.string().nullable().optional(),
  fullNameRu: z.string().nullable().optional(),
  fullNameEn: z.string().nullable().optional(),
});

export const clientContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().nullable().optional(),
  emails: z.array(z.string().email()).default([]),
  phones: z.array(z.string()).default([]),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  position: z.string().nullable().optional(),
});

export const researchMeetingDtoSchema = z.object({
  id: z.number().optional(), // Optional for creation, required for updates
  crmId: z.string().uuid("Invalid CRM ID format"),
  clientId: z.string().uuid("Invalid client ID format").optional(),
  clientNumber: z.string().min(1, "Client number is required"),
  gccNumber: z.string().nullable().optional(),
  clientManager: z.string().nullable().optional(),
  clientName: clientNameSchema,
  createdBy: z.string().min(1, "Created by is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Start time must be in HH:MM:SS format"),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "End time must be in HH:MM:SS format"),
  employees: z.array(z.string()).min(1, "At least one employee is required"),
  comment: z.string().default(""),
  contacts: z.array(clientContactSchema).default([]),
  location: z.string().nullable().optional(), // Location/meeting link field
});

// Insert and update schemas for OpenAPI endpoints
export const insertResearchMeetingDtoSchema = researchMeetingDtoSchema.omit({
  id: true,
});

export const updateResearchMeetingDtoSchema = researchMeetingDtoSchema.partial().extend({
  id: z.number(), // Required for updates
});

// Types for OpenAPI endpoints
export type ClientNameDto = z.infer<typeof clientNameSchema>;
export type ClientContactDto = z.infer<typeof clientContactSchema>;
export type ResearchMeetingDto = z.infer<typeof researchMeetingDtoSchema>;
export type InsertResearchMeetingDto = z.infer<typeof insertResearchMeetingDtoSchema>;
export type UpdateResearchMeetingDto = z.infer<typeof updateResearchMeetingDtoSchema>;