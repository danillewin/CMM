import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useMarkdownLive } from "@/components/markdown-live-context";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LiveMarkdownPane() {
  const { activeTitle, value } = useMarkdownLive();

  return (
    <Card className="h-full" data-testid="pane-markdown">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          Live Preview {activeTitle && `- ${activeTitle}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4">
            {value ? (
              <MarkdownRenderer content={value} className="text-sm" />
            ) : (
              <div className="text-gray-400 text-sm text-center py-8">
                Start typing in any markdown field to see live preview
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}