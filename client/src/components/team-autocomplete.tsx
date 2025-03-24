import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Team } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeamAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TeamAutocomplete({
  value,
  onChange,
}: TeamAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/teams", { name });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create team');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create team",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createTeam = useCallback(async (name: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      // Check if team already exists
      if (teams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
        onChange(trimmedName);
        setOpen(false);
        return;
      }

      await createTeamMutation.mutateAsync(trimmedName);
      onChange(trimmedName);
      setOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  }, [createTeamMutation, onChange, teams]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select team..."}
          <div className="flex items-center gap-1">
            {value && (
              <X 
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer" 
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search team..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => createTeam(inputValue)}
              disabled={!inputValue.trim()}
            >
              Create "{inputValue}"
            </Button>
          </CommandEmpty>
          <CommandGroup>
            {teams.map((team) => (
              <CommandItem
                key={team.id}
                value={team.name}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === team.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {team.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}