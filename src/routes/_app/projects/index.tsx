import { api, type Id } from "@/convex";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { FolderPlus } from "lucide-react";

export const Route = createFileRoute("/_app/projects/")({
  component: ProjectsIndex,
});

function ProjectsIndex() {
  const projects = useQuery(api.projects.listMine, {});

  if (projects !== undefined && projects.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <Empty className="w-full max-w-md border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderPlus />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              You haven’t created any projects yet. Get started by creating your
              first project.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/projects/new">Create project</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your projects.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">New project</Link>
        </Button>
      </div>

      {projects === undefined ? (
        <div className="text-muted-foreground">Loading projects…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <Link
                    to="/project/$projectId"
                    params={{ projectId: project._id as Id<"projects"> }}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {project.description || "No description"}
                </CardDescription>
                <CardAction>
                  <Button variant="secondary" asChild>
                    <Link
                      to="/project/$projectId/settings"
                      params={{ projectId: project._id as Id<"projects"> }}
                    >
                      Settings
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


