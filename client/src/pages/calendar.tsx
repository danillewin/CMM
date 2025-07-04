import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Research, type Meeting, ResearchStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO
} from "date-fns";
import MeetingForm from "@/components/meeting-form";


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();


  const { data: researches = [], isLoading: researchesLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...meeting }: Meeting) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, meeting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setSelectedMeeting(null);
      toast({ title: "Meeting updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update meeting",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Initialize with all research IDs selected
  const [selectedResearchIds, setSelectedResearchIds] = useState<Set<number>>(
    () => new Set(researches.map(r => r.id))
  );

  // Get unique teams and researchers for filters
  const teams = [...new Set(researches.map(r => r.team))].sort();
  const researchers = [...new Set(researches.map(r => r.researcher))].sort();

  // Update selectedResearchIds when researches data is loaded
  useMemo(() => {
    if (researches.length > 0) {
      setSelectedResearchIds(new Set(researches.map(r => r.id)));
    }
  }, [researches]);

  // Calculate calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Filter researches based on selected filters
  const filteredResearches = researches.filter(research =>
    (teamFilter === "ALL" || research.team === teamFilter) &&
    (researcherFilter === "ALL" || research.researcher === researcherFilter) &&
    (statusFilter === "ALL" || research.status === statusFilter)
  );

  // Get meetings for a specific day
  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      if (!isSameDay(meetingDate, date)) {
        return false;
      }

      // If there's no associated research, skip filter checks
      if (!meeting.researchId) {
        return false;
      }

      // Find the associated research
      const research = researches.find(r => r.id === meeting.researchId);
      if (!research) {
        return false;
      }

      // Apply filters
      if (teamFilter !== "ALL" && research.team !== teamFilter) {
        return false;
      }
      if (researcherFilter !== "ALL" && research.researcher !== researcherFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && research.status !== statusFilter) {
        return false;
      }

      // Check if the research is selected in the checkbox list
      return selectedResearchIds.has(meeting.researchId);
    });
  };

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));


  if (researchesLoading || meetingsLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <SectionLoader text="Loading calendar data..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={researcherFilter} onValueChange={setResearcherFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by researcher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Researchers</SelectItem>
                  {researchers.map((researcher) => (
                    <SelectItem key={researcher} value={researcher}>{researcher}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.values(ResearchStatus).map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Researches</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-4">
                  {filteredResearches.map((research) => (
                    <div key={research.id} className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 w-full">
                        <Checkbox
                          id={`research-${research.id}`}
                          checked={selectedResearchIds.has(research.id)}
                          onCheckedChange={() => {
                            const newIds = new Set(selectedResearchIds);
                            if (newIds.has(research.id)) {
                              newIds.delete(research.id);
                            } else {
                              newIds.add(research.id);
                            }
                            setSelectedResearchIds(newIds);
                          }}
                        />
                        <div className="flex items-center flex-1 space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: research.color }}
                          />
                          <Label
                            htmlFor={`research-${research.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {research.name}
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-px bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-muted">
              {calendarDays.map((day) => {
                const dayMeetings = getMeetingsForDay(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] bg-card p-2 ${
                      !isSameMonth(day, currentDate) ? "text-muted-foreground" : ""
                    } ${
                      isSameDay(day, selectedDate || new Date())
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    <div className="mt-1 space-y-1">
                      {dayMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className={`text-white text-xs p-1 rounded truncate cursor-pointer`}
                          style={{
                            backgroundColor: `${researches.find(r => r.id === meeting.researchId)?.color ?? '#3b82f6'}cc`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeeting(meeting);
                          }}
                        >
                          {meeting.respondentName} - {meeting.companyName || 'No company'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Details Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="w-[90vw] max-w-xl">
          <MeetingForm
            initialData={selectedMeeting}
            onSubmit={(data) => {
              if (selectedMeeting) {
                updateMutation.mutate({ ...data, id: selectedMeeting.id });
              }
            }}
            isLoading={updateMutation.isPending}
            onCancel={() => setSelectedMeeting(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}