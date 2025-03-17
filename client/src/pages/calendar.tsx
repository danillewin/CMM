import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResearchIds, setSelectedResearchIds] = useState<Set<number>>(new Set());
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Calculate calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get active researches for a specific day
  const getResearchesForDay = (date: Date) => {
    return researches.filter(research => {
      if (selectedResearchIds.size > 0 && !selectedResearchIds.has(research.id)) {
        return false;
      }
      return isWithinInterval(date, {
        start: parseISO(research.dateStart),
        end: parseISO(research.dateEnd)
      });
    });
  };

  // Generate random color for research (you might want to store this in the database later)
  const getResearchColor = (id: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500"
    ];
    return colors[id % colors.length];
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Researches</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {researches.map((research) => (
                    <div key={research.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`research-${research.id}`}
                        checked={selectedResearchIds.size === 0 || selectedResearchIds.has(research.id)}
                        onCheckedChange={() => toggleResearchFilter(research.id)}
                      />
                      <Label
                        htmlFor={`research-${research.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {research.name}
                      </Label>
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
              {calendarDays.map((day, index) => {
                const dayResearches = getResearchesForDay(day);
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
                      {dayResearches.map((research) => (
                        <div
                          key={research.id}
                          className={`${getResearchColor(
                            research.id
                          )} text-white text-xs p-1 rounded truncate cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResearch(research);
                          }}
                        >
                          {research.name}
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
                    {format(parseISO(selectedResearch.dateStart), "PP")}
                  </p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-sm">
                    {format(parseISO(selectedResearch.dateEnd), "PP")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}