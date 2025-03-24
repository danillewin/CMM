import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Research, ResearchStatus } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, parseISO } from "date-fns";
import { getResearchColor } from "@/lib/colors";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ResearchForm from "@/components/research-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewMode = "teams" | "researchers";

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
  return overlapping.length * 100 + 20; 
}

export default function RoadmapPage() {
  const [showForm, setShowForm] = useState(false);
  const [editResearch, setEditResearch] = useState<Research | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("teams");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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

  // Get unique teams and researchers for filters
  const teams = [...new Set(researches.map(r => r.team))].sort();
  const researchers = [...new Set(researches.map(r => r.researcher))].sort();

  // Filter researches
  const filteredResearches = researches.filter(research => 
    (teamFilter === "ALL" || research.team === teamFilter) &&
    (researcherFilter === "ALL" || research.researcher === researcherFilter) &&
    (statusFilter === "ALL" || research.status === statusFilter)
  );

  // Group researches based on view mode
  const groupedResearches = filteredResearches.reduce((acc, research) => {
    const key = viewMode === "teams" ? research.team : research.researcher;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(research);
    return acc;
  }, {} as Record<string, Research[]>);


  // Calculate date range for all researches
  const dates = researches.flatMap(r => [new Date(r.dateStart), new Date(r.dateEnd)]);
  const minDate = dates.length ? startOfMonth(new Date(Math.min(...dates.map(d => d.getTime())))) : new Date();
  const maxDate = dates.length ? endOfMonth(new Date(Math.max(...dates.map(d => d.getTime())))) : addMonths(new Date(), 3);
  const months = getMonthsBetween(minDate, maxDate);

  const monthWidth = 300; 

  const handleResearchClick = (research: Research) => {
    setEditResearch(research);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Research Roadmap</h1>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="teams">Group by Teams</TabsTrigger>
              <TabsTrigger value="researchers">Group by Researchers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
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
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
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
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(ResearchStatus).map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-[calc(100vh-12rem)] flex flex-col rounded-lg border bg-white/80 backdrop-blur-sm">
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed names column */}
            <div className="w-48 shrink-0 border-r bg-white/90 backdrop-blur-sm">
              <div className="h-14 border-b p-4 font-medium">
                {viewMode === "teams" ? "Team" : "Researcher"}
              </div>
              {Object.keys(groupedResearches).map((group) => {
                const groupResearches = groupedResearches[group];
                const maxOverlap = Math.max(...groupResearches.map((_, i) => 
                  getVerticalPosition(groupResearches[i], groupResearches, i)
                ));
                return (
                  <div 
                    key={group} 
                    className="p-4 font-medium border-b"
                    style={{ height: `${maxOverlap + 100}px` }}
                  >
                    {group}
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
                {Object.entries(groupedResearches).map(([group, groupResearches]) => {
                  const maxOverlap = Math.max(...groupResearches.map((_, i) => 
                    getVerticalPosition(groupResearches[i], groupResearches, i)
                  ));
                  return (
                    <div 
                      key={group} 
                      className="relative border-b" 
                      style={{ height: `${maxOverlap + 100}px` }}
                    >
                      {groupResearches.map((research, index) => {
                        const { left, width } = getCardPosition(research, monthWidth);
                        const top = getVerticalPosition(research, groupResearches, index);
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
                              {viewMode === "teams" ? (
                                <>Researcher: {research.researcher}</>
                              ) : (
                                <>Team: {research.team}</>
                              )}
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