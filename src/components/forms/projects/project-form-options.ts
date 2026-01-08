import { formOptions } from "@tanstack/react-form";
import z from "zod";
import { LANGUAGES, LOCATIONS } from "@/lib/locations";

export type ProjectFormValues = {
  name: string;
  description: string;
  url: string;
  default_region: string;
  default_language: string;
};

export function projectFormOpts(overrides?: Partial<ProjectFormValues>) {
  const defaultRegionCode = (LOCATIONS[1]?.code ??
    LOCATIONS[0]?.code ??
    2826 /* UK */).toString();
  const defaultLanguageCode = LANGUAGES[0]?.code ?? "en";

  return formOptions({
    defaultValues: {
      name: "",
      description: "",
      url: "",
      // Store DataForSEO location codes as strings (SelectField values are strings).
      default_region: defaultRegionCode,
      default_language: defaultLanguageCode,
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
        default_region: z.string().min(1, "Location is required"),
        default_language: z.string().min(1, "Language is required"),
      }),
    },
  });
}


