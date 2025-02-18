import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema, type InsertMeeting, MeetingStatus } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Meeting } from "@shared/schema";

interface MeetingFormProps {
  onSubmit: (data: InsertMeeting) => void;
  initialData?: Meeting | null;
  isLoading?: boolean;
}

export default function MeetingForm({ onSubmit, initialData, isLoading }: MeetingFormProps) {
  const form = useForm<InsertMeeting>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      respondentName: initialData?.respondentName ?? "",
      cnum: initialData?.cnum ?? "",
      date: initialData 
        ? new Date(initialData.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      agenda: initialData?.agenda ?? "",
      status: initialData?.status as typeof MeetingStatus[keyof typeof MeetingStatus] ?? MeetingStatus.NEGOTIATION,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="respondentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Respondent Name</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
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
              <FormLabel className="text-base">CNUM</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="w-full uppercase"
                  onChange={e => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel className="text-base">Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-full" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Agenda</FormLabel>
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
              <FormLabel className="text-base">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? "Saving..." : "Save Meeting"}
        </Button>
      </form>
    </Form>
  );
}