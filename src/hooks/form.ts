import { CheckboxField } from "@/components/form-elements/checkbox-field";
import { OtpField } from "@/components/form-elements/otp-field";
import { SelectField } from "@/components/form-elements/select-field";
import { SubmitButton } from "@/components/form-elements/submit-button";
import { TextField } from "@/components/form-elements/text-field";
import { TextareaField } from "@/components/form-elements/textarea-field";
import { UrlField } from "@/components/form-elements/url-field";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		OtpField,
		UrlField,
		SelectField,
		TextareaField,
		CheckboxField,
	},
	formComponents: {
		SubmitButton,
	},
	fieldContext,
	formContext,
});
