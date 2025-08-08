import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Meeting, MeetingStatus, Research, MeetingTableItem, PaginatedResponse, ResearchTableItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Filter } from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { getResearchColor } from "@/lib/colors";
import { ConfigurableTable, type ColumnConfig } from "@/components/configurable-table";
import { useTranslation } from "react-i18next";
import ResearcherFilterManager from "@/components/researcher-filter-manager";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { InfiniteScrollTable } from "@/components/infinite-scroll-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MeetingFiltersComponent, type MeetingFilters } from "@/components/meeting-filters";

export default function Meetings() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  
  // Unified filters state
  const [filters, setFilters] = useState<MeetingFilters>({
    research: [],
    manager: [],
    recruiter: [],
    researcher: [],
    position: [],
    status: "all",
    gift: "all"
  });
  
  // Applied filters state for "Apply Filters" button
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<MeetingFilters>({
    research: [],
    manager: [],
    recruiter: [],
    researcher: [],
    position: [],
    status: "all",
    gift: "all"
  });
  
  // Debounced search value - only search is debounced, filters wait for apply button
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Apply filters function
  const applyFilters = () => {
    setAppliedSearch(debouncedSearch);
    setAppliedFilters({ ...filters });
  };

  // Clear filters function
  const clearFilters = () => {
    const emptyFilters: MeetingFilters = {
      research: [],
      manager: [],
      recruiter: [],
      researcher: [],
      position: [],
      status: "all",
      gift: "all"
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearch("");
    setAppliedSearch("");
  };

  // Auto-apply search when debounced value changes
  useEffect(() => {
    setAppliedSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Use infinite scroll for meetings with server-side filtering using applied filters
  const {
    data: meetings,
    isLoading: meetingsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteScroll<MeetingTableItem>({
    queryKey: [
      "/api/meetings", 
      "paginated", 
      sortBy, 
      sortDir, 
      appliedSearch, 
      appliedFilters
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        sortBy: sortBy,
        sortDir: sortDir
      });
      
      // Add search parameter (using applied search)
      if (appliedSearch && appliedSearch.trim()) {
        params.append('search', appliedSearch.trim());
      }
      
      // Add filter parameters only if they have values and aren't "all" (using applied filters)
      if (appliedFilters.status && appliedFilters.status !== "all") {
        params.append('status', appliedFilters.status);
      }
      
      if (appliedFilters.gift && appliedFilters.gift !== "all") {
        params.append('gift', appliedFilters.gift);
      }
      
      // Handle array-based filters
      if (appliedFilters.research && appliedFilters.research.length > 0) {
        appliedFilters.research.forEach(name => params.append('researchName', name));
      }
      
      if (appliedFilters.manager && appliedFilters.manager.length > 0) {
        appliedFilters.manager.forEach(manager => params.append('manager', manager));
      }
      
      if (appliedFilters.recruiter && appliedFilters.recruiter.length > 0) {
        appliedFilters.recruiter.forEach(recruiter => params.append('recruiter', recruiter));
      }
      
      if (appliedFilters.researcher && appliedFilters.researcher.length > 0) {
        appliedFilters.researcher.forEach(researcher => params.append('researcher', researcher));
      }
      
      if (appliedFilters.position && appliedFilters.position.length > 0) {
        appliedFilters.position.forEach(position => params.append('position', position));
      }
      
      const response = await fetch(`/api/meetings?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      return response.json() as Promise<PaginatedResponse<MeetingTableItem>>;
    },
    enabled: true, // Server handles all filtering now
  });
  
  // Loading state - only meetings since research data comes from JOIN
  const isLoading = meetingsLoading;

  // Status update mutation for the dropdown in the table
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const meeting = meetings.find(m => m.id === id);
      if (!meeting) return;
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, {
        ...meeting,
        status,
        date: new Date(meeting.date),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: t("forms.save") + " " + t("forms.saving") });
    },
    onError: (error) => {
      toast({ 
        title: t("forms.error"), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Export functions
  const exportToCSV = () => {
    const csvData = meetings.map(meeting => ({
      'Respondent Name': meeting.respondentName || '',
      'Research': meeting.researchName || '',
      'Status': meeting.status || '',
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Manager': (meeting as any).manager || '',
      'Recruiter': (meeting as any).recruiter || '',
      'Researcher': (meeting as any).researcher || '',
      'Position': meeting.respondentPosition || '',
      'Gift': (meeting as any).hasGift ? 'Yes' : 'No',
      'Phone': (meeting as any).phone || '',
      'Email': (meeting as any).email || '',
      'Notes': (meeting as any).notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meetings");
    XLSX.writeFile(workbook, "meetings.csv");
  };

  const exportToExcel = () => {
    const excelData = meetings.map(meeting => ({
      'Respondent Name': meeting.respondentName || '',
      'Research': meeting.researchName || '',
      'Status': meeting.status || '',
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Manager': meeting.manager || '',
      'Recruiter': meeting.recruiter || '',
      'Researcher': meeting.researcher || '',
      'Position': meeting.respondentPosition || '',
      'Gift': meeting.hasGift ? 'Yes' : 'No',
      'Phone': meeting.phone || '',
      'Email': meeting.email || '',
      'Notes': meeting.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meetings");
    XLSX.writeFile(workbook, "meetings.xlsx");
  };

  // Handle row click to navigate to meeting detail
  const handleRowClick = (meeting: MeetingTableItem) => {
    setLocation(`/meetings/${meeting.id}`);
  };

  // Handle sort changes
  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortBy(field);
    setSortDir(direction);
  };

  // Table columns configuration
  const columns = useMemo(() => [
    {
      id: "respondentName",
      name: t("meetings.respondentName"),
      visible: true,
      sortField: "respondentName",
      render: (meeting: MeetingTableItem) => (
        <span className="font-medium">{meeting.respondentName}</span>
      )
    },
    {
      id: "status",
      name: t("meetings.status"),
      visible: true,
      sortField: "status",
      render: (meeting: MeetingTableItem) => (
        <div className="w-24">
          <Select
            value={meeting.status}
            onValueChange={(value) => updateStatusMutation.mutate({ id: meeting.id, status: value })}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MeetingStatus.SET}>{t("meetings.statusSet")}</SelectItem>
              <SelectItem value={MeetingStatus.IN_PROGRESS}>{t("meetings.statusInProgress")}</SelectItem>
              <SelectItem value={MeetingStatus.DONE}>{t("meetings.statusDone")}</SelectItem>
              <SelectItem value={MeetingStatus.DECLINED}>{t("meetings.statusDeclined")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      id: "research",
      name: t("meetings.research"),
      visible: true,
      sortField: "researchName",
      render: (meeting: MeetingTableItem) => (
        <div className="flex items-center gap-2">
          {meeting.researchName ? (
            <>
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getResearchColor(meeting.researchName) }}
              />
              <span className="truncate max-w-[200px]">{meeting.researchName}</span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      )
    },
    {
      id: "date",
      name: t("meetings.date"),
      visible: true,
      sortField: "date",
      render: (meeting: MeetingTableItem) => (
        <span>{new Date(meeting.date).toLocaleDateString()}</span>
      )
    },
    {
      id: "manager",
      name: t("meetings.relationshipManager"),
      visible: true,
      sortField: "manager",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[150px]">{meeting.manager || '—'}</span>
      )
    },
    {
      id: "recruiter",
      name: t("meetings.recruiter"),
      visible: true,
      sortField: "recruiter",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[150px]">{meeting.recruiter || '—'}</span>
      )
    },
    {
      id: "researcher",
      name: t("meetings.researcher"),
      visible: true,
      sortField: "researcher",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[150px]">{meeting.researcher || '—'}</span>
      )
    },
    {
      id: "position",
      name: t("meetings.respondentPosition"),
      visible: false,
      sortField: "respondentPosition",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[200px]">{meeting.respondentPosition || '—'}</span>
      )
    },
    {
      id: "gift",
      name: t("meetings.hasGift"),
      visible: false,
      render: (meeting: MeetingTableItem) => (
        <span>{meeting.hasGift ? t("filters.yes") : t("filters.no")}</span>
      )
    },
    {
      id: "phone",
      name: t("meetings.phone"),
      visible: false,
      sortField: "phone",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[150px]">{meeting.phone || '—'}</span>
      )
    },
    {
      id: "email",
      name: t("meetings.email"),
      visible: false,
      sortField: "email",
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[200px]">{(meeting as any).email || '—'}</span>
      )
    },
    {
      id: "notes",
      name: t("meetings.notes"),
      visible: false,
      render: (meeting: MeetingTableItem) => (
        <span className="truncate max-w-[300px]">
          {meeting.notes ? (
            <span className="text-gray-500 italic">{t("meetings.notes")}</span>
          ) : (
            <span className="text-gray-400">{t("meetings.noMeetings")}</span>
          )}
        </span>
      )
    }
  ], [t, meetings, updateStatusMutation]);

  // Check if there are unapplied filters
  const hasUnappliedFilters = JSON.stringify(filters) !== JSON.stringify(appliedFilters) || search !== appliedSearch;

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("meetings-table-filters");
      if (savedFilters) {
        const savedData = JSON.parse(savedFilters);
        setFilters({
          research: savedData.research || [],
          manager: savedData.manager || [],
          recruiter: savedData.recruiter || [],
          researcher: savedData.researcher || [],
          position: savedData.position || [],
          status: savedData.status || "all",
          gift: savedData.gift || "all"
        });
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("meetings-table-filters", JSON.stringify(filters));
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("meetings.title")}</h1>
            <ResearcherFilterManager
              pageType="meetings"
              currentFilters={{
                search,
                statusFilter: filters.status,
                researchFilter: filters.research,
                managerFilter: filters.manager,
                recruiterFilter: filters.recruiter,
                researcherFilter: filters.researcher,
                positionFilter: filters.position,
                giftFilter: filters.gift,
              }}
              onApplyFilter={(savedFilters) => {
                if (savedFilters.search !== undefined) setSearch(savedFilters.search);
                if (savedFilters.statusFilter !== undefined) setFilters(prev => ({ ...prev, status: savedFilters.statusFilter! }));
                if (savedFilters.researchFilter !== undefined) setFilters(prev => ({ ...prev, research: Array.isArray(savedFilters.researchFilter) ? savedFilters.researchFilter : [] }));
                if (savedFilters.managerFilter !== undefined) setFilters(prev => ({ ...prev, manager: Array.isArray(savedFilters.managerFilter) ? savedFilters.managerFilter : [] }));
                if (savedFilters.recruiterFilter !== undefined) setFilters(prev => ({ ...prev, recruiter: Array.isArray(savedFilters.recruiterFilter) ? savedFilters.recruiterFilter : [] }));
                if (savedFilters.researcherFilter !== undefined) setFilters(prev => ({ ...prev, researcher: Array.isArray(savedFilters.researcherFilter) ? savedFilters.researcherFilter : [] }));
                if (savedFilters.positionFilter !== undefined) setFilters(prev => ({ ...prev, position: Array.isArray(savedFilters.positionFilter) ? savedFilters.positionFilter : [] }));
                if (savedFilters.giftFilter !== undefined) setFilters(prev => ({ ...prev, gift: savedFilters.giftFilter! }));
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200"
              onClick={() => setLocation("/meetings/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("meetings.newMeeting")}
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white hover:bg-gray-50/80 shadow-sm transition-all duration-200"
                onClick={exportToCSV}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white hover:bg-gray-50/80 shadow-sm transition-all duration-200"
                onClick={exportToExcel}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <Input
            placeholder={t("meetings.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Filters */}
        <MeetingFiltersComponent
          filters={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {/* Apply/Clear Buttons */}
        {hasUnappliedFilters && (
          <div className="flex gap-2">
            <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">
              {t("filters.applyFilters")}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              {t("filters.clearFilters")}
            </Button>
          </div>
        )}

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <InfiniteScrollTable
              data={meetings}
              columns={columns}
              isLoading={meetingsLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              onSort={handleSort}
              sortField={sortBy}
              sortDirection={sortDir}
              onRowClick={handleRowClick}
              rowClassName="hover:bg-gray-50/80 transition-all duration-200"
              storeConfigKey="meetings-table"
              searchValue={search}
              onSearchChange={setSearch}
              emptyStateMessage={t("meetings.noMeetings", "No meetings found")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}