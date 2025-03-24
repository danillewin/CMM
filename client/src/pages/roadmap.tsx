import { useQuery } from "@tanstack/react-query";
import { type Research } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getResearchColor } from "@/lib/colors";

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

  // Calculate timeline data
  const timelineData = Object.entries(researchesByTeam).map(([team, teamResearches]) => {
    return {
      team,
      researches: teamResearches.map((research, index) => ({
        ...research,
        startTime: new Date(research.dateStart).getTime(),
        endTime: new Date(research.dateEnd).getTime(),
        color: getResearchColor(index),
      })),
    };
  });

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Research Roadmap</h1>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="min-h-[300px] h-[50px_*_${Math.max(8, timelineData.length)}]">
          <ChartContainer
            config={{
              data: {
                theme: {
                  light: "var(--background)",
                  dark: "var(--background)",
                },
              },
            }}
          >
            <BarChart
              data={timelineData}
              layout="vertical"
              barGap={0}
              barSize={20}
              margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis
                type="category"
                dataKey="team"
                width={140}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const research = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{research.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(research.dateStart).toLocaleDateString()} - {new Date(research.dateEnd).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Status: {research.status}</p>
                    </div>
                  );
                }}
              />
              {timelineData.map((teamData) =>
                teamData.researches.map((research) => (
                  <Bar
                    key={research.id}
                    dataKey={() => [research.startTime, research.endTime]}
                    fill={research.color}
                    name={research.name}
                  />
                ))
              )}
            </BarChart>
          </ChartContainer>
        </div>
      </ScrollArea>
    </div>
  );
}
