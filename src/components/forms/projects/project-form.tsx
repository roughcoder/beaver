import { useAppForm } from "@/hooks/form";
import { FieldGroup } from "@/components/ui/field";
import {
	projectFormOpts,
	type ProjectFormValues,
} from "./project-form-options";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { LANGUAGES, LOCATIONS } from "@/lib/locations";

export function ProjectForm({
	initialValues,
	onSubmit,
	submitLabel,
	submitLoadingLabel,
	cancelTo = "/projects",
	cancelParams,
}: {
	initialValues?: Partial<ProjectFormValues>;
	onSubmit: (value: ProjectFormValues) => Promise<void>;
	submitLabel: string;
	submitLoadingLabel?: string;
	cancelTo?: string;
	cancelParams?: Record<string, unknown>;
}) {
	const form = useAppForm({
		...projectFormOpts(initialValues),
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card>
				<CardContent className="flex flex-col gap-6">
					<FieldGroup>
						<form.AppField name="name">
							{(field) => (
								<field.TextField label="Name" placeholder="My project" />
							)}
						</form.AppField>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label="Description"
									placeholder="What is this project for?"
								/>
							)}
						</form.AppField>

						<form.AppField name="url">
							{(field) => (
								<field.UrlField label="URL" placeholder="example.com" />
							)}
						</form.AppField>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<form.AppField name="default_region">
								{(field) => (
									<field.SelectField
										label="Location"
										options={LOCATIONS.map((loc) => ({
											label: loc.name,
											value: loc.code.toString(),
										}))}
									/>
								)}
							</form.AppField>

							<form.AppField name="default_language">
								{(field) => (
									<field.SelectField
										label="Language"
										options={LANGUAGES.map((lang) => ({
											label: lang.name,
											value: lang.code,
										}))}
									/>
								)}
							</form.AppField>
						</div>
					</FieldGroup>
				</CardContent>
			</Card>
			<div className={cn("flex mt-4", "justify-between")}>
				<Link
					to={cancelTo}
					params={cancelParams}
					className={buttonVariants({ variant: "ghost" })}
				>
					Cancel
				</Link>
				<form.AppForm>
					<form.SubmitButton
						label={submitLabel}
						loadingLabel={submitLoadingLabel}
					/>
				</form.AppForm>
			</div>
		</form>
	);
}
