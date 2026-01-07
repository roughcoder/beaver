import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <Outlet />
    </div>
  );
}


