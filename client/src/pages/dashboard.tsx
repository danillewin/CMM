import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MeetingStatus } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionLoader } from "@/components/ui/loading-spinner";

const COLORS = {
  [MeetingStatus.IN_PROGRESS]: "#3b82f6", // blue-500
  [MeetingStatus.SET]: "#eab308", // yellow-500
  [MeetingStatus.DONE]: "#22c55e", // green-500
  [MeetingStatus.DECLINED]: "#ef4444", // red-500
};

type DashboardData = {
  year: number;
  filters: {
    teams: string[];
    managers: string[];
    researchers: string[];
    researches: { id: number; name: string }[];
  };
  analytics: {
    meetingsByStatus: { name: string; value: number }[];
    meetingsOverTime: Array<{ name: string; SET: number; IN_PROGRESS: number; DONE: number; DECLINED: number }>;
    topManagers: Array<{ name: string; SET: number; IN_PROGRESS: number; DONE: number; DECLINED: number }>;
    recentMeetings: Array<{ id: number; respondentName: string; companyName: string; date: string; status: string }>;
  };
};

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [managerFilter, setManagerFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");

  // Generate available years (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", selectedYear, researchFilter, teamFilter, managerFilter, researcherFilter],
    queryFn: ({ queryKey }) => {
      const [, year, researchId, team, manager, researcher] = queryKey;
      const params = new URLSearchParams();
      params.append('year', year.toString());
      if (researchId) params.append('researchFilter', researchId.toString());
      if (team && team !== 'ALL') params.append('teamFilter', team.toString());
      if (manager && manager !== 'ALL') params.append('managerFilter', manager.toString());
      if (researcher && researcher !== 'ALL') params.append('researcherFilter', researcher.toString());
      
      return fetch(`/api/dashboard?${params.toString()}`).then(res => res.json());
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
        <div className="container mx-auto max-w-[1400px] space-y-8">
          <SectionLoader text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  const { filters, analytics } = dashboardData;



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={researchFilter?.toString() ?? "ALL"}
            onValueChange={(value) => setResearchFilter(value === "ALL" ? null : Number(value))}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by research" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Researches</SelectItem>
              {filters.researches.map((research) => (
                <SelectItem key={research.id} value={research.id.toString()}>
                  {research.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={teamFilter}
            onValueChange={setTeamFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Teams</SelectItem>
              {filters.teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={managerFilter}
            onValueChange={setManagerFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by RM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All RM</SelectItem>
              {filters.managers.map((manager) => (
                <SelectItem key={manager} value={manager}>
                  {manager}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={researcherFilter}
            onValueChange={setResearcherFilter}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by researcher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Researchers</SelectItem>
              {filters.researchers.map((researcher) => (
                <SelectItem key={researcher} value={researcher}>
                  {researcher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Meetings by Status</CardTitle>
              <CardDescription>Distribution of meetings across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.meetingsByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.meetingsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof MeetingStatus]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Meetings Over Time</CardTitle>
              <CardDescription>Number of meetings in the last 30 days by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.meetingsOverTime}>
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={4}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {Object.entries(MeetingStatus).map(([key, status]) => (
                      <Bar
                        key={status}
                        dataKey={status}
                        stackId="status"
                        fill={COLORS[status as keyof typeof MeetingStatus]}
                        name={status}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top RM</CardTitle>
              <CardDescription>RM with the most meetings by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topManagers} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    {Object.entries(MeetingStatus).map(([key, status]) => (
                      <Bar
                        key={status}
                        dataKey={status}
                        stackId="status"
                        fill={COLORS[status as keyof typeof MeetingStatus]}
                        name={status}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Last 5 scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium">{meeting.respondentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {meeting.companyName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {meeting.date}
                      </div>
                      <div
                        style={{ color: COLORS[meeting.status as keyof typeof MeetingStatus] }}
                        className="text-sm font-medium"
                      >
                        {meeting.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}