import { type Id } from "@/convex";

export type LiveKeywordRow = {
  _id: Id<"trackedKeywords">;
  keywordId: Id<"keywords">;
  keyword: string;
  contextId: Id<"keywordContexts">;
  locationCode: number;
  languageCode: string;
  device?: string;
  latestDifficulty?: number;
  dataforseoKd?: number;
  volume?: number;
  intent?: string;
  lastMetricsUpdate?: number;
  lastSerpUpdate?: number;
  nextScheduledRefresh?: number;
  refreshKeywordMetrics: boolean;
  trackSerpDaily: boolean;
  fetchBacklinks: boolean;
};

