import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingSchema, type InsertMeeting, MeetingStatus, type Meeting, type Research } from "@shared/schema";
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

  const form = useForm<InsertMeeting>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      respondentName: initialData?.respondentName ?? "",
      respondentPosition: initialData?.respondentPosition ?? null,
      cnum: initialData?.cnum ?? "",
      gcc: initialData?.gcc ?? "",
      companyName: initialData?.companyName ?? "",
      manager: initialData?.manager ?? (!initialData ? lastUsedManager : ""),
      date: initialData
        ? new Date(initialData.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      researchId: initialData?.researchId ?? null,
      status: initialData?.status ?? MeetingStatus.IN_PROGRESS,
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
                  <PositionAutocomplete
                    value={field.value ?? ""}
                    onChange={(value) => field.onChange(value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            name="gcc"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">GCC</FormLabel>
                <FormControl>
                  <Input {...field} className="w-full" />
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
                <FormLabel className="text-base">Company</FormLabel>
                <FormControl>
                  <Input {...field} className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="researchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Research *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value?.toString() ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
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
                    {...field}
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
          name="manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">RM / Sales</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Saving..." : "Save Meeting"}
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
              onClick={onDelete}
              size="lg"
            >
              Delete Meeting
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}