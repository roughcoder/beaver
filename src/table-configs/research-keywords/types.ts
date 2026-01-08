import { type Id } from "@/convex";

export type ResearchKeywordRow = {
  keywordId: Id<"keywords">;
  keyword: string;
  source: string;
  baselineKd?: number;
  freshness: string; // "Fresh" | "Cached" | "Stale"
  searchVolume?: number;
  cpc?: number;
  competitionLevel?: string;
  intent?: string;
  serpItemTypes?: string[];
  avgBacklinks?: number;
  // Additional flattened fields
  contextId: Id<"keywordContexts">;
  locationCode?: number;
  languageCode?: string;
  device?: string;
  fetchedAt?: number;
  staleAt?: number;
  coreKeyword?: string;
  wordsCount?: number;
  clustering?: number;
  language?: string;
  competition?: number;
  bids?: number;
  serpResultsCount?: number;
  serpUpdatedAt?: number;
  avgReferringDomains?: number;
  avgRank?: number;
};

