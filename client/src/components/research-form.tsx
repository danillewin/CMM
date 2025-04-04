import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResearchSchema, type InsertResearch, type Research, ResearchStatus } from "@shared/schema";
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

  const form = useForm<InsertResearch>({
    resolver: zodResolver(insertResearchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      status: initialData?.status as any || ResearchStatus.PLANNED,
      dateStart: initialData
        ? initialData.dateStart
        : new Date(),
      dateEnd: initialData
        ? initialData.dateEnd
        : new Date(),
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
                {isDescriptionEditing ? (
                  <>
                    <FormControl>
                      <Textarea {...field} className="w-full min-h-[100px]" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsDescriptionEditing(false)}
                    >
                      Done Editing
                    </Button>
                  </>
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[100px]">
                    {description ? (
                      <LinkifiedText text={description} className="text-sm" />
                    ) : (
                      <span className="text-sm text-muted-foreground">No description provided</span>
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Color</FormLabel>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {RESEARCH_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ring-offset-2 ${
                        field.value === color ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => field.onChange(color)}
                    />
                  ))}
                </div>
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
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : String(field.value)}
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
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : String(field.value)}
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

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Saving..." : "Save Research"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                size="lg"
              >
                Cancel
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                size="lg"
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
            <DialogTitle>Cannot Delete Research</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setErrorDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}