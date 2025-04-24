import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Meeting, MeetingStatus, Research } from "@shared/schema";
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
  format,
  startOfDay,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = {
  [MeetingStatus.IN_PROGRESS]: "#3b82f6", // blue-500
  [MeetingStatus.SET]: "#eab308", // yellow-500
  [MeetingStatus.DONE]: "#22c55e", // green-500
  [MeetingStatus.DECLINED]: "#ef4444", // red-500
};

export default function Dashboard() {
  const [researchFilter, setResearchFilter] = useState<number | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [managerFilter, setManagerFilter] = useState<string>("ALL");
  const [researcherFilter, setResearcherFilter] = useState<string>("ALL");

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: researches = [], isLoading: researchesLoading } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  // Get unique teams, managers, and researchers for filters
  const teams = [...new Set(researches.map(r => r.team))].filter(Boolean).sort();
  const managers = [...new Set([
    ...meetings.map(m => m.relationshipManager),
    ...meetings.map(m => m.salesPerson)
  ])].filter(Boolean).sort();

  // Get researchers from researches that have associated meetings
  const researchersWithMeetings = useMemo(() => {
    const meetingResearchIds = new Set(meetings.filter(m => m.researchId).map(m => m.researchId));
    return [...new Set(researches
      .filter(r => meetingResearchIds.has(r.id))
      .map(r => r.researcher))]
      .filter(Boolean)
      .sort();
  }, [meetings, researches]);

  // Filter meetings based on selected filters
  const filteredMeetings = meetings.filter(meeting => {
    if (researchFilter && meeting.researchId !== researchFilter) {
      return false;
    }
    if (teamFilter !== "ALL") {
      const meetingResearch = researches.find(r => r.id === meeting.researchId);
      if (!meetingResearch || meetingResearch.team !== teamFilter) {
        return false;
      }
    }
    if (managerFilter !== "ALL" && meeting.relationshipManager !== managerFilter && meeting.salesPerson !== managerFilter) {
      return false;
    }
    if (researcherFilter !== "ALL") {
      const meetingResearch = researches.find(r => r.id === meeting.researchId);
      if (!meetingResearch || meetingResearch.researcher !== researcherFilter) {
        return false;
      }
    }
    return true;
  });

  // Calculate meetings by status
  const meetingsByStatus = Object.values(MeetingStatus).map((status) => ({
    name: status,
    value: filteredMeetings.filter((m) => m.status === status).length,
  }));

  // Calculate meetings over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subMonths(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = subMonths(startOfDay(date), -1);

    const dayData = {
      name: format(date, 'MMM dd'),
    };

    Object.values(MeetingStatus).forEach(status => {
      dayData[status] = filteredMeetings.filter(m =>
        isWithinInterval(new Date(m.date), { start: dayStart, end: dayEnd }) &&
        m.status === status
      ).length;
    });

    return dayData;
  }).reverse();

  // Calculate top managers with status breakdown
  const managerMeetings = filteredMeetings.reduce((acc, meeting) => {
    // Process RM
    if (meeting.relationshipManager) {
      if (!acc[meeting.relationshipManager]) {
        acc[meeting.relationshipManager] = Object.values(MeetingStatus).reduce((statusAcc, status) => {
          statusAcc[status] = 0;
          return statusAcc;
        }, {});
      }
      acc[meeting.relationshipManager][meeting.status]++;
    }
    
    // Process Recruiters
    if (meeting.salesPerson) {
      if (!acc[meeting.salesPerson]) {
        acc[meeting.salesPerson] = Object.values(MeetingStatus).reduce((statusAcc, status) => {
          statusAcc[status] = 0;
          return statusAcc;
        }, {});
      }
      acc[meeting.salesPerson][meeting.status]++;
    }
    
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const topManagers = Object.entries(managerMeetings)
    .sort(([, a], [, b]) =>
      Object.values(b).reduce((sum, val) => sum + val, 0) -
      Object.values(a).reduce((sum, val) => sum + val, 0)
    )
    .slice(0, 5)
    .map(([name, statusCounts]) => ({
      name,
      ...statusCounts,
    }));

  // Get recent meetings
  const recentMeetings = [...filteredMeetings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (meetingsLoading || researchesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/50 px-6 py-8">
      <div className="container mx-auto max-w-[1400px] space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={researchFilter?.toString() ?? "ALL"}
            onValueChange={(value) => setResearchFilter(value === "ALL" ? null : Number(value))}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
              <SelectValue placeholder="Filter by research" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Researches</SelectItem>
              {researches.map((research) => (
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
              {teams.map((team) => (
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
              {managers.map((manager) => (
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
              {researchersWithMeetings.map((researcher) => (
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
                      data={meetingsByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {meetingsByStatus.map((entry, index) => (
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
                  <BarChart data={last30Days}>
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
                  <BarChart data={topManagers} layout="vertical">
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
                {recentMeetings.map((meeting) => (
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
                        {new Date(meeting.date).toLocaleDateString()}
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