import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  Research,
  ResearchStatus,
  InsertResearch,
  ResearchStatusType,
  Meeting,
  MeetingTableItem,
  PaginatedResponse,
} from "@shared/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { InfiniteScrollTable } from "@/components/infinite-scroll-table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  ExternalLink,
  Plus as PlusIcon,
  Users,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MDEditor from "@uiw/react-md-editor";
import DOMPurify from "dompurify";
import { WysiwygMarkdownEditor } from "@/components/wysiwyg-markdown-editor";
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
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
import { RangeSlider } from "@/components/ui/range-slider";
import { SearchMultiselect } from "@/components/search-multiselect";
import FileUpload from "@/components/file-upload";

// Helper type for handling Research with ID
type ResearchWithId = Research;

// Component for Brief tab
function ResearchDetailBriefForm({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: {
    brief?: string;
    relatedResearches?: string[];
    customerFullName?: string;
    additionalStakeholders?: string[];
    resultFormat?: string;
  }) => void;
}) {
  // Query to fetch research details for related researches to display their names
  const { data: relatedResearchesData = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches", "byIds", research?.relatedResearches],
    queryFn: async () => {
      if (
        !research?.relatedResearches ||
        research.relatedResearches.length === 0
      ) {
        return [];
      }

      // Fetch each research by ID
      const researchPromises = research.relatedResearches.map(async (id) => {
        try {
          const res = await apiRequest("GET", `/api/researches/${id}`);
          if (res.ok) {
            return await res.json();
          }
          return null;
        } catch (error) {
          console.error(`Error fetching research ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(researchPromises);
      return results.filter(Boolean) as Research[];
    },
    enabled: !!(
      research?.relatedResearches && research.relatedResearches.length > 0
    ),
  });
  const form = useForm<{
    customerFullName: string;
    additionalStakeholders: { value: string }[];
    resultFormat: string;
    customerSegmentDescription: string;
    projectBackground: string;
    problemToSolve: string;
    resultsUsage: string;
    productMetrics: string;
    limitations: string;
    researchGoals: string;
    researchHypotheses: string;
    keyQuestions: string;
    previousResources: string;
    additionalMaterials: string;
    relatedResearches: { value: string }[];
    figmaPrototypeLink: string;
    brief: string;
  }>({
    defaultValues: {
      customerFullName: research?.customerFullName || "",
      additionalStakeholders: Array.isArray(research?.additionalStakeholders)
        ? research.additionalStakeholders.map((s) => ({ value: s }))
        : [],
      resultFormat: research?.resultFormat || "Презентация",
      customerSegmentDescription: research?.customerSegmentDescription || "",
      projectBackground: research?.projectBackground || "",
      problemToSolve: research?.problemToSolve || "",
      resultsUsage: research?.resultsUsage || "",
      productMetrics: research?.productMetrics || "",
      limitations: research?.limitations || "",
      researchGoals: research?.researchGoals || "",
      researchHypotheses: research?.researchHypotheses || "",
      keyQuestions: research?.keyQuestions || "",
      previousResources: research?.previousResources || "",
      additionalMaterials: research?.additionalMaterials || "",
      relatedResearches: Array.isArray(research?.relatedResearches)
        ? research.relatedResearches.map((s) => ({ value: s }))
        : [],
      figmaPrototypeLink: research?.figmaPrototypeLink || "",
      brief: research?.brief || "",
    },
  });
  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      customerFullName: research?.customerFullName || "",
      additionalStakeholders: Array.isArray(research?.additionalStakeholders)
        ? research.additionalStakeholders.map((s) => ({ value: s }))
        : [],
      resultFormat: research?.resultFormat || "Презентация",
      customerSegmentDescription: research?.customerSegmentDescription || "",
      projectBackground: research?.projectBackground || "",
      problemToSolve: research?.problemToSolve || "",
      resultsUsage: research?.resultsUsage || "",
      productMetrics: research?.productMetrics || "",
      limitations: research?.limitations || "",
      researchGoals: research?.researchGoals || "",
      researchHypotheses: research?.researchHypotheses || "",
      keyQuestions: research?.keyQuestions || "",
      previousResources: research?.previousResources || "",
      additionalMaterials: research?.additionalMaterials || "",
      relatedResearches: Array.isArray(research?.relatedResearches)
        ? research.relatedResearches.map((s) => ({ value: s }))
        : [],
      figmaPrototypeLink: research?.figmaPrototypeLink || "",
      brief: research?.brief || "",
    });
  }, [research, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalStakeholders",
  });

  const {
    fields: relatedResearchFields,
    append: appendRelatedResearch,
    remove: removeRelatedResearch,
  } = useFieldArray({
    control: form.control,
    name: "relatedResearches",
  });

  const [isProjectBackgroundOpen, setIsProjectBackgroundOpen] = useState(true);
  const [isGoalsHypothesesOpen, setIsGoalsHypothesesOpen] = useState(true);
  const [isAdditionalInformationOpen, setIsAdditionalInformationOpen] =
    useState(true);

  const handleSubmit = (data: {
    customerFullName: string;
    additionalStakeholders: { value: string }[];
    resultFormat: string;
    customerSegmentDescription: string;
    projectBackground: string;
    problemToSolve: string;
    resultsUsage: string;
    productMetrics: string;
    limitations: string;
    researchGoals: string;
    researchHypotheses: string;
    keyQuestions: string;
    previousResources: string;
    additionalMaterials: string;
    relatedResearches: { value: string }[];
    figmaPrototypeLink: string;
    brief: string;
  }) => {
    console.log("Form submission data:", data);
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
        customerFullName: data.customerFullName,
        additionalStakeholders: data.additionalStakeholders
          .map((s) => s.value)
          .filter((s) => s.trim() !== ""),
        resultFormat: data.resultFormat as any,
        customerSegmentDescription: data.customerSegmentDescription,
        projectBackground: data.projectBackground,
        problemToSolve: data.problemToSolve,
        resultsUsage: data.resultsUsage,
        productMetrics: data.productMetrics,
        limitations: data.limitations,
        researchGoals: data.researchGoals,
        researchHypotheses: data.researchHypotheses,
        keyQuestions: data.keyQuestions,
        previousResources: data.previousResources,
        additionalMaterials: data.additionalMaterials,
        relatedResearches: data.relatedResearches
          .map((s) => s.value)
          .filter((s) => s && s.trim() !== ""),
        figmaPrototypeLink: data.figmaPrototypeLink,
        brief: data.brief,
        guide: research.guide || undefined,
        fullText: research.fullText || undefined,
        // Recruitment fields (preserve existing values)
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
          name="customerFullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {"ФИО заказчика"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Иванов Иван Иванович"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("customerFullName", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Stakeholders Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-lg font-medium">
              {"Дополнительные интересанты"}
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {"Добавить интересанта исследования"}
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
                        placeholder="Петров Петр Петрович - Менеджер"
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
              {"Добавить интересанта исследования"}
            </p>
          )}
        </div>

        {/* Result Format Field */}
        <FormField
          control={form.control}
          name="resultFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{"Формат результата"}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleFieldChange("resultFormat", value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={"Формат результата"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Презентация">{"Презентация"}</SelectItem>
                  <SelectItem value="Figma">{"Figma"}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Customer Segment Description Field */}
        <FormField
          control={form.control}
          name="customerSegmentDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{"Описание сегмента клиентов"}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Опишите целевой сегмент клиентов"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange(
                      "customerSegmentDescription",
                      e.target.value,
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Background Collapsible Section */}
        <div className="border rounded-lg p-4 bg-gray-50/50">
          <Collapsible
            open={isProjectBackgroundOpen}
            onOpenChange={setIsProjectBackgroundOpen}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {"Фон проекта"}
              </h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isProjectBackgroundOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
              <FormField
                control={form.control}
                name="projectBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Полное имя заказчика"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange(
                            "projectBackground",
                            e.target.value,
                          );
                        }}
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
                    <FormLabel>{"Дополнительные стейкхолдеры"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("problemToSolve", e.target.value);
                        }}
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
                    <FormLabel>{"Формат результата"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("resultsUsage", e.target.value);
                        }}
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
                    <FormLabel>{"Описание сегмента клиентов"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("productMetrics", e.target.value);
                        }}
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
                    <FormLabel>{"Фон проекта"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("limitations", e.target.value);
                        }}
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
          <Collapsible
            open={isGoalsHypothesesOpen}
            onOpenChange={setIsGoalsHypothesesOpen}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {"Цели, гипотезы и вопросы"}
              </h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isGoalsHypothesesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
              <FormField
                control={form.control}
                name="researchGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Цели исследования"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder=""
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("researchGoals", e.target.value);
                        }}
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
                    <FormLabel>{"Гипотезы исследования"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Введите гипотезы исследования"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange(
                            "researchHypotheses",
                            e.target.value,
                          );
                        }}
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
                    <FormLabel>{"Ключевые вопросы"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder={"Введите ключевые вопросы исследования"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("keyQuestions", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Additional Information Collapsible Section */}
        <div className="border rounded-lg p-4 bg-gray-50/50">
          <Collapsible
            open={isAdditionalInformationOpen}
            onOpenChange={setIsAdditionalInformationOpen}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {"Дополнительная информация"}
              </h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isAdditionalInformationOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
              {/* Related Researches Field */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">
                    {"Связанные исследования"}
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendRelatedResearch({ value: "" })}
                    className="text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {"Добавить исследование"}
                  </Button>
                </div>
                {relatedResearchFields.map((field, index) => {
                  const currentValue = form.watch(
                    `relatedResearches.${index}.value`,
                  );
                  const relatedResearch = relatedResearchesData.find(
                    (r) => r.id.toString() === currentValue,
                  );

                  return (
                    <div key={field.id} className="flex items-center space-x-2">
                      <ResearchSelector
                        value={
                          currentValue ? parseInt(currentValue) : undefined
                        }
                        onValueChange={(value) => {
                          form.setValue(
                            `relatedResearches.${index}.value`,
                            value?.toString() || "",
                          );
                          // Update temp data for related researches
                          const currentValues =
                            form.getValues("relatedResearches");
                          const updatedValues = currentValues.map((item, i) =>
                            i === index
                              ? { ...item, value: value?.toString() || "" }
                              : item,
                          );
                          const cleanValues = updatedValues
                            .map((s) => s.value)
                            .filter((v) => v && v.trim() !== "");
                          onTempDataUpdate?.({
                            relatedResearches: cleanValues,
                          });
                        }}
                        onResearchSelect={() => {}} // Not needed for related researches
                        placeholder={"Выберите связанное исследование"}
                        excludeResearchId={research?.id} // Exclude current research from results
                        displayName={
                          relatedResearch
                            ? `${relatedResearch.name} (${relatedResearch.team})`
                            : undefined
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          removeRelatedResearch(index);
                          // Update temp data for related researches
                          const currentValues =
                            form.getValues("relatedResearches");
                          const filteredValues = currentValues
                            .filter((_, i) => i !== index)
                            .map((item) => item.value)
                            .filter((v) => v && v.trim() !== "");
                          onTempDataUpdate?.({
                            relatedResearches: filteredValues,
                          });
                        }}
                        className="p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <FormField
                control={form.control}
                name="previousResources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Предыдущие ресурсы"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={"Укажите предыдущие ресурсы"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange(
                            "previousResources",
                            e.target.value,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Дополнительные материалы"}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Укажите дополнительные материалы"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange(
                            "additionalMaterials",
                            e.target.value,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Figma Prototype Link Field - Disabled for non-usability testing */}
        <FormField
          control={form.control}
          name="figmaPrototypeLink"
          render={({ field }) => {
            const isUsabilityTesting =
              form.watch("researchType") === "Moderated usability testing" ||
              form.watch("researchType") === "Unmoderated usability testing";
            return (
              <FormItem>
                <FormLabel>{"Ссылка на Figma прототип"}</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder={"Введите ссылку на Figma прототип"}
                    disabled={!isUsabilityTesting}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange("figmaPrototypeLink", e.target.value);
                    }}
                  />
                </FormControl>
                {!isUsabilityTesting && (
                  <p className="text-sm text-gray-500 mt-1">
                    Только на юзабилити тестах
                  </p>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="brief"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                Поле для свободного комментария
              </FormLabel>
              <FormControl>
                <WysiwygMarkdownEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("brief", newValue);
                  }}
                  placeholder="Enter research brief..."
                  height={300}
                  className=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {"Сохранить"}
        </Button>
      </form>
    </Form>
  );
}

// Component for displaying recruitment data in read-only mode
function ResearchRecruitmentView({
  research,
  onEdit,
}: {
  research: Research;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Edit button */}
      <div className="flex justify-end">
        <Button 
          onClick={onEdit}
          variant="outline"
          size="sm"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Редактировать
        </Button>
      </div>

      {/* Content in two columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          {/* Количество респондентов */}
          <div>
            <span className="text-base font-semibold text-black">Количество респондентов:</span>
            <div className="mt-1 text-gray-900">
              {research.recruitmentQuantity || "Не заполнено"}
            </div>
          </div>
          
          {/* Сегменты */}
          <div>
            <span className="text-base font-semibold text-black">Сегменты:</span>
            <div className="mt-1 text-gray-900">
              {(research.recruitmentSegments && research.recruitmentSegments.length > 0) 
                ? research.recruitmentSegments.join(', ') 
                : "Не заполнено"}
            </div>
          </div>
          
          {/* Роли респондентов */}
          <div>
            <span className="text-base font-semibold text-black">Роли респондентов:</span>
            <div className="mt-1 text-gray-900">
              {research.recruitmentRoles || "Не заполнено"}
            </div>
          </div>
          
          {/* Используемые продукты */}
          <div>
            <span className="text-base font-semibold text-black">Используемые продукты:</span>
            <div className="mt-1 text-gray-900">
              {(research.recruitmentUsedProducts && research.recruitmentUsedProducts.length > 0)
                ? research.recruitmentUsedProducts.join(', ')
                : "Не заполнено"}
            </div>
          </div>
          
          {/* Используемые каналы */}
          <div>
            <span className="text-base font-semibold text-black">Используемые каналы:</span>
            <div className="mt-1 text-gray-900">
              {(research.recruitmentUsedChannels && research.recruitmentUsedChannels.length > 0)
                ? research.recruitmentUsedChannels.join(', ')
                : "Не заполнено"}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-3">
          {/* Тип юридического лица */}
          <div>
            <span className="text-base font-semibold text-black">Тип юридического лица:</span>
            <div className="mt-1 text-gray-900">
              {(research.recruitmentLegalEntityType && research.recruitmentLegalEntityType.length > 0)
                ? research.recruitmentLegalEntityType.join(', ')
                : "Не заполнено"}
            </div>
          </div>
          
          {/* Ограничения по FISA */}
          <div>
            <span className="text-base font-semibold text-black">Ограничения по FISA:</span>
            <div className="mt-1 text-gray-900">
              {research.recruitmentRestrictions !== undefined
                ? (research.recruitmentRestrictions ? "Да" : "Нет")
                : "Не заполнено"}
            </div>
          </div>
          
          {/* Диапазон CQ */}
          <div>
            <span className="text-base font-semibold text-black">Диапазон CQ:</span>
            <div className="mt-1 text-gray-900">
              {(research.recruitmentCqMin !== undefined && research.recruitmentCqMax !== undefined)
                ? `${research.recruitmentCqMin} - ${research.recruitmentCqMax}`
                : "Не заполнено"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  onTempDataUpdate?: (data: Partial<InsertResearch>) => void;
}) {
  // Products list from research-form.tsx
  const PRODUCT_OPTIONS = [
    "CDC Integrations",
    "Lending",
    "Факторинг",
    "Аккредитивы",
    "Гарантии и спец.счета",
    "АДМ",
    "Эквайринг",
    "СБП: B2C, C2B",
    "СБП: B2B",
    "Корпоративные карты",
    "Валютные контракты и платежи",
    "FX",
    "Таможенные карты",
    "Зарплатный проект",
    "Cash Pooling",
    "Рублевые платежи (входящие и исходящие)",
    "Динамическое дисконтирование",
    "IPS: SWAP и РЕПО",
    "IPS: инвест. продукты (акции, облигации и т.д.)",
    "Деривативы",
    "IB: Advisory (M&A, Securitisation), Digital Advisory",
    "CDC Mobile",
    "LORO платежи (рублевые и валютные)",
    "Custody",
    "Специальный Депозитарий",
  ];

  const form = useForm<{
    recruitmentQuantity?: string;
    recruitmentRoles?: string;
    recruitmentSegments?: string[];
    recruitmentUsedProducts?: string[];
    recruitmentUsedChannels?: string[];
    recruitmentCqMin?: number;
    recruitmentCqMax?: number;
    recruitmentLegalEntityType?: string[];
    recruitmentRestrictions?: boolean;
  }>({
    defaultValues: {
      recruitmentQuantity: research?.recruitmentQuantity || "",
      recruitmentRoles: research?.recruitmentRoles || "",
      recruitmentSegments: research?.recruitmentSegments || [],
      recruitmentUsedProducts: research?.recruitmentUsedProducts || [],
      recruitmentUsedChannels: research?.recruitmentUsedChannels || [],
      recruitmentCqMin: research?.recruitmentCqMin || 0,
      recruitmentCqMax: research?.recruitmentCqMax || 10,
      recruitmentLegalEntityType: research?.recruitmentLegalEntityType || [],
      recruitmentRestrictions: research?.recruitmentRestrictions || false,
    },
  });

  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      recruitmentQuantity: research?.recruitmentQuantity || "",
      recruitmentRoles: research?.recruitmentRoles || "",
      recruitmentSegments: research?.recruitmentSegments || [],
      recruitmentUsedProducts: research?.recruitmentUsedProducts || [],
      recruitmentUsedChannels: research?.recruitmentUsedChannels || [],
      recruitmentCqMin: research?.recruitmentCqMin || 0,
      recruitmentCqMax: research?.recruitmentCqMax || 10,
      recruitmentLegalEntityType: research?.recruitmentLegalEntityType || [],
      recruitmentRestrictions: research?.recruitmentRestrictions || false,
    });
  }, [research, form]);

  const handleSubmit = (data: {
    recruitmentQuantity?: string;
    recruitmentRoles?: string;
    recruitmentSegments?: string[];
    recruitmentUsedProducts?: string[];
    recruitmentUsedChannels?: string[];
    recruitmentCqMin?: number;
    recruitmentCqMax?: number;
    recruitmentLegalEntityType?: string[];
    recruitmentRestrictions?: boolean;
  }) => {
    // For new research (no existing research), only save temporary data
    if (!research) {
      if (onTempDataUpdate) {
        onTempDataUpdate({
          recruitmentQuantity: data.recruitmentQuantity,
          recruitmentRoles: data.recruitmentRoles,
          recruitmentSegments: data.recruitmentSegments,
          recruitmentUsedProducts: data.recruitmentUsedProducts,
          recruitmentUsedChannels: data.recruitmentUsedChannels,
          recruitmentCqMin: data.recruitmentCqMin,
          recruitmentCqMax: data.recruitmentCqMax,
          recruitmentLegalEntityType: data.recruitmentLegalEntityType,
          recruitmentRestrictions: data.recruitmentRestrictions,
        });
      }
      return;
    }

    // For existing research, update the full research
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
        fullText: research.fullText || undefined,
        // New recruitment fields
        recruitmentQuantity: data.recruitmentQuantity,
        recruitmentRoles: data.recruitmentRoles,
        recruitmentSegments: data.recruitmentSegments,
        recruitmentUsedProducts: data.recruitmentUsedProducts,
        recruitmentUsedChannels: data.recruitmentUsedChannels,
        recruitmentCqMin: data.recruitmentCqMin,
        recruitmentCqMax: data.recruitmentCqMax,
        recruitmentLegalEntityType: data.recruitmentLegalEntityType,
        recruitmentRestrictions: data.recruitmentRestrictions,
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">

          {/* Recruitment Quantity */}
          <FormField
            control={form.control}
            name="recruitmentQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Количество респондентов
                </FormLabel>
              <FormControl>
                <Input
                  data-testid="input-quantity"
                  type="text"
                  placeholder="Например: 15-20"
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleFieldChange("recruitmentQuantity", e.target.value);
                  }}
                  className="max-w-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          {/* Recruitment Roles */}
          <FormField
            control={form.control}
            name="recruitmentRoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Роли респондентов
                </FormLabel>
              <FormControl>
                <Input
                  data-testid="input-roles"
                  placeholder="Например: Руководители, менеджеры, предприниматели"
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleFieldChange("recruitmentRoles", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          {/* Recruitment Segments - Multiple Selection */}
          <FormField
            control={form.control}
            name="recruitmentSegments"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Сегменты клиентов
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {["SME", "MidMarket", "Large", "International"].map((segment) => (
                    <label key={segment} className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        data-testid={`checkbox-segment-${segment.toLowerCase()}`}
                        checked={(field.value || []).includes(segment)}
                        onChange={(e) => {
                          const currentValues = field.value || [];
                          let newValues;
                          if (e.target.checked) {
                            newValues = [...currentValues, segment];
                          } else {
                            newValues = currentValues.filter((v: string) => v !== segment);
                          }
                          field.onChange(newValues);
                          handleFieldChange("recruitmentSegments", newValues);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{segment}</span>
                    </label>
                  ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Used Products */}
        <FormField
          control={form.control}
          name="recruitmentUsedProducts"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Используемые продукты
                </FormLabel>
              <FormControl>
                <SearchMultiselect
                  data-testid="multiselect-products"
                  apiEndpoint="/api/products"
                  selectedValues={field.value || []}
                  onSelectionChange={(values) => {
                    field.onChange(values);
                    handleFieldChange("recruitmentUsedProducts", values);
                  }}
                  placeholder="Выберите продукты"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Used Channels - Beautiful Multi-Select */}
        <FormField
          control={form.control}
          name="recruitmentUsedChannels"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Используемые каналы
                </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-auto min-h-[40px] text-left"
                      data-testid="button-channels"
                    >
                      <div className="flex flex-wrap gap-1">
                        {field.value && field.value.length > 0 ? (
                          field.value.map((channel) => (
                            <span
                              key={channel}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {channel}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            Выберите каналы...
                          </span>
                        )}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-60 overflow-y-auto p-3">
                    <div className="space-y-2">
                      {[
                        "Интернет-банк", 
                        "Мобильное приложение", 
                        "Отделения", 
                        "Колл-центр",
                        "Банкоматы",
                        "Другое"
                      ].map((channel) => (
                        <div
                          key={channel}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={channel}
                            checked={
                              (field.value || []).includes(channel)
                            }
                            onCheckedChange={(checked) => {
                              const currentChannels = field.value || [];
                              let newChannels;
                              if (checked) {
                                newChannels = [...currentChannels, channel];
                              } else {
                                newChannels = currentChannels.filter((c: string) => c !== channel);
                              }
                              field.onChange(newChannels);
                              handleFieldChange("recruitmentUsedChannels", newChannels);
                            }}
                            data-testid={`checkbox-channel-${channel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          />
                          <label
                            htmlFor={channel}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {channel}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CQ Range */}
        <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700">
              Диапазон CQ (от {form.watch("recruitmentCqMin") || 0} до {form.watch("recruitmentCqMax") || 10})
          </FormLabel>
          <RangeSlider
            data-testid="slider-cq"
            min={0}
            max={10}
            step={1}
            minValue={form.watch("recruitmentCqMin") || 0}
            maxValue={form.watch("recruitmentCqMax") || 10}
            onChange={([min, max]) => {
              // Ensure values are numbers, not strings
              const minNum = Number(min);
              const maxNum = Number(max);
              form.setValue("recruitmentCqMin", isNaN(minNum) ? undefined : minNum, { shouldDirty: true });
              form.setValue("recruitmentCqMax", isNaN(maxNum) ? undefined : maxNum, { shouldDirty: true });
              handleFieldChange("recruitmentCqMin", isNaN(minNum) ? undefined : minNum);
              handleFieldChange("recruitmentCqMax", isNaN(maxNum) ? undefined : maxNum);
            }}
            className="w-full"
          />
        </div>

        {/* Legal Entity Type - Multiple Selection */}
        <FormField
          control={form.control}
          name="recruitmentLegalEntityType"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Тип юридического лица
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {["CNUM", "GCC"].map((entityType) => (
                    <label key={entityType} className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        data-testid={`checkbox-entity-${entityType.toLowerCase()}`}
                        checked={(field.value || []).includes(entityType)}
                        onChange={(e) => {
                          const currentValues = field.value || [];
                          let newValues;
                          if (e.target.checked) {
                            newValues = [...currentValues, entityType];
                          } else {
                            newValues = currentValues.filter((v: string) => v !== entityType);
                          }
                          field.onChange(newValues);
                          handleFieldChange("recruitmentLegalEntityType", newValues);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{entityType}</span>
                    </label>
                  ))}
                </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fisa Restrictions - Boolean Yes/No */}
        <FormField
          control={form.control}
          name="recruitmentRestrictions"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Ограничения по FISA
                </FormLabel>
                <div className="flex gap-3">
                  <label className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      data-testid="radio-fisa-yes"
                      checked={field.value === true}
                      onChange={() => {
                        field.onChange(true);
                        handleFieldChange("recruitmentRestrictions", true);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">Да</span>
                  </label>
                  <label className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      data-testid="radio-fisa-no"
                      checked={field.value === false}
                      onChange={() => {
                        field.onChange(false);
                        handleFieldChange("recruitmentRestrictions", false);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">Нет</span>
                  </label>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Сохранить
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
  onTempDataUpdate?: (data: { guideIntroText: string }) => void;
}) {
  const parseQuestionBlocks = (data: string | null): QuestionBlock[] => {
    if (!data || typeof data !== "string") return [];
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any, blockIndex: number) => {
        // Ensure order fields exist for backward compatibility
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
            subSubblocks: (s.subSubblocks || []).map(
              (ss: any, ssIndex: number) => ({
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
              }),
            ),
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

  const form = useForm<{
    guideIntroText: string;
    guideMainQuestions: QuestionBlock[];
  }>({
    defaultValues: {
      guideIntroText: research?.guideIntroText || "",
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
    },
  });
  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      guideIntroText: research?.guideIntroText || "",
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
    });
  }, [research, form]);

  const handleSubmit = (data: {
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
        guide: undefined,
        guideIntroText: data.guideIntroText,

        guideMainQuestions: (() => {
          try {
            const cleanBlocks = (data.guideMainQuestions || []).map(
              (block) => ({
                id: block.id || Math.random().toString(),
                name: block.name || "",
                questions: (block.questions || []).map((q) => ({
                  id: q.id || Math.random().toString(),
                  text: q.text || "",
                  comment: q.comment || "",
                  order: q.order || 0,
                })),
                subblocks: (block.subblocks || []).map((s) => ({
                  id: s.id || Math.random().toString(),
                  name: s.name || "",
                  questions: (s.questions || []).map((q) => ({
                    id: q.id || Math.random().toString(),
                    text: q.text || "",
                    comment: q.comment || "",
                    order: q.order || 0,
                  })),
                  order: s.order || 0,
                })),
                order: block.order || 0,
              }),
            );
            return JSON.stringify(cleanBlocks);
          } catch (error) {
            console.error(
              "Error stringifying guide main questions:",
              error,
              data.guideMainQuestions,
            );
            return JSON.stringify([]);
          }
        })(),

        fullText: research.fullText || undefined,
      });
    }
  };

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  // Helper functions for managing question blocks
  const addQuestionBlock = (sectionName: "guideMainQuestions") => {
    const currentBlocks = form.getValues(sectionName) || [];
    const newBlock: QuestionBlock = {
      id: Math.random().toString(),
      name: "",
      questions: [],
      subblocks: [],
      order: currentBlocks.length,
    };
    form.setValue(sectionName, [...currentBlocks, newBlock]);
    // Update temp data
    const currentFormData = form.getValues();
    handleFieldChange(
      sectionName,
      JSON.stringify(currentFormData[sectionName]),
    );
  };

  const removeQuestionBlock = (
    sectionName: "guideMainQuestions",
    index: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = currentBlocks.filter((_, i) => i !== index);
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const updateQuestionBlock = (
    sectionName: "guideMainQuestions",
    index: number,
    updatedBlock: QuestionBlock,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    updatedBlocks[index] = updatedBlock;
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const addQuestion = (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];

    if (subSubblockIndex !== undefined && subblockIndex !== undefined) {
      // Adding question to sub-subblock (Level 4)
      const targetSubSubblock =
        updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks[
          subSubblockIndex
        ];
      const nextOrder = targetSubSubblock.questions.length;
      const newQuestion: Question = {
        id: Math.random().toString(),
        text: "",
        comment: "",
        order: nextOrder,
      };
      targetSubSubblock.questions.push(newQuestion);
    } else if (subblockIndex !== undefined) {
      // Adding question to subblock (Level 2)
      const targetSubblock = updatedBlocks[blockIndex].subblocks[subblockIndex];
      const maxQuestionOrder = Math.max(
        -1,
        ...targetSubblock.questions.map((q) => q.order),
      );
      const maxSubSubblockOrder = Math.max(
        -1,
        ...targetSubblock.subSubblocks.map((s) => s.order),
      );
      const nextOrder = Math.max(maxQuestionOrder, maxSubSubblockOrder) + 1;

      const newQuestion: Question = {
        id: Math.random().toString(),
        text: "",
        comment: "",
        order: nextOrder,
      };
      targetSubblock.questions.push(newQuestion);
    } else {
      // Adding question to main block (Level 1)
      const targetBlock = updatedBlocks[blockIndex];
      const maxQuestionOrder = Math.max(
        -1,
        ...targetBlock.questions.map((q) => q.order),
      );
      const maxSubblockOrder = Math.max(
        -1,
        ...targetBlock.subblocks.map((s) => s.order),
      );
      const nextOrder = Math.max(maxQuestionOrder, maxSubblockOrder) + 1;

      const newQuestion: Question = {
        id: Math.random().toString(),
        text: "",
        comment: "",
        order: nextOrder,
      };
      targetBlock.questions.push(newQuestion);
    }

    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const removeQuestion = (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    questionIndex: number,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];

    if (subSubblockIndex !== undefined && subblockIndex !== undefined) {
      // Remove question from sub-subblock (Level 4)
      updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks[
        subSubblockIndex
      ].questions = updatedBlocks[blockIndex].subblocks[
        subblockIndex
      ].subSubblocks[subSubblockIndex].questions.filter(
        (_, i) => i !== questionIndex,
      );
    } else if (subblockIndex !== undefined) {
      // Remove question from subblock (Level 2)
      updatedBlocks[blockIndex].subblocks[subblockIndex].questions =
        updatedBlocks[blockIndex].subblocks[subblockIndex].questions.filter(
          (_, i) => i !== questionIndex,
        );
    } else {
      // Remove question from main block (Level 1)
      updatedBlocks[blockIndex].questions = updatedBlocks[
        blockIndex
      ].questions.filter((_, i) => i !== questionIndex);
    }

    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const addSubblock = (
    sectionName: "guideMainQuestions",
    blockIndex: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    const targetBlock = updatedBlocks[blockIndex];

    // Calculate next order based on existing items
    const maxQuestionOrder = Math.max(
      -1,
      ...targetBlock.questions.map((q) => q.order),
    );
    const maxSubblockOrder = Math.max(
      -1,
      ...targetBlock.subblocks.map((s) => s.order),
    );
    const nextOrder = Math.max(maxQuestionOrder, maxSubblockOrder) + 1;

    const newSubblock: SubBlock = {
      id: Math.random().toString(),
      name: "",
      questions: [],
      subSubblocks: [],
      order: nextOrder,
    };

    targetBlock.subblocks.push(newSubblock);
    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const addSubSubblock = (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    subblockIndex: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    const targetSubblock = updatedBlocks[blockIndex].subblocks[subblockIndex];

    // Calculate next order based on existing items in subblock
    const maxQuestionOrder = Math.max(
      -1,
      ...targetSubblock.questions.map((q) => q.order),
    );
    const maxSubSubblockOrder = Math.max(
      -1,
      ...targetSubblock.subSubblocks.map((s) => s.order),
    );
    const nextOrder = Math.max(maxQuestionOrder, maxSubSubblockOrder) + 1;

    const newSubSubblock: SubSubBlock = {
      id: Math.random().toString(),
      name: "",
      questions: [],
      order: nextOrder,
    };

    targetSubblock.subSubblocks.push(newSubSubblock);
    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Вступительное слово */}
        <FormField
          control={form.control}
          name="guideIntroText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {"Вступительное слово"}
              </FormLabel>
              <FormControl>
                <WysiwygMarkdownEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("guideIntroText", newValue);
                  }}
                  placeholder={"Введите вступительное слово"}
                  height={200}
                  className=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Questions */}
        <QuestionSection
          title="Вопросы"
          sectionName="guideMainQuestions"
          form={form}
          addQuestionBlock={addQuestionBlock}
          removeQuestionBlock={removeQuestionBlock}
          updateQuestionBlock={updateQuestionBlock}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          addSubblock={addSubblock}
          addSubSubblock={addSubSubblock}
          handleFieldChange={handleFieldChange}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
      </form>
    </Form>
  );
}

// QuestionItem component for individual questions with optional comment
interface QuestionItemProps {
  question: Question;
  blockIndex: number;
  questionIndex: number;
  subblockIndex?: number;
  subSubblockIndex?: number;
  sectionName: "guideMainQuestions";
  updateQuestion: (
    blockIndex: number,
    questionIndex: number,
    field: "text" | "comment",
    value: string,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => void;
  removeQuestion: (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    questionIndex: number,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => void;
  level: number; // 1 for main block, 2 for subblock, 3 for sub-subblock
}

function QuestionItem({
  question,
  blockIndex,
  questionIndex,
  subblockIndex,
  subSubblockIndex,
  sectionName,
  updateQuestion,
  removeQuestion,
  level,
}: QuestionItemProps) {
  const [showComment, setShowComment] = useState(!!question.comment);

  // Clean, minimal styling based on level with proper indentation
  const marginLeft = {
    1: "ml-2", // Questions in blocks get slight indentation
    2: "ml-6", // Questions in subblocks get more indentation
    3: "ml-10", // Questions in sub-subblocks get maximum indentation
  };

  const textSizes = {
    1: "text-sm",
    2: "text-sm",
    3: "text-xs",
  };

  return (
    <div
      className={`pl-4 py-2 bg-gray-50 rounded border border-gray-200 space-y-2 ${marginLeft[level as keyof typeof marginLeft]}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Место для ваших вопросов"
            value={question.text}
            onChange={(e) =>
              updateQuestion(
                blockIndex,
                questionIndex,
                "text",
                e.target.value,
                subblockIndex,
                subSubblockIndex,
              )
            }
            className={textSizes[level as keyof typeof textSizes]}
          />

          {/* Optional comment field */}
          {showComment && (
            <div className="relative">
              <Input
                placeholder="Комментарий (необязательно)"
                value={question.comment}
                onChange={(e) =>
                  updateQuestion(
                    blockIndex,
                    questionIndex,
                    "comment",
                    e.target.value,
                    subblockIndex,
                    subSubblockIndex,
                  )
                }
                className={`text-gray-600 pr-8 ${level === 3 ? "text-xs" : level === 2 ? "text-xs" : "text-sm"}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setShowComment(false);
                  updateQuestion(
                    blockIndex,
                    questionIndex,
                    "comment",
                    "",
                    subblockIndex,
                    subSubblockIndex,
                  );
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Add comment button */}
          {!showComment && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 h-8 px-2"
              onClick={() => setShowComment(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              добавить комментарий
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            removeQuestion(
              sectionName,
              blockIndex,
              questionIndex,
              subblockIndex,
              subSubblockIndex,
            )
          }
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// QuestionSection component for the Guide form
interface QuestionSectionProps {
  title: string;
  sectionName: "guideMainQuestions";
  form: UseFormReturn<{
    guideIntroText: string;
    guideMainQuestions: QuestionBlock[];
  }>;
  addQuestionBlock: (sectionName: "guideMainQuestions") => void;
  removeQuestionBlock: (
    sectionName: "guideMainQuestions",
    index: number,
  ) => void;
  updateQuestionBlock: (
    sectionName: "guideMainQuestions",
    index: number,
    updatedBlock: QuestionBlock,
  ) => void;
  addQuestion: (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => void;
  removeQuestion: (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    questionIndex: number,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => void;
  addSubblock: (sectionName: "guideMainQuestions", blockIndex: number) => void;
  addSubSubblock: (
    sectionName: "guideMainQuestions",
    blockIndex: number,
    subblockIndex: number,
  ) => void;
  handleFieldChange: (field: string, value: string) => void;
}

function QuestionSection({
  title,
  sectionName,
  form,
  addQuestionBlock,
  removeQuestionBlock,
  updateQuestionBlock,
  addQuestion,
  removeQuestion,
  addSubblock,
  addSubSubblock,
  handleFieldChange,
}: QuestionSectionProps) {
  const questionBlocks = form.watch(sectionName) || [];

  // Determine if we have content (default to view mode if content exists)
  const hasContent =
    questionBlocks.length > 0 &&
    questionBlocks.some(
      (block) =>
        block.name ||
        block.questions.length > 0 ||
        block.subblocks.some(
          (sub) =>
            sub.name ||
            sub.questions.length > 0 ||
            sub.subSubblocks.some(
              (subSub) => subSub.name || subSub.questions.length > 0,
            ),
        ),
    );

  // View mode state - default to view if has content, edit if empty
  const [isViewMode, setIsViewMode] = useState(() => hasContent);

  // Update view mode when content changes
  useEffect(() => {
    if (!hasContent && isViewMode) {
      setIsViewMode(false); // Switch to edit mode if content becomes empty
    }
  }, [hasContent, isViewMode]);

  // State for managing collapsed blocks and subblocks
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedSubblocks, setCollapsedSubblocks] = useState<Set<string>>(
    new Set(),
  );

  const toggleBlock = (blockId: string) => {
    const newCollapsed = new Set(collapsedBlocks);
    if (newCollapsed.has(blockId)) {
      newCollapsed.delete(blockId);
    } else {
      newCollapsed.add(blockId);
    }
    setCollapsedBlocks(newCollapsed);
  };

  const toggleSubblock = (blockId: string, subblockId: string) => {
    const key = `${blockId}-${subblockId}`;
    const newCollapsed = new Set(collapsedSubblocks);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedSubblocks(newCollapsed);
  };

  // View mode rendering functions
  const renderViewModeBlock = (block: QuestionBlock, blockIndex: number) => {
    if (
      !block.name &&
      block.questions.length === 0 &&
      block.subblocks.length === 0
    ) {
      return null; // Don't render empty blocks in view mode
    }

    const hasContent =
      block.name || block.questions.length > 0 || block.subblocks.length > 0;
    if (!hasContent) return null;

    return (
      <div
        key={block.id}
        className="mb-6 p-4 border border-gray-200 rounded-lg bg-white"
      >
        {block.name && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {block.name}
          </h3>
        )}

        {/* Render content in order */}
        <div className="space-y-3">
          {(() => {
            const items = [
              ...block.questions.map((question, questionIndex) => ({
                type: "question" as const,
                item: question,
                index: questionIndex,
                order: question.order,
              })),
              ...block.subblocks.map((subblock, subblockIndex) => ({
                type: "subblock" as const,
                item: subblock,
                index: subblockIndex,
                order: subblock.order,
              })),
            ];

            items.sort((a, b) => a.order - b.order);

            return items.map((item) => {
              if (item.type === "question") {
                const question = item.item as Question;
                return renderViewModeQuestion(question, 1);
              } else {
                const subblock = item.item as SubBlock;
                return renderViewModeSubblock(subblock, blockIndex);
              }
            });
          })()}
        </div>
      </div>
    );
  };

  const renderViewModeSubblock = (subblock: SubBlock, blockIndex: number) => {
    const hasContent =
      subblock.name ||
      subblock.questions.length > 0 ||
      subblock.subSubblocks.length > 0;
    if (!hasContent) return null;

    return (
      <div
        key={subblock.id}
        className="ml-4 mt-3 pl-4 border-l-2 border-gray-200"
      >
        {subblock.name && (
          <h4 className="text-base font-medium text-gray-800 mb-3">
            {subblock.name}
          </h4>
        )}

        <div className="space-y-2">
          {(() => {
            const items = [
              ...subblock.questions.map((question, questionIndex) => ({
                type: "question" as const,
                item: question,
                index: questionIndex,
                order: question.order,
              })),
              ...subblock.subSubblocks.map((subSubblock, subSubblockIndex) => ({
                type: "subSubblock" as const,
                item: subSubblock,
                index: subSubblockIndex,
                order: subSubblock.order,
              })),
            ];

            items.sort((a, b) => a.order - b.order);

            return items.map((item) => {
              if (item.type === "question") {
                const question = item.item as Question;
                return renderViewModeQuestion(question, 2);
              } else {
                const subSubblock = item.item as SubSubBlock;
                return renderViewModeSubSubblock(subSubblock);
              }
            });
          })()}
        </div>
      </div>
    );
  };

  const renderViewModeSubSubblock = (subSubblock: SubSubBlock) => {
    const hasContent = subSubblock.name || subSubblock.questions.length > 0;
    if (!hasContent) return null;

    return (
      <div
        key={subSubblock.id}
        className="ml-4 mt-2 pl-3 border-l border-gray-300"
      >
        {subSubblock.name && (
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            {subSubblock.name}
          </h5>
        )}

        <div className="space-y-1">
          {subSubblock.questions
            .sort((a, b) => a.order - b.order)
            .map((question) => renderViewModeQuestion(question, 3))}
        </div>
      </div>
    );
  };

  const renderViewModeQuestion = (question: Question, level: number) => {
    if (!question.text && !question.comment) return null;

    const levelStyles = {
      1: "text-sm text-gray-800",
      2: "text-sm text-gray-700",
      3: "text-sm text-gray-600",
    };

    return (
      <div key={question.id} className="mb-2">
        {question.text && (
          <div
            className={`${levelStyles[level as keyof typeof levelStyles]} mb-1`}
          >
            • {question.text}
          </div>
        )}
        {question.comment && (
          <div className="text-xs text-gray-500 italic ml-4 mt-1">
            {question.comment}
          </div>
        )}
      </div>
    );
  };

  const updateQuestionBlockName = (
    blockIndex: number,
    name: string,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];

    if (subSubblockIndex !== undefined && subblockIndex !== undefined) {
      // Update sub-subblock name
      updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks[
        subSubblockIndex
      ].name = name;
    } else if (subblockIndex !== undefined) {
      // Update subblock name
      updatedBlocks[blockIndex].subblocks[subblockIndex].name = name;
    } else {
      // Update main block name
      updatedBlocks[blockIndex].name = name;
    }

    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const updateQuestion = (
    blockIndex: number,
    questionIndex: number,
    field: "text" | "comment",
    value: string,
    subblockIndex?: number,
    subSubblockIndex?: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];

    if (subSubblockIndex !== undefined && subblockIndex !== undefined) {
      // Update question in sub-subblock (Level 4)
      updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks[
        subSubblockIndex
      ].questions[questionIndex] = {
        ...updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks[
          subSubblockIndex
        ].questions[questionIndex],
        [field]: value,
      };
    } else if (subblockIndex !== undefined) {
      // Update question in subblock (Level 2)
      updatedBlocks[blockIndex].subblocks[subblockIndex].questions[
        questionIndex
      ] = {
        ...updatedBlocks[blockIndex].subblocks[subblockIndex].questions[
          questionIndex
        ],
        [field]: value,
      };
    } else {
      // Update question in main block (Level 1)
      updatedBlocks[blockIndex].questions[questionIndex] = {
        ...updatedBlocks[blockIndex].questions[questionIndex],
        [field]: value,
      };
    }

    form.setValue(sectionName, updatedBlocks);
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const renderQuestionBlock = (block: QuestionBlock, blockIndex: number) => {
    return (
      <div
        key={block.id}
        className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white"
      >
        {/* Level 1: Main Block Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 mr-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleBlock(block.id)}
              className="p-1 h-6 w-6 hover:bg-gray-100"
            >
              {collapsedBlocks.has(block.id) ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Input
              placeholder="Название блока (например, Вводные вопросы)"
              value={block.name}
              onChange={(e) =>
                updateQuestionBlockName(blockIndex, e.target.value)
              }
              className="text-base font-medium border border-gray-300 focus:border-gray-400"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeQuestionBlock(sectionName, blockIndex)}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Collapsible Content Area */}
        {!collapsedBlocks.has(block.id) && (
          <>
            <div className="space-y-4">
              {/* Combined Questions and Subblocks in order */}
              {(() => {
                const items = [
                  ...block.questions.map((question, questionIndex) => ({
                    type: "question" as const,
                    item: question,
                    index: questionIndex,
                    order: question.order,
                  })),
                  ...block.subblocks.map((subblock, subblockIndex) => ({
                    type: "subblock" as const,
                    item: subblock,
                    index: subblockIndex,
                    order: subblock.order,
                  })),
                ];

                // Sort by order to maintain sequence
                items.sort((a, b) => a.order - b.order);

                return items.map((item) => {
                  if (item.type === "question") {
                    const question = item.item as Question;
                    const questionIndex = item.index;
                    return (
                      <QuestionItem
                        key={question.id}
                        question={question}
                        blockIndex={blockIndex}
                        questionIndex={questionIndex}
                        sectionName={sectionName}
                        updateQuestion={updateQuestion}
                        removeQuestion={removeQuestion}
                        level={1}
                      />
                    );
                  } else {
                    const subblock = item.item as SubBlock;
                    const subblockIndex = item.index;
                    return renderSubblock(subblock, blockIndex, subblockIndex);
                  }
                });
              })()}
            </div>

            {/* Level 1: Action buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addQuestion(sectionName, blockIndex)}
                className="text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить вопрос
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addSubblock(sectionName, blockIndex)}
                className="text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить подблок
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSubblock = (
    subblock: SubBlock,
    blockIndex: number,
    subblockIndex: number,
  ) => {
    return (
      <div
        key={subblock.id}
        className="ml-4 border-l-2 border-gray-300 pl-4 py-3"
      >
        {/* Level 2: Subblock Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 mr-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                toggleSubblock(questionBlocks[blockIndex].id, subblock.id)
              }
              className="p-1 h-6 w-6 hover:bg-gray-100"
            >
              {collapsedSubblocks.has(
                `${questionBlocks[blockIndex].id}-${subblock.id}`,
              ) ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Input
              placeholder="Название подблока (например, Дополнительные вопросы)"
              value={subblock.name}
              onChange={(e) =>
                updateQuestionBlockName(
                  blockIndex,
                  e.target.value,
                  subblockIndex,
                )
              }
              className="text-sm font-medium border border-gray-300 focus:border-gray-400"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentBlocks = form.getValues(sectionName) || [];
              const updatedBlocks = [...currentBlocks];
              updatedBlocks[blockIndex].subblocks = updatedBlocks[
                blockIndex
              ].subblocks.filter((_, i) => i !== subblockIndex);
              form.setValue(sectionName, updatedBlocks);
              handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
            }}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Collapsible Content */}
        {!collapsedSubblocks.has(
          `${questionBlocks[blockIndex].id}-${subblock.id}`,
        ) && (
          <>
            {/* Level 2: Content with Questions and Sub-subblocks */}
            <div className="space-y-3">
              {(() => {
                const items = [
                  ...subblock.questions.map((question, questionIndex) => ({
                    type: "question" as const,
                    item: question,
                    index: questionIndex,
                    order: question.order,
                  })),
                  ...subblock.subSubblocks.map(
                    (subSubblock, subSubblockIndex) => ({
                      type: "subSubblock" as const,
                      item: subSubblock,
                      index: subSubblockIndex,
                      order: subSubblock.order,
                    }),
                  ),
                ];

                // Sort by order
                items.sort((a, b) => a.order - b.order);

                return items.map((item) => {
                  if (item.type === "question") {
                    const question = item.item as Question;
                    const questionIndex = item.index;
                    return (
                      <QuestionItem
                        key={question.id}
                        question={question}
                        blockIndex={blockIndex}
                        questionIndex={questionIndex}
                        subblockIndex={subblockIndex}
                        sectionName={sectionName}
                        updateQuestion={updateQuestion}
                        removeQuestion={removeQuestion}
                        level={2}
                      />
                    );
                  } else {
                    const subSubblock = item.item as SubSubBlock;
                    const subSubblockIndex = item.index;
                    return renderSubSubblock(
                      subSubblock,
                      blockIndex,
                      subblockIndex,
                      subSubblockIndex,
                    );
                  }
                });
              })()}
            </div>

            {/* Level 2: Action buttons */}
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  addQuestion(sectionName, blockIndex, subblockIndex)
                }
                className="text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-sm"
              >
                <Plus className="h-3 w-3 mr-2" />
                Добавить вопрос
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  addSubSubblock(sectionName, blockIndex, subblockIndex)
                }
                className="text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-sm"
              >
                <Plus className="h-3 w-3 mr-2" />
                Добавить под-подблок
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSubSubblock = (
    subSubblock: SubSubBlock,
    blockIndex: number,
    subblockIndex: number,
    subSubblockIndex: number,
  ) => {
    return (
      <div
        key={subSubblock.id}
        className="ml-4 border-l border-gray-300 pl-3 py-2"
      >
        {/* Level 3: Sub-subblock Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 mr-4">
            <Input
              placeholder="Название под-подблока (например, Углубленные вопросы)"
              value={subSubblock.name}
              onChange={(e) =>
                updateQuestionBlockName(
                  blockIndex,
                  e.target.value,
                  subblockIndex,
                  subSubblockIndex,
                )
              }
              className="text-sm font-medium border border-gray-300 focus:border-gray-400"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentBlocks = form.getValues(sectionName) || [];
              const updatedBlocks = [...currentBlocks];
              updatedBlocks[blockIndex].subblocks[subblockIndex].subSubblocks =
                updatedBlocks[blockIndex].subblocks[
                  subblockIndex
                ].subSubblocks.filter((_, i) => i !== subSubblockIndex);
              form.setValue(sectionName, updatedBlocks);
              handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
            }}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Level 3: Sub-subblock Questions */}
        <div className="space-y-2">
          {subSubblock.questions
            .sort((a, b) => a.order - b.order)
            .map((question, questionIndex) => (
              <QuestionItem
                key={question.id}
                question={question}
                blockIndex={blockIndex}
                questionIndex={questionIndex}
                subblockIndex={subblockIndex}
                subSubblockIndex={subSubblockIndex}
                sectionName={sectionName}
                updateQuestion={updateQuestion}
                removeQuestion={removeQuestion}
                level={3}
              />
            ))}
        </div>

        {/* Level 3: Action buttons */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              addQuestion(
                sectionName,
                blockIndex,
                subblockIndex,
                subSubblockIndex,
              )
            }
            className="text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Добавить вопрос
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          {/* Add Question Block button - only show in edit mode or when no content */}
          {(!hasContent || !isViewMode) && (
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => {
                setIsViewMode(false); // Switch to edit mode when adding new content
                addQuestionBlock(sectionName);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Добавить блок вопросов
            </Button>
          )}

          {/* View/Edit Mode Toggle */}
          {hasContent && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsViewMode(true)}
                className={`px-3 py-1 text-sm ${
                  isViewMode
                    ? "bg-gray-200 text-gray-900"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsViewMode(false)}
                className={`px-3 py-1 text-sm ${
                  !isViewMode
                    ? "bg-gray-200 text-gray-900"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Conditional rendering based on view/edit mode */}
      {isViewMode && hasContent ? (
        // View Mode
        <div className="space-y-4">
          {questionBlocks
            .filter(
              (block) =>
                block.name ||
                block.questions.length > 0 ||
                block.subblocks.length > 0,
            )
            .map((block, index) => renderViewModeBlock(block, index))}
        </div>
      ) : (
        // Edit Mode
        <>
          <div className="space-y-6">
            {questionBlocks.map((block, index) =>
              renderQuestionBlock(block, index),
            )}
          </div>

          {questionBlocks.length === 0 && (
            <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="space-y-3">
                <div className="text-4xl">📝</div>
                <p className="text-lg font-medium">Место для ваших вопросов</p>
                <p className="text-sm">
                  Нажмите "Добавить блок вопросов" чтобы создать первый набор
                  вопросов
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
        artifactLink: data.artifactLink,
        brief: research.brief || undefined,
        guide: research.guide || undefined,
        fullText: data.fullText,
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
        {/* Artifact Link Field */}
        <FormField
          control={form.control}
          name="artifactLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {"Ссылка на артефакт"}
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={"Введите ссылку на артефакт"}
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
                  placeholder="Enter full text content..."
                  height={400}
                  className=""
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
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const id = isNew ? null : parseInt(params.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recruitmentEditMode, setRecruitmentEditMode] = useState(false);
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
      if (
        parsedTempData.relatedResearches &&
        typeof parsedTempData.relatedResearches === "string"
      ) {
        try {
          parsedTempData.relatedResearches = JSON.parse(
            parsedTempData.relatedResearches,
          );
        } catch (error) {
          console.error(
            "Error parsing relatedResearches from temp data:",
            error,
          );
          parsedTempData.relatedResearches = [];
        }
      }
      return { ...research, ...parsedTempData } as Research;
    }
    return research;
  }, [isNew, research, tempFormData]);

  // Removed duplicate check query - no longer needed

  // Search state for linked meetings
  const [linkedMeetingsSearch, setLinkedMeetingsSearch] = useState("");
  const debouncedLinkedMeetingsSearch = useDebouncedValue(linkedMeetingsSearch, 500);

  // Fetch meetings by research ID using infinite scroll
  const {
    data: researchMeetings,
    isLoading: isMeetingsLoading,
    isFetching: isMeetingsFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteScroll<MeetingTableItem>({
    queryKey: ["/api/meetings", "by-research", id, debouncedLinkedMeetingsSearch],
    queryFn: async ({ pageParam = 1 }) => {
      if (!id) return { data: [], hasMore: false };
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        researchId: id.toString(),
      });
      
      // Add search parameter if present
      if (debouncedLinkedMeetingsSearch && debouncedLinkedMeetingsSearch.trim()) {
        params.append('search', debouncedLinkedMeetingsSearch.trim());
      }
      
      const response = await fetch(`/api/meetings?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      return response.json() as Promise<PaginatedResponse<MeetingTableItem>>;
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
      // Invalidate roadmap cache to update timeline view
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap/researches"] });
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
      // Invalidate roadmap cache to update timeline view
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap/researches"] });
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
      // Invalidate roadmap cache to update timeline view
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap/researches"] });
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
    if (
      parsedTempData.relatedResearches &&
      typeof parsedTempData.relatedResearches === "string"
    ) {
      try {
        parsedTempData.relatedResearches = JSON.parse(
          parsedTempData.relatedResearches,
        );
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
      const updateData = {
        ...completeFormData,
        id,
      } as unknown as ResearchWithId;
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
            Исследования
          </span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-800 font-medium truncate">
            {isNew
              ? "Новое исследование"
              : research?.name || "Детали исследования"}
          </span>
        </div>

        {/* Main content container - Notion-style UI */}
        <div className="bg-white overflow-hidden">
          {/* Document title - Notion style */}
          <div className="px-8 pt-8 pb-4 border-b border-gray-100">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 outline-none focus:ring-0 empty:before:content-['Untitled'] empty:before:text-gray-400 w-full">
              {isNew ? "Создать новое исследование" : research?.name}
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
                <TabsTrigger value="info">{"Обзор"}</TabsTrigger>
                <TabsTrigger value="brief">{"Бриф"}</TabsTrigger>
                <TabsTrigger value="guide">{"Гайд"}</TabsTrigger>
                <TabsTrigger value="recruitment">{"Рекрутинг"}</TabsTrigger>
                <TabsTrigger value="results">{"Результаты"}</TabsTrigger>
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
                <ResearchDetailBriefForm
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
                {recruitmentEditMode || isNew ? (
                  <ResearchRecruitmentForm
                    research={effectiveResearch}
                    onUpdate={(data) => {
                      handleSubmit(data);
                      setRecruitmentEditMode(false); // Exit edit mode after save
                    }}
                    isLoading={isPending}
                    onTempDataUpdate={handleTempDataUpdate}
                  />
                ) : (
                  <ResearchRecruitmentView
                    research={effectiveResearch as Research}
                    onEdit={() => setRecruitmentEditMode(true)}
                  />
                )}
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
                    <CardTitle className="text-xl">Связанные встречи</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setLocation(
                          `/meetings/new?source=research&sourceId=${id}`,
                        )
                      }
                      className="flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" /> Создать встречу
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <InfiniteScrollTable
                      data={researchMeetings}
                      columns={[
                        {
                          id: "status",
                          name: "Статус",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
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
                          ),
                        },
                        {
                          id: "companyName",
                          name: "Название компании",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
                            <span className="font-medium truncate max-w-[150px]" title={meeting.companyName || ""}>
                              {meeting.companyName || "—"}
                            </span>
                          ),
                        },
                        {
                          id: "respondentName",
                          name: "Имя респондента",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
                            <span className="truncate max-w-[150px]" title={meeting.respondentName}>
                              {meeting.respondentName}
                            </span>
                          ),
                        },
                        {
                          id: "respondentPosition",
                          name: "Должность",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
                            <span className="truncate max-w-[150px]" title={meeting.respondentPosition}>
                              {meeting.respondentPosition}
                            </span>
                          ),
                        },
                        {
                          id: "date",
                          name: "Дата",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
                            <span className="whitespace-nowrap">
                              {new Date(meeting.date).toLocaleDateString()}
                            </span>
                          ),
                        },
                        {
                          id: "salesPerson",
                          name: "Рекрутер",
                          visible: true,
                          render: (meeting: MeetingTableItem) => (
                            <span className="truncate max-w-[150px]" title={meeting.salesPerson}>
                              {meeting.salesPerson}
                            </span>
                          ),
                        },
                      ]}
                      onRowClick={(meeting) =>
                        setLocation(`/meetings/${meeting.id}?source=research&sourceId=${id}`)
                      }
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                      storeConfigKey="research-meetings-table"
                      searchValue={linkedMeetingsSearch}
                      onSearchChange={setLinkedMeetingsSearch}
                      emptyStateMessage="No meetings are connected to this research yet."
                      isLoading={isMeetingsLoading}
                      isFetching={isMeetingsFetching}
                    />
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
                Удалить исследование
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Вы уверены, что хотите удалить это исследование? Это действие
                нельзя отменить. If this research has associated meetings, they
                must be deleted first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="bg-white border border-gray-200 hover:bg-gray-50">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                Удалить
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
