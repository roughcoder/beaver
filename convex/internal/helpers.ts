/**
 * Helper queries and mutations for refresh operations.
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const getKeyword = internalQuery({
  args: { keywordId: v.id("keywords") },
  returns: v.union(
    v.object({
      _id: v.id("keywords"),
      text: v.string(),
      norm: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const keyword = await ctx.db.get(args.keywordId);
    if (!keyword) return null;
    return {
      _id: keyword._id,
      text: keyword.text,
      norm: keyword.norm,
      createdAt: keyword.createdAt,
    };
  },
});

export const getKeywordContext = internalQuery({
  args: { contextId: v.id("keywordContexts") },
  returns: v.union(
    v.object({
      _id: v.id("keywordContexts"),
      seType: v.string(),
      locationCode: v.number(),
      languageCode: v.string(),
      device: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const context = await ctx.db.get(args.contextId);
    if (!context) return null;
    return {
      _id: context._id,
      seType: context.seType,
      locationCode: context.locationCode,
      languageCode: context.languageCode,
      device: context.device,
      createdAt: context.createdAt,
    };
  },
});

export const getLatestSerpSnapshot = internalQuery({
  args: {
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
  },
  returns: v.union(
    v.object({
      _id: v.id("serpSnapshots"),
      staleAt: v.number(),
      topOrganicUrlIds: v.optional(v.array(v.id("urls"))),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("serpSnapshots")
      .withIndex("by_keyword_context_time", (q) =>
        q.eq("keywordId", args.keywordId).eq("contextId", args.contextId)
      )
      .order("desc")
      .first();
    if (!snapshot) return null;
    return {
      _id: snapshot._id,
      staleAt: snapshot.staleAt,
      topOrganicUrlIds: snapshot.topOrganicUrlIds,
    };
  },
});

export const getLatestBacklinkSnapshot = internalQuery({
  args: { projectId: v.optional(v.id("projects")) },
  returns: v.union(
    v.object({
      _id: v.id("backlinkSnapshots"),
      staleAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!args.projectId) return null;
    const snapshot = await ctx.db
      .query("backlinkSnapshots")
      .withIndex("by_project_time", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();
    if (!snapshot) return null;
    return { _id: snapshot._id, staleAt: snapshot.staleAt };
  },
});

export const getUrlsByIds = internalQuery({
  args: { urlIds: v.array(v.id("urls")) },
  returns: v.array(
    v.object({
      _id: v.id("urls"),
      url: v.string(),
      urlNorm: v.string(),
      domainId: v.id("domains"),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const urls: Array<{
      _id: Id<"urls">;
      url: string;
      urlNorm: string;
      domainId: Id<"domains">;
      createdAt: number;
    }> = [];
    for (const urlId of args.urlIds) {
      const url = await ctx.db.get(urlId);
      if (url) {
        urls.push({
          _id: url._id,
          url: url.url,
          urlNorm: url.urlNorm,
          domainId: url.domainId,
          createdAt: url.createdAt,
        });
      }
    }
    return urls;
  },
});

export const getLatestDifficulty = internalQuery({
  args: { serpSnapshotId: v.id("serpSnapshots") },
  returns: v.union(
    v.object({
      _id: v.id("keywordDifficultyComputed"),
      staleAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const difficulty = await ctx.db
      .query("keywordDifficultyComputed")
      .withIndex("by_serpSnapshot", (q) => q.eq("serpSnapshotId", args.serpSnapshotId))
      .first();
    if (!difficulty) return null;
    return { _id: difficulty._id, staleAt: difficulty.staleAt };
  },
});

export const getLatestUrlBacklinkFacts = internalQuery({
  args: { urlId: v.id("urls") },
  returns: v.union(
    v.object({
      _id: v.id("urlBacklinkFacts"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const facts = await ctx.db
      .query("urlBacklinkFacts")
      .withIndex("by_url_latest", (q) => q.eq("urlId", args.urlId))
      .order("desc")
      .first();
    return facts ? { _id: facts._id } : null;
  },
});

export const getBacklinkSnapshotByApiCall = internalQuery({
  args: { apiCallId: v.id("apiCalls") },
  returns: v.union(
    v.object({
      _id: v.id("backlinkSnapshots"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backlinkSnapshots")
      .withIndex("by_apiCall", (q) => q.eq("apiCallId", args.apiCallId))
      .first();
    return existing ? { _id: existing._id } : null;
  },
});

export const createJob = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    status: v.string(),
    stage: v.string(),
    progress: v.number(),
    costSoFarUsd: v.number(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: v.optional(v.any()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", {
      userId: args.userId,
      projectId: args.projectId,
      status: args.status,
      stage: args.stage,
      progress: args.progress,
      costSoFarUsd: args.costSoFarUsd,
      createdAt: Date.now(),
      metadata: args.metadata,
    });
  },
});

