import { useQuery } from "@tanstack/react-query";
import { Meeting, MeetingStatus } from "@shared/schema";
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
import { startOfDay, subDays, format, isWithinInterval } from "date-fns";

const COLORS = {
  [MeetingStatus.NEGOTIATION]: "#eab308", // yellow-500
  [MeetingStatus.SET]: "#3b82f6", // blue-500
  [MeetingStatus.DONE]: "#22c55e", // green-500
  [MeetingStatus.DECLINED]: "#ef4444", // red-500
};

export default function Dashboard() {
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Calculate meetings by status
  const meetingsByStatus = Object.values(MeetingStatus).map((status) => ({
    name: status,
    value: meetings.filter((m) => m.status === status).length,
  }));

  // Calculate meetings over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = subDays(startOfDay(date), -1);

    const dayData = {
      name: format(date, 'MMM dd'),
    };

    // Add count for each status
    Object.values(MeetingStatus).forEach(status => {
      dayData[status] = meetings.filter(m => 
        isWithinInterval(new Date(m.date), { start: dayStart, end: dayEnd }) &&
        m.status === status
      ).length;
    });

    return dayData;
  }).reverse();

  // Calculate top managers with status breakdown
  const managerMeetings = meetings.reduce((acc, meeting) => {
    if (!acc[meeting.manager]) {
      acc[meeting.manager] = Object.values(MeetingStatus).reduce((statusAcc, status) => {
        statusAcc[status] = 0;
        return statusAcc;
      }, {});
    }
    acc[meeting.manager][meeting.status]++;
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
  const recentMeetings = [...meetings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meetings by Status */}
        <Card>
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

        {/* Meetings Over Time */}
        <Card>
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

        {/* Top Managers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Managers</CardTitle>
            <CardDescription>Managers with the most meetings by status</CardDescription>
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

        {/* Recent Meetings */}
        <Card>
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
  );
}