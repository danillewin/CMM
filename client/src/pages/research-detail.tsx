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
import SimpleGuide from "@/components/simple-guide";
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

// Sortable wrapper component for questions
function SortableQuestionItem({
  question,
  blockIndex,
  questionIndex,
  subblockPath,
  sectionName,
  updateQuestion,
  removeQuestion,
  t,
}: QuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: question.id,
    data: {
      type: 'question',
      blockIndex,
      questionIndex,
      subblockPath,
      question,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-2 cursor-grab active:cursor-grabbing shrink-0 mt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </Button>
      <div className="flex-1">
        <QuestionItem
          question={question}
          blockIndex={blockIndex}
          questionIndex={questionIndex}
          subblockPath={subblockPath}
          sectionName={sectionName}
          updateQuestion={updateQuestion}
          removeQuestion={removeQuestion}
          t={t}
        />
      </div>
    </div>
  );
}

// Drop zone component for accepting cross-level drops
function DropZone({
  blockIndex,
  subblockPath,
  level,
  onDrop,
  t,
  label = "Drop here to add to this level",
}: {
  blockIndex: number;
  subblockPath: number[];
  level: number;
  onDrop: (activeId: string, targetBlockIndex: number, targetSubblockPath: number[]) => void;
  t: any;
  label?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${blockIndex}-${subblockPath.join('-')}-${level}`,
    data: {
      type: 'dropzone',
      blockIndex,
      subblockPath,
      level,
    },
  });

  const getDropZoneStyles = (level: number) => {
    switch (level) {
      case 0:
        return {
          borderClass: 'border-blue-400 bg-blue-50',
          hoverClass: 'hover:border-blue-500 hover:bg-blue-100',
          activeClass: 'border-blue-600 bg-blue-100',
          textClass: 'text-blue-700 font-medium'
        };
      case 1:
        return {
          borderClass: 'border-green-400 bg-green-50',
          hoverClass: 'hover:border-green-500 hover:bg-green-100',
          activeClass: 'border-green-600 bg-green-100',
          textClass: 'text-green-700 font-medium'
        };
      case 2:
        return {
          borderClass: 'border-amber-400 bg-amber-50',
          hoverClass: 'hover:border-amber-500 hover:bg-amber-100',
          activeClass: 'border-amber-600 bg-amber-100',
          textClass: 'text-amber-700 font-medium'
        };
      default:
        return {
          borderClass: 'border-gray-400 bg-gray-50',
          hoverClass: 'hover:border-gray-500 hover:bg-gray-100',
          activeClass: 'border-gray-600 bg-gray-100',
          textClass: 'text-gray-700 font-medium'
        };
    }
  };

  const styles = getDropZoneStyles(level);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
        isOver 
          ? `${styles.activeClass} shadow-md transform scale-105` 
          : `${styles.borderClass} ${styles.hoverClass}`
      }`}
    >
      <div className={`text-sm text-center ${styles.textClass} flex items-center justify-center gap-2`}>
        {isOver ? (
          <>
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            <span>Release to drop here</span>
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="w-4 h-4 border-2 border-current border-dashed rounded"></div>
            <span>{label}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Sortable wrapper component for question blocks
function SortableQuestionBlock({
  block,
  blockIndex,
  subblockPath,
  level,
  sectionName,
  form,
  updateQuestionBlockName,
  updateQuestion,
  removeQuestion,
  addQuestion,
  addSubblock,
  handleFieldChange,
  removeQuestionBlock,
  t,
  onCrossLevelMove,
}: {
  block: QuestionBlock;
  blockIndex: number;
  subblockPath: number[];
  level: number;
  sectionName: "guideMainQuestions";
  form: UseFormReturn<{
    guide: string;
    guideIntroText: string;
    guideMainQuestions: QuestionBlock[];
  }>;
  updateQuestionBlockName: (blockIndex: number, name: string, subblockPath: number[]) => void;
  updateQuestion: (blockIndex: number, questionIndex: number, field: "text" | "comment", value: string, subblockPath?: number[]) => void;
  removeQuestion: (sectionName: "guideMainQuestions", blockIndex: number, questionIndex: number, subblockPath?: number[]) => void;
  addQuestion: (sectionName: "guideMainQuestions", blockIndex: number, subblockPath?: number[]) => void;
  addSubblock: (sectionName: "guideMainQuestions", blockIndex: number, subblockPath?: number[]) => void;
  handleFieldChange: (field: string, value: string) => void;
  removeQuestionBlock: (sectionName: "guideMainQuestions", index: number) => void;
  onCrossLevelMove: (activeId: string, targetBlockIndex: number, targetSubblockPath: number[]) => void;
  t: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: block.id,
    data: {
      type: 'subblock',
      blockIndex,
      subblockPath,
      block,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Visual hierarchy based on level
  const getVisualStyles = (level: number) => {
    switch (level) {
      case 0: // Top level
        return {
          containerClass: "border-2 border-blue-200 bg-blue-50 rounded-lg shadow-sm",
          headerClass: "text-xl font-bold text-gray-900",
          nameSize: "text-lg",
          paddingClass: "p-6",
          marginClass: "mb-6",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          indent: 0
        };
      case 1: // Second level
        return {
          containerClass: "border border-green-200 bg-green-50 rounded-md shadow-sm",
          headerClass: "text-lg font-semibold text-gray-800",
          nameSize: "text-base",
          paddingClass: "p-4",
          marginClass: "mb-4",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          indent: 20
        };
      case 2: // Third level
        return {
          containerClass: "border border-amber-200 bg-amber-50 rounded-md",
          headerClass: "text-base font-medium text-gray-700",
          nameSize: "text-sm",
          paddingClass: "p-3",
          marginClass: "mb-3",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          indent: 40
        };
      default:
        return {
          containerClass: "border border-gray-200 bg-gray-50 rounded-md",
          headerClass: "text-sm font-normal text-gray-600",
          nameSize: "text-sm",
          paddingClass: "p-2",
          marginClass: "mb-2",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          indent: 60
        };
    }
  };

  const styles = getVisualStyles(level);

  // Function to handle drag end for questions and subblocks within this block
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Check if it's a cross-level drop to a dropzone
    if (over.data?.current?.type === 'dropzone') {
      const targetBlockIndex = over.data.current.blockIndex;
      const targetSubblockPath = over.data.current.subblockPath;
      onCrossLevelMove(active.id as string, targetBlockIndex, targetSubblockPath);
      return;
    }

    const currentBlocks = form.getValues(sectionName) || [];
    const updatedBlocks = [...currentBlocks];
    let targetBlock = updatedBlocks[blockIndex];

    // Navigate to the correct subblock if needed
    for (const subIndex of subblockPath) {
      targetBlock = targetBlock.subblocks[subIndex];
    }

    // Create combined items array
    const items = [
      ...targetBlock.questions.map((question, questionIndex) => ({
        type: "question" as const,
        item: question,
        index: questionIndex,
        id: question.id,
        order: question.order || questionIndex,
      })),
      ...targetBlock.subblocks.map((subblock, subblockIndex) => ({
        type: "subblock" as const,
        item: subblock,
        index: subblockIndex,
        id: subblock.id,
        order: subblock.order || targetBlock.questions.length + subblockIndex,
      })),
    ];

    // Sort by order
    items.sort((a, b) => a.order - b.order);

    // Find active and over indices
    const activeIndex = items.findIndex(item => item.id === active.id);
    const overIndex = items.findIndex(item => item.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      // Reorder items
      const reorderedItems = arrayMove(items, activeIndex, overIndex);
      
      // Update orders
      reorderedItems.forEach((item, index) => {
        item.order = index;
        if (item.type === "question") {
          (item.item as Question).order = index;
        } else {
          (item.item as QuestionBlock).order = index;
        }
      });

      // Separate back into questions and subblocks
      const newQuestions = reorderedItems
        .filter(item => item.type === "question")
        .map(item => item.item as Question);
      
      const newSubblocks = reorderedItems
        .filter(item => item.type === "subblock")
        .map(item => item.item as QuestionBlock);

      // Update the target block
      targetBlock.questions = newQuestions;
      targetBlock.subblocks = newSubblocks;

      form.setValue(sectionName, updatedBlocks);
      handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.marginClass}>
      <div
        className={`${styles.containerClass} space-y-4 ${styles.paddingClass}`}
        style={{ marginLeft: `${styles.indent}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 mr-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 cursor-grab active:cursor-grabbing shrink-0"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </Button>
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
              className={`${styles.nameSize} ${styles.headerClass} border-0 bg-transparent px-1 focus:ring-2 focus:ring-blue-500 rounded`}
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
                handleFieldChange(sectionName, JSON.stringify(updatedBlocks));
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Questions and Subblocks with drag and drop */}
        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            {(() => {
              const items = [
                ...block.questions.map((question, questionIndex) => ({
                  type: "question" as const,
                  item: question,
                  index: questionIndex,
                  id: question.id,
                  order: question.order || questionIndex,
                })),
                ...block.subblocks.map((subblock, subblockIndex) => ({
                  type: "subblock" as const,
                  item: subblock,
                  index: subblockIndex,
                  id: subblock.id,
                  order: subblock.order || block.questions.length + subblockIndex,
                })),
              ];

              // Sort by order
              items.sort((a, b) => a.order - b.order);

              return (
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item) => {
                    if (item.type === "question") {
                      const question = item.item as Question;
                      const questionIndex = item.index;
                      return (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          blockIndex={blockIndex}
                          questionIndex={questionIndex}
                          subblockPath={subblockPath}
                          sectionName={sectionName}
                          updateQuestion={updateQuestion}
                          removeQuestion={removeQuestion}
                          t={t}
                        />
                      );
                    } else {
                      const subblock = item.item as QuestionBlock;
                      const subblockIndex = item.index;
                      return (
                        <SortableQuestionBlock
                          key={subblock.id}
                          block={subblock}
                          blockIndex={blockIndex}
                          subblockPath={[...subblockPath, subblockIndex]}
                          level={level + 1}
                          sectionName={sectionName}
                          form={form}
                          updateQuestionBlockName={updateQuestionBlockName}
                          updateQuestion={updateQuestion}
                          removeQuestion={removeQuestion}
                          addQuestion={addQuestion}
                          addSubblock={addSubblock}
                          handleFieldChange={handleFieldChange}
                          removeQuestionBlock={removeQuestionBlock}
                          onCrossLevelMove={onCrossLevelMove}
                          t={t}
                        />
                      );
                    }
                  })}
                </SortableContext>
              );
            })()}
          </div>
        </DndContext>

        {/* Drop zone for accepting items from other levels */}
        <DropZone
          blockIndex={blockIndex}
          subblockPath={subblockPath}
          level={level}
          onDrop={onCrossLevelMove}
          t={t}
          label={`Drop items here to move to level ${level + 1}`}
        />

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
          {/* Only show Add Subblock button if depth is less than 3 */}
          {level < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSubblock(sectionName, blockIndex, subblockPath)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("research.addSubblock")}
            </Button>
          )}
        </div>
      </div>
    </div>
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

        {/* Questions - Simplified Version */}
        <FormField
          control={form.control}
          name="guideMainQuestions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SimpleGuide
                  questionBlocks={field.value || []}
                  onUpdateBlocks={(blocks) => {
                    field.onChange(blocks);
                  }}
                  onFieldChange={handleFieldChange}
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

function ResearchDetail() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const {
    data: research,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/researches", id],
    enabled: !!id,
  });

  const [tempData, setTempData] = useState({});

  // Handler for temporary data updates
  const handleTempDataUpdate = (data: any) => {
    setTempData(prev => ({ ...prev, ...data }));
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: InsertResearch) => {
      if (!id) throw new Error("No research ID");
      return await apiRequest(`/api/researches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Research updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/researches", id] });
      // Clear temp data after successful save
      setTempData({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update research",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          Loading research...
        </div>
      </div>
    );
  }

  if (error || !research) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Research not found</h2>
            <p className="text-gray-600 mb-4">
              The research you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/researches")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Researches
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/researches")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Researches
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{research.name}</h1>
            <p className="text-gray-600">Research Details</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="brief" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <ResearchBriefForm 
                research={research}
                onUpdate={updateMutation.mutate}
                isLoading={updateMutation.isPending}
                allResearches={[]}
                onTempDataUpdate={handleTempDataUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ResearchGuideForm 
                research={research}
                onUpdate={updateMutation.mutate}
                isLoading={updateMutation.isPending}
                onTempDataUpdate={handleTempDataUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResearchRecruitmentForm 
                research={research}
                onUpdate={updateMutation.mutate}
                isLoading={updateMutation.isPending}
                onTempDataUpdate={handleTempDataUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Results functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ResearchDetail;
