import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/keywords/research/step-1"
)({
  component: ResearchStep1Redirect,
});

function ResearchStep1Redirect() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();

  return (
    <Navigate
      to="/project/$projectId/keywords/research/add"
      params={{ projectId }}
      search={search}
    />
  );
}

