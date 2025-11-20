import { z } from "zod";

// Schema for clarifying questions response
export const clarifyingQuestionsSchema = z.object({
  type: z.literal("question"),
  model_message: z.string().describe("Clarifying questions in Markdown format"),
});

// Schema for usability survey/test response
export const usabilitySurveySchema = z.object({
  type: z.literal("email_message"),
  content: z.string().default("I currently cannot create a usability test or survey script — please email example@mail.com. Colleagues will help you run the research."),
});

// Schema for interview plan response
export const interviewPlanSchema = z.object({
  type: z.literal("interview"),
  interview_script: z.string().describe("Interview script in Markdown format"),
  respondent_segment: z.string().describe("Respondent segment — find in the initial input or clarify with the user"),
  respondent_exp: z.string().describe("Respondent experience — choose based on the research goal from the table. Format in Markdown"),
  respondent_role: z.string().describe("Respondent role — formulate based on the research goal. Format in Markdown"),
});

// Discriminated union schema for all possible responses
export const responseSchema = z.object({
  data: z.discriminatedUnion("type", [
    clarifyingQuestionsSchema,
    usabilitySurveySchema,
    interviewPlanSchema,
  ]),
});

// Type exports
export type ClarifyingQuestions = z.infer<typeof clarifyingQuestionsSchema>;
export type UsabilitySurvey = z.infer<typeof usabilitySurveySchema>;
export type InterviewPlan = z.infer<typeof interviewPlanSchema>;
export type LLMResponse = z.infer<typeof responseSchema>;

// Chat message types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  responseData?: ClarifyingQuestions | UsabilitySurvey | InterviewPlan;
}
