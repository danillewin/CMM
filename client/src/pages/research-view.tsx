import { useQuery } from "@tanstack/react-query";
import { Research } from "@shared/schema";
import { ResearchTimeline } from "@/components/research-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearchView() {
  const { data: researches = [] } = useQuery<Research[]>({
    queryKey: ["/api/researches"],
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Research Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResearchTimeline researches={researches} />
        </CardContent>
      </Card>
    </div>
  );
}
