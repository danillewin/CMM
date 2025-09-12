import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
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
        throw new Error(data.message || 'Не удалось создать команду');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Команда успешно создана" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Не удалось создать команду",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/teams/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Не удалось удалить команду');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Команда успешно удалена" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Не удалось удалить команду",
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

  const handleDelete = async (e: React.MouseEvent, team: Team) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (confirm(`Вы уверены, что хотите удалить команду "${team.name}"? Это повлияет на все связанные исследования.`)) {
        await deleteTeamMutation.mutateAsync(team.id);
        if (value === team.name) {
          onChange("");
        }
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
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
          {value || "Выберите команду..."}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Поиск команды..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            <div className="p-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => createTeam(inputValue)}
                disabled={!inputValue.trim()}
              >
                Создать "{inputValue}"
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {teams.map((team) => (
              <CommandItem
                key={team.id}
                value={team.name}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
                className="flex justify-between items-center pr-2"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === team.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {team.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => handleDelete(e, team)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}