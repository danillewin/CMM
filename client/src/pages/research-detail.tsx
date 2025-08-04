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
import { useTranslation } from "react-i18next";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Helper type for handling Research with ID
type ResearchWithId = Research;

// Component for Brief tab
function ResearchBriefForm({
  research,
  onUpdate,
  isLoading,
  allResearches,
  onTempDataUpdate,
}: {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  allResearches: Research[];
  onTempDataUpdate?: (data: { brief: string }) => void;
}) {
  const { t } = useTranslation();
  const form = useForm<{
    researchType: string;
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
      researchType: research?.researchType || "Interviews",
      customerFullName: research?.customerFullName || "",
      additionalStakeholders:
        Array.isArray(research?.additionalStakeholders) 
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
      relatedResearches:
        Array.isArray(research?.relatedResearches) 
          ? research.relatedResearches.map((s) => ({ value: s })) 
          : [],
      figmaPrototypeLink: research?.figmaPrototypeLink || "",
      brief: research?.brief || "",
    },
  });
  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      researchType: research?.researchType || "Interviews",
      customerFullName: research?.customerFullName || "",
      additionalStakeholders:
        Array.isArray(research?.additionalStakeholders) 
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
      relatedResearches:
        Array.isArray(research?.relatedResearches) 
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
    researchType: string;
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
        researchType: data.researchType as any,
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Research Type Field */}
        <FormField
          control={form.control}
          name="researchType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {t("research.researchType")}
              </FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value);
                handleFieldChange("researchType", value);
              }} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select research type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CATI (Telephone Survey)">
                    CATI (Telephone Survey)
                  </SelectItem>
                  <SelectItem value="CAWI (Online Survey)">
                    CAWI (Online Survey)
                  </SelectItem>
                  <SelectItem value="Moderated usability testing">
                    Moderated usability testing
                  </SelectItem>
                  <SelectItem value="Unmoderated usability testing">
                    Unmoderated usability testing
                  </SelectItem>
                  <SelectItem value="Co-creation session">
                    Co-creation session
                  </SelectItem>
                  <SelectItem value="Interviews">Interviews</SelectItem>
                  <SelectItem value="Desk research">Desk research</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerFullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {t("research.customerFullName")}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ivanov Ivan Ivanovich" 
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
              {t("research.additionalStakeholders")}
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: "" })}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("research.addStakeholder")}
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
              {t("research.addStakeholder")}{" "}
              {t("research.additionalStakeholders").toLowerCase()}
            </p>
          )}
        </div>

        {/* Result Format Field */}
        <FormField
          control={form.control}
          name="resultFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("research.resultFormat")}</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value);
                handleFieldChange("resultFormat", value);
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("research.resultFormat")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Презентация">
                    {t("research.resultFormatOptions.presentation")}
                  </SelectItem>
                  <SelectItem value="Figma">
                    {t("research.resultFormatOptions.figma")}
                  </SelectItem>
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
              <FormLabel>{t("research.customerSegmentDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={t(
                    "research.customerSegmentDescriptionPlaceholder",
                  )}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("customerSegmentDescription", e.target.value);
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
                {t("research.projectBackground")}
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
                    <FormLabel>
                      {t("research.projectBackgroundDescription")}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        placeholder="" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("projectBackground", e.target.value);
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
                    <FormLabel>{t("research.problemToSolve")}</FormLabel>
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
                    <FormLabel>{t("research.resultsUsage")}</FormLabel>
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
                    <FormLabel>{t("research.productMetrics")}</FormLabel>
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
                    <FormLabel>{t("research.limitations")}</FormLabel>
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
                {t("research.goalsHypothesesQuestions")}
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
                    <FormLabel>{t("research.researchGoals")}</FormLabel>
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
                    <FormLabel>{t("research.researchHypotheses")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.researchHypothesesPlaceholder",
                        )}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("researchHypotheses", e.target.value);
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
                    <FormLabel>{t("research.keyQuestions")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder={t("research.keyQuestionsPlaceholder")}
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
                {t("research.additionalInformation")}
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
                    {t("research.relatedResearches")}
                  </FormLabel>
                  {(() => {
                    const selectedIds = form
                      .watch("relatedResearches")
                      .map((item) => item.value)
                      .filter((id) => id && id.trim() !== "");
                    const availableResearches = allResearches.filter(
                      (r) =>
                        r.id !== research?.id &&
                        !selectedIds.includes(r.id.toString()),
                    );
                    return (
                      availableResearches.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendRelatedResearch({ value: "" })}
                          className="text-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t("research.addRelatedResearch")}
                        </Button>
                      )
                    );
                  })()}
                </div>
                {relatedResearchFields.map((field, index) => {
                  const selectedValue = form.watch(
                    `relatedResearches.${index}.value`,
                  );
                  const selectedResearch = allResearches.find(
                    (r) => r.id.toString() === selectedValue,
                  );

                  return (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Select
                        value={selectedValue}
                        onValueChange={(value) => {
                          console.log("Setting related research value:", value, "at index:", index);
                          form.setValue(
                            `relatedResearches.${index}.value`,
                            value,
                          );
                          // Update temp data for related researches
                          const currentValues = form.getValues("relatedResearches");
                          const cleanValues = currentValues.map(s => s.value).filter(v => v && v.trim() !== "");
                          console.log("Current related researches values:", cleanValues);
                          handleFieldChange("relatedResearches", JSON.stringify(cleanValues));
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue
                            placeholder={t(
                              "research.relatedResearchesPlaceholder",
                            )}
                          >
                            {selectedResearch
                              ? `${selectedResearch.name} (${selectedResearch.team})`
                              : t("research.relatedResearchesPlaceholder")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {allResearches
                            .filter((r: Research) => {
                              // Exclude current research
                              if (r.id === research?.id) return false;
                              // Exclude already selected researches, but allow the currently selected one for this field
                              const selectedIds = form
                                .watch("relatedResearches")
                                .map((item, idx) =>
                                  idx !== index ? item.value : null,
                                )
                                .filter((id) => id && id.trim() !== "");
                              return !selectedIds.includes(r.id.toString());
                            })
                            .map((researchItem: Research) => (
                              <SelectItem
                                key={researchItem.id}
                                value={researchItem.id.toString()}
                              >
                                {researchItem.name} ({researchItem.team})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRelatedResearch(index)}
                        className="text-red-600 hover:text-red-700"
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
                    <FormLabel>{t("research.previousResources")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t("research.previousResourcesPlaceholder")}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("previousResources", e.target.value);
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
                    <FormLabel>{t("research.additionalMaterials")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t(
                          "research.additionalMaterialsPlaceholder",
                        )}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("additionalMaterials", e.target.value);
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
                <FormLabel>{t("research.figmaPrototypeLink")}</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder={t("research.figmaPrototypeLinkPlaceholder")}
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
                {t("researches.brief")}
              </FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("brief", newValue);
                  }}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter research brief...",
                    style: { resize: 'none' }
                  }}
                  components={{
                    preview: (source, state, dispatch) => {
                      const sanitizedHtml = DOMPurify.sanitize(source || '', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: []
                      });
                      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("research.saveBrief")}
        </Button>
      </form>
    </Form>
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
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Describe who we're searching for...",
                    style: { resize: 'none' }
                  }}
                  components={{
                    preview: (source, state, dispatch) => {
                      const sanitizedHtml = DOMPurify.sanitize(source || '', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: []
                      });
                      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
                    }
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
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter invitation template...",
                    style: { resize: 'none' }
                  }}
                  components={{
                    preview: (source, state, dispatch) => {
                      const sanitizedHtml = DOMPurify.sanitize(source || '', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: []
                      });
                      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
                    }
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

// Types for Guide structure
interface Question {
  id: string;
  text: string;
  comment: string;
  order?: number; // Add order field to maintain sequence
}

interface QuestionBlock {
  id: string;
  name: string;
  questions: Question[];
  subblocks: QuestionBlock[];
  order?: number; // Add order field to maintain sequence
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
      
      return parsed.map((item: any) => {
        // Ensure order fields exist for backward compatibility
        if (item.questions) {
          item.questions = item.questions.map((q: any, index: number) => ({
            ...q,
            order: q.order !== undefined ? q.order : index,
          }));
        }
        if (item.subblocks) {
          item.subblocks = item.subblocks.map((s: any, index: number) => ({
            ...s,
            order:
              s.order !== undefined
                ? s.order
                : (item.questions?.length || 0) + index,
          }));
        }
        return {
          ...item,
          order: item.order !== undefined ? item.order : 0,
        };
      });
    } catch {
      return [];
    }
  };

  const form = useForm<{
    guide: string;
    guideIntroText: string;
    guideIntroQuestions: QuestionBlock[];
    guideMainQuestions: QuestionBlock[];
    guideConcludingQuestions: QuestionBlock[];
  }>({
    defaultValues: {
      guide: research?.guide || "",
      guideIntroText: research?.guideIntroText || "",
      guideIntroQuestions: parseQuestionBlocks(
        (research?.guideIntroQuestions as unknown as string) || null,
      ),
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
      guideConcludingQuestions: parseQuestionBlocks(
        (research?.guideConcludingQuestions as unknown as string) || null,
      ),
    },
  });
  // Reset form when research data changes
  useEffect(() => {
    form.reset({
      guide: research?.guide || "",
      guideIntroText: research?.guideIntroText || "",
      guideIntroQuestions: parseQuestionBlocks(
        (research?.guideIntroQuestions as unknown as string) || null,
      ),
      guideMainQuestions: parseQuestionBlocks(
        (research?.guideMainQuestions as unknown as string) || null,
      ),
      guideConcludingQuestions: parseQuestionBlocks(
        (research?.guideConcludingQuestions as unknown as string) || null,
      ),
    });
  }, [research, form]);

  const handleSubmit = (data: {
    guide: string;
    guideIntroText: string;
    guideIntroQuestions: QuestionBlock[];
    guideMainQuestions: QuestionBlock[];
    guideConcludingQuestions: QuestionBlock[];
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
        guideIntroQuestions: (() => {
          try {
            const cleanBlocks = (data.guideIntroQuestions || []).map((block) => ({
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
                subblocks: s.subblocks || [],
                order: s.order || 0,
              })),
              order: block.order || 0,
            }));
            return JSON.stringify(cleanBlocks);
          } catch (error) {
            console.error("Error stringifying guide intro questions:", error, data.guideIntroQuestions);
            return JSON.stringify([]);
          }
        })(),
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
                subblocks: s.subblocks || [],
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
        guideConcludingQuestions: (() => {
          try {
            const cleanBlocks = (data.guideConcludingQuestions || []).map((block) => ({
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
                subblocks: s.subblocks || [],
                order: s.order || 0,
              })),
              order: block.order || 0,
            }));
            return JSON.stringify(cleanBlocks);
          } catch (error) {
            console.error("Error stringifying guide concluding questions:", error, data.guideConcludingQuestions);
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

  // Helper functions for managing question blocks
  const addQuestionBlock = (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const newBlock: QuestionBlock = {
      id: Math.random().toString(),
      name: "",
      questions: [],
      subblocks: [],
      order: 0,
    };
    form.setValue(sectionName, [...currentBlocks, newBlock]);
    // Update temp data
    const currentFormData = form.getValues();
    handleFieldChange(sectionName, JSON.stringify(currentFormData[sectionName]));
  };

  const removeQuestionBlock = (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    index: number,
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = currentBlocks.filter((_, i) => i !== index);
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const updateQuestionBlock = (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
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
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    subblockPath: number[] = [],
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    // Calculate next order based on existing items
    const maxQuestionOrder = Math.max(
      -1,
      ...targetBlock.questions.map((q) => q.order || 0),
    );
    const maxSubblockOrder = Math.max(
      -1,
      ...targetBlock.subblocks.map((s) => s.order || 0),
    );
    const nextOrder = Math.max(maxQuestionOrder, maxSubblockOrder) + 1;

    const newQuestion: Question = {
      id: Math.random().toString(),
      text: "",
      comment: "",
      order: nextOrder,
    };

    targetBlock.questions.push(newQuestion);
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const removeQuestion = (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    questionIndex: number,
    subblockPath: number[] = [],
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    targetBlock.questions = targetBlock.questions.filter(
      (_, i) => i !== questionIndex,
    );
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const addSubblock = (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    subblockPath: number[] = [],
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    // Calculate next order based on existing items
    const maxQuestionOrder = Math.max(
      -1,
      ...targetBlock.questions.map((q) => q.order || 0),
    );
    const maxSubblockOrder = Math.max(
      -1,
      ...targetBlock.subblocks.map((s) => s.order || 0),
    );
    const nextOrder = Math.max(maxQuestionOrder, maxSubblockOrder) + 1;

    const newSubblock: QuestionBlock = {
      id: Math.random().toString(),
      name: "",
      questions: [],
      subblocks: [],
      order: nextOrder,
    };

    targetBlock.subblocks.push(newSubblock);
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
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
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter research guide...",
                    style: { resize: 'none' }
                  }}
                  components={{
                    preview: (source, state, dispatch) => {
                      const sanitizedHtml = DOMPurify.sanitize(source || '', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: []
                      });
                      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
                    }
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

        {/* Вступительные вопросы */}
        <QuestionSection
          title={t("research.guideIntroQuestions")}
          sectionName="guideIntroQuestions"
          form={form}
          addQuestionBlock={addQuestionBlock}
          removeQuestionBlock={removeQuestionBlock}
          updateQuestionBlock={updateQuestionBlock}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          addSubblock={addSubblock}
          handleFieldChange={handleFieldChange}
        />

        {/* Основные вопросы */}
        <QuestionSection
          title={t("research.guideMainQuestions")}
          sectionName="guideMainQuestions"
          form={form}
          addQuestionBlock={addQuestionBlock}
          removeQuestionBlock={removeQuestionBlock}
          updateQuestionBlock={updateQuestionBlock}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          addSubblock={addSubblock}
          handleFieldChange={handleFieldChange}
        />

        {/* Заключительные вопросы */}
        <QuestionSection
          title={t("research.guideConcludingQuestions")}
          sectionName="guideConcludingQuestions"
          form={form}
          addQuestionBlock={addQuestionBlock}
          removeQuestionBlock={removeQuestionBlock}
          updateQuestionBlock={updateQuestionBlock}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          addSubblock={addSubblock}
          handleFieldChange={handleFieldChange}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Guide
        </Button>
      </form>
    </Form>
  );
}

// QuestionSection component for the Guide form
interface QuestionSectionProps {
  title: string;
  sectionName:
    | "guideIntroQuestions"
    | "guideMainQuestions"
    | "guideConcludingQuestions";
  form: UseFormReturn<{
    guide: string;
    guideIntroText: string;
    guideIntroQuestions: QuestionBlock[];
    guideMainQuestions: QuestionBlock[];
    guideConcludingQuestions: QuestionBlock[];
  }>;
  addQuestionBlock: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
  ) => void;
  removeQuestionBlock: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    index: number,
  ) => void;
  updateQuestionBlock: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    index: number,
    updatedBlock: QuestionBlock,
  ) => void;
  addQuestion: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    subblockPath?: number[],
  ) => void;
  removeQuestion: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    questionIndex: number,
    subblockPath?: number[],
  ) => void;
  addSubblock: (
    sectionName:
      | "guideIntroQuestions"
      | "guideMainQuestions"
      | "guideConcludingQuestions",
    blockIndex: number,
    subblockPath?: number[],
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
  handleFieldChange,
}: QuestionSectionProps) {
  const { t } = useTranslation();
  const questionBlocks = form.watch(sectionName) || [];

  const updateQuestionBlockName = (
    blockIndex: number,
    name: string,
    subblockPath: number[] = [],
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    targetBlock.name = name;
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const updateQuestion = (
    blockIndex: number,
    questionIndex: number,
    field: "text" | "comment",
    value: string,
    subblockPath: number[] = [],
  ) => {
    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    targetBlock.questions[questionIndex] = {
      ...targetBlock.questions[questionIndex],
      [field]: value,
    };
    form.setValue(sectionName, updatedBlocks);
    // Update temp data
    handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
  };

  const renderQuestionBlock = (
    block: QuestionBlock,
    blockIndex: number,
    subblockPath: number[] = [],
    level: number = 0,
  ) => {
    const indent = level * 20;

    return (
      <div
        key={block.id}
        className="border rounded-lg p-4 space-y-4"
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Input
              placeholder={t("research.questionBlockNamePlaceholder")}
              value={block.name}
              onChange={(e) =>
                updateQuestionBlockName(
                  blockIndex,
                  e.target.value,
                  subblockPath,
                )
              }
              className="font-medium"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              if (subblockPath.length === 0) {
                removeQuestionBlock(sectionName, blockIndex);
              } else {
                // Handle subblock removal
                const currentBlocks = form.getValues(sectionName) || [];
                const updatedBlocks = [...currentBlocks];
                let parentBlock = updatedBlocks[blockIndex];

                // Navigate to parent of the subblock to be removed
                for (let i = 0; i < subblockPath.length - 1; i++) {
                  parentBlock = parentBlock.subblocks[subblockPath[i]];
                }

                // Remove the subblock
                parentBlock.subblocks = parentBlock.subblocks.filter(
                  (_, i) => i !== subblockPath[subblockPath.length - 1],
                );
                form.setValue(sectionName, updatedBlocks);
                // Update temp data
                handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Combined Questions and Subblocks in order */}
        <div className="space-y-3">
          {/* Create combined items array with type indicators */}
          {(() => {
            const items = [
              ...block.questions.map((question, questionIndex) => ({
                type: "question" as const,
                item: question,
                index: questionIndex,
                order: question.order || questionIndex,
              })),
              ...block.subblocks.map((subblock, subblockIndex) => ({
                type: "subblock" as const,
                item: subblock,
                index: subblockIndex,
                order: subblock.order || block.questions.length + subblockIndex,
              })),
            ];

            // Sort by order to maintain sequence
            items.sort((a, b) => a.order - b.order);

            return items.map((item) => {
              if (item.type === "question") {
                const question = item.item as Question;
                const questionIndex = item.index;
                return (
                  <div
                    key={question.id}
                    className="border-l-4 border-blue-200 pl-4 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={t("research.questionTextPlaceholder")}
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(
                              blockIndex,
                              questionIndex,
                              "text",
                              e.target.value,
                              subblockPath,
                            )
                          }
                        />
                        <Input
                          placeholder={t("research.questionCommentPlaceholder")}
                          value={question.comment}
                          onChange={(e) =>
                            updateQuestion(
                              blockIndex,
                              questionIndex,
                              "comment",
                              e.target.value,
                              subblockPath,
                            )
                          }
                          className="text-sm text-gray-600"
                        />
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
                            subblockPath,
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              } else {
                const subblock = item.item as QuestionBlock;
                const subblockIndex = item.index;
                return renderQuestionBlock(
                  subblock,
                  blockIndex,
                  [...subblockPath, subblockIndex],
                  level + 1,
                );
              }
            });
          })()}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addQuestion(sectionName, blockIndex, subblockPath)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("research.addQuestion")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSubblock(sectionName, blockIndex, subblockPath)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("research.addSubblock")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addQuestionBlock(sectionName)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("research.addQuestionBlock")}
        </Button>
      </div>

      <div className="space-y-4">
        {questionBlocks.map((block, index) =>
          renderQuestionBlock(block, index),
        )}
      </div>

      {questionBlocks.length === 0 && (
        <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
          No question blocks yet. Click "Add Question Block" to get started.
        </div>
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
  onTempDataUpdate?: (data: { fullText: string }) => void;
}) {
  const { t } = useTranslation();
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Artifact Link Field */}
        <FormField
          control={form.control}
          name="artifactLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium">
                {t("research.artifactLink")}
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t("research.artifactLinkPlaceholder")}
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
              <FormLabel className="text-lg font-medium">Full Text</FormLabel>
              <FormControl>
                <MDEditor
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("fullText", newValue);
                  }}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter full text content...",
                    style: { resize: 'none' }
                  }}
                  components={{
                    preview: (source, state, dispatch) => {
                      const sanitizedHtml = DOMPurify.sanitize(source || '', {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: []
                      });
                      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
                    }
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
  
  // Query all researches for autocomplete functionality in Brief tab
  const { data: allResearches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

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

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
    enabled: isNew, // Only load all researches when creating a new one (for duplicate detection)
  });

  // Fetch all meetings to filter the ones related to this research
  const { data: meetings = [], isLoading: isMeetingsLoading } = useQuery<
    Meeting[]
  >({
    queryKey: ["/api/meetings"],
    enabled: !isNew && !!id, // Only load meetings when viewing an existing research
  });

  // Filter meetings related to this research
  const researchMeetings = meetings.filter(
    (meeting) => meeting.researchId === id,
  );

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
    const completeFormData: InsertResearch = {
      ...overviewFormData,
      ...tempFormData, // This contains data from Brief, Guide, Recruitment, Results tabs
    };

    if (!isNew && id) {
      // For update, we need to include the ID
      const updateData = { ...completeFormData, id } as unknown as ResearchWithId;
      updateMutation.mutate(updateData);
    } else {
      // For create, we check for duplicates first
      const duplicateResearch = researches.find(
        (r) =>
          r.name.toLowerCase() === completeFormData.name.toLowerCase() &&
          r.team.toLowerCase() === completeFormData.team.toLowerCase(),
      );
      if (duplicateResearch) {
        if (
          confirm(
            "A research with this name and team already exists. Create anyway?",
          )
        ) {
          createMutation.mutate(completeFormData);
        }
      } else {
        createMutation.mutate(completeFormData);
      }
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
                  allResearches={allResearches}
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
