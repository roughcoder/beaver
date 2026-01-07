import { useFieldContext } from "@/hooks/form-content";
import { useStore } from "@tanstack/react-form";
import { Field, FieldError } from "../ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

export function OtpField({
	disabled,
	message,
}: {
	disabled?: boolean;
	message?: string | null;
} = {}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<Field data-invalid={field.state.meta.errors.length > 0}>
			<InputOTP
				maxLength={6}
				data-slot="input-group-control"
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(code) => field.handleChange(code)}
				aria-invalid={errors.length > 0}
				disabled={disabled}
			>
				<InputOTPGroup className="w-full justify-center">
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
			<FieldError errors={errors} />
			{message && <FieldError>{message}</FieldError>}
		</Field>
	);
}
