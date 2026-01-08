import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/keywords/research")({
  component: ResearchLayout,
});

function ResearchLayout() {
  return (
      <Outlet />
  );
}

