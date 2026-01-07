import { formOptions } from "@tanstack/react-form";
import z from "zod";

export const requestFormOpts = formOptions({
  defaultValues: {
    email: '',
  },
  validators: {
    onChange: z.object({
      email: z.string().email('Please enter a valid email address'),
    })
  }
});

