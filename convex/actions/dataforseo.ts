/**
 * Node actions for calling DataForSEO APIs.
 * These run in Node.js and can make external HTTP requests.
 */

"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { callLabsApi, callSerpApi, callBacklinksApi, type ApiCallResult } from "../lib/dataforseoClient";
import { computeRequestHash } from "../lib/requestHash";
import { internal } from "../_generated/api";
// Cache functions are now in internal/cache and accessed via internal API

// TTL constants (in milliseconds)
const KEYWORD_METRICS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SERP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BACKLINKS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

function toConvexSafeValue(value: unknown): unknown {
  if (value === null) return null;
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    const arr: unknown[] = [];
    for (const v of value) {
      const converted = toConvexSafeValue(v);
      if (converted !== undefined) arr.push(converted);
    }
    return arr;
  }

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;

  // Convex supports bytes as ArrayBuffer; keep as-is.
  if (value instanceof ArrayBuffer) return value;

  // Convert any object (including class instances) into a plain object,
  // recursively stripping `undefined` values.
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const converted = toConvexSafeValue(v);
      if (converted !== undefined) out[k] = converted;
    }
    return out;
  }

  // Functions/symbols/etc. are not Convex values; drop them.
  return undefined;
}

function normalizeMonthlySearches(
  monthlySearches: unknown,
): Array<{ year: number; month: number; searchVolume: number }> | undefined {
  if (!Array.isArray(monthlySearches)) return undefined;
  const out: Array<{ year: number; month: number; searchVolume: number }> = [];
  for (const row of monthlySearches) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const year = typeof r.year === "number" ? r.year : undefined;
    const month = typeof r.month === "number" ? r.month : undefined;
    const svRaw = r["search_volume"] ?? r["searchVolume"];
    const searchVolume = typeof svRaw === "number" ? svRaw : undefined;
    if (year !== undefined && month !== undefined && searchVolume !== undefined) {
      out.push({ year, month, searchVolume });
    }
  }
  return out.length > 0 ? out : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function normalizeTrend(keywordInfo: unknown): number[] | undefined {
  if (!keywordInfo || typeof keywordInfo !== "object") return undefined;
  const obj = keywordInfo as Record<string, unknown>;
  const svtVal = obj["search_volume_trend"];
  if (!svtVal || typeof svtVal !== "object") return undefined;
  const svt = svtVal as Record<string, unknown>;
  const monthly = asOptionalNumber(svt["monthly"]);
  const quarterly = asOptionalNumber(svt["quarterly"]);
  const yearly = asOptionalNumber(svt["yearly"]);
  const out = [monthly, quarterly, yearly].filter((x): x is number => x !== undefined);
  return out.length > 0 ? out : undefined;
}

function normalizeKeywordInfo(keywordInfo: unknown): unknown {
  if (!keywordInfo || typeof keywordInfo !== "object") return undefined;
  const obj = keywordInfo as Record<string, unknown>;
  return toConvexSafeValue({
    volume: asOptionalNumber(obj["search_volume"]),
    cpc: asOptionalNumber(obj["cpc"]),
    competition: asOptionalNumber(obj["competition"]),
    competitionLevel: asOptionalString(obj["competition_level"]),
    // Prefer explicit page bid fields if present.
    bids:
      asOptionalNumber(obj["bids"]) ??
      asOptionalNumber(obj["high_top_of_page_bid"]) ??
      asOptionalNumber(obj["low_top_of_page_bid"]),
    monthlySearches: normalizeMonthlySearches(obj["monthly_searches"]),
    trend: normalizeTrend(keywordInfo),
  });
}

function normalizeKeywordProperties(keywordProperties: unknown): unknown {
  if (!keywordProperties || typeof keywordProperties !== "object") return undefined;
  const obj = keywordProperties as Record<string, unknown>;
  return toConvexSafeValue({
    coreKeyword: asOptionalString(obj["core_keyword"]),
    keywordDifficulty: asOptionalNumber(obj["keyword_difficulty"]),
    language: asOptionalString(obj["language"]),
    clustering: asOptionalNumber(obj["clustering"]),
    wordsCount: asOptionalNumber(obj["words_count"]),
  });
}

function parseUpdatedAt(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? undefined : t;
  }
  return undefined;
}

function normalizeSerpInfo(serpInfo: unknown): unknown {
  if (!serpInfo || typeof serpInfo !== "object") return undefined;
  const obj = serpInfo as Record<string, unknown>;
  const serpItemTypesRaw = obj["serp_item_types"];
  const serpItemTypes = Array.isArray(serpItemTypesRaw)
    ? serpItemTypesRaw.filter((x): x is string => typeof x === "string")
    : undefined;
  return toConvexSafeValue({
    serpItemTypes,
    resultsCount: asOptionalNumber(obj["results_count"]),
    updatedAt: parseUpdatedAt(obj["updated_at"]),
  });
}

function normalizeAvgBacklinksInfo(avgBacklinksInfo: unknown): unknown {
  if (!avgBacklinksInfo || typeof avgBacklinksInfo !== "object") return undefined;
  const obj = avgBacklinksInfo as Record<string, unknown>;
  return toConvexSafeValue({
    avgBacklinks: asOptionalNumber(obj["avg_backlinks"] ?? obj["backlinks"]),
    avgReferringDomains: asOptionalNumber(obj["avg_referring_domains"] ?? obj["referring_domains"]),
    avgRank: asOptionalNumber(obj["avg_rank"] ?? obj["rank"]),
  });
}

function normalizeSearchIntentInfo(searchIntentInfo: unknown): unknown {
  if (!searchIntentInfo || typeof searchIntentInfo !== "object") return undefined;
  const obj = searchIntentInfo as Record<string, unknown>;
  const foreignIntentRaw = obj["foreign_intent"];
  const foreignIntent = Array.isArray(foreignIntentRaw)
    ? foreignIntentRaw.filter((x): x is string => typeof x === "string")
    : undefined;
  return toConvexSafeValue({
    mainIntent: asOptionalString(obj["main_intent"]),
    foreignIntent,
  });
}

/**
 * Run keyword suggestions job.
 */
export const runKeywordSuggestionsJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    seedKeyword: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    keywordIds: v.array(v.id("keywords")),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; keywordIds: Id<"keywords">[]; costUsd: number }> => {
    const now = Date.now();
    
    // Normalize entities
    const keywordId: Id<"keywords"> = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
      text: args.seedKeyword,
    });
    
    const contextId = await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: "google",
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
    });

    // Check cache
    const cacheCheck = await ctx.runQuery(internal.internal.cache.checkKeywordSnapshotCache, {
      keywordId,
      contextId,
      source: "labs_keyword_suggestions",
      now,
    });

    if (cacheCheck.cached && cacheCheck.apiCallId) {
      // Return cached results
      return {
        success: true,
        keywordIds: [keywordId],
        costUsd: 0,
      };
    }

    // Build request
    // Note: keyword_suggestions endpoint doesn't support device parameter
    const payload = [
      {
        keyword: args.seedKeyword,
        location_code: args.locationCode,
        language_code: args.languageCode,
      },
    ];

    console.log(`[runKeywordSuggestionsJob] Calling API with:`, {
      seedKeyword: args.seedKeyword,
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      payload: JSON.stringify(payload, null, 2),
    });

    const requestHash = computeRequestHash("dataforseo_labs/google/keyword_suggestions/live", payload);

    // Check for duplicate request hash
    const duplicateApiCallId = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: KEYWORD_METRICS_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      return {
        success: true,
        keywordIds: [keywordId],
        costUsd: 0,
      };
    }

    // Call API
    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callLabsApi("keyword_suggestions", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      // Create API call ledger entry
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/keyword_suggestions/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      // Parse and store results
      const keywordIds: Id<"keywords">[] = [keywordId];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (responseData?.tasks?.[0]?.result?.[0]?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of responseData.tasks[0].result[0].items as any[]) {
          if (item.keyword) {
            const derivedKeywordId = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
              text: item.keyword,
            });
            keywordIds.push(derivedKeywordId);

            // Store keyword snapshot for the suggestion
            const fetchedAt = Date.now();
            await ctx.runMutation(internal.internal.writeModels.writeKeywordSnapshot, {
              userId: args.userId,
              projectId: args.projectId,
              apiCallId,
              keywordId: derivedKeywordId,
              contextId,
              source: "labs_keyword_suggestions",
              fetchedAt,
              staleAt: fetchedAt + KEYWORD_METRICS_TTL_MS,
              keywordInfo: normalizeKeywordInfo(item.keyword_info),
              keywordProperties: normalizeKeywordProperties(item.keyword_properties),
              serpInfo: normalizeSerpInfo(item.serp_info),
              avgBacklinksInfo: normalizeAvgBacklinksInfo(item.avg_backlinks_info),
              searchIntentInfo: normalizeSearchIntentInfo(item.search_intent_info),
              rawJson: toConvexSafeValue(item),
            });
          }
        }
      }

      return {
        success: true,
        keywordIds,
        costUsd,
      };
    } catch (error) {
      // Create error API call entry
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/keyword_suggestions/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

/**
 * Run related keywords job.
 */
export const runRelatedKeywordsJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    seedKeyword: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    keywordIds: v.array(v.id("keywords")),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; keywordIds: Id<"keywords">[]; costUsd: number }> => {
    const now = Date.now();
    
    const keywordId: Id<"keywords"> = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
      text: args.seedKeyword,
    });
    
    const contextId = await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: "google",
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
    });

    const cacheCheck = await ctx.runQuery(internal.internal.cache.checkKeywordSnapshotCache, {
      keywordId,
      contextId,
      source: "labs_related_keywords",
      now,
    });

    if (cacheCheck.cached && cacheCheck.apiCallId) {
      return {
        success: true,
        keywordIds: [keywordId],
        costUsd: 0,
      };
    }

    // Build request
    // Note: related_keywords endpoint doesn't support device parameter
    const payload = [
      {
        keyword: args.seedKeyword,
        location_code: args.locationCode,
        language_code: args.languageCode,
      },
    ];

    console.log(`[runRelatedKeywordsJob] Calling API with:`, {
      seedKeyword: args.seedKeyword,
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      payload: JSON.stringify(payload, null, 2),
    });

    const requestHash = computeRequestHash("dataforseo_labs/google/related_keywords/live", payload);

    const duplicateApiCallId = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: KEYWORD_METRICS_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      return {
        success: true,
        keywordIds: [keywordId],
        costUsd: 0,
      };
    }

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callLabsApi("related_keywords", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/related_keywords/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      const keywordIds: Id<"keywords">[] = [keywordId];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (responseData?.tasks?.[0]?.result?.[0]?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of responseData.tasks[0].result[0].items as any[]) {
          if (item.keyword) {
            const derivedKeywordId = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
              text: item.keyword,
            });
            keywordIds.push(derivedKeywordId);

            const fetchedAt = Date.now();
            await ctx.runMutation(internal.internal.writeModels.writeKeywordSnapshot, {
              userId: args.userId,
              projectId: args.projectId,
              apiCallId,
              keywordId: derivedKeywordId,
              contextId,
              source: "labs_related_keywords",
              fetchedAt,
              staleAt: fetchedAt + KEYWORD_METRICS_TTL_MS,
              keywordInfo: normalizeKeywordInfo(item.keyword_info),
              keywordProperties: normalizeKeywordProperties(item.keyword_properties),
              serpInfo: normalizeSerpInfo(item.serp_info),
              avgBacklinksInfo: normalizeAvgBacklinksInfo(item.avg_backlinks_info),
              searchIntentInfo: normalizeSearchIntentInfo(item.search_intent_info),
              rawJson: toConvexSafeValue(item),
            });
          }
        }
      }

      return {
        success: true,
        keywordIds,
        costUsd,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/related_keywords/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

/**
 * Run bulk keyword difficulty job.
 */
export const runBulkKeywordDifficultyJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    keywords: v.array(v.string()),
    locationCode: v.number(),
    languageCode: v.string(),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; costUsd: number }> => {
    const now = Date.now();
    
    const contextId: Id<"keywordContexts"> = await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: "google",
      locationCode: args.locationCode,
      languageCode: args.languageCode,
    });

    const payload = [
      {
        keywords: args.keywords,
        location_code: args.locationCode,
        language_code: args.languageCode,
      },
    ];

    const requestHash = computeRequestHash("dataforseo_labs/google/bulk_keyword_difficulty/live", payload);

    const duplicateApiCallId = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: KEYWORD_METRICS_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      return {
        success: true,
        costUsd: 0,
      };
    }

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callLabsApi("bulk_keyword_difficulty", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/bulk_keyword_difficulty/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      // Store bulk KD results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (responseData?.tasks?.[0]?.result?.[0]?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of responseData.tasks[0].result[0].items as any[]) {
          if (item.keyword) {
            const keywordId = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
              text: item.keyword,
            });

            const fetchedAt = Date.now();
            await ctx.runMutation(internal.internal.writeModels.writeKeywordSnapshot, {
              userId: args.userId,
              projectId: args.projectId,
              apiCallId,
              keywordId,
              contextId,
              source: "bulk_keyword_difficulty",
              fetchedAt,
              staleAt: fetchedAt + KEYWORD_METRICS_TTL_MS,
              keywordProperties: toConvexSafeValue({
                keywordDifficulty: item.keyword_difficulty,
              }),
              rawJson: toConvexSafeValue(item),
            });
          }
        }
      }

      return {
        success: true,
        costUsd,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/bulk_keyword_difficulty/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

/**
 * Run keyword overview job (enrichment).
 */
export const runKeywordOverviewJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    keyword: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    keywordId: v.id("keywords"),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; keywordId: Id<"keywords">; costUsd: number }> => {
    const now = Date.now();
    
    const keywordId: Id<"keywords"> = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
      text: args.keyword,
    });
    
    const contextId: Id<"keywordContexts"> = await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: "google",
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
    });

    const cacheCheck = await ctx.runQuery(internal.internal.cache.checkKeywordSnapshotCache, {
      keywordId,
      contextId,
      source: "labs_keyword_overview",
      now,
    });

    if (cacheCheck.cached && cacheCheck.apiCallId) {
      return {
        success: true,
        keywordId,
        costUsd: 0,
      };
    }

    const payload = [
      {
        keyword: args.keyword,
        location_code: args.locationCode,
        language_code: args.languageCode,
        device: args.device || "desktop",
      },
    ];

    const requestHash = computeRequestHash("dataforseo_labs/google/keyword_overview/live", payload);

    const duplicateApiCallId = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: KEYWORD_METRICS_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      return {
        success: true,
        keywordId,
        costUsd: 0,
      };
    }

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callLabsApi("keyword_overview", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/keyword_overview/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = responseData?.tasks?.[0]?.result?.[0] as any;
      if (item) {
        const fetchedAt = Date.now();
        await ctx.runMutation(internal.internal.writeModels.writeKeywordSnapshot, {
          userId: args.userId,
          projectId: args.projectId,
          apiCallId,
          keywordId,
          contextId,
          source: "labs_keyword_overview",
          fetchedAt,
          staleAt: fetchedAt + KEYWORD_METRICS_TTL_MS,
          keywordInfo: normalizeKeywordInfo(item.keyword_info),
          keywordProperties: normalizeKeywordProperties(item.keyword_properties),
          serpInfo: normalizeSerpInfo(item.serp_info),
          avgBacklinksInfo: normalizeAvgBacklinksInfo(item.avg_backlinks_info),
          searchIntentInfo: normalizeSearchIntentInfo(item.search_intent_info),
          rawJson: toConvexSafeValue(item),
        });
      }

      return {
        success: true,
        keywordId,
        costUsd,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "dataforseo_labs/google/keyword_overview/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

/**
 * Run SERP snapshot job.
 */
export const runSerpSnapshotJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    keyword: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    serpSnapshotId: v.id("serpSnapshots"),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; serpSnapshotId: Id<"serpSnapshots">; costUsd: number }> => {
    const now = Date.now();
    
    const keywordId: Id<"keywords"> = await ctx.runMutation(internal.internal.writeModels.upsertKeyword, {
      text: args.keyword,
    });
    
    const contextId: Id<"keywordContexts"> = await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: "google",
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
    });

    const cacheCheck: { cached: boolean; snapshotId?: Id<"serpSnapshots">; apiCallId?: Id<"apiCalls"> } = await ctx.runQuery(internal.internal.cache.checkSerpSnapshotCache, {
      keywordId,
      contextId,
      now,
    });

    if (cacheCheck.cached && cacheCheck.snapshotId) {
      return {
        success: true,
        serpSnapshotId: cacheCheck.snapshotId as Id<"serpSnapshots">,
        costUsd: 0,
      };
    }

    const payload = [
      {
        keyword: args.keyword,
        location_code: args.locationCode,
        language_code: args.languageCode,
        device: args.device || "desktop",
      },
    ];

    const requestHash = computeRequestHash("serp/google/organic/live/advanced", payload);

    const duplicateApiCallId: Id<"apiCalls"> | null = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: SERP_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      // Return existing snapshot
      const existing: { cached: boolean; snapshotId?: Id<"serpSnapshots">; apiCallId?: Id<"apiCalls"> } = await ctx.runQuery(internal.internal.cache.checkSerpSnapshotCache, {
        keywordId,
        contextId,
        now: now - SERP_TTL_MS - 1, // Force fetch
      });
      if (existing.snapshotId) {
        return {
          success: true,
          serpSnapshotId: existing.snapshotId as Id<"serpSnapshots">,
          costUsd: 0,
        };
      }
    }

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callSerpApi("google_organic_live_advanced", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "serp/google/organic/live/advanced",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const taskResult = responseData?.tasks?.[0]?.result?.[0] as any;
      if (!taskResult) {
        throw new Error("No result in SERP response");
      }

      const fetchedAt = Date.now();
      const topOrganicDomainIds: Id<"domains">[] = [];
      const topOrganicUrlIds: Id<"urls">[] = [];
      const serpItemTypesPresent: string[] = [];
      const serpItemsToWrite: Array<{
        type: string;
        rankGroup?: number;
        rankAbsolute?: number;
        page?: number;
        domainId: Id<"domains">;
        urlId: Id<"urls">;
        domain: string;
        url: string;
        title?: string;
        description?: string;
        breadcrumb?: string;
        websiteName?: string;
        isFeaturedSnippet?: boolean;
        isVideo?: boolean;
        isImage?: boolean;
        isMalicious?: boolean;
        isWebStory?: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: any;
      }> = [];

      // Process all items first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (taskResult.items) {
        for (const item of taskResult.items as any[]) {
          if (item.type) {
            if (!serpItemTypesPresent.includes(item.type)) {
              serpItemTypesPresent.push(item.type);
            }
          }

          if (item.type === "organic" && item.url) {
            const domainStr = extractDomain(item.url);
            const domainId = await ctx.runMutation(internal.internal.writeModels.upsertDomain, {
              domain: domainStr,
            });
            
            const urlId = await ctx.runMutation(internal.internal.writeModels.upsertUrl, {
              url: item.url,
              domainId,
            });

            if (item.rank_group && item.rank_group <= 10) {
              if (!topOrganicDomainIds.includes(domainId)) {
                topOrganicDomainIds.push(domainId);
              }
              if (!topOrganicUrlIds.includes(urlId)) {
                topOrganicUrlIds.push(urlId);
              }
            }

            serpItemsToWrite.push({
              type: item.type || "organic",
              rankGroup: item.rank_group,
              rankAbsolute: item.rank_absolute,
              page: item.page,
              domainId,
              urlId,
              domain: domainStr,
              url: item.url,
              title: item.title,
              description: item.description,
              breadcrumb: item.breadcrumb,
              websiteName: item.website_name,
              isFeaturedSnippet: item.is_featured_snippet,
              isVideo: item.is_video,
              isImage: item.is_image,
              isMalicious: item.is_malicious,
              isWebStory: item.is_web_story,
              payload: item,
            });
          }
        }
      }

      // Create snapshot once
      const serpSnapshotId: Id<"serpSnapshots"> = await ctx.runMutation(internal.internal.writeModels.writeSerpSnapshot, {
        userId: args.userId,
        projectId: args.projectId,
        apiCallId,
        keywordId,
        contextId,
        fetchedAt,
        staleAt: fetchedAt + SERP_TTL_MS,
        seType: "google",
        seDomain: taskResult.se_domain || "google.com",
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
        resultsCount: taskResult.items_count,
        itemsCount: taskResult.items_count,
        pagesCount: taskResult.pages_count,
        serpItemTypesPresent,
        topOrganicDomainIds,
        topOrganicUrlIds,
        rawJson: toConvexSafeValue(taskResult),
      });

      // Write all SERP items
      for (const item of serpItemsToWrite) {
        await ctx.runMutation(internal.internal.writeModels.writeSerpItem, {
          userId: args.userId,
          projectId: args.projectId,
          apiCallId,
          serpSnapshotId,
          type: item.type,
          rankGroup: item.rankGroup,
          rankAbsolute: item.rankAbsolute,
          page: item.page,
          domainId: item.domainId,
          urlId: item.urlId,
          domain: item.domain,
          url: item.url,
          title: item.title,
          description: item.description,
          breadcrumb: item.breadcrumb,
          websiteName: item.websiteName,
          isFeaturedSnippet: item.isFeaturedSnippet,
          isVideo: item.isVideo,
          isImage: item.isImage,
          isMalicious: item.isMalicious,
          isWebStory: item.isWebStory,
          payload: toConvexSafeValue(item.payload),
        });
      }

      return {
        success: true,
        serpSnapshotId,
        costUsd,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "serp/google/organic/live/advanced",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

/**
 * Run backlinks bulk pages summary job.
 */
export const runBacklinksBulkPagesSummaryJob = internalAction({
  args: {
    jobId: v.id("jobs"),
    urls: v.array(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    success: v.boolean(),
    backlinkSnapshotId: v.id("backlinkSnapshots"),
    costUsd: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; backlinkSnapshotId: Id<"backlinkSnapshots">; costUsd: number }> => {
    const now = Date.now();

    const payload = [
      {
        targets: args.urls.map((url) => ({ url })),
      },
    ];

    const requestHash = computeRequestHash("backlinks/bulk_pages_summary/live", payload);

    const duplicateApiCallId: Id<"apiCalls"> | null = await ctx.runQuery(internal.internal.cache.checkDuplicateRequestHash, {
      requestHash,
      ttlMs: BACKLINKS_TTL_MS,
      now,
    });

    if (duplicateApiCallId) {
      // Return existing snapshot - use a query helper
      const existing: { _id: Id<"backlinkSnapshots"> } | null = await ctx.runQuery(internal.internal.helpers.getBacklinkSnapshotByApiCall, {
        apiCallId: duplicateApiCallId,
      });
      
      if (existing) {
        return {
          success: true,
          backlinkSnapshotId: existing._id,
          costUsd: 0,
        };
      }
    }

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: ApiCallResult<any>;
    let costUsd = 0;
    let apiCallId: Id<"apiCalls">;

    try {
      result = await callBacklinksApi("bulk_pages_summary", payload);
      costUsd = result.costUsd;

      const durationMs = Date.now() - startTime;

      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "backlinks/bulk_pages_summary/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        httpStatus: 200,
        dataforseoStatusCode: result.statusCode,
        dataforseoStatusMessage: result.statusMessage,
        costUsd: result.costUsd,
        tasksCount: result.tasksCount,
        tasksCostUsd: result.tasksCostUsd,
        responseAt: Date.now(),
        durationMs,
      });

      const fetchedAt = Date.now();
      const backlinkSnapshotId: Id<"backlinkSnapshots"> = await ctx.runMutation(internal.internal.writeModels.writeBacklinkSnapshot, {
        userId: args.userId,
        projectId: args.projectId,
        apiCallId,
        fetchedAt,
        staleAt: fetchedAt + BACKLINKS_TTL_MS,
        targetType: "url",
        targetsCount: args.urls.length,
        rawJson: toConvexSafeValue(result.data),
      });

      // Process results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = result.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (responseData?.tasks?.[0]?.result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const targetResult of responseData.tasks[0].result as any[]) {
          const targetUrl: string | undefined = targetResult.target?.url;
          if (targetUrl) {
            const domainStr = extractDomain(targetUrl);
            const domainId = await ctx.runMutation(internal.internal.writeModels.upsertDomain, {
              domain: domainStr,
            });
            
            const urlId = await ctx.runMutation(internal.internal.writeModels.upsertUrl, {
              url: targetUrl,
              domainId,
            });

            const metrics = targetResult.metrics;
            if (metrics) {
              await ctx.runMutation(internal.internal.writeModels.writeUrlBacklinkFacts, {
                userId: args.userId,
                projectId: args.projectId,
                apiCallId,
                backlinkSnapshotId,
                urlId,
                domainId,
                fetchedAt,
                staleAt: fetchedAt + BACKLINKS_TTL_MS,
                rank: metrics.rank,
                mainDomainRank: metrics.main_domain_rank,
                backlinks: metrics.backlinks,
                dofollowBacklinks: metrics.dofollow_backlinks,
                nofollowBacklinks: metrics.nofollow_backlinks,
                referringDomains: metrics.referring_domains,
                referringMainDomains: metrics.referring_main_domains,
                referringPages: metrics.referring_pages,
                brokenBacklinks: metrics.broken_backlinks,
                brokenPages: metrics.broken_pages,
                backlinksSpamScore: metrics.backlinks_spam_score,
                firstSeen: metrics.first_seen,
                lostDate: metrics.lost_date,
                referringLinksTld: metrics.referring_links_tld,
                referringLinksTypes: metrics.referring_links_types,
                referringLinksAttributes: metrics.referring_links_attributes,
                referringLinksPlatforms: metrics.referring_links_platforms,
                referringLinksSemantics: metrics.referring_links_semantics,
                referringLinksCountries: metrics.referring_links_countries,
              });
            }
          }
        }
      }

      return {
        success: true,
        backlinkSnapshotId,
        costUsd,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      apiCallId = await ctx.runMutation(internal.internal.cache.createApiCall, {
        userId: args.userId,
        projectId: args.projectId,
        endpoint: "backlinks/bulk_pages_summary/live",
        method: "POST",
        requestHash,
        requestPayload: payload,
        error: errorMsg,
        costUsd: 0,
      });

      throw error;
    }
  },
});

