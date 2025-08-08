import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

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
  
  // Ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];
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

  // Set up infinite scroll with intersection observer
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !isOpen || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    // Observe the scroll container itself for when we reach the bottom
    const bottomTrigger = document.createElement('div');
    bottomTrigger.style.height = '1px';
    scrollElement.appendChild(bottomTrigger);
    observer.observe(bottomTrigger);

    return () => {
      observer.disconnect();
      if (bottomTrigger.parentNode) {
        bottomTrigger.parentNode.removeChild(bottomTrigger);
      }
    };
  }, [hasNextPage, isFetching, fetchNextPage, isOpen]);

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
    if (safeSelectedValues.includes(value)) {
      onSelectionChange(safeSelectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...safeSelectedValues, value]);
    }
  }, [safeSelectedValues, onSelectionChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Handle removing individual selection
  const handleRemoveSelection = useCallback((value: string) => {
    onSelectionChange(safeSelectedValues.filter(v => v !== value));
  }, [safeSelectedValues, onSelectionChange]);

  // Get display text for selected values
  const getSelectedDisplayText = useCallback(() => {
    if (safeSelectedValues.length === 0) return placeholder;
    if (safeSelectedValues.length === 1) {
      const option = formattedOptions.find(opt => opt.value === safeSelectedValues[0]);
      return option?.label || safeSelectedValues[0];
    }
    return `${safeSelectedValues.length} selected`;
  }, [safeSelectedValues, formattedOptions, placeholder]);

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
            safeSelectedValues.length > 1 && "h-auto",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {safeSelectedValues.length === 0 && (
              <span className="text-muted-foreground truncate">
                {placeholder}
              </span>
            )}
            {safeSelectedValues.length === 1 && (
              <span className="truncate">
                {getSelectedDisplayText()}
              </span>
            )}
            {safeSelectedValues.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {safeSelectedValues.slice(0, 2).map((value) => {
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
                {safeSelectedValues.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{safeSelectedValues.length - 2} more
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
          {safeSelectedValues.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {safeSelectedValues.length} selected
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
                  checked={safeSelectedValues.includes(option.value)}
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