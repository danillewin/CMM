import { useState } from "react";
import { useLocation } from "wouter";
import { MeetingTableItem, PaginatedResponse } from "@shared/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { InfiniteScrollTable } from "@/components/infinite-scroll-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus as PlusIcon } from "lucide-react";

interface ResearchLinkedMeetingsProps {
  researchId: number;
  onCreateMeeting: () => void;
}

export function ResearchLinkedMeetings({ researchId, onCreateMeeting }: ResearchLinkedMeetingsProps) {
  const [, setLocation] = useLocation();
  
  // Search state for linked meetings
  const [linkedMeetingsSearch, setLinkedMeetingsSearch] = useState("");
  const debouncedLinkedMeetingsSearch = useDebouncedValue(linkedMeetingsSearch, 500);

  // Fetch meetings by research ID using infinite scroll
  const {
    data: researchMeetings,
    isLoading: isMeetingsLoading,
    isFetching: isMeetingsFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteScroll<MeetingTableItem>({
    queryKey: ["/api/meetings", "by-research", researchId, debouncedLinkedMeetingsSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        researchId: researchId.toString(),
      });
      
      // Add search parameter if present
      if (debouncedLinkedMeetingsSearch && debouncedLinkedMeetingsSearch.trim()) {
        params.append('search', debouncedLinkedMeetingsSearch.trim());
      }
      
      const response = await fetch(`/api/meetings?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      return response.json() as Promise<PaginatedResponse<MeetingTableItem>>;
    },
    enabled: !!researchId,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">
          Связанные встречи
        </CardTitle>
        <Button
          onClick={onCreateMeeting}
          size="sm"
          className="gap-1"
          data-testid="button-create-linked-meeting"
        >
          <PlusIcon className="h-4 w-4" /> Создать встречу
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <InfiniteScrollTable
          data={researchMeetings}
          columns={[
            {
              id: "status",
              name: "Статус",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]
                  ${
                    meeting.status === "Done"
                      ? "bg-green-100 text-green-800"
                      : meeting.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : meeting.status === "Meeting Set"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                  title={meeting.status}
                >
                  {meeting.status}
                </span>
              ),
            },
            {
              id: "companyName",
              name: "Название компании",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span className="font-medium truncate max-w-[150px]" title={meeting.companyName || ""}>
                  {meeting.companyName || "—"}
                </span>
              ),
            },
            {
              id: "respondentName",
              name: "Имя респондента",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span className="truncate max-w-[150px]" title={meeting.respondentName}>
                  {meeting.respondentName}
                </span>
              ),
            },
            {
              id: "respondentPosition",
              name: "Должность",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span className="truncate max-w-[150px]" title={meeting.respondentPosition}>
                  {meeting.respondentPosition}
                </span>
              ),
            },
            {
              id: "date",
              name: "Дата",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span className="whitespace-nowrap">
                  {new Date(meeting.date).toLocaleDateString()}
                </span>
              ),
            },
            {
              id: "salesPerson",
              name: "Рекрутер",
              visible: true,
              render: (meeting: MeetingTableItem) => (
                <span className="truncate max-w-[150px]" title={meeting.salesPerson}>
                  {meeting.salesPerson}
                </span>
              ),
            },
          ]}
          onRowClick={(meeting) =>
            setLocation(`/meetings/${meeting.id}?source=research&sourceId=${researchId}`)
          }
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          storeConfigKey="research-meetings-table"
          searchValue={linkedMeetingsSearch}
          onSearchChange={setLinkedMeetingsSearch}
          emptyStateMessage="No meetings are connected to this research yet."
          isLoading={isMeetingsLoading}
          isFetching={isMeetingsFetching}
        />
      </CardContent>
    </Card>
  );
}
