import { useQuery } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { getResearchColorWithoutOpacity } from "@/lib/colors";

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
  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
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
                    className={`absolute p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getResearchColorWithoutOpacity(index)} text-white`}
                    style={{
                      left: left,
                      width: `${width}px`,
                      top: `${(index % 2) * 60 + 20}px`,
                    }}
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
    </div>
  );
}