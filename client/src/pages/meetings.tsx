import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Meeting, MeetingStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown, FileDown } from "lucide-react";
import * as XLSX from 'xlsx';
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

const getStatusColor = (status: string) => {
  switch (status) {
    case MeetingStatus.NEGOTIATION:
      return "bg-blue-500";
    case MeetingStatus.SET:
      return "bg-yellow-500";
    case MeetingStatus.DONE:
      return "bg-green-500";
    case MeetingStatus.DECLINED:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function Meetings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "respondentName">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showForm, setShowForm] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [pendingMeeting, setPendingMeeting] = useState<Omit<Meeting, "id"> | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const { toast } = useToast();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
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
      'CNUM': meeting.cnum,
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Agenda': meeting.agenda,
      'Status': meeting.status
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
      'CNUM': meeting.cnum,
      'Date': new Date(meeting.date).toLocaleDateString(),
      'Agenda': meeting.agenda,
      'Status': meeting.status
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
         meeting.agenda.toLowerCase().includes(search.toLowerCase())) &&
        (!statusFilter || meeting.status === statusFilter)
    )
    .sort((a, b) => {
      const aVal = sortBy === "date" ? a.date : a.respondentName;
      const bVal = sortBy === "date" ? b.date : b.respondentName;
      return sortDir === "asc"
        ? aVal < bVal ? -1 : 1
        : aVal > bVal ? -1 : 1;
    });

  const toggleSort = (field: "date" | "respondentName") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Client Meetings</h1>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-60">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {Object.values(MeetingStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-xl">
              <MeetingForm
                onSubmit={handleSubmit}
                initialData={editMeeting}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={exportToCSV}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={exportToExcel}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate CNUM Warning</AlertDialogTitle>
            <AlertDialogDescription>
              A meeting with this CNUM already exists. Would you like to create it anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelCreate}>No, don't create</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateAnyway}>Create Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[150px]">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("respondentName")}
                    className="whitespace-nowrap"
                  >
                    Respondent Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[100px]">CNUM</TableHead>
                <TableHead className="min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("date")}
                    className="whitespace-nowrap"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">Agenda</TableHead>
                <TableHead className="min-w-[150px]">Status</TableHead>
                <TableHead className="min-w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(meeting.status)}`} />
                  </TableCell>
                  <TableCell className="font-medium">{meeting.respondentName}</TableCell>
                  <TableCell>{meeting.cnum}</TableCell>
                  <TableCell>
                    {new Date(meeting.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{meeting.agenda}</TableCell>
                  <TableCell>
                    <Select
                      value={meeting.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ id: meeting.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MeetingStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setEditMeeting(meeting);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => deleteMutation.mutate(meeting.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}