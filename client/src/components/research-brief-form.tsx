import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResearchSchema, Research, InsertResearch } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";

interface ResearchBriefFormProps {
  research?: Research;
  onUpdate: (data: InsertResearch) => void;
  isLoading: boolean;
  onTempDataUpdate?: (data: { brief: string }) => void;
}

export function ResearchBriefForm({
  research,
  onUpdate,
  isLoading,
  onTempDataUpdate,
}: ResearchBriefFormProps) {
  const { t } = useTranslation();
  
  const form = useForm<{ brief: string }>({
    resolver: zodResolver(insertResearchSchema.pick({ brief: true })),
    defaultValues: {
      brief: research?.brief || "",
    },
  });

  // Update form when research data changes
  React.useEffect(() => {
    if (research) {
      form.reset({
        brief: research.brief || "",
      });
    }
  }, [research, form]);

  const handleFieldChange = (field: string, value: string) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value } as any);
    }
  };

  const onSubmit = (data: { brief: string }) => {
    const submissionData = { ...research, ...data } as InsertResearch;
    onUpdate(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  data-testid="input-brief"
                  value={field.value}
                  onChange={(val) => {
                    const newValue = val || "";
                    field.onChange(newValue);
                    handleFieldChange("brief", newValue);
                  }}
                  preview="live"
                  hideToolbar={false}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: "Enter research brief...",
                    style: { resize: 'none' }
                  }}
                  previewOptions={{
                    remarkPlugins: [remarkGfm],
                    disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                    unwrapDisallowed: true,
                    className: "prose prose-sm max-w-none p-4"
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} data-testid="button-save-brief">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("research.saveBrief")}
        </Button>
      </form>
    </Form>
  );
}