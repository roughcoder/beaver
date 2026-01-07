import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/project/$projectId/settings/team")({
  component: TeamSettingsPage,
});

function TeamSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="text-muted-foreground">
          Manage teammates and roles (mock UI).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This section is mocked for now.
        </CardContent>
      </Card>
    </div>
  );
}


