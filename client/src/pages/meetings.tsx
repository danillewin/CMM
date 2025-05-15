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

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"]
  });

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

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
      case "researcher":
        return meeting.researcher || "";
      case "research":
        return meeting.researchId 
          ? researches.find(r => r.id === meeting.researchId)?.name || ""
          : "";
      case "email":
        return (meeting as any).email || "";
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
          (meeting.researcher?.toLowerCase() || "").includes(search.toLowerCase()) ||
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

  // Get unique statuses for filtering
  const uniqueStatuses = ["ALL", ...Object.values(MeetingStatus)];
  
  // Get unique researches for filtering
  const uniqueResearches = [{ id: null, name: "ALL" }, ...researches];
  
  // Get unique RM/Sales for filtering
  const uniqueManagersSet = new Set<string>(meetings.map(m => m.relationshipManager));
  const uniqueManagers = ["ALL", ...Array.from(uniqueManagersSet)];
  
  const uniqueRecruitersSet = new Set<string>(meetings.map(m => m.salesPerson));
  const uniqueRecruiters = ["ALL", ...Array.from(uniqueRecruitersSet)];

  // Remove debugging code for clarity

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
      render: (meeting: Meeting) => (
        <div className="max-w-[200px] truncate">
          {meeting.researchId ? (
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full mr-2 shadow-sm"
                style={{ backgroundColor: researches.find(r => r.id === meeting.researchId)?.color ?? '#3b82f6' }}
              />
              {researches.find(r => r.id === meeting.researchId)?.name}
            </div>
          ) : '—'}
        </div>
      )
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

  if (isLoading) {
    return <SectionLoader text="Loading meetings..." />;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <Button 
          onClick={() => setLocation("/meetings/new")}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Add Meeting
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search meetings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={researchFilter?.toString() || ""} 
                  onValueChange={(value) => setResearchFilter(value ? Number(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by research" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueResearches.map((research) => (
                      <SelectItem 
                        key={research.id || "all"} 
                        value={research.id?.toString() || "all"}
                      >
                        {research.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={managerFilter} onValueChange={setManagerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by RM" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueManagers.map((manager) => (
                      <SelectItem key={manager} value={manager}>
                        {manager}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueRecruiters.map((recruiter) => (
                      <SelectItem key={recruiter} value={recruiter}>
                        {recruiter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                className="gap-1"
              >
                <FileDown className="h-4 w-4" /> Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToExcel}
                className="gap-1"
              >
                <FileDown className="h-4 w-4" /> Export Excel
              </Button>
            </div>

            <ConfigurableTable
              data={filteredMeetings}
              columns={columns}
              onSort={handleSort}
              sortField={sortBy}
              sortDirection={sortDir}
              onRowClick={handleRowClick}
              rowClassName="cursor-pointer hover:bg-gray-50"
              storeConfigKey="meetings-table"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}