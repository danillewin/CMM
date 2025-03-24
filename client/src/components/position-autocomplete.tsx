import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X, Trash2 } from "lucide-react";
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
import { type Position } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PositionAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
}

export function PositionAutocomplete({
  value,
  onChange
}: PositionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const createPositionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/positions", { name });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create position');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Position created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create position",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/positions/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete position');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Position deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete position",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createPosition = useCallback(async (name: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      // Check if position already exists
      if (positions.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        onChange(trimmedName);
        setOpen(false);
        return;
      }

      await createPositionMutation.mutateAsync(trimmedName);
      onChange(trimmedName);
      setOpen(false);
      setInputValue("");
    } catch (error) {
      console.error("Failed to create position:", error);
    }
  }, [createPositionMutation, onChange, positions]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleDelete = async (e: React.MouseEvent, position: Position) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (confirm(`Are you sure you want to delete position "${position.name}"? Associated meetings will have their position set to "Unknown".`)) {
        await deletePositionMutation.mutateAsync(position.id);
        if (value === position.name) {
          onChange("");
        }
      }
    } catch (error) {
      console.error("Failed to delete position:", error);
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
          {value || "Select position..."}
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
            placeholder="Search position..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            <div className="p-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => createPosition(inputValue)}
                disabled={!inputValue.trim()}
              >
                Create "{inputValue}"
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup>
            {positions.map((position) => (
              <CommandItem
                key={position.id}
                value={position.name}
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
                      value === position.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {position.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => handleDelete(e, position)}
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