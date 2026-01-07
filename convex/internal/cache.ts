/**
 * Fetch-or-cache utilities for DataForSEO API calls.
 * Checks for fresh snapshots and duplicate request hashes before making API calls.
 */

import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";

export interface CacheCheckResult {
  cached: boolean;
  snapshotId?: Id<"keywordSnapshots" | "serpSnapshots" | "backlinkSnapshots">;
  apiCallId?: Id<"apiCalls">;
}

/**
 * Check if we have a fresh snapshot for a keyword + context + source.
 */
export const checkKeywordSnapshotCache = internalQuery({
  args: {
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    source: v.string(),
    now: v.number(),
  },
  returns: v.object({
    cached: v.boolean(),
    snapshotId: v.optional(v.union(v.id("keywordSnapshots"), v.id("serpSnapshots"), v.id("backlinkSnapshots"))),
    apiCallId: v.optional(v.id("apiCalls")),
  }),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("keywordSnapshots")
      .withIndex("by_keyword_context_source", (q) =>
        q.eq("keywordId", args.keywordId).eq("contextId", args.contextId).eq("source", args.source)
      )
      .order("desc")
      .first();

    if (latest && latest.staleAt > args.now) {
      return {
        cached: true,
        snapshotId: latest._id,
        apiCallId: latest.apiCallId,
      };
    }

    return { cached: false };
  },
});

/**
 * Check if we have a fresh SERP snapshot for a keyword + context.
 */
export const checkSerpSnapshotCache = internalQuery({
  args: {
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    now: v.number(),
  },
  returns: v.object({
    cached: v.boolean(),
    snapshotId: v.optional(v.union(v.id("keywordSnapshots"), v.id("serpSnapshots"), v.id("backlinkSnapshots"))),
    apiCallId: v.optional(v.id("apiCalls")),
  }),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("serpSnapshots")
      .withIndex("by_keyword_context_time", (q) =>
        q.eq("keywordId", args.keywordId).eq("contextId", args.contextId)
      )
      .order("desc")
      .first();

    if (latest && latest.staleAt > args.now) {
      return {
        cached: true,
        snapshotId: latest._id,
        apiCallId: latest.apiCallId,
      };
    }

    return { cached: false };
  },
});

/**
 * Check if we have a duplicate request hash within TTL to avoid duplicate billing.
 */
export const checkDuplicateRequestHash = internalQuery({
  args: {
    requestHash: v.string(),
    ttlMs: v.number(),
    now: v.number(),
  },
  returns: v.union(v.id("apiCalls"), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("apiCalls")
      .withIndex("by_requestHash", (q) => q.eq("requestHash", args.requestHash))
      .order("desc")
      .first();

    if (existing && existing.requestedAt + args.ttlMs > args.now) {
      return existing._id;
    }

    return null;
  },
});

/**
 * Create an apiCalls ledger entry.
 */
export const createApiCall = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    endpoint: v.string(),
    method: v.string(),
    requestHash: v.string(),
    requestPayload: v.optional(v.any()),
    httpStatus: v.optional(v.number()),
    dataforseoStatusCode: v.optional(v.number()),
    dataforseoStatusMessage: v.optional(v.string()),
    costUsd: v.number(),
    tasksCount: v.optional(v.number()),
    tasksCostUsd: v.optional(v.array(v.number())),
    error: v.optional(v.string()),
    responseAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  },
  returns: v.id("apiCalls"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiCalls", {
      userId: args.userId,
      projectId: args.projectId,
      provider: "dataforseo",
      endpoint: args.endpoint,
      method: args.method,
      requestHash: args.requestHash,
      requestPayload: args.requestPayload,
      requestedAt: Date.now(),
      responseAt: args.responseAt,
      durationMs: args.durationMs,
      httpStatus: args.httpStatus,
      dataforseoStatusCode: args.dataforseoStatusCode,
      dataforseoStatusMessage: args.dataforseoStatusMessage,
      currency: "USD",
      costUsd: args.costUsd,
      tasksCount: args.tasksCount,
      tasksCostUsd: args.tasksCostUsd,
      error: args.error,
    });
  },
});

