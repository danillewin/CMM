import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Meeting, MeetingStatus, Research } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
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

export default function Meetings() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("");
  const [researcherFilter, setResearcherFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [giftFilter, setGiftFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Ensure research data is loaded first and wait for it to complete
  const { data: researches = [], isLoading: researchesLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Then load meetings data after researches are loaded
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    // This ensures meetings are fetched after researches
    enabled: !researchesLoading
  });
  
  // Combined loading state
  const isLoading = researchesLoading || meetingsLoading;

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
        title: t("errors.generic"), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Export functions
  const exportToCSV = () => {
    const csvContent = filteredMeetings.map(meeting => ({
      [t("meetings.respondentName")]: meeting.respondentName,
      [t("meetings.respondentPosition")]: meeting.respondentPosition,
      [t("meetings.cnum")]: meeting.cnum,
      [t("meetings.gcc")]: meeting.gcc || '—',
      [t("meetings.companyName")]: meeting.companyName,
      [t("meetings.relationshipManager")]: meeting.relationshipManager,
      [t("meetings.recruiter")]: meeting.salesPerson,
      [t("meetings.researcher")]: meeting.researcher || '—',
      [t("meetings.date")]: new Date(meeting.date).toLocaleDateString(),
      [t("meetings.status")]: meeting.status,
      [t("meetings.hasGift")]: meeting.hasGift === "yes" ? t("meetings.giftYes") : t("meetings.giftNo"),
      [t("meetings.research")]: meeting.researchId ? researches.find(r => r.id === meeting.researchId)?.name : '—'
    }));

    const csvString = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meetings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const excelData = filteredMeetings.map(meeting => ({
      [t("meetings.respondentName")]: meeting.respondentName,
      [t("meetings.respondentPosition")]: meeting.respondentPosition,
      [t("meetings.cnum")]: meeting.cnum,
      [t("meetings.gcc")]: meeting.gcc || '—',
      [t("meetings.companyName")]: meeting.companyName,
      [t("meetings.relationshipManager")]: meeting.relationshipManager,
      [t("meetings.recruiter")]: meeting.salesPerson,
      [t("meetings.researcher")]: meeting.researcher || '—',
      [t("meetings.date")]: new Date(meeting.date).toLocaleDateString(),
      [t("meetings.status")]: meeting.status,
      [t("meetings.hasGift")]: meeting.hasGift === "yes" ? t("meetings.giftYes") : t("meetings.giftNo"),
      [t("meetings.research")]: meeting.researchId ? researches.find(r => r.id === meeting.researchId)?.name : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("meetings.title"));
    XLSX.writeFile(wb, `meetings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper function to get the value for sorting
  const getValueForSorting = (meeting: Meeting, field: string) => {
    switch (field) {
      case "date":
        return new Date(meeting.date);
      case "cnum":
        return meeting.cnum;
      case "gcc":
        return meeting.gcc || "";
      case "respondentPosition":
        return meeting.respondentPosition || "";
      case "companyName":
        return meeting.companyName || "";
      case "relationshipManager":
        return meeting.relationshipManager;
      case "salesPerson":
        return meeting.salesPerson;
      case "researcher":
        return meeting.researcher || "";
      case "status":
        return meeting.status;
      case "respondentName":
        return meeting.respondentName;
      case "research":
        return meeting.researchId 
          ? researches.find(r => r.id === meeting.researchId)?.name || ""
          : "";
      default:
        return meeting.respondentName;
    }
  };

  // Filter and sort meetings
  const filteredMeetings = meetings
    .filter(
      (meeting) =>
        (meeting.respondentName.toLowerCase().includes(search.toLowerCase()) ||
          meeting.cnum.toLowerCase().includes(search.toLowerCase()) ||
          (meeting.gcc?.toLowerCase() || "").includes(search.toLowerCase()) ||
          (meeting.companyName?.toLowerCase() || "").includes(search.toLowerCase()) ||
          (meeting.respondentPosition?.toLowerCase() || "").includes(search.toLowerCase()) ||
          meeting.relationshipManager.toLowerCase().includes(search.toLowerCase()) ||
          meeting.salesPerson.toLowerCase().includes(search.toLowerCase()) ||
          (meeting.researcher?.toLowerCase() || "").includes(search.toLowerCase()) ||
          meeting.status.toLowerCase().includes(search.toLowerCase()) ||
          new Date(meeting.date).toLocaleDateString().toLowerCase().includes(search.toLowerCase()) ||
          (meeting.researchId && researches.find(r => r.id === meeting.researchId)?.name.toLowerCase().includes(search.toLowerCase()))) &&
        (statusFilter === "ALL" || !statusFilter || meeting.status === statusFilter) &&
        (!researchFilter || meeting.researchId === researchFilter) &&
        (managerFilter === "ALL" || !managerFilter || meeting.relationshipManager === managerFilter) &&
        (recruiterFilter === "ALL" || !recruiterFilter || meeting.salesPerson === recruiterFilter) &&
        (researcherFilter === "ALL" || !researcherFilter || meeting.researcher === researcherFilter) &&
        (positionFilter === "ALL" || !positionFilter || meeting.respondentPosition === positionFilter) &&
        (giftFilter === "ALL" || !giftFilter || meeting.hasGift === giftFilter)
    )
    .sort((a, b) => {
      const aVal = getValueForSorting(a, sortBy);
      const bVal = getValueForSorting(b, sortBy);
      
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };
  
  const handleRowClick = (meeting: Meeting) => {
    // Navigate to the meeting detail page
    setLocation(`/meetings/${meeting.id}`);
  };

  // Define columns for the configurable table with useMemo to update on language change
  const columns: ColumnConfig[] = useMemo(() => [
    {
      id: "hasGift", 
      name: t("meetings.hasGift"),
      visible: true,
      sortField: "hasGift",
      render: (meeting: Meeting) => (
        <div className="flex justify-center">
          {meeting.hasGift === "yes" ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          ) : (
            <div className="w-6 h-6 border border-gray-300 bg-gray-100 rounded-full">
            </div>
          )}
        </div>
      )
    },
    {
      id: "status",
      name: t("meetings.status"),
      visible: true,
      sortField: "status",
      render: (meeting: Meeting) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={meeting.status}
            onValueChange={(value) =>
              updateStatusMutation.mutate({ id: meeting.id, status: value })
            }
          >
            <SelectTrigger
              className="w-[140px] bg-white/80 backdrop-blur-sm shadow-sm"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <SelectValue>{meeting.status === MeetingStatus.IN_PROGRESS ? t("meetings.statusInProgress") : 
                meeting.status === MeetingStatus.SET ? t("meetings.statusSet") :
                meeting.status === MeetingStatus.DONE ? t("meetings.statusDone") :
                meeting.status === MeetingStatus.DECLINED ? t("meetings.statusDeclined") : meeting.status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(MeetingStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status === MeetingStatus.IN_PROGRESS ? t("meetings.statusInProgress") : 
                   status === MeetingStatus.SET ? t("meetings.statusSet") :
                   status === MeetingStatus.DONE ? t("meetings.statusDone") :
                   status === MeetingStatus.DECLINED ? t("meetings.statusDeclined") : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      id: "cnum",
      name: t("meetings.cnum"),
      visible: true,
      sortField: "cnum",
      render: (meeting: Meeting) => (
        <span className="font-medium">{meeting.cnum}</span>
      )
    },
    {
      id: "gcc",
      name: t("meetings.gcc"),
      visible: true,
      sortField: "gcc",
      render: (meeting: Meeting) => (
        <span className="font-medium">{meeting.gcc || '—'}</span>
      )
    },
    {
      id: "companyName",
      name: t("meetings.companyName"),
      visible: true,
      sortField: "companyName",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[200px]">{meeting.companyName}</span>
      )
    },
    {
      id: "respondentName",
      name: t("meetings.respondentName"),
      visible: true,
      sortField: "respondentName",
      render: (meeting: Meeting) => (
        <span className="font-medium truncate max-w-[200px]">{meeting.respondentName}</span>
      )
    },
    {
      id: "respondentPosition",
      name: t("meetings.respondentPosition"),
      visible: true,
      sortField: "respondentPosition",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[150px]">{meeting.respondentPosition}</span>
      )
    },
    {
      id: "relationshipManager",
      name: t("meetings.relationshipManager"),
      visible: true,
      sortField: "relationshipManager",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.relationshipManager}</span>
      )
    },
    {
      id: "salesPerson",
      name: t("meetings.recruiter"),
      visible: true,
      sortField: "salesPerson",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.salesPerson}</span>
      )
    },
    {
      id: "researcher",
      name: t("meetings.researcher"),
      visible: true,
      sortField: "researcher",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.researcher || '—'}</span>
      )
    },
    {
      id: "research",
      name: t("meetings.research"),
      visible: true,
      sortField: "research",
      render: (meeting: Meeting) => {
        // Find matching research with safe checks
        const researchId = meeting.researchId;
        const matchingResearch = researches.find(r => r.id === researchId);
        
        return (
          <div className="max-w-[200px] truncate">
            {researchId ? (
              <div className="flex items-center">
                {matchingResearch ? (
                  <>
                    <div
                      className="w-2 h-2 rounded-full mr-2 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: matchingResearch.color || '#3b82f6' }}
                    />
                    <span className="truncate">{matchingResearch.name}</span>
                  </>
                ) : (
                  <span className="text-gray-500">{t("forms.loading")}</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        );
      }
    },
    {
      id: "date",
      name: t("meetings.date"),
      visible: true,
      sortField: "date",
      render: (meeting: Meeting) => (
        <span>{new Date(meeting.date).toLocaleDateString()}</span>
      )
    },
    {
      id: "email",
      name: t("meetings.email"),
      visible: false,
      sortField: "email",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[200px]">{(meeting as any).email || '—'}</span>
      )
    },
    {
      id: "notes",
      name: t("meetings.notes"),
      visible: false,
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[300px]">
          {meeting.notes ? (
            <span className="text-gray-500 italic">{t("meetings.notes")}</span>
          ) : (
            <span className="text-gray-400">{t("meetings.noMeetings")}</span>
          )}
        </span>
      )
    }
  ], [t, researches, meetings, updateStatusMutation]); // Dependencies for useMemo

  // Prepare filter configurations with useMemo to update on language change
  const filterConfigs = useMemo(() => [
    {
      id: "status",
      name: t("filters.status"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...Object.values(MeetingStatus).map(status => ({ 
          label: status === MeetingStatus.IN_PROGRESS ? t("meetings.statusInProgress") : 
                 status === MeetingStatus.SET ? t("meetings.statusSet") :
                 status === MeetingStatus.DONE ? t("meetings.statusDone") :
                 status === MeetingStatus.DECLINED ? t("meetings.statusDeclined") : status, 
          value: status 
        }))
      ],
      value: statusFilter || "ALL",
      onChange: setStatusFilter
    },
    {
      id: "research",
      name: t("meetings.research"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...researches.map(research => ({ 
          label: research.name, 
          value: research.id.toString() 
        }))
      ],
      value: researchFilter?.toString() ?? "ALL",
      onChange: (value: string) => setResearchFilter(value === "ALL" ? null : Number(value))
    },
    {
      id: "manager",
      name: t("meetings.relationshipManager"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.relationshipManager)
        )).filter(Boolean).sort().map(manager => ({ 
          label: manager, 
          value: manager 
        }))
      ],
      value: managerFilter || "ALL",
      onChange: setManagerFilter
    },
    {
      id: "recruiter",
      name: t("meetings.recruiter"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.salesPerson)
        )).filter(Boolean).sort().map(recruiter => ({ 
          label: recruiter, 
          value: recruiter 
        }))
      ],
      value: recruiterFilter || "ALL",
      onChange: setRecruiterFilter
    },
    {
      id: "researcher",
      name: t("meetings.researcher"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.researcher)
        )).filter(Boolean).sort().map(researcher => ({ 
          label: researcher, 
          value: researcher 
        }))
      ],
      value: researcherFilter || "ALL",
      onChange: setResearcherFilter,
      enableCustomFilters: true
    },
    {
      id: "position",
      name: t("meetings.respondentPosition"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.respondentPosition)
        )).filter(Boolean).sort().map(position => ({ 
          label: position, 
          value: position 
        }))
      ],
      value: positionFilter || "ALL",
      onChange: setPositionFilter
    },
    {
      id: "hasGift",
      name: t("meetings.hasGift"),
      options: [
        { label: t("filters.all"), value: "ALL" },
        { label: t("meetings.giftYes"), value: "yes" },
        { label: t("meetings.giftNo"), value: "no" }
      ],
      value: giftFilter || "ALL",
      onChange: setGiftFilter
    }
  ], [t, statusFilter, researchFilter, managerFilter, recruiterFilter, researcherFilter, positionFilter, giftFilter, researches, meetings, setStatusFilter, setResearchFilter, setManagerFilter, setRecruiterFilter, setResearcherFilter, setPositionFilter, setGiftFilter]); // Dependencies for useMemo

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("meetings-table-filters");
      if (savedFilters) {
        const { status, research, manager, recruiter, researcher, position } = JSON.parse(savedFilters);
        if (status) setStatusFilter(status);
        if (research !== undefined) setResearchFilter(research === null ? null : Number(research));
        if (manager) setManagerFilter(manager);
        if (recruiter) setRecruiterFilter(recruiter);
        if (researcher) setResearcherFilter(researcher);
        if (position) setPositionFilter(position);
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("meetings-table-filters", JSON.stringify({
        status: statusFilter,
        research: researchFilter,
        manager: managerFilter,
        recruiter: recruiterFilter,
        researcher: researcherFilter,
        position: positionFilter
      }));
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  }, [statusFilter, researchFilter, managerFilter, recruiterFilter, researcherFilter, positionFilter]);

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
                statusFilter,
                researchFilter,
                managerFilter,
                recruiterFilter,
                researcherFilter,
                positionFilter,
                giftFilter,
              }}
              onApplyFilter={(filters) => {
                if (filters.search !== undefined) setSearch(filters.search);
                if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter);
                if (filters.researchFilter !== undefined) setResearchFilter(filters.researchFilter);
                if (filters.managerFilter !== undefined) setManagerFilter(filters.managerFilter);
                if (filters.recruiterFilter !== undefined) setRecruiterFilter(filters.recruiterFilter);
                if (filters.researcherFilter !== undefined) setResearcherFilter(filters.researcherFilter);
                if (filters.positionFilter !== undefined) setPositionFilter(filters.positionFilter);
                if (filters.giftFilter !== undefined) setGiftFilter(filters.giftFilter);
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

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <SectionLoader text={t("forms.loading")} />
            ) : (
              <ConfigurableTable
                data={filteredMeetings}
                columns={columns}
                onSort={handleSort}
                sortField={sortBy}
                sortDirection={sortDir}
                onRowClick={handleRowClick}
                rowClassName="hover:bg-gray-50/80 transition-all duration-200"
                storeConfigKey="meetings-table"
                filters={filterConfigs}
                searchValue={search}
                onSearchChange={setSearch}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}