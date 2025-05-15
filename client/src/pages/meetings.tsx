import { useState } from "react";
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
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Status': meeting.status,
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
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Status': meeting.status,
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
          meeting.status.toLowerCase().includes(search.toLowerCase()) ||
          new Date(meeting.date).toLocaleDateString().toLowerCase().includes(search.toLowerCase()) ||
          (meeting.researchId && researches.find(r => r.id === meeting.researchId)?.name.toLowerCase().includes(search.toLowerCase()))) &&
        (statusFilter === "ALL" || !statusFilter || meeting.status === statusFilter) &&
        (!researchFilter || meeting.researchId === researchFilter) &&
        (managerFilter === "ALL" || !managerFilter || meeting.relationshipManager === managerFilter) &&
        (recruiterFilter === "ALL" || !recruiterFilter || meeting.salesPerson === recruiterFilter)
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

        <div className="mb-4">
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(MeetingStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={researchFilter?.toString() ?? "ALL"}
            onValueChange={(value) => setResearchFilter(value === "ALL" ? null : Number(value))}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by research" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Researches</SelectItem>
              {researches.map((research) => (
                <SelectItem key={research.id} value={research.id.toString()}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${getResearchColor(research.id)} mr-2`} />
                    {research.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by RM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All RM</SelectItem>
              {Array.from(new Set(
                meetings.map(m => m.relationshipManager)
              )).filter(Boolean).sort().map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by Recruiter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Recruiters</SelectItem>
              {Array.from(new Set(
                meetings.map(m => m.salesPerson)
              )).filter(Boolean).sort().map((recruiter) => (
                <SelectItem key={recruiter} value={recruiter}>
                  {recruiter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}