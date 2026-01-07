import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/")({
  component: ProjectIndex,
});

function ProjectIndex() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          A quick overview of your project (mocked for now).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tracked keywords</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">12</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content pieces</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">8</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg. SERP position</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">14.2</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Mocked activity feed.
        </CardContent>
      </Card>
    </div>
  );
}


