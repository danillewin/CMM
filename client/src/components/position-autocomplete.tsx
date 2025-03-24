import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
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

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const createPositionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/positions", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    },
  });

  const createPosition = useCallback(async (name: string) => {
    await createPositionMutation.mutateAsync(name);
    onChange(name);
    setOpen(false);
  }, [createPositionMutation, onChange]);

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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === position.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {position.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
