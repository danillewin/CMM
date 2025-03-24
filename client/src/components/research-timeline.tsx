import { ChartContainer } from "@/components/ui/chart";
import { getResearchColor, getResearchColorWithoutOpacity } from "@/lib/colors";
import { Research } from "@shared/schema";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface ResearchTimelineProps {
  researches: Research[];
}

export function ResearchTimeline({ researches }: ResearchTimelineProps) {
  // Sort researches by start date
  const sortedResearches = [...researches].sort((a, b) => 
    new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
  );

  const data = sortedResearches.map((research) => ({
    ...research,
    start: new Date(research.dateStart).getTime(),
    end: new Date(research.dateEnd).getTime(),
  }));

  // Find min and max dates for the chart range
  const minDate = Math.min(...data.map(d => d.start));
  const maxDate = Math.max(...data.map(d => d.end));

  // Prepare data for the Gantt chart
  const chartData = data.map((research, index) => ({
    name: research.name,
    team: research.team,
    researcher: research.researcher,
    start: research.start,
    end: research.end,
    index,
    duration: research.end - research.start,
    status: research.status,
    color: getResearchColorWithoutOpacity(index),
  }));

  return (
    <div className="w-full h-[600px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          barSize={30}
          margin={{ top: 20, right: 50, left: 150, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[minDate, maxDate]}
            tickFormatter={(value) => format(value, "MM/dd/yyyy")}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={140}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-4 shadow-sm">
                  <div className="grid gap-2">
                    <div className="font-medium text-lg">{data.name}</div>
                    <div className="grid gap-1">
                      <div className="text-sm">
                        <span className="font-medium">Team:</span> {data.team}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Researcher:</span> {data.researcher}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Status:</span> {data.status}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Duration:</span><br />
                        {format(data.start, "MM/dd/yyyy")} - {format(data.end, "MM/dd/yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="duration"
            name="Duration"
            radius={[4, 4, 4, 4]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}