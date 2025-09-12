import { useState, useRef, useCallback } from "react";
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
        throw new Error(data.message || 'Не удалось создать должность');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Должность успешно создана" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Не удалось создать должность",
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
        throw new Error(data.message || 'Не удалось удалить должность');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Должность успешно удалена" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Не удалось удалить должность",
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

  const handleDelete = async (e: React.MouseEvent, position: Position) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (confirm(`Вы уверены, что хотите удалить должность "${position.name}"? Связанные встречи будут иметь должность "Неизвестно".`)) {
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
          className="w-full justify-between text-left font-normal"
        >
          <span className="truncate">{value || "Выберите должность..."}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="rounded-lg">
          <CommandInput
            placeholder="Поиск должности..."
            value={inputValue}
            onValueChange={setInputValue}
            className="h-9"
          />
          <CommandEmpty>
            <div className="p-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => createPosition(inputValue)}
                disabled={!inputValue.trim()}
              >
                Создать "{inputValue}"
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {positions.map((position) => (
              <CommandItem
                key={position.id}
                value={position.name}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
                className="flex justify-between items-center pr-2 py-1.5 text-gray-700 hover:bg-gray-50/80"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-gray-600",
                      value === position.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {position.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => handleDelete(e, position)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}