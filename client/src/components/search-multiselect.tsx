import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id?: number;
  name: string;
  value?: string;
}

interface SearchMultiselectProps {
  apiEndpoint: string;
  placeholder?: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  className?: string;
  disabled?: boolean;
  formatOption?: (option: Option) => { label: string; value: string };
}

export function SearchMultiselect({
  apiEndpoint,
  placeholder = "Search...",
  selectedValues,
  onSelectionChange,
  className,
  disabled = false,
  formatOption,
}: SearchMultiselectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch data with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: [apiEndpoint, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: pageParam.toString(),
        limit: "20"
      });
      
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen, // Only fetch when popover is open
  });

  // Set up infinite scroll
  useInfiniteScroll({
    ref: scrollRef,
    onIntersect: () => {
      if (hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    enabled: isOpen && hasNextPage,
  });

  // Flatten all pages of data
  const options = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Format options with custom formatter or default
  const formattedOptions = useMemo(() => {
    return options.map(option => {
      if (formatOption) {
        return formatOption(option);
      }
      // Default formatting
      if (option.id !== undefined) {
        return { label: option.name, value: option.id.toString() };
      }
      return { label: option.name, value: option.name };
    });
  }, [options, formatOption]);

  // Handle option selection
  const handleOptionToggle = useCallback((value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  }, [selectedValues, onSelectionChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Handle removing individual selection
  const handleRemoveSelection = useCallback((value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value));
  }, [selectedValues, onSelectionChange]);

  // Get display text for selected values
  const getSelectedDisplayText = useCallback(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = formattedOptions.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, formattedOptions, placeholder]);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-[40px] py-2",
            selectedValues.length > 1 && "h-auto",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedValues.length === 0 && (
              <span className="text-muted-foreground truncate">
                {placeholder}
              </span>
            )}
            {selectedValues.length === 1 && (
              <span className="truncate">
                {getSelectedDisplayText()}
              </span>
            )}
            {selectedValues.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {selectedValues.slice(0, 2).map((value) => {
                  const option = formattedOptions.find(opt => opt.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="text-xs max-w-[120px] truncate"
                    >
                      {option?.label || value}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveSelection(value);
                        }}
                      />
                    </Badge>
                  );
                })}
                {selectedValues.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedValues.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
          {selectedValues.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {selectedValues.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-60" ref={scrollRef}>
          <div className="p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center py-6 text-sm text-destructive">
                Error loading data
              </div>
            )}
            {formattedOptions.length === 0 && !isLoading && !error && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                No results found
              </div>
            )}
            {formattedOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                onClick={() => handleOptionToggle(option.value)}
              >
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleOptionToggle(option.value)}
                  className="pointer-events-none"
                />
                <span className="flex-1 truncate text-sm">{option.label}</span>
              </div>
            ))}
            {isFetching && !isLoading && (
              <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                Loading more...
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}