import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Meeting, MeetingStatus, Research } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, FileDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { getResearchColor } from "@/lib/colors";

export default function Meetings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "respondentName" | "cnum" | "gcc" | "respondentPosition" | "companyName" | "relationshipManager" | "salesPerson" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
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
        (managerFilter === "ALL" || !managerFilter || meeting.relationshipManager === managerFilter || meeting.salesPerson === managerFilter)
    )
    .sort((a, b) => {
      const aVal = sortBy === "date" ? new Date(a.date)
        : sortBy === "cnum" ? a.cnum
        : sortBy === "gcc" ? (a.gcc || "")
        : sortBy === "respondentPosition" ? (a.respondentPosition || "")
        : sortBy === "companyName" ? (a.companyName || "")
        : sortBy === "relationshipManager" ? a.relationshipManager
        : sortBy === "salesPerson" ? a.salesPerson
        : sortBy === "status" ? a.status
        : a.respondentName;
      const bVal = sortBy === "date" ? new Date(b.date)
        : sortBy === "cnum" ? b.cnum
        : sortBy === "gcc" ? (b.gcc || "")
        : sortBy === "respondentPosition" ? (b.respondentPosition || "")
        : sortBy === "companyName" ? (b.companyName || "")
        : sortBy === "relationshipManager" ? b.relationshipManager
        : sortBy === "salesPerson" ? b.salesPerson
        : sortBy === "status" ? b.status
        : b.respondentName;
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const toggleSort = (field: typeof sortBy) => {
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
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
              {Array.from(new Set([
                ...meetings.map(m => m.relationshipManager),
                ...meetings.map(m => m.salesPerson)
              ])).filter(Boolean).sort().map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
                    <TableHead className="w-[12%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("status")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[10%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("cnum")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        CNUM
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[8%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("gcc")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        GCC
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("companyName")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Company
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("respondentName")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Respondent
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[12%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("respondentPosition")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Position
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[10%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("relationshipManager")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        RM
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[10%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("salesPerson")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Recruiter
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%]">Research</TableHead>
                    <TableHead className="w-[10%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("date")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer hover:bg-gray-50/80 transition-all duration-200"
                      onClick={() => handleRowClick(meeting)}
                    >
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="font-medium">{meeting.cnum}</TableCell>
                      <TableCell className="font-medium">{meeting.gcc || '—'}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{meeting.companyName}</TableCell>
                      <TableCell className="font-medium truncate max-w-[200px]">{meeting.respondentName}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{meeting.respondentPosition}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{meeting.relationshipManager}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{meeting.salesPerson}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {meeting.researchId ? (
                          <div className="flex items-center">
                            <div
                              className="w-2 h-2 rounded-full mr-2 shadow-sm"
                              style={{ backgroundColor: researches.find(r => r.id === meeting.researchId)?.color ?? '#3b82f6' }}
                            />
                            {researches.find(r => r.id === meeting.researchId)?.name}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(meeting.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}