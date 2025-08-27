import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Research, type Meeting, type CalendarMeeting, type CalendarResearch, ResearchStatus } from "@shared/schema";
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
import { useTranslation } from "react-i18next";
import ResearcherFilterManager from "@/components/researcher-filter-manager";


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeeting | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();
  const { t } = useTranslation();


  // Calculate date range for current month
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  // Use optimized calendar endpoints for minimal data
  const { data: researchesResponse, isLoading: researchesLoading } = useQuery<{ data: CalendarResearch[] }>({
    queryKey: ["/api/calendar/researches", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () => fetch(`/api/calendar/researches?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`).then(res => res.json()),
  });

  const { data: meetingsResponse, isLoading: meetingsLoading } = useQuery<{ data: CalendarMeeting[] }>({
    queryKey: ["/api/calendar/meetings", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () => fetch(`/api/calendar/meetings?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`).then(res => res.json()),
  });

  // Separate query for full meeting details when clicked
  const { data: fullMeetingData, isLoading: fullMeetingLoading } = useQuery<Meeting>({
    queryKey: ["/api/meetings", selectedMeeting?.id],
    queryFn: () => fetch(`/api/meetings/${selectedMeeting?.id}`).then(res => res.json()),
    enabled: !!selectedMeeting?.id,
  });

  const researches = researchesResponse?.data || [];
  const meetings = meetingsResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...meeting }: Meeting) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, meeting);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both calendar and full meeting queries
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/meetings", monthStart.toISOString(), monthEnd.toISOString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", selectedMeeting?.id] });
      setSelectedMeeting(null);
      toast({ title: t("meeting_updated_successfully") });
    },
    onError: (error: Error) => {
      toast({
        title: t("failed_to_update_meeting"),
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
  const teams = Array.from(new Set(researches.map(r => r.team))).sort();
  const researchers = Array.from(new Set(researches.map(r => r.researcher))).sort();

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


  // Don't show full page loading - we'll show inline loading states instead

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{t("calendar.title", "Calendar")}</h1>
          <ResearcherFilterManager
            pageType="calendar"
            currentFilters={{
              teamFilter,
              researcherFilter,
              statusFilter,
            }}
            onApplyFilter={(filters) => {
              if (filters.teamFilter !== undefined) setTeamFilter(filters.teamFilter);
              if (filters.researcherFilter !== undefined) setResearcherFilter(filters.researcherFilter);
              if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter);
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Фильтр по команде" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все команды</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={researcherFilter} onValueChange={setResearcherFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Фильтр по исследователю" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все исследователи</SelectItem>
                  {researchers.map((researcher) => (
                    <SelectItem key={researcher} value={researcher}>{researcher}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все статусы</SelectItem>
                  {Object.values(ResearchStatus).map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Исследования</CardTitle>
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
              {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            {(researchesLoading || meetingsLoading) ? (
              <div className="flex items-center justify-center h-64 bg-card">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Загрузка данных календаря...</span>
                </div>
              </div>
            ) : (
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
                          {meeting.respondentName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meeting Details Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="w-[90vw] max-w-xl">
          {fullMeetingLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm text-muted-foreground">{t("loading_meeting_details")}...</span>
              </div>
            </div>
          ) : fullMeetingData ? (
            <MeetingForm
              initialData={fullMeetingData}
              onSubmit={(data) => {
                updateMutation.mutate({ 
                  ...data, 
                  id: fullMeetingData.id,
                  gcc: data.gcc || null,
                  email: data.email || null,
                  companyName: data.companyName || null,
                  researcher: data.researcher || null,
                  fullText: data.fullText || null,
                  notes: data.notes || null
                });
              }}
              isLoading={updateMutation.isPending}
              onCancel={() => setSelectedMeeting(null)}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{t("error_loading_meeting")}</p>
              <Button 
                onClick={() => setSelectedMeeting(null)}
                className="mt-4"
              >
                {t("close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}