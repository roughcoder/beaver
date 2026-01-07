import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/keywords")({
  component: KeywordsLayout,
});

function KeywordsLayout() {
  return (
    <div className="flex flex-col">
      <Outlet />
    </div>
  );
}

