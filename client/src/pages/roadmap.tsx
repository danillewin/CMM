import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from "date-fns";
import { getResearchColor } from "@/lib/colors";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ResearchForm from "@/components/research-form";

function getMonthsBetween(startDate: Date, endDate: Date) {
  return eachMonthOfInterval({ start: startDate, end: endDate });
}

function getCardPosition(research: Research, monthWidth: number) {
  const start = new Date(research.dateStart);
  const end = new Date(research.dateEnd);
  const left = start.getDate() * (monthWidth / 31);
  const width = Math.max(
    100,
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) * (monthWidth / 31)
  );
  return { left, width };
}

function getVerticalPosition(research: Research, existingResearches: Research[], index: number): number {
  const current = new Date(research.dateStart);
  const currentEnd = new Date(research.dateEnd);

  // Find overlapping researches that started before this one
  const overlapping = existingResearches.filter((r, i) => {
    if (i >= index) return false;
    const start = new Date(r.dateStart);
    const end = new Date(r.dateEnd);
    return isWithinInterval(current, { start, end }) || 
           isWithinInterval(currentEnd, { start, end }) ||
           isWithinInterval(start, { start: current, end: currentEnd });
  });

  // Return position based on number of overlaps, with more vertical spacing
  return overlapping.length * 100 + 20; // Increased from 80 to 100
}

export default function RoadmapPage() {
  const [showForm, setShowForm] = useState(false);
  const [editResearch, setEditResearch] = useState<Research | null>(null);
  const { toast } = useToast();

  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...research }: Research) => {
      const res = await apiRequest("PATCH", `/api/researches/${id}`, research);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      setShowForm(false);
      setEditResearch(null);
      toast({ title: "Research updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/researches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/researches"] });
      toast({ title: "Research deleted successfully" });
    },
  });

  // Group researches by team
  const researchesByTeam = researches.reduce((acc, research) => {
    if (!acc[research.team]) {
      acc[research.team] = [];
    }
    acc[research.team].push(research);
    return acc;
  }, {} as Record<string, Research[]>);

  // Calculate date range for all researches
  const dates = researches.flatMap(r => [new Date(r.dateStart), new Date(r.dateEnd)]);
  const minDate = dates.length ? startOfMonth(new Date(Math.min(...dates.map(d => d.getTime())))) : new Date();
  const maxDate = dates.length ? endOfMonth(new Date(Math.max(...dates.map(d => d.getTime())))) : addMonths(new Date(), 3);
  const months = getMonthsBetween(minDate, maxDate);

  const monthWidth = 300; // Width in pixels for each month column

  const handleResearchClick = (research: Research) => {
    setEditResearch(research);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Research Roadmap</h1>

        <div className="h-[calc(100vh-12rem)] flex flex-col rounded-lg border bg-white/80 backdrop-blur-sm">
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed team names column */}
            <div className="w-48 shrink-0 border-r bg-white/90 backdrop-blur-sm">
              <div className="h-14 border-b p-4 font-medium">Team</div>
              {Object.keys(researchesByTeam).map((team) => {
                const teamResearches = researchesByTeam[team];
                const maxOverlap = Math.max(...teamResearches.map((_, i) => 
                  getVerticalPosition(teamResearches[i], teamResearches, i)
                ));
                return (
                  <div 
                    key={team} 
                    className="p-4 font-medium border-b"
                    style={{ height: `${maxOverlap + 100}px` }}
                  >
                    {team}
                  </div>
                );
              })}
            </div>

            {/* Scrollable area for both header and content */}
            <ScrollArea className="flex-1">
              <div style={{ width: `${monthWidth * months.length}px` }}>
                {/* Months header */}
                <div className="flex border-b sticky top-0 bg-white/90 backdrop-blur-sm z-10 h-14">
                  {months.map((month, i) => (
                    <div
                      key={i}
                      className="border-r p-4 font-medium text-center shrink-0"
                      style={{ width: monthWidth }}
                    >
                      {format(month, 'MMMM yyyy')}
                    </div>
                  ))}
                </div>

                {/* Timeline content */}
                {Object.entries(researchesByTeam).map(([team, teamResearches]) => {
                  const maxOverlap = Math.max(...teamResearches.map((_, i) => 
                    getVerticalPosition(teamResearches[i], teamResearches, i)
                  ));
                  return (
                    <div 
                      key={team} 
                      className="relative border-b" 
                      style={{ height: `${maxOverlap + 100}px` }}
                    >
                      {teamResearches.map((research, index) => {
                        const { left, width } = getCardPosition(research, monthWidth);
                        const top = getVerticalPosition(research, teamResearches, index);
                        return (
                          <Card
                            key={research.id}
                            className={`absolute p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getResearchColor(research.id)} text-white`}
                            style={{
                              left: left,
                              width: `${width}px`,
                              top: `${top}px`,
                            }}
                            onClick={() => handleResearchClick(research)}
                          >
                            <div className="font-medium truncate">{research.name}</div>
                            <div className="text-sm opacity-90 truncate">
                              {format(new Date(research.dateStart), 'MMM d')} - {format(new Date(research.dateEnd), 'MMM d')}
                            </div>
                            <div className="text-sm opacity-90 truncate">
                              Status: {research.status}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Research Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="w-[90vw] max-w-xl">
            <ResearchForm
              onSubmit={(data) => {
                if (editResearch) {
                  updateMutation.mutate({ ...data, id: editResearch.id });
                }
              }}
              initialData={editResearch}
              isLoading={updateMutation.isPending}
              onCancel={() => {
                setShowForm(false);
                setEditResearch(null);
              }}
              onDelete={editResearch ? () => {
                deleteMutation.mutate(editResearch.id);
                setShowForm(false);
                setEditResearch(null);
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}