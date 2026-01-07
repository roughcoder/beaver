import { formOptions } from "@tanstack/react-form";
import z from "zod";

export const credentialsFormOpts = formOptions({
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    onChange: z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })
  }
});

