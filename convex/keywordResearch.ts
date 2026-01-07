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
    }> = [];

    // Group by keyword + context, take latest
    const seen = new Map<string, boolean>();

    for (const snapshot of snapshots) {
      const key = `${snapshot.keywordId}_${snapshot.contextId}`;
      if (seen.has(key)) continue;
      seen.set(key, true);

      const keyword = await ctx.db.get(snapshot.keywordId);
      if (!keyword) continue;

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
      });
    }

    return results;
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

