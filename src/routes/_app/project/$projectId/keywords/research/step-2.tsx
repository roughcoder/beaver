import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  jobId: z.string().optional(),
  locationCode: z.string().optional(),
  languageCode: z.string().optional(),
  device: z.string().optional(),
});

export const Route = createFileRoute(
  "/_app/project/$projectId/keywords/research/step-2"
)({
  validateSearch: searchSchema,
  component: ResearchStep2Redirect,
});

function ResearchStep2Redirect() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();

  return (
    <Navigate
      to="/project/$projectId/keywords/research"
      params={{ projectId }}
      search={search}
    />
  );
}

