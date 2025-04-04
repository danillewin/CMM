import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema, type InsertMeeting, MeetingStatus, type Meeting, type Research, type MeetingStatusType } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import MDEditor from '@uiw/react-md-editor';
import { RequiredFieldIndicator } from "./required-field-indicator";

interface MeetingFormProps {
  onSubmit: (data: InsertMeeting) => void;
  initialData?: Meeting | null;
  isLoading?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
}

export default function MeetingForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
  onDelete
}: MeetingFormProps) {
  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });
  const { lastUsedManager, addManager } = useManagers();

  // Properly handle the date conversion for the form
  const defaultDate = initialData 
    ? new Date(initialData.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const form = useForm({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      respondentName: initialData?.respondentName ?? "",
      respondentPosition: initialData?.respondentPosition ?? "",
      cnum: initialData?.cnum ?? "",
      gcc: initialData?.gcc ?? "",
      companyName: initialData?.companyName ?? "",
      relationshipManager: initialData?.relationshipManager ?? (!initialData ? lastUsedManager : ""),
      salesPerson: initialData?.salesPerson ?? "",
      date: new Date(defaultDate),
      researchId: initialData?.researchId ?? 0,
      status: (initialData?.status as MeetingStatusType) ?? MeetingStatus.IN_PROGRESS,
      notes: initialData?.notes ?? "",
    },
  });

  const onSubmitWrapper = (data: InsertMeeting) => {
    if (data.relationshipManager) {
      addManager(data.relationshipManager);
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWrapper)} className="space-y-6">
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
                  <FormLabel className="text-sm font-medium text-gray-600">
                    Respondent Name
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base" 
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
                  <FormLabel className="text-sm font-medium text-gray-600">
                    Position
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <PositionAutocomplete
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">Company</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base" 
                      placeholder="Company name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">
                    CNUM
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full uppercase border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base"
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
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
                  <FormLabel className="text-sm font-medium text-gray-600">GCC</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base" 
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
            <FormField
              control={form.control}
              name="date"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">
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
                      className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base"
                      {...rest}
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
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Relationship Manager
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base" 
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
                    <FormLabel className="text-sm font-medium text-gray-600">
                      Sales Person
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="w-full border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-gray-900 text-base" 
                        placeholder="Sales person name..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">
                    Status
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value)} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-0 border-b border-gray-200 rounded-none pl-0 shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:border-gray-900">
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

            <FormField
              control={form.control}
              name="researchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">
                    Research
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger className="border-0 border-b border-gray-200 rounded-none pl-0 shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:border-gray-900">
                        <SelectValue placeholder="Select research" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {researches.map((research) => (
                        <SelectItem key={research.id} value={research.id.toString()}>
                          {research.name} - {research.team}
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
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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