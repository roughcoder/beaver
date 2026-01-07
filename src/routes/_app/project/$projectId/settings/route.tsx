import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/settings")({
  component: ProjectSettingsLayout,
});

function ProjectSettingsLayout() {
  const { projectId } = Route.useParams();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Link
          to="/project/$projectId/settings"
          params={{ projectId }}
          className="rounded-md px-3 py-2 text-sm hover:bg-muted"
          activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-muted" }}
        >
          Project details
        </Link>
        <Link
          to="/project/$projectId/settings/team"
          params={{ projectId }}
          className="rounded-md px-3 py-2 text-sm hover:bg-muted"
          activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-muted" }}
        >
          Team
        </Link>
        <Link
          to="/project/$projectId/settings/api-keys"
          params={{ projectId }}
          className="rounded-md px-3 py-2 text-sm hover:bg-muted"
          activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-muted" }}
        >
          API keys
        </Link>
        <Link
          to="/project/$projectId/settings/danger-zone"
          params={{ projectId }}
          className="rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
          activeProps={{
            className:
              "rounded-md px-3 py-2 text-sm text-destructive bg-muted",
          }}
        >
          Danger zone
        </Link>
      </div>

      <Outlet />
    </div>
  );
}


