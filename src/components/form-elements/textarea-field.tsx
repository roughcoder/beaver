import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useFieldContext } from "@/hooks/form-content";
import { useStore } from "@tanstack/react-form";

interface TextareaFieldProps {
	label: string;
	placeholder?: string;
	description?: string;
	rows?: number;
}

export function TextareaField({
	label,
	placeholder,
	description,
	rows = 4,
}: TextareaFieldProps) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<Field data-invalid={errors.length > 0}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				aria-invalid={errors.length > 0}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError errors={errors} />
		</Field>
	);
}
