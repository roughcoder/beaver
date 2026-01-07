import { formOptions } from "@tanstack/react-form";
import z from "zod";

export const verifyFormOpts = formOptions({
  defaultValues: {
    code: '',
    newPassword: '',
  },
  validators: {
    onChange: z.object({
      code: z.string().length(6, 'Code must be 6 characters long'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    })
  }
});

