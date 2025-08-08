import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface Option {
  value: string;
  label: string;
}

export interface UniversalSearchableSelectProps {
  placeholder?: string;
  searchEndpoint: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
  isMultiSelect?: boolean;
}

export function UniversalSearchableSelect({
  placeholder = "Select options...",
  searchEndpoint,
  value = [],
  onChange,
  className,
  disabled = false,
  isMultiSelect = true
}: UniversalSearchableSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Simple approach - just load initial data and search results
  const { data: options = [], isLoading } = useQuery<Option[]>({
    queryKey: [searchEndpoint, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        limit: "50"
      });
      
      const response = await fetch(`${searchEndpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to search');
      return await response.json();
    },
    enabled: true,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Combine current options with selected values that might not be visible
  const allOptions = [
    ...options,
    ...value.map(v => ({ value: v, label: v }))
  ].reduce((unique, option) => {
    const exists = unique.find(u => u.value === option.value);
    if (!exists) unique.push(option);
    return unique;
  }, [] as Option[]);

  const handleSelect = (optionValue: string) => {
    if (isMultiSelect) {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange([optionValue]);
      setOpen(false);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const getDisplayLabel = (optionValue: string): string => {
    const option = allOptions.find(o => o.value === optionValue);
    return option?.label || optionValue;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10 h-auto"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {isMultiSelect ? (
                value.map((selectedValue) => (
                  <Badge
                    key={selectedValue}
                    variant="secondary"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(selectedValue);
                    }}
                  >
                    {getDisplayLabel(selectedValue)}
                    <X className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" />
                  </Badge>
                ))
              ) : (
                value.length > 0 && (
                  <span>{getDisplayLabel(value[0])}</span>
                )
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2">
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
          </div>
          <ScrollArea className="max-h-60">
            {isLoading && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.loading")}...
              </div>
            )}
            {!isLoading && options.length === 0 && search.trim() && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.noResults")}
              </div>
            )}
            {!isLoading && options.length === 0 && !search.trim() && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.startTyping")}
              </div>
            )}
            {options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                className={cn(
                  "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                  value.includes(option.value) && "bg-accent"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}