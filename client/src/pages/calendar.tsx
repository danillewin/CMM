import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Research, type Meeting } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { getResearchColor } from "@/lib/colors";

type ViewMode = "researches" | "meetings";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("researches");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const { data: researches = [], isLoading: researchesLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  // Initialize with all research IDs selected
  const [selectedResearchIds, setSelectedResearchIds] = useState<Set<number>>(
    () => new Set(researches.map(r => r.id))
  );

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

  // Get active researches for a specific day
  const getResearchesForDay = (date: Date) => {
    return researches.filter(research => {
      if (selectedResearchIds.size === 0) {
        return false;
      }
      if (!selectedResearchIds.has(research.id)) {
        return false;
      }
      return isWithinInterval(date, {
        start: parseISO(research.dateStart.toString()),
        end: parseISO(research.dateEnd.toString())
      });
    });
  };

  // Get meetings for a specific day
  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(meeting => {
      if (selectedResearchIds.size > 0 && meeting.researchId && !selectedResearchIds.has(meeting.researchId)) {
        return false;
      }
      return isSameDay(new Date(meeting.date), date);
    });
  };


  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const toggleResearchFilter = (id: number) => {
    const newIds = new Set(selectedResearchIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    setSelectedResearchIds(newIds);
  };

  if (researchesLoading || meetingsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-4 sm:px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="grid grid-cols-[250px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>View Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant={viewMode === "researches" ? "default" : "outline"}
                    onClick={() => setViewMode("researches")}
                    className="w-full justify-start"
                  >
                    Researches
                  </Button>
                  <Button 
                    variant={viewMode === "meetings" ? "default" : "outline"}
                    onClick={() => setViewMode("meetings")}
                    className="w-full justify-start"
                  >
                    Meetings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Researches</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {researches.map((research) => (
                      <div key={research.id} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 w-full">
                          <Checkbox
                            id={`research-${research.id}`}
                            checked={selectedResearchIds.has(research.id)}
                            onCheckedChange={() => toggleResearchFilter(research.id)}
                          />
                          <div className="flex items-center flex-1 space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getResearchColor(research.id)}`} />
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
                  const dayResearches = viewMode === "researches" ? getResearchesForDay(day) : [];
                  const dayMeetings = viewMode === "meetings" ? getMeetingsForDay(day) : [];

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
                        {viewMode === "researches" && dayResearches.map((research) => (
                          <div
                            key={research.id}
                            className={`${getResearchColor(research.id)} text-white text-xs p-1 rounded truncate cursor-pointer`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResearch(research);
                            }}
                          >
                            {research.name}
                          </div>
                        ))}
                        {viewMode === "meetings" && dayMeetings.map((meeting) => (
                          <div
                            key={meeting.id}
                            className={`${meeting.researchId ? getResearchColor(meeting.researchId) : 'bg-gray-500'} text-white text-xs p-1 rounded truncate cursor-pointer`}
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

        {/* Research Details Dialog */}
        {selectedResearch && (
          <Card className="fixed bottom-4 right-4 w-96">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedResearch.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResearch(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label>Team</Label>
                  <p className="text-sm">{selectedResearch.team}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedResearch.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start Date</Label>
                    <p className="text-sm">
                      {format(parseISO(selectedResearch.dateStart.toString()), "PP")}
                    </p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="text-sm">
                      {format(parseISO(selectedResearch.dateEnd.toString()), "PP")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meeting Details Dialog */}
        <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
          <DialogContent className="w-[90vw] max-w-xl">
            <MeetingForm
              initialData={selectedMeeting}
              onSubmit={() => {}} // Read-only mode
              onCancel={() => setSelectedMeeting(null)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}