import { ProjectForm } from "@/components/forms/projects/project-form";
import { api, type Id } from "@/convex";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";

export const Route = createFileRoute("/_app/project/$projectId/settings/")({
  component: ProjectDetailsSettingsPage,
});

function ProjectDetailsSettingsPage() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId: id });
  const updateProject = useMutation(api.projects.update);

  if (project === undefined) {
    return <div className="text-muted-foreground">Loading settings…</div>;
  }

  if (project === null) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Project details</h2>
        <p className="text-muted-foreground">
          This project doesn’t exist or you don’t have access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Project details</h2>
        <p className="text-muted-foreground">
          Update your project’s default settings.
        </p>
      </div>

      <ProjectForm
        initialValues={{
          name: project.name,
          description: project.description,
          url: project.url,
          default_region: project.default_region,
          default_language: project.default_language,
        }}
        cancelTo="/project/$projectId"
        cancelParams={{ projectId: id }}
        submitLabel="Save changes"
        submitLoadingLabel="Saving…"
        onSubmit={async (value) => {
          await updateProject({
            projectId: id,
            patch: {
              name: value.name,
              description: value.description,
              url: value.url,
              default_region: value.default_region,
              default_language: value.default_language,
            },
          });
        }}
      />
    </div>
  );
}


