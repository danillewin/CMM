import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResearchSchema, type InsertResearch, type Research } from "@shared/schema";
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
  const form = useForm<InsertResearch>({
    resolver: zodResolver(insertResearchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      dateStart: initialData
        ? new Date(initialData.dateStart).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      dateEnd: initialData
        ? new Date(initialData.dateEnd).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Research Name</FormLabel>
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
              <FormLabel className="text-base">Team</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="researcher"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Researcher</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="w-full min-h-[100px]" />
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
                <FormLabel className="text-base">Start Date</FormLabel>
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
            name="dateEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">End Date</FormLabel>
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
              onClick={onDelete}
              size="lg"
            >
              Delete Research
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}