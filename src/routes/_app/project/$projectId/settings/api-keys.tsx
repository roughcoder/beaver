import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/settings/api-keys",
)({
  component: ApiKeysSettingsPage,
});

function ApiKeysSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">API keys</h2>
        <p className="text-muted-foreground">Manage API keys (mock UI).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keys</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This section is mocked for now.
        </CardContent>
      </Card>
    </div>
  );
}


