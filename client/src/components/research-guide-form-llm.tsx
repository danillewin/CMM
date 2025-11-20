import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { WysiwygMarkdownEditor } from "@/components/wysiwyg-markdown-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Research, InsertResearch, ResearchStatusType } from "@shared/schema";
import type { ChatMessage, InterviewPlan } from "@shared/llm-schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResearchGuideFormLLMProps {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: any) => void;
}

export function ResearchGuideFormLLM({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: ResearchGuideFormLLMProps) {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [pendingInterviewData, setPendingInterviewData] = useState<InterviewPlan | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  const form = useForm<{
    guideRespondentRecommendations: string;
    guideQuestionsSimple: string;
  }>({
    defaultValues: {
      guideRespondentRecommendations: research?.guideRespondentRecommendations || "",
      guideQuestionsSimple: research?.guideQuestionsSimple || "",
    },
  });

  // Load chat history from research data
  useEffect(() => {
    if (research?.llmChatHistory && Array.isArray(research.llmChatHistory)) {
      setChatHistory(research.llmChatHistory as ChatMessage[]);
      
      // Check if any message in chat history has interview type - if so, show recommendations
      const hasInterviewResponse = (research.llmChatHistory as ChatMessage[]).some(
        msg => msg.role === "assistant" && msg.responseData?.type === "interview"
      );
      if (hasInterviewResponse && research.guideRespondentRecommendations) {
        setShowRecommendations(true);
      }
    } else {
      setChatHistory([]);
    }
  }, [research?.id]);

  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      guideRespondentRecommendations: research?.guideRespondentRecommendations || "",
      guideQuestionsSimple: research?.guideQuestionsSimple || "",
    });
  }, [research, form]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // LLM chat mutation
  const chatMutation = useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      const res = await apiRequest("POST", `/api/researches/${research?.id}/chat`, {
        message,
        chatHistory: history,
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      return res.json();
    },
    onSuccess: (response) => {
      const responseData = response.data;
      
      // Determine the message content based on response type
      let assistantMessage = "";
      
      if (responseData.type === "question") {
        assistantMessage = responseData.model_message;
      } else if (responseData.type === "email_message") {
        assistantMessage = responseData.content;
      } else if (responseData.type === "interview") {
        assistantMessage = "Похоже, для вас подходит метод интервью. Я составил вопросы для интервью и рекомендации по выбору респондентов";
        setPendingInterviewData(responseData);
      }

      // Add assistant response to chat history
      const newChatHistory: ChatMessage[] = [
        ...chatHistory,
        {
          role: "user",
          content: userMessage,
          timestamp: Date.now(),
        },
        {
          role: "assistant",
          content: assistantMessage,
          timestamp: Date.now(),
          responseData: responseData,
        },
      ];

      setChatHistory(newChatHistory);
      setUserMessage("");

      // Update research with new chat history
      if (onTempDataUpdate) {
        onTempDataUpdate({ llmChatHistory: newChatHistory });
      }

      // Auto-apply interview data when received
      if (responseData.type === "interview") {
        const currentQuestions = form.getValues("guideQuestionsSimple");
        
        // Check if questions field already has content
        if (currentQuestions && currentQuestions.trim().length > 0) {
          setPendingInterviewData(responseData);
          setReplaceDialogOpen(true);
        } else {
          applyInterviewData(responseData);
        }
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось получить ответ от ассистента. Попробуйте снова.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!userMessage.trim() || chatMutation.isPending) return;

    chatMutation.mutate({
      message: userMessage,
      history: chatHistory,
    });
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setUserMessage("");
    setPendingInterviewData(null);
    
    if (onTempDataUpdate) {
      onTempDataUpdate({ llmChatHistory: [] });
    }
  };

  const applyInterviewData = (interviewData?: InterviewPlan) => {
    const data = interviewData || pendingInterviewData;
    if (!data) {
      console.log("applyInterviewData called but no data available");
      return;
    }

    console.log("Applying interview data:", data);

    // Format recommendations
    const recommendations = `**Сегмент:** ${data.respondent_segment}

**Опыт:**  
${data.respondent_exp}

**Роль:**  
${data.respondent_role}`;

    console.log("Setting form values...");
    console.log("Questions to set:", data.interview_script);

    // Reset the form with new values to trigger re-render
    const currentValues = form.getValues();
    form.reset({
      guideRespondentRecommendations: recommendations,
      guideQuestionsSimple: data.interview_script,
    });

    console.log("Form values after reset:", form.getValues());

    // Show recommendations field
    setShowRecommendations(true);

    // Update temp data
    if (onTempDataUpdate) {
      onTempDataUpdate({
        guideRespondentRecommendations: recommendations,
        guideQuestionsSimple: data.interview_script,
      });
    }

    setReplaceDialogOpen(false);
    setPendingInterviewData(null);
    
    // Scroll to questions field
    setTimeout(() => {
      questionsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = (data: {
    guideRespondentRecommendations: string;
    guideQuestionsSimple: string;
  }) => {
    if (research) {
      onUpdate({
        name: research.name,
        team: research.team,
        researcher: research.researcher,
        description: research.description,
        dateStart: research.dateStart,
        dateEnd: research.dateEnd,
        status: research.status as ResearchStatusType,
        color: research.color,
        researchType: research.researchType as any,
        products: research.products || [],
        customerFullName: research.customerFullName || undefined,
        additionalStakeholders: research.additionalStakeholders || undefined,
        resultFormat: (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        customerSegmentDescription: research.customerSegmentDescription || undefined,
        projectBackground: research.projectBackground || undefined,
        problemToSolve: research.problemToSolve || undefined,
        resultsUsage: research.resultsUsage || undefined,
        productMetrics: research.productMetrics || undefined,
        limitations: research.limitations || undefined,
        researchGoals: research.researchGoals || undefined,
        researchHypotheses: research.researchHypotheses || undefined,
        keyQuestions: research.keyQuestions || undefined,
        previousResources: research.previousResources || undefined,
        additionalMaterials: research.additionalMaterials || undefined,
        relatedResearches: research.relatedResearches || undefined,
        figmaPrototypeLink: research.figmaPrototypeLink || undefined,
        artifactLink: research.artifactLink || undefined,
        brief: research.brief || undefined,
        guide: undefined,
        guideIntroText: research.guideIntroText || undefined,
        guideRespondentRecommendations: data.guideRespondentRecommendations,
        guideQuestionsSimple: data.guideQuestionsSimple,
        llmChatHistory: chatHistory as any,
        fullText: research.fullText || undefined,
        recruitmentQuantity: research.recruitmentQuantity,
        recruitmentRoles: research.recruitmentRoles,
        recruitmentSegments: research.recruitmentSegments,
        recruitmentUsedProducts: research.recruitmentUsedProducts || [],
        recruitmentUsedChannels: research.recruitmentUsedChannels,
        recruitmentCqMin: research.recruitmentCqMin,
        recruitmentCqMax: research.recruitmentCqMax,
        recruitmentLegalEntityType: research.recruitmentLegalEntityType,
        recruitmentRestrictions: research.recruitmentRestrictions,
      });
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Respondent Recommendations - Hidden by default, only shown when LLM provides data */}
        {showRecommendations && (
          <div ref={questionsRef}>
            <FormLabel className="text-lg font-medium mb-2 block">
              {"Рекомендации для респондентов"}
            </FormLabel>
            <FormField
              control={form.control}
              name="guideRespondentRecommendations"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <WysiwygMarkdownEditor
                      key={field.value}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        handleFieldChange("guideRespondentRecommendations", val);
                      }}
                      placeholder="Рекомендации по выбору респондентов..."
                      height={250}
                      simple={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Questions Field - Visible by default */}
        <FormField
          control={form.control}
          name="guideQuestionsSimple"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">{"Вопросы"}</FormLabel>
              <FormControl>
                <WysiwygMarkdownEditor
                  key={field.value}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    handleFieldChange("guideQuestionsSimple", val);
                  }}
                  placeholder={`Используйте **жирный текст** для заголовков блоков

- Пункты списка для вопросов
- Еще один вопрос
- И еще один`}
                  height={300}
                  simple={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LLM Chat Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <FormLabel className="text-lg font-medium mb-4 block">
            {"Помощник по планированию исследований"}
          </FormLabel>

          {/* Chat Messages */}
          <ScrollArea className="h-[400px] mb-4 bg-white rounded border p-4">
            {chatHistory.length === 0 ? (
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
                <div className="prose prose-sm max-w-none">
                  <p className="mb-2">
                    Напишите, какой продукт, услугу, интерфейс или процесс вы хотите изучить?
                  </p>
                  <p className="text-sm">
                    Уточните интересуемый сегмент клиентов и прочие детали, которые вы считаете важными
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                      data-testid={`chat-message-${message.role}`}
                    >
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => (
                              <p className={message.role === "user" ? "text-white mb-2" : "text-gray-900 mb-2"} {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong className={message.role === "user" ? "text-white font-bold" : "text-gray-900 font-bold"} {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className={message.role === "user" ? "text-white" : "text-gray-900"} {...props} />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Опишите вашу задачу..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={chatMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || chatMutation.isPending}
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Clear History Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="w-full text-red-600 hover:bg-red-50"
            disabled={chatHistory.length === 0}
            data-testid="button-clear-history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить историю
          </Button>
        </div>

        {/* Save Button */}
        <Button type="submit" disabled={isLoading} data-testid="button-save">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
      </form>

      {/* Replace Dialog */}
      <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заменить существующие вопросы?</AlertDialogTitle>
            <AlertDialogDescription>
              В поле Вопросы уже есть данные. Хотите заменить их на новые вопросы от LLM?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-replace">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => applyInterviewData()} data-testid="button-confirm-replace">
              Заменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
