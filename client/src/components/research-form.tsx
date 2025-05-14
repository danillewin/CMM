import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResearchSchema, type InsertResearch, type Research, ResearchStatus, type ResearchStatusType } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeamAutocomplete } from "./team-autocomplete";
import { RESEARCH_COLORS } from "@/lib/colors";
import { LinkifiedText } from "@/components/linkified-text";
import { RequiredFieldIndicator } from "@/components/required-field-indicator";
import { Pencil } from "lucide-react";

interface ResearchFormProps {
  onSubmit: (data: InsertResearch) => void;
  initialData?: Research | null;
  isLoading?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
}

export default function ResearchForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
  onDelete
}: ResearchFormProps) {
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Log the initial data for debugging
  console.log("Initial data:", initialData);
  
  // Ensure dates are properly converted to Date objects
  const startDate = initialData?.dateStart 
    ? new Date(initialData.dateStart) 
    : new Date();
  
  const endDate = initialData?.dateEnd 
    ? new Date(initialData.dateEnd) 
    : new Date();
    
  console.log("Parsed dates:", { startDate, endDate });

  const form = useForm<InsertResearch>({
    resolver: zodResolver(insertResearchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      status: (initialData?.status as ResearchStatusType) || ResearchStatus.PLANNED,
      dateStart: startDate,
      dateEnd: endDate,
      color: initialData?.color ?? RESEARCH_COLORS[0],
    },
  });

  const description = form.watch("description");

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
      }
    } catch (error: any) {
      if (error.message?.includes("associated meetings")) {
        setErrorMessage("This research cannot be deleted because it has associated meetings. Please delete all related meetings first.");
        setErrorDialogOpen(true);
      } else {
        setErrorMessage("An error occurred while deleting the research.");
        setErrorDialogOpen(true);
      }
    }
  };

  // Helper function to format dates consistently
  const formatDateForInput = (date: Date | string) => {
    try {
      if (!date) return ""; // Return empty string if date is null/undefined
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn("Invalid date:", date);
        return "";
      }
      
      // Format to YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Research Name
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Team
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <TeamAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="researcher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Researcher
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ResearchStatus).map((status) => (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Color</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full" 
                            style={{ backgroundColor: field.value }} 
                          />
                          <span>Selected Color</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="min-w-[200px]">
                    <div className="p-3 w-full">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {RESEARCH_COLORS.map((color) => (
                          <div
                            key={color}
                            className="flex justify-center items-center"
                          >
                            <div
                              className={`w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                                field.value === color ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                field.onChange(color);
                                document.body.click(); // Force the dropdown to close
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
            <div className="hidden md:block"></div> {/* Spacer for grid alignment */}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Description</FormLabel>
                  {!isDescriptionEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setIsDescriptionEditing(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <FormControl>
                  {isDescriptionEditing ? (
                    <Textarea
                      {...field}
                      rows={5}
                      className="resize-none"
                      onBlur={() => setIsDescriptionEditing(false)}
                    />
                  ) : (
                    <div className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2">
                      {description ? (
                        <LinkifiedText text={description} />
                      ) : (
                        <span className="text-sm text-muted-foreground">No description provided</span>
                      )}
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Start Date
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => {
                        field.onChange(new Date(e.target.value));
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    End Date
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => {
                        field.onChange(new Date(e.target.value));
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons - styled for Notion look, matching Meeting form */}
          <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? "Saving..." : "Save Research"}
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
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                Delete Research
              </Button>
            )}
          </div>
        </form>
      </Form>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}