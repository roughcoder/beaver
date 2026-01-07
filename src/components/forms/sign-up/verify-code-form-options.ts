import { formOptions } from "@tanstack/react-form";
import z from "zod";

export const verifyCodeFormOpts = formOptions({
  defaultValues: {
    code: '',
  },
  validators: {
    onChange: z.object({
      code: z.string().length(6, 'Code must be 6 characters long'),
    })
  }
});

