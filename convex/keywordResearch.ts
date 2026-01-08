/**
 * Public APIs for keyword research wizard.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Start a research run (wizard step 1).
 */
export const startResearchRun = mutation({
  args: {
    projectId: v.id("projects"),
    seedKeywords: v.array(v.string()),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    includeBulkKd: v.optional(v.boolean()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    // Create a job for this research run
    const jobId = await ctx.db.insert("jobs", {
      userId,
      projectId: args.projectId,
      status: "queued",
      stage: "discovery",
      progress: 0,
      costSoFarUsd: 0,
      createdAt: Date.now(),
      metadata: {
        seedKeywords: args.seedKeywords,
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
        includeBulkKd: args.includeBulkKd || false,
      },
    });

    // Schedule discovery jobs (suggestions + related for each seed)
    // In a real implementation, you'd use ctx.scheduler to schedule these
    // For now, we'll trigger them immediately via actions
    for (const seedKeyword of args.seedKeywords) {
      // Schedule suggestions job
      await ctx.scheduler.runAfter(0, internal.actions.dataforseo.runKeywordSuggestionsJob, {
        jobId,
        seedKeyword,
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
        userId,
        projectId: args.projectId,
      });

      // Schedule related keywords job
      await ctx.scheduler.runAfter(0, internal.actions.dataforseo.runRelatedKeywordsJob, {
        jobId,
        seedKeyword,
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
        userId,
        projectId: args.projectId,
      });
    }

    return jobId;
  },
});

/**
 * List research results for wizard step 2.
 */
export const listResearchResults = query({
  args: {
    projectId: v.id("projects"),
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.array(
    v.object({
      keywordId: v.id("keywords"),
      keyword: v.string(),
      source: v.string(),
      baselineKd: v.optional(v.number()),
      freshness: v.string(), // "Fresh" | "Cached" | "Stale"
      searchVolume: v.optional(v.number()),
      cpc: v.optional(v.number()),
      competitionLevel: v.optional(v.string()),
      intent: v.optional(v.string()),
      serpItemTypes: v.optional(v.array(v.string())),
      avgBacklinks: v.optional(v.number()),
      // Additional flattened fields
      contextId: v.id("keywordContexts"),
      locationCode: v.optional(v.number()),
      languageCode: v.optional(v.string()),
      device: v.optional(v.string()),
      fetchedAt: v.optional(v.number()),
      staleAt: v.optional(v.number()),
      coreKeyword: v.optional(v.string()),
      wordsCount: v.optional(v.number()),
      clustering: v.optional(v.number()),
      language: v.optional(v.string()),
      competition: v.optional(v.number()),
      bids: v.optional(v.number()),
      serpResultsCount: v.optional(v.number()),
      serpUpdatedAt: v.optional(v.number()),
      avgReferringDomains: v.optional(v.number()),
      avgRank: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all keywords discovered for this project
    // This is a simplified version - in reality you'd filter by jobId and merge results
    const snapshots = await ctx.db
      .query("keywordSnapshots")
      .withIndex("by_project_time", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    const now = Date.now();
    const results: Array<{
      keywordId: Id<"keywords">;
      keyword: string;
      source: string;
      baselineKd?: number;
      freshness: string;
      searchVolume?: number;
      cpc?: number;
      competitionLevel?: string;
      intent?: string;
      serpItemTypes?: string[];
      avgBacklinks?: number;
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
    }> = [];

    // Group by keyword + context + source, take latest.
    // We run multiple DataForSEO discovery methods (suggestions + related). A keyword can
    // appear in both, so we keep one row per source so the UI can show both sources.
    const seen = new Map<string, boolean>();

    for (const snapshot of snapshots) {
      const key = `${snapshot.keywordId}_${snapshot.contextId}_${snapshot.source}`;
      if (seen.has(key)) continue;
      seen.set(key, true);

      const keyword = await ctx.db.get(snapshot.keywordId);
      if (!keyword) continue;

      const context = await ctx.db.get(snapshot.contextId);
      if (!context) continue;

      const freshness = snapshot.staleAt > now ? "Fresh" : snapshot.staleAt > now - 7 * 24 * 60 * 60 * 1000 ? "Cached" : "Stale";

      results.push({
        keywordId: snapshot.keywordId,
        keyword: keyword.text,
        source: snapshot.source,
        baselineKd: snapshot.keywordProperties?.keywordDifficulty,
        freshness,
        searchVolume: snapshot.keywordInfo?.volume,
        cpc: snapshot.keywordInfo?.cpc,
        competitionLevel: snapshot.keywordInfo?.competitionLevel,
        intent: snapshot.searchIntentInfo?.mainIntent,
        serpItemTypes: snapshot.serpInfo?.serpItemTypes,
        avgBacklinks: snapshot.avgBacklinksInfo?.avgBacklinks,
        contextId: snapshot.contextId,
        locationCode: context.locationCode,
        languageCode: context.languageCode,
        device: context.device,
        fetchedAt: snapshot.fetchedAt,
        staleAt: snapshot.staleAt,
        coreKeyword: snapshot.keywordProperties?.coreKeyword,
        wordsCount: snapshot.keywordProperties?.wordsCount,
        clustering: snapshot.keywordProperties?.clustering,
        language: snapshot.keywordProperties?.language,
        competition: snapshot.keywordInfo?.competition,
        bids: snapshot.keywordInfo?.bids,
        serpResultsCount: snapshot.serpInfo?.resultsCount,
        serpUpdatedAt: snapshot.serpInfo?.updatedAt,
        avgReferringDomains: snapshot.avgBacklinksInfo?.avgReferringDomains,
        avgRank: snapshot.avgBacklinksInfo?.avgRank,
      });
    }

    return results;
  },
});

/**
 * List research results for wizard step 2 with pagination, search, and sorting.
 */
export const listResearchResultsPaged = query({
  args: {
    projectId: v.id("projects"),
    jobId: v.optional(v.id("jobs")),
    pageIndex: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    sortColumn: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    rows: v.array(
      v.object({
        keywordId: v.id("keywords"),
        keyword: v.string(),
        source: v.string(),
        baselineKd: v.optional(v.number()),
        freshness: v.string(), // "Fresh" | "Cached" | "Stale"
        searchVolume: v.optional(v.number()),
        cpc: v.optional(v.number()),
        competitionLevel: v.optional(v.string()),
        intent: v.optional(v.string()),
        serpItemTypes: v.optional(v.array(v.string())),
        avgBacklinks: v.optional(v.number()),
        // Additional flattened fields
        contextId: v.id("keywordContexts"),
        locationCode: v.optional(v.number()),
        languageCode: v.optional(v.string()),
        device: v.optional(v.string()),
        fetchedAt: v.optional(v.number()),
        staleAt: v.optional(v.number()),
        coreKeyword: v.optional(v.string()),
        wordsCount: v.optional(v.number()),
        clustering: v.optional(v.number()),
        language: v.optional(v.string()),
        competition: v.optional(v.number()),
        bids: v.optional(v.number()),
        serpResultsCount: v.optional(v.number()),
        serpUpdatedAt: v.optional(v.number()),
        avgReferringDomains: v.optional(v.number()),
        avgRank: v.optional(v.number()),
      })
    ),
    totalCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all keywords discovered for this project
    // This is a simplified version - in reality you'd filter by jobId and merge results
    const snapshots = await ctx.db
      .query("keywordSnapshots")
      .withIndex("by_project_time", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    const now = Date.now();
    const results: Array<{
      keywordId: Id<"keywords">;
      keyword: string;
      source: string;
      baselineKd?: number;
      freshness: string;
      searchVolume?: number;
      cpc?: number;
      competitionLevel?: string;
      intent?: string;
      serpItemTypes?: string[];
      avgBacklinks?: number;
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
    }> = [];

    // Group by keyword + context + source, take latest.
    // We run multiple DataForSEO discovery methods (suggestions + related). A keyword can
    // appear in both, so we keep one row per source so the UI can show both sources.
    const seen = new Map<string, boolean>();

    for (const snapshot of snapshots) {
      const key = `${snapshot.keywordId}_${snapshot.contextId}_${snapshot.source}`;
      if (seen.has(key)) continue;
      seen.set(key, true);

      const keyword = await ctx.db.get(snapshot.keywordId);
      if (!keyword) continue;

      const context = await ctx.db.get(snapshot.contextId);
      if (!context) continue;

      const freshness = snapshot.staleAt > now ? "Fresh" : snapshot.staleAt > now - 7 * 24 * 60 * 60 * 1000 ? "Cached" : "Stale";

      results.push({
        keywordId: snapshot.keywordId,
        keyword: keyword.text,
        source: snapshot.source,
        baselineKd: snapshot.keywordProperties?.keywordDifficulty,
        freshness,
        searchVolume: snapshot.keywordInfo?.volume,
        cpc: snapshot.keywordInfo?.cpc,
        competitionLevel: snapshot.keywordInfo?.competitionLevel,
        intent: snapshot.searchIntentInfo?.mainIntent,
        serpItemTypes: snapshot.serpInfo?.serpItemTypes,
        avgBacklinks: snapshot.avgBacklinksInfo?.avgBacklinks,
        contextId: snapshot.contextId,
        locationCode: context.locationCode,
        languageCode: context.languageCode,
        device: context.device,
        fetchedAt: snapshot.fetchedAt,
        staleAt: snapshot.staleAt,
        coreKeyword: snapshot.keywordProperties?.coreKeyword,
        wordsCount: snapshot.keywordProperties?.wordsCount,
        clustering: snapshot.keywordProperties?.clustering,
        language: snapshot.keywordProperties?.language,
        competition: snapshot.keywordInfo?.competition,
        bids: snapshot.keywordInfo?.bids,
        serpResultsCount: snapshot.serpInfo?.resultsCount,
        serpUpdatedAt: snapshot.serpInfo?.updatedAt,
        avgReferringDomains: snapshot.avgBacklinksInfo?.avgReferringDomains,
        avgRank: snapshot.avgBacklinksInfo?.avgRank,
      });
    }

    // Apply search filter
    let filtered = results;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = results.filter((r) =>
        r.keyword.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (args.sortColumn && args.sortDirection) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (args.sortColumn) {
          case "keyword":
            aVal = a.keyword.toLowerCase();
            bVal = b.keyword.toLowerCase();
            break;
          case "source":
            aVal = a.source;
            bVal = b.source;
            break;
          case "baselineKd":
            aVal = a.baselineKd ?? 0;
            bVal = b.baselineKd ?? 0;
            break;
          case "searchVolume":
            aVal = a.searchVolume ?? 0;
            bVal = b.searchVolume ?? 0;
            break;
          case "cpc":
            aVal = a.cpc ?? 0;
            bVal = b.cpc ?? 0;
            break;
          case "intent":
            aVal = a.intent ?? "";
            bVal = b.intent ?? "";
            break;
          case "freshness":
            aVal = a.freshness;
            bVal = b.freshness;
            break;
          case "competition":
            aVal = a.competition ?? 0;
            bVal = b.competition ?? 0;
            break;
          case "competitionLevel":
            aVal = a.competitionLevel ?? "";
            bVal = b.competitionLevel ?? "";
            break;
          case "bids":
            aVal = a.bids ?? 0;
            bVal = b.bids ?? 0;
            break;
          case "avgBacklinks":
            aVal = a.avgBacklinks ?? 0;
            bVal = b.avgBacklinks ?? 0;
            break;
          case "avgReferringDomains":
            aVal = a.avgReferringDomains ?? 0;
            bVal = b.avgReferringDomains ?? 0;
            break;
          case "avgRank":
            aVal = a.avgRank ?? 0;
            bVal = b.avgRank ?? 0;
            break;
          case "locationCode":
            aVal = a.locationCode ?? 0;
            bVal = b.locationCode ?? 0;
            break;
          case "languageCode":
            aVal = a.languageCode ?? "";
            bVal = b.languageCode ?? "";
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return args.sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return args.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    const totalCount = filtered.length;

    // Apply pagination
    const startIndex = args.pageIndex * args.pageSize;
    const endIndex = startIndex + args.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      rows: paginated,
      totalCount,
    };
  },
});

/**
 * Enrich selected keywords (run keyword_overview).
 */
export const enrichSelectedKeywords = mutation({
  args: {
    projectId: v.id("projects"),
    keywordIds: v.array(v.id("keywords")),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    const jobId = await ctx.db.insert("jobs", {
      userId,
      projectId: args.projectId,
      status: "queued",
      stage: "enrichment",
      progress: 0,
      costSoFarUsd: 0,
      createdAt: Date.now(),
      metadata: {
        keywordIds: args.keywordIds,
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
      },
    });

    // Schedule enrichment jobs
    for (const keywordId of args.keywordIds) {
      const keyword = await ctx.db.get(keywordId);
      if (!keyword) continue;

      await ctx.scheduler.runAfter(0, internal.actions.dataforseo.runKeywordOverviewJob, {
        jobId,
        keyword: keyword.text,
        locationCode: args.locationCode,
        languageCode: args.languageCode,
        device: args.device,
        userId,
        projectId: args.projectId,
      });
    }

    return jobId;
  },
});

/**
 * Add selected keywords to project (wizard step 3).
 */
export const addSelectedToProject = mutation({
  args: {
    projectId: v.id("projects"),
    keywordIds: v.array(v.id("keywords")),
    contextId: v.id("keywordContexts"),
    refreshKeywordMetrics: v.optional(v.boolean()),
    trackSerpDaily: v.optional(v.boolean()),
    fetchBacklinks: v.optional(v.boolean()),
  },
  returns: v.array(v.id("trackedKeywords")),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    const trackedKeywordIds: Id<"trackedKeywords">[] = [];

    for (const keywordId of args.keywordIds) {
      // Check if already tracked
      const existing = await ctx.db
        .query("trackedKeywords")
        .withIndex("by_keyword_context", (q) =>
          q.eq("keywordId", keywordId).eq("contextId", args.contextId)
        )
        .filter((q) => q.eq(q.field("projectId"), args.projectId))
        .first();

      if (existing) {
        trackedKeywordIds.push(existing._id);
        continue;
      }

      const trackedId = await ctx.db.insert("trackedKeywords", {
        userId,
        projectId: args.projectId,
        keywordId,
        contextId: args.contextId,
        refreshKeywordMetrics: args.refreshKeywordMetrics ?? true,
        trackSerpDaily: args.trackSerpDaily ?? false,
        fetchBacklinks: args.fetchBacklinks ?? false,
        createdAt: Date.now(),
      });

      trackedKeywordIds.push(trackedId);
    }

    return trackedKeywordIds;
  },
});

