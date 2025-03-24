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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Research Timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResearchTimeline researches={researches} />
        </CardContent>
      </Card>
    </div>
  );
}