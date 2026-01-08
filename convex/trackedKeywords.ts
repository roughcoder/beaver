/**
 * Public APIs for tracked keywords management.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * List tracked keywords for a project.
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("trackedKeywords"),
      keywordId: v.id("keywords"),
      keyword: v.string(),
      contextId: v.id("keywordContexts"),
      locationCode: v.number(),
      languageCode: v.string(),
      device: v.optional(v.string()),
      latestDifficulty: v.optional(v.number()),
      dataforseoKd: v.optional(v.number()),
      volume: v.optional(v.number()),
      intent: v.optional(v.string()),
      lastMetricsUpdate: v.optional(v.number()),
      lastSerpUpdate: v.optional(v.number()),
      nextScheduledRefresh: v.optional(v.number()),
      refreshKeywordMetrics: v.boolean(),
      trackSerpDaily: v.boolean(),
      fetchBacklinks: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tracked = await ctx.db
      .query("trackedKeywords")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const results = [];

    for (const track of tracked) {
      const keyword = await ctx.db.get(track.keywordId);
      if (!keyword) continue;

      const context = await ctx.db.get(track.contextId);
      if (!context) continue;

      // Get latest keyword snapshot
      const latestSnapshot = await ctx.db
        .query("keywordSnapshots")
        .withIndex("by_keyword_context_source", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      // Get latest computed difficulty
      const latestDifficulty = await ctx.db
        .query("keywordDifficultyComputed")
        .withIndex("by_keyword_context_time", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      // Get latest SERP snapshot
      const latestSerp = await ctx.db
        .query("serpSnapshots")
        .withIndex("by_keyword_context_time", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      results.push({
        _id: track._id,
        keywordId: track.keywordId,
        keyword: keyword.text,
        contextId: track.contextId,
        locationCode: context.locationCode,
        languageCode: context.languageCode,
        device: context.device,
        latestDifficulty: latestDifficulty?.difficulty,
        dataforseoKd: latestSnapshot?.keywordProperties?.keywordDifficulty,
        volume: latestSnapshot?.keywordInfo?.volume,
        intent: latestSnapshot?.searchIntentInfo?.mainIntent,
        lastMetricsUpdate: latestSnapshot?.fetchedAt,
        lastSerpUpdate: latestSerp?.fetchedAt,
        nextScheduledRefresh: track.trackSerpDaily && latestSerp
          ? latestSerp.staleAt
          : undefined,
        refreshKeywordMetrics: track.refreshKeywordMetrics,
        trackSerpDaily: track.trackSerpDaily,
        fetchBacklinks: track.fetchBacklinks,
      });
    }

    return results;
  },
});

/**
 * List tracked keywords for a project with pagination, search, and sorting.
 */
export const listByProjectPaged = query({
  args: {
    projectId: v.id("projects"),
    pageIndex: v.number(),
    pageSize: v.number(),
    search: v.optional(v.string()),
    sortColumn: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    rows: v.array(
      v.object({
        _id: v.id("trackedKeywords"),
        keywordId: v.id("keywords"),
        keyword: v.string(),
        contextId: v.id("keywordContexts"),
        locationCode: v.number(),
        languageCode: v.string(),
        device: v.optional(v.string()),
        latestDifficulty: v.optional(v.number()),
        dataforseoKd: v.optional(v.number()),
        volume: v.optional(v.number()),
        intent: v.optional(v.string()),
        lastMetricsUpdate: v.optional(v.number()),
        lastSerpUpdate: v.optional(v.number()),
        nextScheduledRefresh: v.optional(v.number()),
        refreshKeywordMetrics: v.boolean(),
        trackSerpDaily: v.boolean(),
        fetchBacklinks: v.boolean(),
      })
    ),
    totalCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tracked = await ctx.db
      .query("trackedKeywords")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const results = [];

    for (const track of tracked) {
      const keyword = await ctx.db.get(track.keywordId);
      if (!keyword) continue;

      const context = await ctx.db.get(track.contextId);
      if (!context) continue;

      // Get latest keyword snapshot
      const latestSnapshot = await ctx.db
        .query("keywordSnapshots")
        .withIndex("by_keyword_context_source", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      // Get latest computed difficulty
      const latestDifficulty = await ctx.db
        .query("keywordDifficultyComputed")
        .withIndex("by_keyword_context_time", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      // Get latest SERP snapshot
      const latestSerp = await ctx.db
        .query("serpSnapshots")
        .withIndex("by_keyword_context_time", (q) =>
          q.eq("keywordId", track.keywordId).eq("contextId", track.contextId)
        )
        .order("desc")
        .first();

      results.push({
        _id: track._id,
        keywordId: track.keywordId,
        keyword: keyword.text,
        contextId: track.contextId,
        locationCode: context.locationCode,
        languageCode: context.languageCode,
        device: context.device,
        latestDifficulty: latestDifficulty?.difficulty,
        dataforseoKd: latestSnapshot?.keywordProperties?.keywordDifficulty,
        volume: latestSnapshot?.keywordInfo?.volume,
        intent: latestSnapshot?.searchIntentInfo?.mainIntent,
        lastMetricsUpdate: latestSnapshot?.fetchedAt,
        lastSerpUpdate: latestSerp?.fetchedAt,
        nextScheduledRefresh: track.trackSerpDaily && latestSerp
          ? latestSerp.staleAt
          : undefined,
        refreshKeywordMetrics: track.refreshKeywordMetrics,
        trackSerpDaily: track.trackSerpDaily,
        fetchBacklinks: track.fetchBacklinks,
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
          case "latestDifficulty":
            aVal = a.latestDifficulty ?? a.dataforseoKd ?? 0;
            bVal = b.latestDifficulty ?? b.dataforseoKd ?? 0;
            break;
          case "volume":
            aVal = a.volume ?? 0;
            bVal = b.volume ?? 0;
            break;
          case "intent":
            aVal = a.intent ?? "";
            bVal = b.intent ?? "";
            break;
          case "locationCode":
            aVal = a.locationCode;
            bVal = b.locationCode;
            break;
          case "trackSerpDaily":
            aVal = a.trackSerpDaily ? 1 : 0;
            bVal = b.trackSerpDaily ? 1 : 0;
            break;
          case "lastMetricsUpdate":
            aVal = a.lastMetricsUpdate ?? 0;
            bVal = b.lastMetricsUpdate ?? 0;
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
 * Set tracking options for tracked keywords.
 */
export const setTrackingOptions = mutation({
  args: {
    trackedKeywordIds: v.array(v.id("trackedKeywords")),
    refreshKeywordMetrics: v.optional(v.boolean()),
    trackSerpDaily: v.optional(v.boolean()),
    fetchBacklinks: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const trackedId of args.trackedKeywordIds) {
      const tracked = await ctx.db.get(trackedId);
      if (!tracked || tracked.userId !== userId) {
        continue;
      }

      const updates: {
        refreshKeywordMetrics?: boolean;
        trackSerpDaily?: boolean;
        fetchBacklinks?: boolean;
      } = {};

      if (args.refreshKeywordMetrics !== undefined) {
        updates.refreshKeywordMetrics = args.refreshKeywordMetrics;
      }
      if (args.trackSerpDaily !== undefined) {
        updates.trackSerpDaily = args.trackSerpDaily;
      }
      if (args.fetchBacklinks !== undefined) {
        updates.fetchBacklinks = args.fetchBacklinks;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(trackedId, updates);
      }
    }

    return null;
  },
});

