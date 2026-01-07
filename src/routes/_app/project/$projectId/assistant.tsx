import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Assistant</h2>
        <p className="text-muted-foreground">
          AI-powered assistant for your project (coming soon).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistant</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This feature is under development. Check back soon for AI-powered
          assistance with your project.
        </CardContent>
      </Card>
    </div>
  );
}

