import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  Research,
  ResearchStatus,
  InsertResearch,
  ResearchStatusType,
  Meeting,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Plus as PlusIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ResearchForm from "@/components/research-form";
import ReactMarkdown from "react-markdown";
import { ResearchBriefForm } from "@/components/research-brief-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResearchSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Plus, X, ChevronDown, ChevronUp, ChevronRight, Trash2, Edit, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResearchSelector } from "@/components/research-selector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/file-upload";

// Helper type for handling Research with ID
type ResearchWithId = Research;

// Types for 4-level Guide structure
interface Question {
  id: string;
  text: string;
  comment: string;
  order: number;
}

interface SubSubBlock {
  id: string;
  name: string;
  questions: Question[];
  order: number;
}

interface SubBlock {
  id: string;
  name: string;
  questions: Question[];
  subSubblocks: SubSubBlock[];
  order: number;
}

interface QuestionBlock {
  id: string;
  name: string;
  questions: Question[];
  subblocks: SubBlock[];
  order: number;
}

// Component for Recruitment tab
function ResearchRecruitmentForm({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: {
    clientsWeSearchFor: string;
    inviteTemplate: string;
  }) => void;
}) {
  const form = useForm<{ clientsWeSearchFor: string; inviteTemplate: string }>({
    defaultValues: {
      clientsWeSearchFor: research?.clientsWeSearchFor || "",
      inviteTemplate: research?.inviteTemplate || "",
    },
  });

  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      clientsWeSearchFor: research?.clientsWeSearchFor || "",
      inviteTemplate: research?.inviteTemplate || "",
    });
  }, [research, form]);

  const handleSubmit = (data: {
    clientsWeSearchFor: string;
    inviteTemplate: string;
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
        resultFormat:
          (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        customerSegmentDescription:
          research.customerSegmentDescription || undefined,
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
        guide: research.guide || undefined,
        guideIntroText: research.guideIntroText,
        guideMainQuestions: research.guideMainQuestions,
        fullText: research.fullText || undefined,
        clientsWeSearchFor: data.clientsWeSearchFor,
        inviteTemplate: data.inviteTemplate,
      });
    }
  };

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clientsWeSearchFor"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                Clients we search for
              </FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("clientsWeSearchFor", newValue);
                  }}
                  preview="live"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Describe who we're searching for...",
                    style: { resize: 'none' }
                  }}
                  previewOptions={{
                    remarkPlugins: [remarkGfm],
                    disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                    unwrapDisallowed: true,
                    className: "prose prose-sm max-w-none p-4"
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inviteTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                Invite template
              </FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("inviteTemplate", newValue);
                  }}
                  preview="live"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter invitation template...",
                    style: { resize: 'none' }
                  }}
                  previewOptions={{
                    remarkPlugins: [remarkGfm],
                    disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                    unwrapDisallowed: true,
                    className: "prose prose-sm max-w-none p-4"
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Recruitment
        </Button>
      </form>
    </Form>
  );
}

// Component for Guide tab
function ResearchGuideForm({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: { guide: string }) => void;
}) {
  const { t } = useTranslation();

  const parseQuestionBlocks = (data: string | null): QuestionBlock[] => {
    if (!data || typeof data !== 'string') return [];
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((item: any, blockIndex: number) => {
        // Ensure order fields exist for backward compatibility
        const questions = (item.questions || []).map((q: any, qIndex: number) => ({
          id: q.id || Math.random().toString(),
          text: q.text || '',
          comment: q.comment || '',
          order: q.order !== undefined ? q.order : qIndex,
        }));
        
        const subblocks = (item.subblocks || []).map((s: any, sIndex: number) => ({
          id: s.id || Math.random().toString(),
          name: s.name || '',
          questions: (s.questions || []).map((sq: any, sqIndex: number) => ({
            id: sq.id || Math.random().toString(),
            text: sq.text || '',
            comment: sq.comment || '',
            order: sq.order !== undefined ? sq.order : sqIndex,
          })),
          subSubblocks: (s.subSubblocks || []).map((ss: any, ssIndex: number) => ({
            id: ss.id || Math.random().toString(),
            name: ss.name || '',
            questions: (ss.questions || []).map((ssq: any, ssqIndex: number) => ({
              id: ssq.id || Math.random().toString(),
              text: ssq.text || '',
              comment: ssq.comment || '',
              order: ssq.order !== undefined ? ssq.order : ssqIndex,
            })),
            order: ss.order !== undefined ? ss.order : (s.questions || []).length + ssIndex,
          })),
          order: s.order !== undefined ? s.order : questions.length + sIndex,
        }));
        
        return {
          id: item.id || Math.random().toString(),
          name: item.name || '',
          questions,
          subblocks,
          order: item.order !== undefined ? item.order : blockIndex,
        };
      });
    } catch {
      return [];
    }
  };

  const form = useForm<{
    guide: string;
    guideIntroText: string;
    guideMainQuestions: QuestionBlock[];
  }>({
    defaultValues: {
      guide: research?.guide || "",
      guideIntroText: research?.guideIntroText || "",
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
    },
  });
  
  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      guide: research?.guide || "",
      guideIntroText: research?.guideIntroText || "",
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
    });
  }, [research, form]);

  const handleSubmit = (data: {
    guide: string;
    guideIntroText: string;
    guideMainQuestions: QuestionBlock[];
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
        resultFormat:
          (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        customerSegmentDescription:
          research.customerSegmentDescription || undefined,
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
        guide: data.guide,
        guideIntroText: data.guideIntroText,
        guideMainQuestions: (() => {
          try {
            const cleanBlocks = (data.guideMainQuestions || []).map((block) => ({
              id: block.id || Math.random().toString(),
              name: block.name || "",
              questions: (block.questions || []).map(q => ({
                id: q.id || Math.random().toString(),
                text: q.text || "",
                comment: q.comment || "",
                order: q.order || 0,
              })),
              subblocks: (block.subblocks || []).map(s => ({
                id: s.id || Math.random().toString(),
                name: s.name || "",
                questions: (s.questions || []).map(q => ({
                  id: q.id || Math.random().toString(),
                  text: q.text || "",
                  comment: q.comment || "",
                  order: q.order || 0,
                })),
                order: s.order || 0,
              })),
              order: block.order || 0,
            }));
            return JSON.stringify(cleanBlocks);
          } catch (error) {
            console.error("Error stringifying guide main questions:", error, data.guideMainQuestions);
            return JSON.stringify([]);
          }
        })(),
        fullText: research.fullText || undefined,
        clientsWeSearchFor: research.clientsWeSearchFor || undefined,
        inviteTemplate: research.inviteTemplate || undefined,
      });
    }
  };

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Original Guide Field */}
        <FormField
          control={form.control}
          name="guide"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">Guide</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("guide", newValue);
                  }}
                  preview="live"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter research guide...",
                    style: { resize: 'none' }
                  }}
                  previewOptions={{
                    remarkPlugins: [remarkGfm],
                    disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                    unwrapDisallowed: true,
                    className: "prose prose-sm max-w-none p-4"
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Вступительное слово */}
        <FormField
          control={form.control}
          name="guideIntroText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {t("research.guideIntroText")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("research.guideIntroTextPlaceholder")}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("guideIntroText", e.target.value);
                  }}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Guide
        </Button>
      </form>
    </Form>
  );
}

// Component for Results tab
function ResearchResultsForm({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: { artifactLink: string; fullText: string }) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<{ artifactLink: string; fullText: string }>({
    defaultValues: {
      artifactLink: research?.artifactLink || "",
      fullText: research?.fullText || "",
    },
  });

  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      artifactLink: research?.artifactLink || "",
      fullText: research?.fullText || "",
    });
  }, [research, form]);

  const handleSubmit = (data: { artifactLink: string; fullText: string }) => {
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
        resultFormat:
          (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        customerSegmentDescription:
          research.customerSegmentDescription || undefined,
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
        brief: research.brief || undefined,
        guide: research.guide || undefined,
        guideIntroText: research.guideIntroText,
        guideMainQuestions: research.guideMainQuestions,
        clientsWeSearchFor: research.clientsWeSearchFor || undefined,
        inviteTemplate: research.inviteTemplate || undefined,
        artifactLink: data.artifactLink,
        fullText: data.fullText,
      });
    }
  };

  const handleTranscriptionComplete = (transcribedText: string) => {
    const currentFullText = form.getValues("fullText");
    const newFullText = currentFullText 
      ? `${currentFullText}\n\n## Transcription\n\n${transcribedText}`
      : transcribedText;
    
    form.setValue("fullText", newFullText);
    handleFieldChange("fullText", newFullText);
    
    // Auto-save after transcription
    if (research) {
      handleSubmit({ ...form.getValues(), fullText: newFullText });
    }
  };

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="artifactLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                Artifact Link
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("artifactLink", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload for Transcription */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Audio/Video Transcription</h3>
          <FileUpload
            onTranscriptionComplete={handleTranscriptionComplete}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="fullText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                Full Text Results
              </FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("fullText", newValue);
                  }}
                  preview="live"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter full text content...",
                    style: { resize: 'none' }
                  }}
                  previewOptions={{
                    remarkPlugins: [remarkGfm],
                    disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                    unwrapDisallowed: true,
                    className: "prose prose-sm max-w-none p-4"
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Results
        </Button>
      </form>
    </Form>
  );
}

function ResearchDetail() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  // State to manage form data across tabs during creation AND editing
  const [tempFormData, setTempFormData] = useState<Partial<InsertResearch>>({});

  // Handler to update temporary form data
  const handleTempDataUpdate = (newData: Partial<InsertResearch>) => {
    setTempFormData((prev) => ({ ...prev, ...newData }));
  };

  // Clear temporary data when navigating to a different research
  useEffect(() => {
    setTempFormData({});
  }, [id]);
  
  // Remove the inefficient query that loads all researches
  // Related researches will now use a searchable component instead

  const { data: research, isLoading: isResearchLoading } = useQuery<Research>({
    queryKey: ["/api/researches", id],
    queryFn: async () => {
      if (isNew) return undefined;
      try {
        const res = await apiRequest("GET", `/api/researches/${id}`);
        if (!res.ok) {
          throw new Error("Research not found");
        }
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching research:", error);
        throw error;
      }
    },
    enabled: !isNew && !!id,
  });

  // Combine existing research data with temporary changes from form data
  const effectiveResearch = useMemo(() => {
    if (isNew) {
      return { ...tempFormData } as unknown as Research;
    } else if (research) {
      // Handle special parsing for relatedResearches field
      const parsedTempData = { ...tempFormData };
      if (parsedTempData.relatedResearches && typeof parsedTempData.relatedResearches === 'string') {
        try {
          parsedTempData.relatedResearches = JSON.parse(parsedTempData.relatedResearches);
        } catch (error) {
          console.error("Error parsing relatedResearches from temp data:", error);
          parsedTempData.relatedResearches = [];
        }
      }
      return { ...research, ...parsedTempData } as Research;
    }
    return research;
  }, [isNew, research, tempFormData]);

  // Removed duplicate check query - no longer needed

  // Fetch meetings by research ID using a specific API endpoint
  const { data: researchMeetings = [], isLoading: isMeetingsLoading } = useQuery<
    Meeting[]
  >({
    queryKey: ["/api/meetings", "by-research", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await apiRequest("GET", `/api/meetings?researchId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const result = await res.json();
      // Handle both paginated response {data: Meeting[]} and direct Meeting[] array
      return Array.isArray(result) ? result : (result.data || []);
    },
    enabled: !isNew && !!id, // Only load meetings when viewing an existing research
  });

  const createMutation = useMutation({
    mutationFn: async (researchData: InsertResearch) => {
      const res = await apiRequest("POST", "/api/researches", researchData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research created successfully" });
      // Redirect to the newly created research detail page
      setLocation(`/researches/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating research",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ResearchWithId) => {
      const { id, ...updateData } = data;
      const res = await apiRequest(
        "PATCH",
        `/api/researches/${id}`,
        updateData,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/researches", id] });
      toast({ title: "Research updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating research",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const res = await apiRequest("DELETE", `/api/researches/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete research");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research deleted successfully" });
      setLocation("/researches"); // Return to researches list
    },
    onError: (error: Error) => {
      // Check if the error is due to associated meetings
      if (error.message?.includes("associated meetings")) {
        setErrorMessage(
          "This research cannot be deleted because it has associated meetings. Please delete all related meetings first.",
        );
      } else {
        setErrorMessage(
          error.message || "An error occurred while deleting the research.",
        );
      }
      setErrorDialogOpen(true);
    },
  });

  // Unified save function that combines all tab data
  const handleUnifiedSave = (overviewFormData: InsertResearch) => {
    // Merge overview form data with temporary data from all tabs
    const parsedTempData = { ...tempFormData };
    
    // Parse relatedResearches if it's a JSON string
    if (parsedTempData.relatedResearches && typeof parsedTempData.relatedResearches === 'string') {
      try {
        parsedTempData.relatedResearches = JSON.parse(parsedTempData.relatedResearches);
      } catch (error) {
        console.error("Error parsing relatedResearches for save:", error);
        parsedTempData.relatedResearches = [];
      }
    }
    
    const completeFormData: InsertResearch = {
      ...overviewFormData,
      ...parsedTempData, // This contains data from Brief, Guide, Recruitment, Results tabs
    };

    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...completeFormData, id } as unknown as ResearchWithId;
      updateMutation.mutate(updateData);
    } else {
      // Create new research directly without duplicate check
      createMutation.mutate(completeFormData);
    }
  };

  const handleSubmit = handleUnifiedSave;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    setLocation("/researches");
  };

  const isLoading = isResearchLoading || isMeetingsLoading;
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
            onClick={() => setLocation("/researches")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="mx-2 text-gray-300">/</span>
          <span
            className="hover:text-gray-800 cursor-pointer"
            onClick={() => setLocation("/researches")}
          >
            Researches
          </span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">
            {isNew ? "New Research" : research?.name || "Research Details"}
          </span>
        </div>

        {/* Main content container - Notion-style UI */}
        <div className="bg-white overflow-hidden">
          {/* Document title - Notion style */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 outline-none focus:ring-0 empty:before:content-['Untitled'] empty:before:text-gray-400 w-full">
              {isNew ? "Create New Research" : research?.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 my-2">
              {!isNew && research && (
                <>
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium
                      ${
                        research.status === ResearchStatus.DONE
                          ? "bg-green-100 text-green-800"
                          : research.status === ResearchStatus.IN_PROGRESS
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {research.status}
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-800 font-medium">
                    {research.team}
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: research.color }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(research?.dateStart).toLocaleDateString()} -{" "}
                    {new Date(research?.dateEnd).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main content area with tabs */}
          <div className="px-8 py-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">
                  {t("research.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger value="brief">
                  {t("research.tabs.brief")}
                </TabsTrigger>
                <TabsTrigger value="guide">
                  {t("research.tabs.guide")}
                </TabsTrigger>
                <TabsTrigger value="recruitment">
                  {t("research.tabs.recruitment")}
                </TabsTrigger>
                <TabsTrigger value="results">
                  {t("research.tabs.results")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <ResearchForm
                  onSubmit={handleSubmit}
                  initialData={effectiveResearch || undefined}
                  isLoading={isPending}
                  onCancel={handleCancel}
                  onDelete={!isNew ? handleDelete : undefined}
                  onTempDataUpdate={handleTempDataUpdate}
                />
              </TabsContent>

              <TabsContent value="brief" className="mt-6">
                <ResearchBriefForm
                  research={effectiveResearch}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                  onTempDataUpdate={handleTempDataUpdate}
                />
              </TabsContent>

              <TabsContent value="guide" className="mt-6">
                <ResearchGuideForm
                  research={effectiveResearch}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                  onTempDataUpdate={handleTempDataUpdate}
                />
              </TabsContent>

              <TabsContent value="recruitment" className="mt-6">
                <ResearchRecruitmentForm
                  research={effectiveResearch}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                  onTempDataUpdate={handleTempDataUpdate}
                />
              </TabsContent>

              <TabsContent value="results" className="mt-6">
                <ResearchResultsForm
                  research={effectiveResearch}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                  onTempDataUpdate={handleTempDataUpdate}
                />
              </TabsContent>
            </Tabs>

            {/* Connected Meetings Section */}
            {!isNew && id && (
              <div className="mt-10">
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">
                      Connected Meetings
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setLocation(`/meetings/new?researchId=${id}`)
                      }
                      className="flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" /> Create Meeting
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {researchMeetings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No meetings are connected to this research yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
                              <TableHead className="w-[15%]">Status</TableHead>
                              <TableHead className="w-[15%]">
                                Company Name
                              </TableHead>
                              <TableHead className="w-[15%]">
                                Respondent Name
                              </TableHead>
                              <TableHead className="w-[15%]">
                                Position
                              </TableHead>
                              <TableHead className="w-[15%]">Date</TableHead>
                              <TableHead className="w-[15%]">
                                Recruiter
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {researchMeetings.map((meeting) => (
                              <TableRow
                                key={meeting.id}
                                className="hover:bg-gray-50/80 transition-all duration-200 cursor-pointer"
                                onClick={() =>
                                  setLocation(`/meetings/${meeting.id}`)
                                }
                              >
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
                                    ${
                                      meeting.status === "Done"
                                        ? "bg-green-100 text-green-800"
                                        : meeting.status === "In Progress"
                                          ? "bg-blue-100 text-blue-800"
                                          : meeting.status === "Meeting Set"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                    title={meeting.status}
                                  >
                                    {meeting.status}
                                  </span>
                                </TableCell>
                                <TableCell
                                  className="font-medium truncate max-w-[150px]"
                                  title={meeting.companyName || ""}
                                >
                                  {meeting.companyName || "—"}
                                </TableCell>
                                <TableCell
                                  className="truncate max-w-[150px]"
                                  title={meeting.respondentName}
                                >
                                  {meeting.respondentName}
                                </TableCell>
                                <TableCell
                                  className="truncate max-w-[150px]"
                                  title={meeting.respondentPosition}
                                >
                                  {meeting.respondentPosition}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {new Date(meeting.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell
                                  className="truncate max-w-[150px]"
                                  title={meeting.salesPerson}
                                >
                                  {meeting.salesPerson}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                Delete Research
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this research? This action
                cannot be undone. If this research has associated meetings, they
                must be deleted first.
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

        <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">
                Error
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                {errorMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-primary hover:bg-primary/90 text-white border-0">
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default ResearchDetail;