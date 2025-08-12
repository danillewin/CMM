import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema, type InsertMeeting, MeetingStatus, type Meeting, type Research, type MeetingStatusType, type Jtbd } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useManagers } from "@/hooks/use-managers";
import { PositionAutocomplete } from "./position-autocomplete";
import { JtbdSelector } from "./jtbd-selector";
import MDEditor from '@uiw/react-md-editor';
import DOMPurify from 'dompurify';
import { RequiredFieldIndicator } from "./required-field-indicator";
import { ResearchSelector } from "./research-selector";

interface MeetingFormProps {
  onSubmit: (data: InsertMeeting) => void;
  initialData?: Meeting | null;
  isLoading?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onCnumChange?: (cnum: string) => void;
  meetings?: Meeting[];
  hideNotesAndFullText?: boolean;
  onTempDataUpdate?: (data: Partial<InsertMeeting>) => void;
  isCreating?: boolean; // Flag to indicate if we're creating a new meeting
  selectedJtbds?: Jtbd[]; // For passing selected JTBDs from parent
  onJtbdsChange?: (jtbds: Jtbd[]) => void; // For updating selected JTBDs in parent
}

export default function MeetingForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
  onDelete,
  onCnumChange,
  meetings = [],
  hideNotesAndFullText = false,
  onTempDataUpdate,
  isCreating = false,
  selectedJtbds: parentSelectedJtbds,
  onJtbdsChange
}: MeetingFormProps) {
  const [localSelectedJtbds, setLocalSelectedJtbds] = useState<Jtbd[]>([]);
  
  // Use parent-provided JTBDs if available, otherwise use local state
  const selectedJtbds = parentSelectedJtbds || localSelectedJtbds;
  const handleJtbdsChange = onJtbdsChange || setLocalSelectedJtbds;
  
  // Research data is now loaded on-demand via ResearchSelector component
  // No need to pre-load all researches
  const researches: Research[] = [];
  const { lastUsedManager, addManager } = useManagers();

  // Properly handle the date conversion for the form
  const defaultDate = initialData 
    ? new Date(initialData.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  type FormValues = {
    respondentName: string;
    respondentPosition: string;
    cnum: string;
    gcc: string;
    companyName: string;
    email: string;
    researcher: string;
    relationshipManager: string;
    salesPerson: string;
    date: Date;
    researchId: number | undefined;
    status: MeetingStatusType;
    notes: string;
    fullText: string;
    hasGift: "yes" | "no";
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      respondentName: initialData?.respondentName ?? "",
      respondentPosition: initialData?.respondentPosition ?? "",
      cnum: initialData?.cnum ?? "",
      gcc: initialData?.gcc ?? "",
      companyName: initialData?.companyName ?? "",
      email: initialData?.email ?? "",
      researcher: initialData?.researcher ?? "", // Researcher from connected research
      relationshipManager: initialData?.relationshipManager ?? (!initialData ? lastUsedManager : ""),
      salesPerson: initialData?.salesPerson ?? "",
      date: new Date(defaultDate),
      researchId: initialData?.researchId ?? undefined,
      status: (initialData?.status as MeetingStatusType) ?? MeetingStatus.IN_PROGRESS,
      notes: initialData?.notes ?? "",
      fullText: initialData?.fullText ?? "",
      hasGift: (initialData?.hasGift as "yes" | "no") ?? "no",
    },
  });

  // Helper function to handle form field changes and update temporary data
  const handleFieldChange = (field: string, value: any) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  // Handle form submission
  const onSubmitWrapper = (data: FormValues) => {
    if (data.relationshipManager) {
      addManager(data.relationshipManager);
    }
    // Convert form data to InsertMeeting type
    onSubmit(data as unknown as InsertMeeting);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWrapper)} className="space-y-6">
        {/* Jobs to be Done section - moved to top as requested */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium">Jobs to be Done</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Track which jobs were discussed during this meeting
          </p>
          <JtbdSelector 
            entityId={initialData?.id || 0} 
            entityType="meeting"
            selectedJtbds={selectedJtbds}
            onJtbdsChange={handleJtbdsChange}
          />
        </div>
        
        {/* Date and Status Fields - Moved to top of form per user request */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Date
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={value instanceof Date ? value.toISOString().slice(0, 10) : String(value)}
                      onChange={(e) => {
                        onChange(new Date(e.target.value));
                      }}
                      className="w-full"
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Status
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value)} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MeetingStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Client Information Section */}
        <div className="mb-8">
          <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Client Information
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="respondentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Respondent Name
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("respondentName", e.target.value);
                      }}
                      className="w-full" 
                      placeholder="Enter name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="respondentPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Position
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <PositionAutocomplete
                      value={field.value ?? ""}
                      onChange={(value) => {
                        field.onChange(value || "");
                        handleFieldChange("respondentPosition", value || "");
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Company</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("companyName", e.target.value);
                      }}
                      className="w-full" 
                      placeholder="Company name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Client Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      className="w-full" 
                      placeholder="Email address..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField
              control={form.control}
              name="cnum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    CNUM
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full uppercase"
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                      onBlur={(e) => {
                        field.onBlur(); // Call the original onBlur
                        
                        // Check for duplicates when the field loses focus
                        const cnum = e.target.value.trim().toUpperCase();
                        if (cnum && onCnumChange) {
                          onCnumChange(cnum);
                        }
                      }}
                      placeholder="CNUM..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gcc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">GCC</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full" 
                      placeholder="GCC..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Meeting Details Section */}
        <div className="mb-8">
          <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Meeting Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormField
                control={form.control}
                name="researcher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Researcher</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full bg-gray-50"
                        disabled
                        readOnly
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1">
                      Inherited from selected Research
                    </div>
                  </FormItem>
                )}
              />
              
            </div>
            
            <FormField
              control={form.control}
              name="researchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Research
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <ResearchSelector
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        // Update the research ID
                        field.onChange(value);
                        handleFieldChange("researchId", value);
                      }}
                      onResearchSelect={(research) => {
                        // Update the researcher field with the researcher from the selected research
                        form.setValue('researcher', research.researcher);
                        handleFieldChange("researcher", research.researcher);
                      }}
                      placeholder="Select research..."
                      displayName={!isCreating && initialData ? (initialData as any).researchName : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="relationshipManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Relationship Manager
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full" 
                        placeholder="RM name..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salesPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Recruiter
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full" 
                        placeholder="Recruiter name..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Gift field - last field in Meeting Details */}
          <FormField
            control={form.control}
            name="hasGift"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                <FormControl>
                  <Checkbox
                    checked={field.value === "yes"}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? "yes" : "no");
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base cursor-pointer">
                    Gift provided
                  </FormLabel>
                  <FormDescription>
                    Check if a gift was provided during this meeting
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

{!hideNotesAndFullText && (
          <>
            {/* Meeting Notes Section */}
            <div className="mb-8">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Meeting Notes
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <div data-color-mode="light">
                        <MDEditor
                          value={field.value}
                          onChange={(value) => field.onChange(value || '')}
                          preview="edit"
                          height={300}
                          className="border border-gray-200 rounded-md overflow-hidden"
                          textareaProps={{
                            placeholder: "Enter meeting notes...",
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
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Full Text Section */}
            <div className="mb-8">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Full Text
              </div>
              
              <FormField
                control={form.control}
                name="fullText"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <div data-color-mode="light">
                        <MDEditor
                          value={field.value}
                          onChange={(value) => field.onChange(value || '')}
                          preview="edit"
                          height={300}
                          className="border border-gray-200 rounded-md overflow-hidden"
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
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Action Buttons - styled for Notion look */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-gray-100">
          <Button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white"
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? "Saving..." : "Save Meeting"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              size="sm"
            >
              Cancel
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 ml-auto"
              onClick={onDelete}
              size="sm"
            >
              Delete Meeting
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}