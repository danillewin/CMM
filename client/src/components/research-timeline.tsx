import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getResearchColor } from "@/lib/colors";
import { Research } from "@shared/schema";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface ResearchTimelineProps {
  researches: Research[];
}

export function ResearchTimeline({ researches }: ResearchTimelineProps) {
  const data = researches.map((research) => ({
    ...research,
    start: new Date(research.dateStart).getTime(),
    end: new Date(research.dateEnd).getTime(),
  }));

  // Find min and max dates for the chart range
  const minDate = Math.min(...data.map(d => d.start));
  const maxDate = Math.max(...data.map(d => d.end));

  const chartData = data.map((research, index) => ({
    name: research.name,
    team: research.team,
    start: research.start,
    end: research.end,
    index,
    duration: research.end - research.start,
    status: research.status,
  }));

  const config = chartData.reduce((acc, item, index) => ({
    ...acc,
    [item.name]: {
      color: getResearchColor(index),
    },
  }), {});

  return (
    <div className="w-full h-[400px]">
      <ChartContainer config={config}>
        <BarChart
          data={chartData}
          layout="vertical"
          barGap={10}
          barSize={20}
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[minDate, maxDate]}
            tickFormatter={(value) => format(value, "MM/dd/yyyy")}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="font-medium">{data.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Team: {data.team}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(data.start, "MM/dd/yyyy")} - {format(data.end, "MM/dd/yyyy")}
                    </div>
                    <div className="text-xs font-medium">
                      Status: {data.status}
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="duration"
            name="Duration"
            fill="var(--color)"
            radius={[4, 4, 4, 4]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
