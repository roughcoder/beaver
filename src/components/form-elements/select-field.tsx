import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFieldContext } from "@/hooks/form-content";
import { useStore } from "@tanstack/react-form";

interface Option {
	value: string;
	label: string;
}

interface SelectFieldProps {
	label: string;
	options: Option[];
	placeholder?: string;
	description?: string;
	disabled?: boolean;
	onValueChange?: (value: string) => void;
}

export function SelectField({
	label,
	options,
	placeholder,
	description,
	disabled,
	onValueChange,
}: SelectFieldProps) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	const value = field.state.value ?? "";

	return (
		<Field data-invalid={errors.length > 0}>
			<FieldLabel>{label}</FieldLabel>
			<Select
				value={value}
				onValueChange={(value) => {
					field.handleChange(value);
					onValueChange?.(value);
				}}
				name={field.name}
				disabled={disabled}
			>
				<SelectTrigger aria-invalid={errors.length > 0} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{description ? <FieldDescription>{description}</FieldDescription> : null}
		</Field>
	);
}
