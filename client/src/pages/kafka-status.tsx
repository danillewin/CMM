import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Settings } from "lucide-react";

interface KafkaStatus {
  enabled: boolean;
  connected: boolean;
  topics: {
    meetings: string;
    researches: string;
  };
  environment: {
    KAFKA_ENABLED: string;
    KAFKA_BROKER: string;
    KAFKA_CLIENT_ID: string;
  };
}

export default function KafkaStatusPage() {
  const { data: kafkaStatus, isLoading, error } = useQuery<KafkaStatus>({
    queryKey: ["/api/kafka/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Kafka Status - Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Failed to fetch Kafka status</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (enabled: boolean, connected: boolean) => {
    if (!enabled) return <Settings className="h-5 w-5 text-gray-500" />;
    if (connected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = (enabled: boolean, connected: boolean) => {
    if (!enabled) return "Disabled";
    if (connected) return "Connected";
    return "Disconnected";
  };

  const getStatusColor = (enabled: boolean, connected: boolean) => {
    if (!enabled) return "secondary";
    if (connected) return "default";
    return "destructive";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Kafka Integration Status</h1>
        <p className="text-gray-600">
          Monitor the status of Kafka integration for completed meetings and researches
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(kafkaStatus?.enabled || false, kafkaStatus?.connected || false)}
              Connection Status
            </CardTitle>
            <CardDescription>
              Current Kafka connection and configuration status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={getStatusColor(kafkaStatus?.enabled || false, kafkaStatus?.connected || false)}>
                {getStatusText(kafkaStatus?.enabled || false, kafkaStatus?.connected || false)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled:</span>
                <span className="text-sm">{kafkaStatus?.enabled ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connected:</span>
                <span className="text-sm">{kafkaStatus?.connected ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Configuration</CardTitle>
            <CardDescription>
              Kafka topics for sending completed entities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Meetings Topic:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {kafkaStatus?.topics.meetings}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Researches Topic:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {kafkaStatus?.topics.researches}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>
              Current environment variables affecting Kafka integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-600">KAFKA_ENABLED</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                    {kafkaStatus?.environment.KAFKA_ENABLED}
                  </code>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">KAFKA_BROKER</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                    {kafkaStatus?.environment.KAFKA_BROKER}
                  </code>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">KAFKA_CLIENT_ID</label>
                <div className="mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                    {kafkaStatus?.environment.KAFKA_CLIENT_ID}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>Automatic Notifications:</strong> When meetings or researches are updated to "Done" status, 
              they are automatically sent to Kafka topics.
            </p>
            <p>
              <strong>Feature Toggle:</strong> Set <code>KAFKA_ENABLED=true</code> in environment variables 
              to enable Kafka integration.
            </p>
            <p>
              <strong>Topics:</strong> Completed meetings go to <code>completed-meetings</code> topic, 
              completed researches go to <code>completed-researches</code> topic.
            </p>
            <p>
              <strong>Message Format:</strong> Each message includes entity data, timestamp, action type 
              (completed/updated), and metadata headers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}