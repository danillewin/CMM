import { useInfiniteQuery } from "@tanstack/react-query";
import { PaginatedResponse } from "@shared/schema";

interface UseInfiniteScrollOptions<T> {
  queryKey: any[];
  queryFn: (params: { pageParam?: number }) => Promise<PaginatedResponse<T>>;
  limit?: number;
  enabled?: boolean;
}

export function useInfiniteScroll<T>({
  queryKey,
  queryFn,
  limit = 20,
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn({ pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled,
    initialPageParam: 1,
  });

  // Flatten all pages into a single array
  const data = query.data?.pages.flatMap(page => page.data) ?? [];
  
  // Check if we can load more
  const hasNextPage = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}