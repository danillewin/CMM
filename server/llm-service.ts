import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { responseSchema, type ChatMessage } from "@shared/llm-schemas";

// Mock configuration for development (can be replaced with real API)
const LLM_API_KEY = process.env.OPENAI_API_KEY || "mock-api-key";
const LLM_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1";
const LLM_MODEL = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";

// Initialize OpenAI client (will be null if no API key)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient && LLM_API_KEY && LLM_API_KEY !== "mock-api-key") {
    openaiClient = new OpenAI({
      apiKey: LLM_API_KEY,
      baseURL: LLM_API_URL,
    });
  }
  return openaiClient;
}

// System prompt for the interview planning assistant
const SYSTEM_PROMPT = `You are an expert UX researcher assistant helping to plan and design user research interviews. 
Your role is to:
1. Understand the research goals and product/service being studied
2. Identify the customer segment and important details
3. Determine the most appropriate research method (interview, survey, usability test)
4. Create interview scripts with well-structured questions based on best practices
5. Recommend appropriate respondent criteria (segment, experience level, role)

When the user asks about interviews, provide:
- A well-structured interview script with clear question blocks (formatted as markdown with bold headings)
- Specific respondent segment description
- Respondent experience level recommendations
- Respondent role criteria

When more information is needed, ask specific clarifying questions to better understand:
- The product/service/interface/process being studied
- The target customer segment
- Research goals and hypotheses
- Any specific areas of focus

Format all responses in clear, professional Russian.`;

export async function generateChatResponse(
  userMessage: string,
  chatHistory: ChatMessage[]
): Promise<any> {
  const client = getOpenAIClient();
  
  // Mock response for development when no API key is configured
  if (!client) {
    console.log("Using mock LLM response (no API key configured)");
    return getMockResponse(userMessage, chatHistory);
  }

  try {
    // Convert chat history to OpenAI format
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add chat history
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    console.log(`Sending request to LLM with ${messages.length} messages`);

    // Call OpenAI with structured output
    const completion = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_response",
          schema: {
            type: "object",
            properties: {
              data: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["question"] },
                      model_message: { type: "string" }
                    },
                    required: ["type", "model_message"]
                  },
                  {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["email_message"] },
                      content: { type: "string" }
                    },
                    required: ["type", "content"]
                  },
                  {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["interview"] },
                      interview_script: { type: "string" },
                      respondent_segment: { type: "string" },
                      respondent_exp: { type: "string" },
                      respondent_role: { type: "string" }
                    },
                    required: ["type", "interview_script", "respondent_segment", "respondent_exp", "respondent_role"]
                  }
                ]
              }
            },
            required: ["data"]
          }
        }
      },
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message;
    if (!response?.content) {
      throw new Error("No response from LLM");
    }

    // Parse the JSON response
    const parsed = JSON.parse(response.content);
    console.log(`Received LLM response with type: ${parsed.data.type}`);
    return parsed;
  } catch (error) {
    console.error("Error calling LLM API:", error);
    throw new Error(`Failed to generate LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Mock response for development/testing
function getMockResponse(userMessage: string, chatHistory: ChatMessage[]): any {
  // Simple mock logic based on message count and content
  const messageCount = chatHistory.length;
  const lowerMessage = userMessage.toLowerCase();

  // First message - ask clarifying questions
  if (messageCount === 0) {
    return {
      data: {
        type: "question" as const,
        model_message: `Спасибо за ваш запрос! Чтобы лучше помочь вам с планированием исследования, мне нужно уточнить несколько деталей:

1. **Какой именно продукт, услугу или интерфейс вы планируете изучать?**
2. **Кто ваша целевая аудитория?** (например: B2B клиенты, розничные пользователи, конкретная возрастная группа)
3. **Какие основные вопросы вы хотите исследовать?** (например: юзабилити интерфейса, понимание ценностного предложения, барьеры к использованию)
4. **Есть ли у вас гипотезы, которые нужно проверить?**`,
      },
    };
  }

  // If user mentions "survey" or "usability test"
  if (lowerMessage.includes("опрос") || lowerMessage.includes("юзабилити тест") || lowerMessage.includes("тестирован")) {
    return {
      data: {
        type: "email_message" as const,
        content: "Я пока не могу создать сценарий юзабилити-теста или опроса — напишите на example@mail.com. Коллеги помогут вам провести исследование.",
      },
    };
  }

  // Otherwise, return interview plan
  return {
    data: {
      type: "interview" as const,
      interview_script: `**Введение (5 минут)**
- Поблагодарите респондента за участие
- Объясните цель интервью
- Получите согласие на запись (если применимо)
- Расскажите о конфиденциальности данных

**Разогрев (5-7 минут)**
- Расскажите немного о себе и вашей работе
- Как давно вы работаете в текущей компании?
- Какие задачи вы решаете в своей работе каждый день?

**Основной блок: Текущий опыт (10-15 минут)**
- Расскажите о вашем опыте использования подобных продуктов
- Какие проблемы вы решаете с их помощью?
- Что вам нравится в текущих решениях?
- С какими трудностями вы сталкиваетесь?

**Потребности и ожидания (10-15 минут)**
- Что бы вы хотели улучшить в процессе работы?
- Какие функции были бы для вас наиболее полезны?
- Что для вас важно при выборе такого решения?

**Заключение (5 минут)**
- Есть ли что-то еще, о чем мы не спросили, но что вы считаете важным?
- Спасибо за участие!`,
      respondent_segment: "B2B специалисты, работающие с аналогичными продуктами в средних и крупных компаниях",
      respondent_exp: `**Минимальный опыт:** 1-2 года работы в релевантной области

**Предпочтительный опыт:** 3+ лет, с опытом использования аналогичных решений

**Ключевые критерии:**
- Регулярно сталкивается с задачами, которые решает исследуемый продукт
- Имеет опыт принятия решений о выборе инструментов
- Может сравнить разные подходы к решению задачи`,
      respondent_role: `**Целевая роль:** Менеджер продукта, Руководитель отдела, или специалист, принимающий решения о выборе инструментов

**Ключевые характеристики:**
- Имеет полномочия для принятия решений или влияет на выбор решений
- Активно использует продукты данной категории
- Понимает бизнес-процессы и может оценить эффективность решения`,
    },
  };
}

export const llmService = {
  generateChatResponse,
};
