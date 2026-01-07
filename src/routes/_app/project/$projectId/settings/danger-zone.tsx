import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api, type Id } from "@/convex";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";

export const Route = createFileRoute(
  "/_app/project/$projectId/settings/danger-zone",
)({
  component: DangerZoneSettingsPage,
});

function DangerZoneSettingsPage() {
  const navigate = useNavigate();
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId: id });
  const removeProject = useMutation(api.projects.remove);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
        <p className="text-muted-foreground">
          Destructive actions can’t be undone.
        </p>
      </div>

      <div className="rounded-lg border border-destructive/30 p-4">
        <div className="flex flex-col gap-2">
          <div className="font-medium">Delete project</div>
          <div className="text-muted-foreground text-sm">
            Permanently delete{" "}
            <span className="font-medium">
              {project?.name ?? "this project"}
            </span>{" "}
            and all of its data.
          </div>

          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete project</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      await removeProject({ projectId: id });
                      navigate({ to: "/projects" });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}


