import { ProjectForm } from "@/components/forms/projects/project-form";
import { api, type Id } from "@/convex";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTrigger } from "@/components/ui/stepper";

export const Route = createFileRoute("/_app/projects/new")({
  component: NewProjectPage,
});
const steps = [1, 2, 3, 4];

function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useMutation(api.projects.create);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
					<h1 className="text-3xl font-bold mb-2">New Project</h1>
					<p className="text-muted-foreground mb-6">Create a new project to get started</p>
				</div>
                <Stepper value={1} onValueChange={() => {}}>
					{steps.map((step) => (
						<StepperItem key={step} step={step} className="not-last:flex-1" loading={false}>
							<StepperTrigger asChild>
								<StepperIndicator />
							</StepperTrigger>
							{step < steps.length && <StepperSeparator />}
						</StepperItem>
					))}
				</Stepper>

      <ProjectForm
        submitLabel="Create project"
        submitLoadingLabel="Creating…"
        onSubmit={async (value) => {
          const projectId = await createProject({
            name: value.name,
            description: value.description,
            url: value.url,
            default_region: value.default_region,
            default_language: value.default_language,
          });

          navigate({
            to: "/project/$projectId/settings",
            params: { projectId: projectId as Id<"projects"> },
          });
        }}
      />
 

    </div>
  );
}


