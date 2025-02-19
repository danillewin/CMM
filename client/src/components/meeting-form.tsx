import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { Meeting } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useManagers } from "@/hooks/use-managers";

interface MeetingFormProps {
  onSubmit: (data: InsertMeeting) => void;
  initialData?: Meeting | null;
  isLoading?: boolean;
}

export default function MeetingForm({ onSubmit, initialData, isLoading }: MeetingFormProps) {
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });
  const { lastUsedManager, addManager } = useManagers();

  const form = useForm<InsertMeeting>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      respondentName: initialData?.respondentName ?? "",
      respondentPosition: initialData?.respondentPosition ?? "",
      cnum: initialData?.cnum ?? "",
      companyName: initialData?.companyName ?? "",
      manager: initialData?.manager ?? (!initialData ? lastUsedManager : ""),
      date: initialData
        ? new Date(initialData.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      agenda: initialData?.agenda ?? "",
      status: initialData?.status as typeof MeetingStatus[keyof typeof MeetingStatus] ?? MeetingStatus.NEGOTIATION,
    },
  });

  const onSubmitWrapper = (data: InsertMeeting) => {
    if (data.manager) {
      addManager(data.manager);
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWrapper)} className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="respondentPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Position</FormLabel>
                <FormControl>
                  <Input {...field} className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Company Name</FormLabel>
                <FormControl>
                  <Input {...field} className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full"
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
        </div>

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
          name="manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Manager</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
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