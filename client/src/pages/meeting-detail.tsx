import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  Meeting,
  MeetingStatus,
  Research,
  InsertMeeting,
} from "@shared/schema";

// Types for summarization display
interface SummarizationResponseBlock {
  blockName: string;
  blockElements: Array<
    SummarizationResponseBlock | SummarizationResponseQuestion
  >;
  blockSummary: string;
  question?: string;
  answer?: string;
}

interface SummarizationResponseQuestion {
  question: string;
  answer: string;
}

interface SummarizationResponse {
  items: SummarizationResponseBlock[];
  summary: string;
}
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  ExternalLinkIcon,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MeetingForm from "@/components/meeting-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WysiwygMarkdownEditor } from "@/components/wysiwyg-markdown-editor";
import DOMPurify from "dompurify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort } from "@/lib/date-utils";
import MDEditor from "@uiw/react-md-editor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUpload from "@/components/file-upload";
import FileAttachments from "@/components/file-attachments";

// Helper type for handling Meeting with ID
type MeetingWithId = Meeting;

// Component to render a single question with answer
function SummarizationQuestion({
  question,
  answer,
}: SummarizationResponseQuestion) {
  return (
    <div
      className="border-l-4 border-blue-200 pl-4 py-2 bg-gray-50 rounded-r-md"
      data-testid="summarization-question"
    >
      <div className="flex items-start gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p
          className="font-medium text-gray-800 text-sm"
          data-testid="question-text"
        >
          {question}
        </p>
      </div>
      {answer && (
        <div
          className="ml-6 text-sm text-gray-600 bg-white p-2 rounded border"
          data-testid="answer-text"
        >
          {answer}
        </div>
      )}
    </div>
  );
}

// Component to render a single block with nested structure
function SummarizationBlock({
  block,
  level = 0,
}: {
  block: SummarizationResponseBlock;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isRootLevel = level === 0;
  const hasElements = block.blockElements && block.blockElements.length > 0;

  // Determine if this is a question block vs a nested block
  const isQuestionBlock = "question" in block && block.question;

  // Use static classes instead of dynamic ones for Tailwind JIT
  const indentClass =
    level === 1 ? "ml-4" : level === 2 ? "ml-8" : level === 3 ? "ml-12" : "";
  const cardClass = isRootLevel
    ? "border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm"
    : "border-l-2 border-gray-300 pl-3 py-2 mb-2 bg-gray-50/50 rounded-r";

  return (
    <div
      className={`${cardClass} ${indentClass}`}
      data-testid={`summarization-block-${level}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
            data-testid="block-toggle"
          >
            {hasElements ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <FileText className="h-4 w-4 text-gray-400" />
            )}
            <h4
              className={`${isRootLevel ? "text-lg font-semibold" : "text-sm font-medium"} text-gray-800`}
              data-testid="block-name"
            >
              {block.blockName}
            </h4>
            {hasElements && (
              <Badge
                variant="secondary"
                className="text-xs"
                data-testid="block-count"
              >
                {block.blockElements.length}{" "}
                {block.blockElements.length === 1 ? "item" : "items"}
              </Badge>
            )}
          </CollapsibleTrigger>
        </div>

        {/* Block question (if this block has a direct question) */}
        {isQuestionBlock && (
          <div className="mt-3">
            <SummarizationQuestion
              question={block.question!}
              answer={block.answer || ""}
            />
          </div>
        )}

        {/* Block elements (nested content) */}
        <CollapsibleContent
          className="space-y-2 mt-3"
          data-testid="block-elements"
        >
          {block.blockElements.map((element, index) => {
            if (
              "question" in element &&
              "answer" in element &&
              !("blockName" in element)
            ) {
              // It's a question element - ensure it matches SummarizationResponseQuestion type
              const questionElement = element as SummarizationResponseQuestion;
              return <SummarizationQuestion key={index} {...questionElement} />;
            } else {
              // It's a nested block
              const blockElement = element as SummarizationResponseBlock;
              return (
                <SummarizationBlock
                  key={index}
                  block={blockElement}
                  level={level + 1}
                />
              );
            }
          })}
        </CollapsibleContent>

        {/* Block summary */}
        {block.blockSummary && (
          <div
            className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
            data-testid="block-summary"
          >
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-800 mb-1">
                  Block Summary
                </p>
                <p className="text-sm text-blue-700">{block.blockSummary}</p>
              </div>
            </div>
          </div>
        )}
      </Collapsible>
    </div>
  );
}

// Main component to display complete summarization result
function SummarizationDisplay({ result }: { result: SummarizationResponse }) {
  return (
    <div className="space-y-6" data-testid="summarization-display">
      {/* Overall Summary */}
      {result.summary && (
        <Card
          className="border-green-200 bg-green-50"
          data-testid="overall-summary"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  Meeting Summary
                </h3>
                <p
                  className="text-sm text-green-700"
                  data-testid="summary-text"
                >
                  {result.summary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Blocks */}
      <div>
        <h3
          className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"
          data-testid="detailed-analysis-title"
        >
          <FileText className="h-5 w-5" />
          Detailed Interview Analysis
        </h3>
        <div className="space-y-2" data-testid="analysis-blocks">
          {result.items.map((item, index) => (
            <SummarizationBlock key={index} block={item} level={0} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for Meeting Info tab (all fields except notes and fullText)
function MeetingInfoForm({
  meeting,
  onUpdate,
  isLoading,
  onTempDataUpdate,
  onDelete,
}: {
  meeting?: Meeting;
  onUpdate: (data: InsertMeeting) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: Partial<InsertMeeting>) => void;
  onDelete?: () => void;
}) {
  return (
    <MeetingForm
      onSubmit={onUpdate}
      initialData={meeting || null}
      isLoading={isLoading}
      hideNotesAndFullText={true}
      onTempDataUpdate={onTempDataUpdate}
      isCreating={false}
      onDelete={onDelete}
    />
  );
}

// Component for Meeting Results tab (notes and fullText only)
function MeetingResultsForm({
  meeting,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: {
  meeting?: Meeting;
  onUpdate: (data: InsertMeeting) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: Partial<InsertMeeting>) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const form = useForm<{ notes: string; fullText: string }>({
    defaultValues: {
      notes: meeting?.notes || "",
      fullText: meeting?.fullText || "",
    },
  });

  // Reset form when meeting data changes
  useEffect(() => {
    if (meeting) {
      form.reset({
        notes: meeting.notes || "",
        fullText: meeting.fullText || "",
      });
    }
  }, [meeting, form]);

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  const handleSubmit = (data: { notes: string; fullText: string }) => {
    if (meeting) {
      onUpdate({
        respondentName: meeting.respondentName,
        respondentPosition: meeting.respondentPosition,
        cnum: meeting.cnum,
        gcc: meeting.gcc || "",
        companyName: meeting.companyName || "",
        email: meeting.email || "",
        researcher: meeting.researcher || "",
        relationshipManager: meeting.relationshipManager,
        salesPerson: meeting.salesPerson,
        date: meeting.date,
        researchId: meeting.researchId,
        status: meeting.status as any,
        notes: data.notes,
        fullText: data.fullText,
        hasGift: (meeting.hasGift as "yes" | "no") || "no",
        summarizationStatus:
          (meeting.summarizationStatus as any) || "not_started",
      });
    }
  };
  // Handle when files are uploaded successfully
  const handleUploadComplete = () => {
    // Files are uploaded and transcription is processing in the background
    // The FileAttachments component will show the status
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* File Upload and Attachments Section */}
        <div className="space-y-6">
          <FileUpload
            meetingId={meeting?.id || null}
            onUploadComplete={handleUploadComplete}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />

          {meeting?.id && <FileAttachments meetingId={meeting.id} />}
        </div>

        {/* Meeting Results Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Заметки о встрече
                </FormLabel>
                <FormControl>
                  <WysiwygMarkdownEditor
                    value={field.value}
                    onChange={(val) => {
                      const newValue = val || "";
                      field.onChange(newValue);
                      handleFieldChange("notes", newValue);
                    }}
                    placeholder="Введите заметки о встрече..."
                    height={300}
                    className=""
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Отчет в текстовом виде
                </FormLabel>
                <FormControl>
                  <WysiwygMarkdownEditor
                    value={field.value}
                    onChange={(val) => {
                      const newValue = val || "";
                      field.onChange(newValue);
                      handleFieldChange("fullText", newValue);
                    }}
                    placeholder="Введите полный текст..."
                    height={300}
                    className=""
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Summarization Results Section */}
          {meeting?.id && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI Interview Analysis
              </h3>

              {/* Summarization Status */}
              <div className="mb-4">
                {(!meeting.summarizationStatus ||
                  meeting.summarizationStatus === "not_started") && (
                  <div
                    className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-md"
                    data-testid="summarization-not-started"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Analysis will begin automatically after all files are
                      transcribed
                    </span>
                  </div>
                )}

                {meeting.summarizationStatus === "in_progress" && (
                  <div
                    className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-md"
                    data-testid="summarization-in-progress"
                  >
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">AI analysis in progress...</span>
                  </div>
                )}

                {meeting.summarizationStatus === "failed" && (
                  <div
                    className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md"
                    data-testid="summarization-failed"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Analysis failed. Please contact support if this issue
                      persists.
                    </span>
                  </div>
                )}

                {meeting.summarizationStatus === "completed" &&
                  meeting.summarizationResult && (
                    <div
                      className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md mb-4"
                      data-testid="summarization-completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        AI analysis completed successfully
                      </span>
                    </div>
                  )}
              </div>

              {/* Display summarization results when completed */}
              {(meeting as any).summarizationStatus === "completed" &&
                (meeting as any).summarizationResult && (
                  <SummarizationDisplay
                    result={
                      (meeting as any)
                        .summarizationResult as SummarizationResponse
                    }
                  />
                )}
            </div>
          )}

          <Button type="submit" disabled={isLoading || isProcessing}>
            {isLoading || isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Сохранить результаты
          </Button>
        </form>
      </div>
    </Form>
  );
}

// Types for Guide structure (from research-detail.tsx)
interface Question {
  id: string;
  text: string;
  comment?: string;
  order: number;
}

interface Subblock {
  id: string;
  name: string;
  questions: Question[];
  subblocks: Subblock[];
  order: number;
}

interface QuestionBlock {
  id: string;
  name: string;
  questions: Question[];
  subblocks: Subblock[];
  order: number;
}

// Helper function to parse question blocks (from research-detail.tsx)
const parseQuestionBlocks = (questionsJson: string | null): QuestionBlock[] => {
  if (!questionsJson || typeof questionsJson !== "string") return [];

  try {
    const parsed = JSON.parse(questionsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any, blockIndex: number) => {
      const questions = (item.questions || []).map(
        (q: any, qIndex: number) => ({
          id: q.id || Math.random().toString(),
          text: q.text || "",
          comment: q.comment || "",
          order: q.order !== undefined ? q.order : qIndex,
        }),
      );

      const subblocks = (item.subblocks || []).map(
        (s: any, sIndex: number) => ({
          id: s.id || Math.random().toString(),
          name: s.name || "",
          questions: (s.questions || []).map((sq: any, sqIndex: number) => ({
            id: sq.id || Math.random().toString(),
            text: sq.text || "",
            comment: sq.comment || "",
            order: sq.order !== undefined ? sq.order : sqIndex,
          })),
          subblocks: (s.subblocks || []).map((ss: any, ssIndex: number) => ({
            id: ss.id || Math.random().toString(),
            name: ss.name || "",
            questions: (ss.questions || []).map(
              (ssq: any, ssqIndex: number) => ({
                id: ssq.id || Math.random().toString(),
                text: ssq.text || "",
                comment: ssq.comment || "",
                order: ssq.order !== undefined ? ssq.order : ssqIndex,
              }),
            ),
            order:
              ss.order !== undefined
                ? ss.order
                : (s.questions || []).length + ssIndex,
          })),
          order: s.order !== undefined ? s.order : questions.length + sIndex,
        }),
      );

      return {
        id: item.id || Math.random().toString(),
        name: item.name || "",
        questions,
        subblocks,
        order: item.order !== undefined ? item.order : blockIndex,
      };
    });
  } catch {
    return [];
  }
};

// Read-only component to display questions recursively
function ReadOnlyQuestions({ questions }: { questions: Question[] }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="ml-4 space-y-2">
      {questions
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((question, idx) => (
          <div key={question.id || idx} className="space-y-1">
            <p className="text-sm text-gray-700">{question.text}</p>
            {question.comment && (
              <p className="text-xs text-gray-500 italic ml-2">
                {question.comment}
              </p>
            )}
          </div>
        ))}
    </div>
  );
}

// Read-only component to display subblocks recursively
function ReadOnlySubblocks({ subblocks }: { subblocks: Subblock[] }) {
  if (!subblocks || subblocks.length === 0) return null;

  return (
    <div className="ml-4 space-y-4">
      {subblocks
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((subblock, idx) => (
          <div key={subblock.id || idx} className="space-y-2">
            <h5 className="font-medium text-gray-800 text-sm">
              {subblock.name}
            </h5>
            <ReadOnlyQuestions questions={subblock.questions} />
            <ReadOnlySubblocks subblocks={subblock.subblocks} />
          </div>
        ))}
    </div>
  );
}

// Read-only Guide tab component
function MeetingGuideTab({ research }: { research?: Research }) {
  if (!research) {
    return (
      <div className="text-center py-8 text-gray-500">
        No research linked to this meeting or research guide not available.
      </div>
    );
  }

  const guideMainQuestions = parseQuestionBlocks(
    (research.guideMainQuestions as unknown as string) || null,
  );

  return (
    <div className="space-y-8">
      {/* Introductory Text */}
      {research.guideIntroText && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Introductory Text</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {research.guideIntroText}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Main Guide Content */}
      {research.guide && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Guide</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {research.guide}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Question Blocks */}
      {guideMainQuestions && guideMainQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Questions</h3>
          <div className="space-y-6">
            {guideMainQuestions
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((block, idx) => (
                <div
                  key={block.id || idx}
                  className="space-y-3 border-l-4 border-blue-200 pl-4"
                >
                  <h4 className="font-medium text-gray-900">{block.name}</h4>
                  <ReadOnlyQuestions questions={block.questions} />
                  <ReadOnlySubblocks subblocks={block.subblocks} />
                </div>
              ))}
          </div>
        </div>
      )}

      {!research.guideIntroText &&
        !research.guide &&
        (!guideMainQuestions || guideMainQuestions.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No guide content available for this research.
          </div>
        )}
    </div>
  );
}

export default function MeetingDetail() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);

  // Debug: Log params and isNew value to console
  console.log("MeetingDetail debug:", { 
    location, 
    params, 
    isNew, 
    id,
    "params.id": params.id
  });

  // Completely prevent any /api/meetings queries (without ID) on this page
  useEffect(() => {
    // Cancel any queries to the general /api/meetings endpoint
    queryClient.cancelQueries({
      queryKey: ["/api/meetings"],
      exact: false,
      predicate: (query) => {
        const queryKey = query.queryKey;
        // Cancel if it's exactly ['/api/meetings'] or starts with ['/api/meetings'] but not ['/api/meetings', id]
        return (
          Array.isArray(queryKey) &&
          queryKey[0] === "/api/meetings" &&
          (queryKey.length === 1 ||
            (queryKey.length > 1 && typeof queryKey[1] !== "number"))
        );
      },
    });

    // Also remove any observers for the general meetings endpoint
    queryClient.removeQueries({
      queryKey: ["/api/meetings"],
      exact: false,
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey[0] === "/api/meetings" &&
          (queryKey.length === 1 ||
            (queryKey.length > 1 && typeof queryKey[1] !== "number"))
        );
      },
    });
  }, [location]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMeetings, setDuplicateMeetings] = useState<Meeting[]>([]);
  const [pendingFormData, setPendingFormData] = useState<InsertMeeting | null>(
    null,
  );
  // State to manage form data across tabs during creation and editing
  const [tempFormData, setTempFormData] = useState<Partial<InsertMeeting>>({});
  const { toast } = useToast();

  // Parse query parameters for navigation context and new meeting creation
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedResearchId = isNew
    ? searchParams.get("researchId")
      ? parseInt(searchParams.get("researchId")!)
      : undefined
    : undefined;

  // Parse navigation source context
  const sourceType = searchParams.get("source"); // "research" or null
  const sourceId = searchParams.get("sourceId")
    ? parseInt(searchParams.get("sourceId")!)
    : null;
  const fromContext = searchParams.get("from"); // This is what research-detail.tsx uses

  // For storing the preselected research details
  const [preselectedResearch, setPreselectedResearch] =
    useState<Research | null>(null);

  // For storing selected JTBDs during meeting creation
  const [selectedJtbdsForNewMeeting, setSelectedJtbdsForNewMeeting] = useState<
    any[]
  >([]);

  // Handler to update temporary form data
  const handleTempDataUpdate = (newData: Partial<InsertMeeting>) => {
    setTempFormData((prev) => ({ ...prev, ...newData }));
  };

  // Clear temporary data when navigating away from new meeting
  useEffect(() => {
    if (!isNew) {
      setTempFormData({});
    }
  }, [isNew]);

  const { data: meeting, isLoading: isMeetingLoading } = useQuery<Meeting>({
    queryKey: ["/api/meetings", id],
    queryFn: async () => {
      if (isNew) return undefined;
      const res = await apiRequest("GET", `/api/meetings/${id}`);
      if (!res.ok) throw new Error("Meeting not found");
      return res.json();
    },
    enabled: !isNew && !!id,
  });

  // Remove the meetings query entirely - we'll fetch duplicates imperatively when needed

  // Research data is now loaded on-demand via ResearchSelector component
  // No need to pre-load all researches
  const researches: Research[] = [];

  // Duplicate checking completely removed to avoid any /api/meetings requests

  // When editing a meeting, store the combined data of the existing meeting and temporary form data
  const effectiveMeeting = isNew
    ? Object.keys(tempFormData).length > 0
      ? ({ ...tempFormData } as unknown as Meeting)
      : undefined
    : Object.keys(tempFormData).length > 0
      ? ({ ...meeting, ...tempFormData } as unknown as Meeting)
      : meeting;

  // Query for research data associated with this meeting for the Guide tab
  const { data: research, isLoading: isResearchLoading } = useQuery<Research>({
    queryKey: ["/api/researches", effectiveMeeting?.researchId],
    queryFn: async () => {
      if (!effectiveMeeting?.researchId) return undefined;
      const res = await apiRequest(
        "GET",
        `/api/researches/${effectiveMeeting.researchId}`,
      );
      if (!res.ok) throw new Error("Research not found");
      return res.json();
    },
    enabled: !!effectiveMeeting?.researchId,
  });

  // Effect to load specific research when preselected via query param
  useEffect(() => {
    if (isNew && preselectedResearchId) {
      // Load the specific research if preselected via URL
      fetch(`/api/researches/${preselectedResearchId}`)
        .then((res) => res.json())
        .then((research) => {
          if (research) {
            setPreselectedResearch(research);
          }
        })
        .catch((err) =>
          console.warn("Could not load preselected research:", err),
        );
    }
  }, [isNew, preselectedResearchId]);

  const createMutation = useMutation({
    mutationFn: async (meetingData: InsertMeeting) => {
      const res = await apiRequest("POST", "/api/meetings", meetingData);
      return res.json();
    },
    onSuccess: async (data) => {
      // Invalidate the meetings list to show the new meeting
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      // Also invalidate the specific meeting
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", data.id] });
      // Invalidate calendar views to update them as well
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/meetings"] });

      // If there are selected JTBDs, link them to the newly created meeting
      if (selectedJtbdsForNewMeeting.length > 0) {
        try {
          for (const jtbd of selectedJtbdsForNewMeeting) {
            await apiRequest(
              "POST",
              `/api/meetings/${data.id}/jtbds/${jtbd.id}`,
              {},
            );
          }
          toast({ title: "Meeting created successfully with linked JTBDs" });
        } catch (error) {
          console.error("Error linking JTBDs to meeting:", error);
          toast({
            title:
              "Meeting created successfully, but some JTBDs couldn't be linked",
          });
        }
      } else {
        toast({ title: "Meeting created successfully" });
      }

      // Default behavior - go to the newly created meeting detail page
      setLocation(`/meetings/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MeetingWithId) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the meetings list and specific meeting
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", id] });
      // Invalidate calendar views to update them as well
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/meetings"] });
      toast({ title: "Meeting updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      // Invalidate meetings list to remove deleted meeting
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      // Invalidate calendar views to update them as well
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/meetings"] });
      toast({ title: "Meeting deleted successfully" });
      setLocation("/"); // Return to meetings list
    },
    onError: (error) => {
      toast({
        title: "Error deleting meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (formData: InsertMeeting) => {
    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...formData, id } as MeetingWithId;
      updateMutation.mutate(updateData);
    } else {
      // No duplicate checking - just create the meeting
      createMutation.mutate(formData);
    }
  };

  const handleConfirmCreate = () => {
    if (pendingFormData) {
      createMutation.mutate(pendingFormData);
      setShowDuplicateDialog(false);
      setPendingFormData(null);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    // Navigate back to source if available, otherwise go to meetings
    if (fromContext === "research" && preselectedResearchId) {
      // If creating from research page, go back to research page
      setLocation(`/researches/${preselectedResearchId}`);
    } else if (sourceType === "research" && sourceId) {
      // If editing existing meeting from research context
      setLocation(`/researches/${sourceId}`);
    } else {
      setLocation("/");
    }
  };

  const isLoading = isMeetingLoading;
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header with breadcrumb-style navigation */}
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <Button
            variant="ghost"
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-gray-300">/</span>
          <span
            className="hover:text-gray-800 cursor-pointer"
            onClick={handleCancel}
          >
            {fromContext === "research" && preselectedResearch
              ? preselectedResearch.name
              : sourceType === "research"
                ? meeting?.researchName || "Исследования"
                : "Встречи"}
          </span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">
            {isNew ? "Новая встреча" : meeting?.companyName || "Детали встречи"}
          </span>
        </div>

        {/* Main content container - Notion-style UI */}
        <div className="bg-white overflow-hidden">
          {/* Document title - Notion style with Company Name (CNUM or GCC): Respondent Name format */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 outline-none focus:ring-0 empty:before:content-['Untitled'] empty:before:text-gray-400 w-full">
              {isNew
                ? "Создать новую встречу"
                : `${meeting?.companyName || ""} (${meeting?.cnum || meeting?.gcc || ""}): ${meeting?.respondentName || ""}`}
            </h1>
            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 my-2">
              {/* Status badge with Notion-like styling */}
              <div className="flex items-center gap-1">
                <span
                  className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                  title={isNew ? MeetingStatus.IN_PROGRESS : meeting?.status}
                >
                  {isNew ? MeetingStatus.IN_PROGRESS : meeting?.status}
                </span>
              </div>

              {/* Meeting date with Notion-like tag styling */}
              {!isNew && meeting?.date && (
                <div
                  className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-800 font-medium whitespace-nowrap"
                  title={formatDateShort(meeting.date)}
                >
                  {formatDateShort(meeting.date)}
                </div>
              )}

              {/* Display research name if available - clickable to go to research page */}
              {!isNew && meeting?.researchId && (
                <div
                  className="px-2.5 py-0.5 rounded-md text-xs bg-purple-100 text-purple-800 font-medium cursor-pointer hover:bg-purple-200 transition-colors duration-200 flex items-center gap-1 whitespace-nowrap overflow-hidden max-w-[150px]"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    setLocation(`/researches/${meeting.researchId}`);
                  }}
                  title={`${meeting.researchName || "Research"} - Click to view research details`}
                >
                  <span className="truncate">
                    {meeting.researchName || "Research"}
                  </span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </div>
              )}

              {/* Position information */}
              {!isNew && meeting?.respondentPosition && (
                <div
                  className="px-2.5 py-0.5 rounded-md text-xs bg-amber-100 text-amber-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                  title={meeting.respondentPosition}
                >
                  {meeting.respondentPosition}
                </div>
              )}
            </div>
          </div>

          {/* Tabbed interface - Notion-style */}
          <div className="px-8 py-6">
            {isNew ? (
              // For new meetings, show the full meeting form without tabs
              // Show loading state if we're waiting for preselected research data
              preselectedResearchId && !preselectedResearch ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading research data...</span>
                </div>
              ) : (
                <MeetingForm
                  onSubmit={handleSubmit}
                  initialData={
                    preselectedResearchId && preselectedResearch
                      ? ({
                          id: 0, // New meeting
                          researchId: preselectedResearchId,
                          date: new Date(),
                          // Default values for required fields
                          respondentName: "",
                          respondentPosition: "",
                          cnum: "",
                          gcc: null,
                          companyName: null,
                          email: "",
                          researcher: preselectedResearch.researcher || "", // Set the researcher from the selected research
                          relationshipManager: "",
                          salesPerson: "",
                          status: MeetingStatus.IN_PROGRESS,
                          notes: null,
                        } as Meeting)
                      : undefined
                  }
                  isLoading={isPending}
                  isCreating={true}
                  onCancel={handleCancel}
                  onCnumChange={() => {}} // No duplicate checking
                  meetings={[]} // No meetings data needed
                  onTempDataUpdate={handleTempDataUpdate}
                  selectedJtbds={selectedJtbdsForNewMeeting}
                  onJtbdsChange={setSelectedJtbdsForNewMeeting}
                  preselectedResearch={preselectedResearch}
                />
              )
            ) : (
              // For existing meetings, show tabbed interface
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-50 p-1 rounded-lg">
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    Информация
                  </TabsTrigger>
                  <TabsTrigger
                    value="guide"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    Guide
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    Результаты
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-0">
                  <MeetingInfoForm
                    meeting={effectiveMeeting}
                    onUpdate={handleSubmit}
                    isLoading={isPending}
                    onTempDataUpdate={handleTempDataUpdate}
                    onDelete={!isNew ? handleDelete : undefined}
                  />
                </TabsContent>

                <TabsContent value="guide" className="mt-0">
                  {isResearchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading guide content...</span>
                    </div>
                  ) : (
                    <MeetingGuideTab research={research} />
                  )}
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <MeetingResultsForm
                    meeting={effectiveMeeting}
                    onUpdate={handleSubmit}
                    isLoading={isPending}
                    onTempDataUpdate={handleTempDataUpdate}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">
                Delete Meeting
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this meeting? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="bg-white border border-gray-200 hover:bg-gray-50">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Duplicate CNUM Dialog */}
        <Dialog
          open={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
        >
          <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border-0 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-amber-600">
                {pendingFormData
                  ? "Duplicate CNUM Detected"
                  : "Duplicate CNUM Warning"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                The following meeting(s) already exist with this CNUM:
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[300px] overflow-auto my-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Research</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateMeetings.map((meeting) => {
                    const research = {
                      name: meeting.researchName || "Unknown Research",
                    };
                    return (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          {new Date(meeting.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{meeting.respondentName}</TableCell>
                        <TableCell>{research.name}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-7"
                            onClick={() => {
                              window.open(`/meetings/${meeting.id}`, "_blank");
                            }}
                            title="Open meeting in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDuplicateDialog(false)}
                className="bg-white border border-gray-200 hover:bg-gray-50"
              >
                Отмена
              </Button>
              {pendingFormData && (
                <Button
                  onClick={handleConfirmCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Создать в любом случае
                </Button>
              )}
              {!pendingFormData && (
                <Button
                  onClick={() => setShowDuplicateDialog(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Acknowledge
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
