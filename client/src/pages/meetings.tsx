import { useState, useEffect } from "react";
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

export default function Meetings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("");
  const [researcherFilter, setResearcherFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
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
      toast({ title: "Meeting status updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating meeting status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Export functions
  const exportToCSV = () => {
    const csvContent = filteredMeetings.map(meeting => ({
      'Respondent': meeting.respondentName,
      'Position': meeting.respondentPosition,
      'CNUM': meeting.cnum,
      'GCC': meeting.gcc || '—',
      'Company': meeting.companyName,
      'RM': meeting.relationshipManager,
      'Recruiter': meeting.salesPerson,
      'Researcher': meeting.researcher || '—',
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Status': meeting.status,
      'Gift': meeting.hasGift === "yes" ? "Yes" : "No",
      'Research': meeting.researchId ? researches.find(r => r.id === meeting.researchId)?.name : '—'
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
      'Respondent': meeting.respondentName,
      'Position': meeting.respondentPosition,
      'CNUM': meeting.cnum,
      'GCC': meeting.gcc || '—',
      'Company': meeting.companyName,
      'RM': meeting.relationshipManager,
      'Recruiter': meeting.salesPerson,
      'Researcher': meeting.researcher || '—',
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Status': meeting.status,
      'Gift': meeting.hasGift === "yes" ? "Yes" : "No",
      'Research': meeting.researchId ? researches.find(r => r.id === meeting.researchId)?.name : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Meetings');
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
        (positionFilter === "ALL" || !positionFilter || meeting.respondentPosition === positionFilter)
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

  // Define columns for the configurable table
  const columns: ColumnConfig[] = [
    {
      id: "hasGift", 
      name: "Gift",
      visible: true,
      sortField: "hasGift",
      render: (meeting: Meeting) => (
        <div className="flex justify-center">
          {meeting.hasGift === "yes" ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm" title="Gift provided">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 shadow-sm" title="No gift">
              <span className="text-xs">-</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: "status",
      name: "Status",
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
              <SelectValue>{meeting.status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(MeetingStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      id: "cnum",
      name: "CNUM",
      visible: true,
      sortField: "cnum",
      render: (meeting: Meeting) => (
        <span className="font-medium">{meeting.cnum}</span>
      )
    },
    {
      id: "gcc",
      name: "GCC",
      visible: true,
      sortField: "gcc",
      render: (meeting: Meeting) => (
        <span className="font-medium">{meeting.gcc || '—'}</span>
      )
    },
    {
      id: "companyName",
      name: "Company",
      visible: true,
      sortField: "companyName",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[200px]">{meeting.companyName}</span>
      )
    },
    {
      id: "respondentName",
      name: "Respondent",
      visible: true,
      sortField: "respondentName",
      render: (meeting: Meeting) => (
        <span className="font-medium truncate max-w-[200px]">{meeting.respondentName}</span>
      )
    },
    {
      id: "respondentPosition",
      name: "Position",
      visible: true,
      sortField: "respondentPosition",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[150px]">{meeting.respondentPosition}</span>
      )
    },
    {
      id: "relationshipManager",
      name: "RM",
      visible: true,
      sortField: "relationshipManager",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.relationshipManager}</span>
      )
    },
    {
      id: "salesPerson",
      name: "Recruiter",
      visible: true,
      sortField: "salesPerson",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.salesPerson}</span>
      )
    },
    {
      id: "researcher",
      name: "Researcher",
      visible: true,
      sortField: "researcher",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[120px]">{meeting.researcher || '—'}</span>
      )
    },
    {
      id: "research",
      name: "Research",
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
                  <span className="text-gray-500">Loading...</span>
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
      name: "Date",
      visible: true,
      sortField: "date",
      render: (meeting: Meeting) => (
        <span>{new Date(meeting.date).toLocaleDateString()}</span>
      )
    },
    {
      id: "email",
      name: "Email",
      visible: false,
      sortField: "email",
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[200px]">{(meeting as any).email || '—'}</span>
      )
    },
    {
      id: "notes",
      name: "Notes",
      visible: false,
      render: (meeting: Meeting) => (
        <span className="truncate max-w-[300px]">
          {meeting.notes ? (
            <span className="text-gray-500 italic">Has notes</span>
          ) : (
            <span className="text-gray-400">No notes</span>
          )}
        </span>
      )
    }
  ];

  // Prepare filter configurations
  const filterConfigs = [
    {
      id: "status",
      name: "Status",
      options: [
        { label: "All Statuses", value: "ALL" },
        ...Object.values(MeetingStatus).map(status => ({ 
          label: status, 
          value: status 
        }))
      ],
      value: statusFilter || "ALL",
      onChange: setStatusFilter
    },
    {
      id: "research",
      name: "Research",
      options: [
        { label: "All Researches", value: "ALL" },
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
      name: "RM",
      options: [
        { label: "All RMs", value: "ALL" },
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
      name: "Recruiter",
      options: [
        { label: "All Recruiters", value: "ALL" },
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
      name: "Researcher",
      options: [
        { label: "All Researchers", value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.researcher)
        )).filter(Boolean).sort().map(researcher => ({ 
          label: researcher, 
          value: researcher 
        }))
      ],
      value: researcherFilter || "ALL",
      onChange: setResearcherFilter
    },
    {
      id: "position",
      name: "Position",
      options: [
        { label: "All Positions", value: "ALL" },
        ...Array.from(new Set(
          meetings.map(m => m.respondentPosition)
        )).filter(Boolean).sort().map(position => ({ 
          label: position, 
          value: position 
        }))
      ],
      value: positionFilter || "ALL",
      onChange: setPositionFilter
    }
  ];

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
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Client Meetings</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200"
              onClick={() => setLocation("/meetings/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
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
              <SectionLoader text="Loading meetings..." />
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