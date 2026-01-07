/**
 * DataForSEO location and language codes.
 */

export interface Location {
  code: number;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

export const LOCATIONS: Location[] = [
  { code: 2840, name: "United States" }, // US
  { code: 2826, name: "United Kingdom" }, // UK
  { code: 2124, name: "Canada" },
  { code: 2036, name: "Australia" },
  { code: 3728, name: "Ireland" },
  { code: 5548, name: "New Zealand" },
  { code: 2756, name: "Germany" },
  { code: 250, name: "France" },
  { code: 724, name: "Spain" },
  { code: 528, name: "Netherlands" },
];

export const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

export function getLocationByCode(code: number): Location | undefined {
  return LOCATIONS.find((loc) => loc.code === code);
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.code === code);
}

