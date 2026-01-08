/**
 * Public APIs for fetching detailed keyword information.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get comprehensive keyword details for a specific keyword and context.
 */
export const get = query({
  args: {
    projectId: v.id("projects"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
  },
  returns: v.union(
    v.null(),
    v.object({
      keyword: v.object({
        _id: v.id("keywords"),
        text: v.string(),
        norm: v.string(),
        createdAt: v.number(),
      }),
      context: v.object({
        _id: v.id("keywordContexts"),
        seType: v.string(),
        locationCode: v.number(),
        languageCode: v.string(),
        device: v.optional(v.string()),
        createdAt: v.number(),
      }),
      snapshot: v.union(
        v.null(),
        v.object({
          fetchedAt: v.number(),
          staleAt: v.number(),
          source: v.string(),
          keywordInfo: v.optional(
            v.object({
              volume: v.optional(v.number()),
              cpc: v.optional(v.number()),
              competition: v.optional(v.number()),
              competitionLevel: v.optional(v.string()),
              bids: v.optional(v.number()),
              monthlySearches: v.optional(
                v.array(
                  v.object({
                    year: v.number(),
                    month: v.number(),
                    searchVolume: v.number(),
                  })
                )
              ),
              trend: v.optional(v.array(v.number())),
            })
          ),
          keywordProperties: v.optional(
            v.object({
              coreKeyword: v.optional(v.string()),
              keywordDifficulty: v.optional(v.number()),
              language: v.optional(v.string()),
              clustering: v.optional(v.number()),
              wordsCount: v.optional(v.number()),
            })
          ),
          serpInfo: v.optional(
            v.object({
              serpItemTypes: v.optional(v.array(v.string())),
              resultsCount: v.optional(v.number()),
              updatedAt: v.optional(v.number()),
            })
          ),
          avgBacklinksInfo: v.optional(
            v.object({
              avgBacklinks: v.optional(v.number()),
              avgReferringDomains: v.optional(v.number()),
              avgRank: v.optional(v.number()),
            })
          ),
          searchIntentInfo: v.optional(
            v.object({
              mainIntent: v.optional(v.string()),
              foreignIntent: v.optional(v.array(v.string())),
            })
          ),
        })
      ),
      serpSnapshot: v.union(
        v.null(),
        v.object({
          _id: v.id("serpSnapshots"),
          fetchedAt: v.number(),
          staleAt: v.number(),
          resultsCount: v.optional(v.number()),
          itemsCount: v.optional(v.number()),
          pagesCount: v.optional(v.number()),
          serpItemTypesPresent: v.optional(v.array(v.string())),
        })
      ),
      computedDifficulty: v.union(
        v.null(),
        v.object({
          difficulty: v.number(),
          computedAt: v.number(),
          staleAt: v.number(),
          medianUrlStrength: v.number(),
          medianDomainStrength: v.optional(v.number()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }

    // Get keyword
    const keyword = await ctx.db.get(args.keywordId);
    if (!keyword) {
      return null;
    }

    // Get context
    const context = await ctx.db.get(args.contextId);
    if (!context) {
      return null;
    }

    // Get latest keyword snapshot
    const latestSnapshot = await ctx.db
      .query("keywordSnapshots")
      .withIndex("by_project_keyword_context_time", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("keywordId", args.keywordId)
          .eq("contextId", args.contextId)
      )
      .order("desc")
      .first();

    // Get latest SERP snapshot
    const latestSerp = await ctx.db
      .query("serpSnapshots")
      .withIndex("by_project_time", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("keywordId", args.keywordId)
          .eq("contextId", args.contextId)
      )
      .order("desc")
      .first();

    // Get latest computed difficulty
    const latestDifficulty = await ctx.db
      .query("keywordDifficultyComputed")
      .withIndex("by_project_keyword_context_time", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("keywordId", args.keywordId)
          .eq("contextId", args.contextId)
      )
      .order("desc")
      .first();

    return {
      keyword: {
        _id: keyword._id,
        text: keyword.text,
        norm: keyword.norm,
        createdAt: keyword.createdAt,
      },
      context: {
        _id: context._id,
        seType: context.seType,
        locationCode: context.locationCode,
        languageCode: context.languageCode,
        device: context.device,
        createdAt: context.createdAt,
      },
      snapshot: latestSnapshot
        ? {
            fetchedAt: latestSnapshot.fetchedAt,
            staleAt: latestSnapshot.staleAt,
            source: latestSnapshot.source,
            keywordInfo: latestSnapshot.keywordInfo,
            keywordProperties: latestSnapshot.keywordProperties,
            serpInfo: latestSnapshot.serpInfo,
            avgBacklinksInfo: latestSnapshot.avgBacklinksInfo,
            searchIntentInfo: latestSnapshot.searchIntentInfo,
          }
        : null,
      serpSnapshot: latestSerp
        ? {
            _id: latestSerp._id,
            fetchedAt: latestSerp.fetchedAt,
            staleAt: latestSerp.staleAt,
            resultsCount: latestSerp.resultsCount,
            itemsCount: latestSerp.itemsCount,
            pagesCount: latestSerp.pagesCount,
            serpItemTypesPresent: latestSerp.serpItemTypesPresent,
          }
        : null,
      computedDifficulty: latestDifficulty
        ? {
            difficulty: latestDifficulty.difficulty,
            computedAt: latestDifficulty.computedAt,
            staleAt: latestDifficulty.staleAt,
            medianUrlStrength: latestDifficulty.medianUrlStrength,
            medianDomainStrength: latestDifficulty.medianDomainStrength,
          }
        : null,
    };
  },
});

