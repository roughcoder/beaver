import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { KeyRound, Settings, ShieldAlert, Users } from "lucide-react";

export const Route = createFileRoute("/_app/project/$projectId/settings")({
  component: ProjectSettingsLayout,
});

function ProjectSettingsLayout() {
  const { projectId } = Route.useParams();
  const navItems = [
    {
      label: "Project details",
      to: "/project/$projectId/settings",
      icon: Settings,
    },
    { label: "Team", to: "/project/$projectId/settings/team", icon: Users },
    {
      label: "API keys",
      to: "/project/$projectId/settings/api-keys",
      icon: KeyRound,
    },
    {
      label: "Danger zone",
      to: "/project/$projectId/settings/danger-zone",
      icon: ShieldAlert,
      tone: "danger",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-wrap items-start justify-start gap-2 border-b pb-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDanger = item.tone === "danger";
          return (
            <Link
              key={item.label}
              to={item.to}
              params={{ projectId }}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isDanger
                  ? "text-destructive hover:bg-muted"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              activeProps={{
                className: `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isDanger
                    ? "text-destructive bg-muted"
                    : "bg-muted text-foreground"
                }`,
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}

