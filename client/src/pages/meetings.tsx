import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Meeting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown } from "lucide-react";
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

export default function Meetings() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "clientName">("date");
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

  const handleSubmit = (data: Omit<Meeting, "id">) => {
    if (editMeeting) {
      updateMutation.mutate({ ...data, id: editMeeting.id });
      return;
    }

    const duplicateMeeting = meetings.find(
      m => m.clientName === data.clientName || m.companyName === data.companyName
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

  const filteredMeetings = meetings
    .filter(
      (meeting) =>
        meeting.clientName.toLowerCase().includes(search.toLowerCase()) ||
        meeting.companyName.toLowerCase().includes(search.toLowerCase()) ||
        meeting.agenda.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = sortBy === "date" ? a.date : a.clientName;
      const bVal = sortBy === "date" ? b.date : b.clientName;
      return sortDir === "asc" 
        ? aVal < bVal ? -1 : 1
        : aVal > bVal ? -1 : 1;
    });

  const toggleSort = (field: "date" | "clientName") => {
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
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Client Meetings</h1>

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          icon={<Search className="h-4 w-4" />}
        />
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <MeetingForm
              onSubmit={handleSubmit}
              initialData={editMeeting}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Meeting Warning</AlertDialogTitle>
            <AlertDialogDescription>
              A meeting with this client name or company name already exists. Would you like to create it anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCreate}>No, don't create</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateAnyway}>Create Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("clientName")}
                  >
                    Client Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("date")}
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Agenda</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>{meeting.clientName}</TableCell>
                  <TableCell>{meeting.companyName}</TableCell>
                  <TableCell>
                    {new Date(meeting.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{meeting.agenda}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
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
                      onClick={() => deleteMutation.mutate(meeting.id)}
                    >
                      Delete
                    </Button>
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