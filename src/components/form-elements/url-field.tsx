import { useFieldContext } from "@/hooks/form-content";
import { useStore } from "@tanstack/react-form";
import { AlertTriangle } from "lucide-react";
import { Field, FieldLabel } from "../ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "../ui/input-group";
import { TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";

export function UrlField({
	label,
	placeholder,
}: {
	label: string;
	placeholder?: string;
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<Field data-invalid={field.state.meta.errors.length > 0}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>https://</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					id={field.name}
					name={field.name}
					value={field.state.value}
					onBlur={field.handleBlur}
					onChange={(e) => field.handleChange(e.target.value)}
					placeholder={placeholder}
					aria-invalid={errors.length > 0}
				/>
				{errors.length > 0 && (
					<InputGroupAddon align="inline-end">
						<Tooltip>
							<TooltipTrigger asChild>
								<AlertTriangle className="text-destructive" />
							</TooltipTrigger>
							<TooltipContent>
								<p>{errors[0]?.message}</p>
							</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
				)}
			</InputGroup>
			{/* <FieldDescription>Enter your email address to login.</FieldDescription> */}
			{/* <FieldError errors={field.state.meta.errors}></FieldError> */}
		</Field>
	);
}
