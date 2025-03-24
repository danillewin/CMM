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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_TEAMS } from "@/lib/constants";

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
  const [open, setOpen] = useState(false);
  const [customTeam, setCustomTeam] = useState("");

  const form = useForm<InsertResearch>({
    resolver: zodResolver(insertResearchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      status: initialData?.status ?? ResearchStatus.PLANNED,
      dateStart: initialData
        ? new Date(initialData.dateStart).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      dateEnd: initialData
        ? new Date(initialData.dateEnd).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value || "Select team..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search team..." />
                    <CommandEmpty>No team found.</CommandEmpty>
                    <CommandGroup>
                      {DEFAULT_TEAMS.map((team) => (
                        <CommandItem
                          key={team}
                          value={team}
                          onSelect={(currentValue) => {
                            form.setValue("team", currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === team ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {team}
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="custom"
                        onSelect={(e) => e.preventDefault()}
                        className="text-muted-foreground"
                      >
                        <div className="w-full flex items-center gap-2">
                          <Input
                            value={customTeam}
                            onChange={(e) => {
                              setCustomTeam(e.target.value);
                              form.setValue("team", e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customTeam.trim()) {
                                  form.setValue("team", customTeam.trim());
                                  setOpen(false);
                                }
                              }
                            }}
                            placeholder="Enter custom team..."
                            className="w-full"
                          />
                          {customTeam && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (customTeam.trim()) {
                                  form.setValue("team", customTeam.trim());
                                  setOpen(false);
                                }
                              }}
                            >
                              Use
                            </Button>
                          )}
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Status</FormLabel>
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