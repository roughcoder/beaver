import { formOptions } from "@tanstack/react-form";
import z from "zod";

export type ProjectFormValues = {
  name: string;
  description: string;
  url: string;
  default_region: string;
  default_language: string;
};

export function projectFormOpts(overrides?: Partial<ProjectFormValues>) {
  return formOptions({
    defaultValues: {
      name: "",
      description: "",
      url: "",
      default_region: "us-east-1",
      default_language: "en",
      ...overrides,
    } satisfies ProjectFormValues,
    validators: {
      onChange: z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string(),
        url: z.string().refine(
          (value) => value.length === 0 || z.string().url().safeParse(value).success,
          "Please enter a valid URL",
        ),
        default_region: z.string().min(1, "Default region is required"),
        default_language: z.string().min(1, "Default language is required"),
      }),
    },
  });
}


