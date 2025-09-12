import { useState, useRef } from "react";
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
import { formatDateForInput, parseDateFromInput } from "@/lib/date-utils";
import { DatePicker } from "@/components/ui/date-picker";
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
  preselectedResearch?: Research | null; // For showing preselected research name
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
  onJtbdsChange,
  preselectedResearch
}: MeetingFormProps) {
  const [localSelectedJtbds, setLocalSelectedJtbds] = useState<Jtbd[]>([]);
  const [validationError, setValidationError] = useState<boolean>(false);
  const cnumFieldRef = useRef<HTMLDivElement>(null);
  
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
    
  // Extract time from date for separate time field
  const defaultTime = initialData 
    ? new Date(initialData.date).toTimeString().slice(0, 5)
    : "10:00";

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
    time: string;
    meetingLink: string;
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
      time: initialData?.time ?? "",
      meetingLink: initialData?.meetingLink ?? "",
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
    // Check if at least one of CNUM or GCC is provided
    const hasCnum = data.cnum && data.cnum.trim().length > 0;
    const hasGcc = data.gcc && data.gcc.trim().length > 0;
    
    if (!hasCnum && !hasGcc) {
      // Highlight the disclaimer text in red
      setValidationError(true);
      
      // Scroll to the CNUM field
      if (cnumFieldRef.current) {
        cnumFieldRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Focus the CNUM input field
        const input = cnumFieldRef.current.querySelector('input');
        if (input) {
          setTimeout(() => input.focus(), 300);
        }
      }
      
      return; // Prevent form submission
    }
    
    // Clear validation error if submission is valid
    setValidationError(false);
    
    if (data.relationshipManager) {
      addManager(data.relationshipManager);
    }
    
    // Combine date and time into a single Date object if time is provided
    let combinedDateTime = new Date(data.date);
    if (data.time && data.time.trim()) {
      const [hours, minutes] = data.time.split(':').map(Number);
      combinedDateTime.setHours(hours, minutes, 0, 0);
    }
    
    // Convert form data to InsertMeeting type with combined date/time
    const submitData = {
      ...data,
      date: combinedDateTime,
      time: data.time || null, // Store time separately as well
      meetingLink: data.meetingLink || null, // Store meeting link
    };
    
    onSubmit(submitData as unknown as InsertMeeting);
  };

  // Clear validation error when user starts typing in either field
  const handleCnumChange = (value: string) => {
    if (validationError && value.trim().length > 0) {
      setValidationError(false);
    }
  };

  const handleGccChange = (value: string) => {
    if (validationError && value.trim().length > 0) {
      setValidationError(false);
    }
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
        
        {/* Date, Time and Status Fields - Moved to top of form per user request */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Дата
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={value instanceof Date ? value : undefined}
                      onChange={(date) => {
                        if (date) {
                          onChange(date);
                        }
                      }}
                      placeholder="дд/мм/гг"
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
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Время
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      className="w-full font-mono"
                      data-testid="input-meeting-time"
                      placeholder="ЧЧ:ММ (например: 14:30)"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Время в 24-часовом формате (например: 14:30)"
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remove any non-digit or colon characters
                        value = value.replace(/[^\d:]/g, '');
                        
                        // Auto-format as user types
                        if (value.length === 2 && !value.includes(':')) {
                          value = value + ':';
                        }
                        
                        // Limit to 5 characters (HH:MM)
                        if (value.length > 5) {
                          value = value.substring(0, 5);
                        }
                        
                        e.target.value = value;
                        field.onChange(e);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const match = value.match(/^(\d{1,2}):?(\d{0,2})$/);
                        
                        if (match) {
                          const hours = parseInt(match[1] || '0');
                          const minutes = parseInt(match[2] || '0');
                          
                          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                            const formattedTime = 
                              (hours < 10 ? '0' : '') + hours + ':' + 
                              (minutes < 10 ? '0' : '') + minutes;
                            e.target.value = formattedTime;
                            field.onChange(e);
                          }
                        }
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
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Ссылка на встречу
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      className="w-full"
                      data-testid="input-meeting-link"
                      placeholder="https://..."
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
                    Статус
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value)} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-meeting-status">
                        <SelectValue placeholder="Выберите статус" />
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
            Информация о клиенте
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="respondentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Имя респондента
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
                      placeholder="Введите имя..."
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
                    Должность
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
                  <FormLabel className="text-base">Компания</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("companyName", e.target.value);
                      }}
                      className="w-full" 
                      placeholder="Название компании..."
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
                  <FormLabel className="text-base">Email клиента</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      className="w-full" 
                      placeholder="Адрес электронной почты..."
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
                <FormItem ref={cnumFieldRef}>
                  <FormLabel className="text-base">
                    CNUM
                    <RequiredFieldIndicator />
                    <span className={`text-xs font-normal ml-2 ${validationError ? 'text-red-500' : 'text-gray-500'}`}>(CNUM or GCC required)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full uppercase"
                      onChange={e => {
                        const value = e.target.value.toUpperCase();
                        field.onChange(value);
                        handleCnumChange(value);
                      }}
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gcc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    GCC
                    <RequiredFieldIndicator />
                    <span className={`text-xs font-normal ml-2 ${validationError ? 'text-red-500' : 'text-gray-500'}`}>(CNUM or GCC required)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full" 
                      onChange={e => {
                        field.onChange(e.target.value);
                        handleGccChange(e.target.value);
                      }}
                      placeholder="GCC..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Meeting Details Section */}
        <div className="mb-8">
          <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Детали встречи
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormField
                control={form.control}
                name="researcher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Исследователь</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full bg-gray-50"
                        disabled
                        readOnly
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1">
                      Наследуется от выбранного исследования
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
                    Исследование
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
                      placeholder="Выберите исследование..."
                      displayName={
                        !isCreating && initialData 
                          ? (initialData as any).researchName 
                          : isCreating && preselectedResearch 
                            ? `${preselectedResearch.name} (${preselectedResearch.team})`
                            : undefined
                      }
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
                      Клиентский менеджер
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full" 
                        placeholder="Имя RM..."
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
                      Рекрутер
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full" 
                        placeholder="Имя рекрутера..."
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
                    Подарок предоставлен
                  </FormLabel>
                  <FormDescription>
                    Отметьте, если подарок был предоставлен во время этой встречи
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
                Заметки о встрече
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
                            placeholder: "Введите заметки о встрече...",
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
                Отчет в текстовом виде
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
                            placeholder: "Введите полный текст содержания...",
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
            {isLoading ? "Сохранение..." : "Сохранить встречу"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              size="sm"
            >
              Отмена
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
              Удалить встречу
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}