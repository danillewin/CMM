import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { isWithinInterval, parseISO } from "date-fns";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Filter researches that are active on the selected date
  const activeResearches = date
    ? researches.filter((research) =>
        isWithinInterval(date, {
          start: parseISO(research.dateStart),
          end: parseISO(research.dateEnd),
        })
      )
    : [];

  // Function to check if a date has any active researches
  const hasActiveResearches = (date: Date) => {
    return researches.some((research) =>
      isWithinInterval(date, {
        start: parseISO(research.dateStart),
        end: parseISO(research.dateEnd),
      })
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Research Calendar</h1>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          {/* Full Calendar View */}
          <Card>
            <CardContent className="p-4">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                modifiers={{
                  hasResearch: (date) => hasActiveResearches(date),
                }}
                modifiersStyles={{
                  hasResearch: {
                    backgroundColor: "var(--primary)",
                    color: "white",
                    borderRadius: "50%",
                  },
                }}
                className="rounded-md border w-full"
                components={{
                  Day: ({ date, ...props }) => (
                    <button
                      {...props}
                      className={cn(
                        props.className,
                        "relative hover:bg-accent",
                        hasActiveResearches(date) && "font-bold text-accent-foreground",
                        props.selected && "text-primary-foreground"
                      )}
                    >
                      {format(date, "d")}
                      {hasActiveResearches(date) && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  ),
                }}
              />
            </CardContent>
          </Card>

          {/* Active Researches List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Researches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeResearches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active researches on {date ? format(date, "PPP") : "selected date"}
                  </p>
                ) : (
                  activeResearches.map((research) => (
                    <Button
                      key={research.id}
                      variant={selectedResearch?.id === research.id ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedResearch(research)}
                    >
                      {research.name}
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Details */}
        <Card>
          {selectedResearch ? (
            <>
              <CardHeader>
                <CardTitle>{selectedResearch.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Team</Label>
                    <p className="text-sm">{selectedResearch.team}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm">{selectedResearch.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <p className="text-sm">
                        {format(parseISO(selectedResearch.dateStart), "PPP")}
                      </p>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <p className="text-sm">
                        {format(parseISO(selectedResearch.dateEnd), "PPP")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center min-h-[400px] text-muted-foreground">
              Select a research to view details
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}