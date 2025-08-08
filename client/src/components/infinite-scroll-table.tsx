import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ConfigurableTable, type ColumnConfig, type FilterConfig } from "@/components/configurable-table";

interface InfiniteScrollTableProps<T extends { id: string | number }> {
  data: T[];
  columns: ColumnConfig[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onRowClick?: (item: T) => void;
  rowClassName?: string;
  storeConfigKey?: string;
  filters?: FilterConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  emptyStateMessage?: string;
  onApplyFilters?: () => void;
  hasUnappliedFilters?: boolean;
}

export function InfiniteScrollTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  rowClassName,
  storeConfigKey,
  filters,
  searchValue,
  onSearchChange,
  emptyStateMessage = "No data available",
  onApplyFilters,
  hasUnappliedFilters,
}: InfiniteScrollTableProps<T>) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.unobserve(loadMoreElement);
    };
  }, [handleLoadMore]);

  return (
    <div className="space-y-4">
      <ConfigurableTable
        data={data}
        columns={columns}
        onSort={onSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        storeConfigKey={storeConfigKey}
        filters={filters}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        emptyStateMessage={data.length === 0 ? emptyStateMessage : undefined}
        onApplyFilters={onApplyFilters}
        hasUnappliedFilters={hasUnappliedFilters}
        isLoading={isLoading}
      />
      
      {/* Load more trigger */}
      <div
        ref={loadMoreRef}
        className="flex items-center justify-center py-4"
      >
        {isFetchingNextPage && (
          <div className="flex items-center text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading more...
          </div>
        )}
        {hasNextPage && !isFetchingNextPage && (
          <div className="text-gray-400 text-sm">
            Scroll down to load more
          </div>
        )}
        {!hasNextPage && data.length > 0 && (
          <div className="text-gray-400 text-sm">
            No more items to load
          </div>
        )}
      </div>
    </div>
  );
}