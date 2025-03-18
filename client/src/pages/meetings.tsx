import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import MeetingForm from "@/components/meeting-form";
import * as XLSX from 'xlsx';
import { getResearchColor } from "@/lib/colors";


export default function Meetings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "respondentName" | "cnum" | "respondentPosition" | "companyName" | "manager" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showForm, setShowForm] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [pendingMeeting, setPendingMeeting] = useState<Omit<Meeting, "id"> | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const { toast } = useToast();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  const createMutation = useMutation({
    mutationFn: async (meeting: Omit<Meeting, "id">) => {
      const res = await apiRequest("POST", "/api/meetings", meeting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setShowForm(false);
      setPendingMeeting(null);
      toast({ title: "Meeting created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...meeting }: Meeting) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, meeting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setShowForm(false);
      setEditMeeting(null);
      toast({ title: "Meeting updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting deleted successfully" });
    },
  });

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
  });

  const handleSubmit = (data: Omit<Meeting, "id">) => {
    if (editMeeting) {
      updateMutation.mutate({ ...data, id: editMeeting.id });
      return;
    }

    const duplicateMeeting = meetings.find(
      m => m.cnum === data.cnum
    );

    if (duplicateMeeting) {
      setPendingMeeting(data);
      setShowDuplicateWarning(true);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCreateAnyway = () => {
    if (pendingMeeting) {
      createMutation.mutate(pendingMeeting);
    }
    setShowDuplicateWarning(false);
  };

  const handleCancelCreate = () => {
    setShowDuplicateWarning(false);
    setPendingMeeting(null);
  };

  const exportToCSV = () => {
    const csvContent = filteredMeetings.map(meeting => ({
      'Respondent Name': meeting.respondentName,
      'Position': meeting.respondentPosition,
      'CNUM': meeting.cnum,
      'Company Name': meeting.companyName,
      'Manager': meeting.manager,
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
      'Respondent Name': meeting.respondentName,
      'Position': meeting.respondentPosition,
      'CNUM': meeting.cnum,
      'Company Name': meeting.companyName,
      'Manager': meeting.manager,
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Status': meeting.status,
      'Research': meeting.researchId ? researches.find(r => r.id === meeting.researchId)?.name : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Meetings');
    XLSX.writeFile(wb, `meetings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredMeetings = meetings
    .filter(
      (meeting) =>
        (meeting.respondentName.toLowerCase().includes(search.toLowerCase()) ||
          meeting.cnum.toLowerCase().includes(search.toLowerCase()) ||
          (meeting.companyName?.toLowerCase() || "").includes(search.toLowerCase())) &&
        (statusFilter === "ALL" || !statusFilter || meeting.status === statusFilter) &&
        (!researchFilter || meeting.researchId === researchFilter)
    )
    .sort((a, b) => {
      const aVal = sortBy === "date" ? new Date(a.date)
        : sortBy === "cnum" ? a.cnum
        : sortBy === "respondentPosition" ? (a.respondentPosition || "")
        : sortBy === "companyName" ? (a.companyName || "")
        : sortBy === "manager" ? a.manager
        : sortBy === "status" ? a.status
        : a.respondentName;
      const bVal = sortBy === "date" ? new Date(b.date)
        : sortBy === "cnum" ? b.cnum
        : sortBy === "respondentPosition" ? (b.respondentPosition || "")
        : sortBy === "companyName" ? (b.companyName || "")
        : sortBy === "manager" ? b.manager
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
    setEditMeeting(meeting);
    setShowForm(true);
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
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  New Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-xl">
                <MeetingForm
                  onSubmit={handleSubmit}
                  initialData={editMeeting}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  onCancel={() => {
                    setShowForm(false);
                    setEditMeeting(null);
                  }}
                  onDelete={editMeeting ? () => {
                    deleteMutation.mutate(editMeeting.id);
                    setShowForm(false);
                    setEditMeeting(null);
                  } : undefined}
                />
              </DialogContent>
            </Dialog>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <TableHead className="w-[15%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("companyName")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Company Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("respondentName")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Respondent Name
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
                    <TableHead className="w-[12%]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("manager")}
                        className="whitespace-nowrap hover:text-primary transition-colors duration-200"
                      >
                        Manager
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
                      <TableCell className="truncate max-w-[200px]">{meeting.companyName}</TableCell>
                      <TableCell className="font-medium truncate max-w-[200px]">{meeting.respondentName}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{meeting.respondentPosition}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{meeting.manager}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {meeting.researchId ? (
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${getResearchColor(meeting.researchId)} mr-2 shadow-sm`} />
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

        <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <AlertDialogContent className="bg-white/90 backdrop-blur-sm shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">Duplicate CNUM Warning</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                A meeting with this CNUM already exists. Would you like to create it anyway?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="bg-white hover:bg-gray-50/80 transition-all duration-200">No, don't create</AlertDialogCancel>
              <AlertDialogAction className="bg-primary hover:bg-primary/90 transition-all duration-200">Create Anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}