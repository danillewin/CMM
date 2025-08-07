import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Research, PaginatedResponse } from "@shared/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchSelectorProps {
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  onResearchSelect?: (research: Research) => void; // Callback to pass full research data
  displayName?: string; // For displaying existing research name when disabled
}

export function ResearchSelector({
  value,
  onValueChange,
  placeholder = "Select research...",
  disabled = false,
  onResearchSelect,
  displayName
}: ResearchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["/api/researches", "selector", searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "20",
        sortBy: "name",
        sortDir: "asc",
      });
      
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/researches?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch researches");
      }
      return response.json() as Promise<PaginatedResponse<Research>>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: open, // Only fetch when popover is open
  });

  // Get flattened array of all researches
  const researches = data?.pages.flatMap(page => page.data) || [];
  
  // Find selected research
  const selectedResearch = researches.find(r => r.id === value);

  // Handle scroll to load more
  const handleScroll = () => {
    if (!listRef.current || !hasNextPage || isFetchingNextPage) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      fetchNextPage();
    }
  };

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayName ? (
            <span className="truncate">{displayName}</span>
          ) : selectedResearch ? (
            <span className="truncate">
              {selectedResearch.name} - {selectedResearch.team}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search researches..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-[300px] overflow-auto"
          >
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading researches...</span>
              </div>
            )}
            
            {isError && (
              <CommandEmpty>Error loading researches. Please try again.</CommandEmpty>
            )}
            
            {!isLoading && !isError && researches.length === 0 && (
              <CommandEmpty>No researches found.</CommandEmpty>
            )}
            
            {researches.length > 0 && (
              <CommandGroup>
                {researches.map((research) => (
                  <CommandItem
                    key={research.id}
                    value={research.id.toString()}
                    onSelect={() => {
                      onValueChange(research.id);
                      onResearchSelect?.(research);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === research.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{research.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {research.team} • {research.researcher}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
                
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading more...</span>
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}