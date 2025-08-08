import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface Option {
  value: string;
  label: string;
  id?: number;
}

interface SearchableMultiSelectProps {
  placeholder?: string;
  searchEndpoint: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function SearchableMultiSelect({
  placeholder = "Select options...",
  searchEndpoint,
  value = [],
  onChange,
  className,
  disabled = false
}: SearchableMultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Query for search results
  const { data: searchResults = [], isLoading } = useQuery<Option[]>({
    queryKey: [searchEndpoint, debouncedSearch],
    queryFn: async (): Promise<Option[]> => {
      if (!debouncedSearch.trim()) return [];
      const response = await fetch(`${searchEndpoint}?search=${encodeURIComponent(debouncedSearch)}&limit=20`);
      if (!response.ok) throw new Error('Failed to search');
      return await response.json();
    },
    enabled: debouncedSearch.trim().length > 0
  });

  // Handle initial load - fetch a few options to show something
  const { data: initialOptions = [] } = useQuery<Option[]>({
    queryKey: [searchEndpoint, 'initial'],
    queryFn: async (): Promise<Option[]> => {
      const response = await fetch(`${searchEndpoint}?search=&limit=10`);
      if (!response.ok) throw new Error('Failed to load initial options');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Combine search results with initial options and currently selected values
  const allOptions = [
    ...initialOptions,
    ...searchResults,
    // Include currently selected values that might not be in the search results
    ...value.map(v => ({ value: v, label: v }))
  ].reduce((unique, option) => {
    const exists = unique.find(u => u.value === option.value);
    if (!exists) unique.push(option);
    return unique;
  }, [] as Option[]);

  const displayOptions = search.trim() ? searchResults : initialOptions;

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
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
              {value.map((selectedValue) => (
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
              ))}
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
          <div className="max-h-60 overflow-auto">
            {isLoading && search.trim() && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.loading")}...
              </div>
            )}
            {!isLoading && displayOptions.length === 0 && search.trim() && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.noResults")}
              </div>
            )}
            {!isLoading && displayOptions.length === 0 && !search.trim() && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                {t("common.startTyping")}
              </div>
            )}
            {displayOptions.map((option) => (
              <div
                key={option.value}
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}