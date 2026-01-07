import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { useFieldContext } from "@/hooks/form-content";
import { useStore } from "@tanstack/react-form";

interface CheckboxFieldProps {
	label: string;
	description?: string;
}

export function CheckboxField({ label, description }: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<Field data-invalid={errors.length > 0}>
			<div className="flex items-center gap-2">
				<Checkbox
					id={field.name}
					name={field.name}
					checked={field.state.value ?? false}
					onCheckedChange={(checked) => field.handleChange(checked as boolean)}
					onBlur={field.handleBlur}
					aria-invalid={errors.length > 0}
				/>
				<FieldLabel htmlFor={field.name} className="font-normal cursor-pointer">
					{label}
				</FieldLabel>
			</div>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError errors={errors} />
		</Field>
	);
}
