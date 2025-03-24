import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
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
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Research Roadmap</h1>

      {/* Months header */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        <div className="w-48 shrink-0 border-r p-4 font-medium">Team</div>
        <div className="flex">
          {months.map((month, i) => (
            <div
              key={i}
              className="border-r p-4 font-medium text-center"
              style={{ width: monthWidth }}
            >
              {format(month, 'MMMM yyyy')}
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        {/* Teams and their researches */}
        {Object.entries(researchesByTeam).map(([team, teamResearches]) => (
          <div key={team} className="flex border-b min-h-[200px]">
            <div className="w-48 shrink-0 border-r p-4 font-medium">
              {team}
            </div>
            <div className="relative flex">
              {months.map((month, i) => (
                <div
                  key={i}
                  className="border-r"
                  style={{ width: monthWidth }}
                />
              ))}
              {/* Research cards */}
              {teamResearches.map((research, index) => {
                const { left, width } = getCardPosition(research, monthWidth);
                return (
                  <Card
                    key={research.id}
                    className={`absolute p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getResearchColor(research.id)} text-white`}
                    style={{
                      left: left,
                      width: `${width}px`,
                      top: `${(index % 2) * 60 + 20}px`,
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
          </div>
        ))}
      </ScrollArea>

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
  );
}