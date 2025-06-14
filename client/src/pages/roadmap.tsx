import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Research, ResearchStatus } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, parseISO } from "date-fns";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { getResearchColor } from "@/lib/colors";
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

function getCardPosition(research: Research, monthWidth: number, timelineStart: Date) {
  const start = new Date(research.dateStart);
  const end = new Date(research.dateEnd);

  // Calculate days from timeline start to research start
  const daysFromStart = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate the width based on the actual duration in days
  const durationInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  // Convert days to pixels based on month width (assuming 30 days per month)
  const left = (daysFromStart * monthWidth) / 30;
  const width = Math.max(100, (durationInDays * monthWidth) / 30);

  return { left, width };
}

function getCurrentDatePosition(monthWidth: number, timelineStart: Date) {
  const today = new Date();
  const daysFromStart = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
  return (daysFromStart * monthWidth) / 30;
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
  const [viewMode, setViewMode] = useState<ViewMode>("teams");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: researches = [], isLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Get unique teams and researchers for filters
  const teams = [...new Set(researches.map(r => r.team))].filter(Boolean).sort();
  const researchers = [...new Set(researches.map(r => r.researcher))].filter(Boolean).sort();

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

  const [, setLocation] = useLocation();

  const handleResearchClick = (research: Research) => {
    // Navigate to the research detail page instead of showing the form
    setLocation(`/researches/${research.id}`);
  };

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
        <div className="container mx-auto max-w-[1400px] space-y-8">
          <SectionLoader text="Loading roadmap data..." />
        </div>
      </div>
    );
  }

  // Calculate current date line position
  const currentDatePosition = getCurrentDatePosition(monthWidth, minDate);

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
          <div className="flex border-b sticky top-0 bg-white/90 backdrop-blur-sm z-10">
            <div className="w-48 p-4 font-medium border-r">
              {viewMode === "teams" ? "Team" : "Researcher"}
            </div>
            <div className="flex-1 overflow-hidden">
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
          </div>
          
          <div className="overflow-auto flex-1">
            <div className="flex min-w-full">
              <table className="min-w-full">
                <tbody>
                  {Object.entries(groupedResearches).map(([group, groupResearches]) => {
                    const maxOverlap = Math.max(...groupResearches.map((_, i) => 
                      getVerticalPosition(groupResearches[i], groupResearches, i)
                    ));
                    return (
                      <tr key={group}>
                        <td 
                          className="w-48 p-4 font-medium border-r border-b bg-white/90 backdrop-blur-sm sticky left-0"
                          style={{ height: `${maxOverlap + 100}px` }}
                        >
                          {group}
                        </td>
                        <td className="relative border-b" style={{ width: `${monthWidth * months.length}px`, height: `${maxOverlap + 100}px` }}>
                          {/* Current date line */}
                          <div
                            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20"
                            style={{ left: `${currentDatePosition}px` }}
                          />
                          
                          {groupResearches.map((research, index) => {
                            const { left, width } = getCardPosition(research, monthWidth, minDate);
                            const top = getVerticalPosition(research, groupResearches, index);
                            return (
                              <Card
                                key={research.id}
                                className="absolute p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                                style={{
                                  left: `${left}px`,
                                  width: `${width}px`,
                                  top: `${top}px`,
                                  backgroundColor: `${research.color}cc`,
                                }}
                                onClick={() => handleResearchClick(research)}
                              >
                                <div className="font-medium truncate text-white">{research.name}</div>
                                <div className="text-sm opacity-90 truncate text-white">
                                  {viewMode === "teams" ? (
                                    <>Researcher: {research.researcher}</>
                                  ) : (
                                    <>Team: {research.team}</>
                                  )}
                                </div>
                                <div className="text-sm opacity-90 flex items-center gap-1 text-white">
                                  <span>Status:</span>
                                  <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={research.status}>
                                    {research.status}
                                  </span>
                                </div>
                              </Card>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}