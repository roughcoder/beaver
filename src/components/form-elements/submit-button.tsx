import { Button } from "@/components/ui/button";
import { useFormContext } from "@/hooks/form-content";

export function SubmitButton({
	label,
	loadingLabel,
	disabled: disabledProp,
}: {
	label: string;
	loadingLabel?: string;
	disabled?: boolean;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(formState) => [formState.canSubmit, formState.isSubmitting]}
		>
			{([canSubmit, isSubmitting, formIsSubmitting]) => (
				<Button
					type="submit"
					disabled={
						disabledProp || !canSubmit || isSubmitting || formIsSubmitting
					}
					className="w-full"
				>
					{isSubmitting || formIsSubmitting ? (loadingLabel ?? label) : label}
				</Button>
			)}
		</form.Subscribe>
	);
}
