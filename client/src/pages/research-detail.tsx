import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Research, ResearchStatus, InsertResearch, ResearchStatusType, Meeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, ExternalLink, Plus as PlusIcon } from "lucide-react";
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

import ReactMarkdown from 'react-markdown';
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
import MDEditor from '@uiw/react-md-editor';
import { useTranslation } from 'react-i18next';
import { useFieldArray } from "react-hook-form";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

// Helper type for handling Research with ID
type ResearchWithId = Research;

// Component for Brief tab
function ResearchBriefForm({ research, onUpdate, isLoading }: { research?: Research; onUpdate: (data: InsertResearch) => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useForm<{ 
    customerFullName: string; 
    additionalStakeholders: { value: string }[]; 
    resultFormat: string; 
    projectBackground: string;
    problemToSolve: string;
    resultsUsage: string;
    productMetrics: string;
    limitations: string;
    researchGoals: string;
    researchHypotheses: string;
    keyQuestions: string;
    brief: string;
  }>({
    defaultValues: {
      customerFullName: research?.customerFullName || "",
      additionalStakeholders: research?.additionalStakeholders?.map(s => ({ value: s })) || [],
      resultFormat: research?.resultFormat || "Презентация",
      projectBackground: research?.projectBackground || "",
      problemToSolve: research?.problemToSolve || "",
      resultsUsage: research?.resultsUsage || "",
      productMetrics: research?.productMetrics || "",
      limitations: research?.limitations || "",
      researchGoals: research?.researchGoals || "",
      researchHypotheses: research?.researchHypotheses || "",
      keyQuestions: research?.keyQuestions || "",
      brief: research?.brief || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalStakeholders"
  });

  const [isProjectBackgroundOpen, setIsProjectBackgroundOpen] = useState(true);
  const [isGoalsHypothesesOpen, setIsGoalsHypothesesOpen] = useState(true);

  const handleSubmit = (data: { 
    customerFullName: string; 
    additionalStakeholders: { value: string }[]; 
    resultFormat: string; 
    projectBackground: string;
    problemToSolve: string;
    resultsUsage: string;
    productMetrics: string;
    limitations: string;
    researchGoals: string;
    researchHypotheses: string;
    keyQuestions: string;
    brief: string;
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
        customerFullName: data.customerFullName,
        additionalStakeholders: data.additionalStakeholders.map(s => s.value).filter(s => s.trim() !== ""),
        resultFormat: data.resultFormat as any,
        projectBackground: data.projectBackground,
        problemToSolve: data.problemToSolve,
        resultsUsage: data.resultsUsage,
        productMetrics: data.productMetrics,
        limitations: data.limitations,
        researchGoals: data.researchGoals,
        researchHypotheses: data.researchHypotheses,
        keyQuestions: data.keyQuestions,
        brief: data.brief,
        guide: research.guide || undefined,
        fullText: research.fullText || undefined,
        clientsWeSearchFor: research.clientsWeSearchFor || undefined,
        inviteTemplate: research.inviteTemplate || undefined,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerFullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">{t('research.customerFullName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ivanov Ivan Ivanovich"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Additional Stakeholders Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-lg font-medium">{t('research.additionalStakeholders')}</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('research.addStakeholder')}
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`additionalStakeholders.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Petrov Petr Petrovich - Manager"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {fields.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              {t('research.addStakeholder')} {t('research.additionalStakeholders').toLowerCase()}
            </p>
          )}
        </div>
        
        {/* Result Format Field */}
        <FormField
          control={form.control}
          name="resultFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('research.resultFormat')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('research.resultFormat')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Презентация">
                    {t('research.resultFormatOptions.presentation')}
                  </SelectItem>
                  <SelectItem value="Figma">
                    {t('research.resultFormatOptions.figma')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Project Background Collapsible Section */}
        <div className="border rounded-lg p-4 bg-gray-50/50">
          <Collapsible open={isProjectBackgroundOpen} onOpenChange={setIsProjectBackgroundOpen}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('research.projectBackground')}</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isProjectBackgroundOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
            <FormField
              control={form.control}
              name="projectBackground"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.projectBackgroundDescription')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="problemToSolve"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.problemToSolve')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resultsUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.resultsUsage')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productMetrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.productMetrics')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="limitations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.limitations')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Goals / Hypotheses / Questions Collapsible Section */}
        <div className="border rounded-lg p-4 bg-gray-50/50">
          <Collapsible open={isGoalsHypothesesOpen} onOpenChange={setIsGoalsHypothesesOpen}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('research.goalsHypothesesQuestions')}</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isGoalsHypothesesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
            <FormField
              control={form.control}
              name="researchGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.researchGoals')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="researchHypotheses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.researchHypotheses')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t('research.researchHypothesesPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="keyQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('research.keyQuestions')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder={t('research.keyQuestionsPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <FormField
          control={form.control}
          name="brief"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">{t('researches.brief')}</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('research.saveBrief')}
        </Button>
      </form>
    </Form>
  );
}

// Component for Recruitment tab
function ResearchRecruitmentForm({ research, onUpdate, isLoading }: { research?: Research; onUpdate: (data: InsertResearch) => void; isLoading: boolean }) {
  const form = useForm<{ clientsWeSearchFor: string; inviteTemplate: string }>({
    defaultValues: {
      clientsWeSearchFor: research?.clientsWeSearchFor || "",
      inviteTemplate: research?.inviteTemplate || "",
    },
  });

  const handleSubmit = (data: { clientsWeSearchFor: string; inviteTemplate: string }) => {
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
        customerFullName: research.customerFullName || undefined,
        additionalStakeholders: research.additionalStakeholders || undefined,
        resultFormat: (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        projectBackground: research.projectBackground || undefined,
        problemToSolve: research.problemToSolve || undefined,
        resultsUsage: research.resultsUsage || undefined,
        productMetrics: research.productMetrics || undefined,
        limitations: research.limitations || undefined,
        researchGoals: research.researchGoals || undefined,
        researchHypotheses: research.researchHypotheses || undefined,
        keyQuestions: research.keyQuestions || undefined,
        brief: research.brief || undefined,
        guide: research.guide || undefined,
        fullText: research.fullText || undefined,
        clientsWeSearchFor: data.clientsWeSearchFor,
        inviteTemplate: data.inviteTemplate,
      });
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
              <FormLabel className="text-lg font-medium">Clients we search for</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
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
              <FormLabel className="text-lg font-medium">Invite template</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
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
function ResearchGuideForm({ research, onUpdate, isLoading }: { research?: Research; onUpdate: (data: InsertResearch) => void; isLoading: boolean }) {
  const form = useForm<{ guide: string }>({
    defaultValues: {
      guide: research?.guide || "",
    },
  });

  const handleSubmit = (data: { guide: string }) => {
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
        customerFullName: research.customerFullName || undefined,
        additionalStakeholders: research.additionalStakeholders || undefined,
        resultFormat: (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        projectBackground: research.projectBackground || undefined,
        problemToSolve: research.problemToSolve || undefined,
        resultsUsage: research.resultsUsage || undefined,
        productMetrics: research.productMetrics || undefined,
        limitations: research.limitations || undefined,
        researchGoals: research.researchGoals || undefined,
        researchHypotheses: research.researchHypotheses || undefined,
        keyQuestions: research.keyQuestions || undefined,
        brief: research.brief || undefined,
        guide: data.guide,
        fullText: research.fullText || undefined,
        clientsWeSearchFor: research.clientsWeSearchFor || undefined,
        inviteTemplate: research.inviteTemplate || undefined,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="guide"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">Guide</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
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
function ResearchResultsForm({ research, onUpdate, isLoading }: { research?: Research; onUpdate: (data: InsertResearch) => void; isLoading: boolean }) {
  const form = useForm<{ fullText: string }>({
    defaultValues: {
      fullText: research?.fullText || "",
    },
  });

  const handleSubmit = (data: { fullText: string }) => {
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
        customerFullName: research.customerFullName || undefined,
        additionalStakeholders: research.additionalStakeholders || undefined,
        resultFormat: (research.resultFormat as "Презентация" | "Figma") || "Презентация",
        projectBackground: research.projectBackground || undefined,
        problemToSolve: research.problemToSolve || undefined,
        resultsUsage: research.resultsUsage || undefined,
        productMetrics: research.productMetrics || undefined,
        limitations: research.limitations || undefined,
        researchGoals: research.researchGoals || undefined,
        researchHypotheses: research.researchHypotheses || undefined,
        keyQuestions: research.keyQuestions || undefined,
        brief: research.brief || undefined,
        guide: research.guide || undefined,
        fullText: data.fullText,
        clientsWeSearchFor: research.clientsWeSearchFor || undefined,
        inviteTemplate: research.inviteTemplate || undefined,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">Full Text</FormLabel>
                <FormControl>
                  <MDEditor
                    value={field.value}
                    onChange={(val) => field.onChange(val || "")}
                    preview="edit"
                    hideToolbar={false}
                    data-color-mode="light"
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

  const { data: research, isLoading: isResearchLoading } = useQuery<Research>({
    queryKey: ["/api/researches", id],
    queryFn: async () => {
      if (isNew) return undefined;
      console.log(`Fetching research with ID: ${id}`);
      try {
        // Use regular fetch like meeting-detail.tsx does
        const res = await apiRequest("GET", `/api/researches/${id}`);
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          console.error("Error in response:", await res.text());
          throw new Error("Research not found");
        }
        
        const data = await res.json();
        console.log("Fetched research data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching research:", error);
        throw error;
      }
    },
    enabled: !isNew && !!id,
  });

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
    enabled: isNew, // Only load all researches when creating a new one (for duplicate detection)
  });
  
  // Fetch all meetings to filter the ones related to this research
  const { data: meetings = [], isLoading: isMeetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    enabled: !isNew && !!id, // Only load meetings when viewing an existing research
  });
  
  // Filter meetings related to this research
  const researchMeetings = meetings.filter(meeting => meeting.researchId === id);

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
        variant: "destructive" 
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: ResearchWithId) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/researches/${id}`, updateData);
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
        variant: "destructive" 
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
      setLocation("/researches");  // Return to researches list
    },
    onError: (error: Error) => {
      // Check if the error is due to associated meetings
      if (error.message?.includes("associated meetings")) {
        setErrorMessage("This research cannot be deleted because it has associated meetings. Please delete all related meetings first.");
      } else {
        setErrorMessage(error.message || "An error occurred while deleting the research.");
      }
      setErrorDialogOpen(true);
    },
  });
  
  const handleSubmit = (formData: InsertResearch) => {
    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...formData, id } as ResearchWithId;
      updateMutation.mutate(updateData);
    } else {
      // For create, we check for duplicates first
      const duplicateResearch = researches.find(r => 
        r.name.toLowerCase() === formData.name.toLowerCase() && 
        r.team.toLowerCase() === formData.team.toLowerCase()
      );
      if (duplicateResearch) {
        if (confirm("A research with this name and team already exists. Create anyway?")) {
          createMutation.mutate(formData);
        }
      } else {
        createMutation.mutate(formData);
      }
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
    setLocation("/researches");
  };

  const isLoading = isResearchLoading || isMeetingsLoading;
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
          <span className="hover:text-gray-800 cursor-pointer" onClick={() => setLocation("/researches")}>Researches</span>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium
                      ${research.status === ResearchStatus.DONE ? 'bg-green-100 text-green-800' :
                        research.status === ResearchStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}
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
                    {new Date(research?.dateStart).toLocaleDateString()} - {new Date(research?.dateEnd).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main content area with tabs */}
          <div className="px-8 py-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">{t('research.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="brief">{t('research.tabs.brief')}</TabsTrigger>
                <TabsTrigger value="recruitment">{t('research.tabs.recruitment')}</TabsTrigger>
                <TabsTrigger value="guide">{t('research.tabs.guide')}</TabsTrigger>
                <TabsTrigger value="results">{t('research.tabs.results')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-6">
                <ResearchForm
                  onSubmit={handleSubmit}
                  initialData={research || undefined}
                  isLoading={isPending}
                  onCancel={handleCancel}
                  onDelete={!isNew ? handleDelete : undefined}
                />
              </TabsContent>
              
              <TabsContent value="brief" className="mt-6">
                <ResearchBriefForm
                  research={research}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                />
              </TabsContent>
              
              <TabsContent value="recruitment" className="mt-6">
                <ResearchRecruitmentForm
                  research={research}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                />
              </TabsContent>
              
              <TabsContent value="guide" className="mt-6">
                <ResearchGuideForm
                  research={research}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                />
              </TabsContent>
              
              <TabsContent value="results" className="mt-6">
                <ResearchResultsForm
                  research={research}
                  onUpdate={handleSubmit}
                  isLoading={isPending}
                />
              </TabsContent>
            </Tabs>
            
            {/* Connected Meetings Section */}
            {!isNew && id && (
              <div className="mt-10">
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Connected Meetings</CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setLocation(`/meetings/new?researchId=${id}`)}
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
                              <TableHead className="w-[15%]">Company Name</TableHead>
                              <TableHead className="w-[15%]">Respondent Name</TableHead>
                              <TableHead className="w-[15%]">Position</TableHead>
                              <TableHead className="w-[15%]">Date</TableHead>
                              <TableHead className="w-[15%]">Recruiter</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {researchMeetings.map((meeting) => (
                              <TableRow
                                key={meeting.id}
                                className="hover:bg-gray-50/80 transition-all duration-200 cursor-pointer"
                                onClick={() => setLocation(`/meetings/${meeting.id}`)}
                              >
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
                                    ${meeting.status === 'Done' ? 'bg-green-100 text-green-800' :
                                      meeting.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                      meeting.status === 'Meeting Set' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'}`} title={meeting.status}>
                                    {meeting.status}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium truncate max-w-[150px]" title={meeting.companyName || ''}>
                                  {meeting.companyName || '—'}
                                </TableCell>
                                <TableCell className="truncate max-w-[150px]" title={meeting.respondentName}>
                                  {meeting.respondentName}
                                </TableCell>
                                <TableCell className="truncate max-w-[150px]" title={meeting.respondentPosition}>
                                  {meeting.respondentPosition}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {new Date(meeting.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="truncate max-w-[150px]" title={meeting.salesPerson}>
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

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white rounded-lg border-0 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Delete Research</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this research? This action cannot be undone.
                If this research has associated meetings, they must be deleted first.
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
              <AlertDialogTitle className="text-xl font-semibold">Error</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                {errorMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                className="bg-primary hover:bg-primary/90 text-white border-0"
              >
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