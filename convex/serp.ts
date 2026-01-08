/**
 * Public APIs for SERP snapshots and items.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List SERP snapshots for a keyword and context, ordered by fetchedAt descending.
 */
export const listSnapshotsForKeywordContext = query({
  args: {
    projectId: v.id("projects"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
  },
  returns: v.array(
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or access denied");
    }

    const snapshots = await ctx.db
      .query("serpSnapshots")
      .withIndex("by_keyword_context_time", (q) =>
        q.eq("keywordId", args.keywordId).eq("contextId", args.contextId)
      )
      .order("desc")
      .collect();

    return snapshots.map((snapshot) => ({
      _id: snapshot._id,
      fetchedAt: snapshot.fetchedAt,
      staleAt: snapshot.staleAt,
      resultsCount: snapshot.resultsCount,
      itemsCount: snapshot.itemsCount,
      pagesCount: snapshot.pagesCount,
      serpItemTypesPresent: snapshot.serpItemTypesPresent,
    }));
  },
});

/**
 * Get SERP items for a specific snapshot, grouped by type.
 */
export const getSnapshotItems = query({
  args: {
    projectId: v.id("projects"),
    serpSnapshotId: v.id("serpSnapshots"),
  },
  returns: v.array(
    v.object({
      _id: v.id("serpItems"),
      type: v.string(),
      rankGroup: v.optional(v.number()),
      rankAbsolute: v.optional(v.number()),
      page: v.optional(v.number()),
      domain: v.optional(v.string()),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      breadcrumb: v.optional(v.string()),
      websiteName: v.optional(v.string()),
      isFeaturedSnippet: v.optional(v.boolean()),
      isVideo: v.optional(v.boolean()),
      isImage: v.optional(v.boolean()),
      isMalicious: v.optional(v.boolean()),
      isWebStory: v.optional(v.boolean()),
      urlBacklinks: v.optional(
        v.object({
          backlinks: v.optional(v.number()),
          dofollowBacklinks: v.optional(v.number()),
          nofollowBacklinks: v.optional(v.number()),
          referringDomains: v.optional(v.number()),
          referringMainDomains: v.optional(v.number()),
          referringPages: v.optional(v.number()),
          rank: v.optional(v.number()),
          mainDomainRank: v.optional(v.number()),
          backlinksSpamScore: v.optional(v.number()),
        })
      ),
      domainBacklinks: v.optional(
        v.object({
          backlinks: v.optional(v.number()),
          dofollowBacklinks: v.optional(v.number()),
          nofollowBacklinks: v.optional(v.number()),
          referringDomains: v.optional(v.number()),
          referringMainDomains: v.optional(v.number()),
          referringPages: v.optional(v.number()),
          rank: v.optional(v.number()),
          mainDomainRank: v.optional(v.number()),
          backlinksSpamScore: v.optional(v.number()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify project ownership via snapshot
    const snapshot = await ctx.db.get(args.serpSnapshotId);
    if (!snapshot) {
      throw new Error("SERP snapshot not found");
    }

    if (snapshot.projectId) {
      const project = await ctx.db.get(snapshot.projectId);
      if (!project || project.userId !== userId) {
        throw new Error("Project not found or access denied");
      }
    } else if (snapshot.userId !== userId) {
      throw new Error("Access denied");
    }

    const items = await ctx.db
      .query("serpItems")
      .withIndex("by_snapshot_type", (q) => q.eq("serpSnapshotId", args.serpSnapshotId))
      .collect();

    const results = [];

    for (const item of items) {
      // Get URL backlink facts if urlId exists
      let urlBacklinks = undefined;
      if (item.urlId) {
        const urlFacts = await ctx.db
          .query("urlBacklinkFacts")
          .withIndex("by_url_latest", (q) => q.eq("urlId", item.urlId!))
          .order("desc")
          .first();

        if (urlFacts) {
          urlBacklinks = {
            backlinks: urlFacts.backlinks,
            dofollowBacklinks: urlFacts.dofollowBacklinks,
            nofollowBacklinks: urlFacts.nofollowBacklinks,
            referringDomains: urlFacts.referringDomains,
            referringMainDomains: urlFacts.referringMainDomains,
            referringPages: urlFacts.referringPages,
            rank: urlFacts.rank,
            mainDomainRank: urlFacts.mainDomainRank,
            backlinksSpamScore: urlFacts.backlinksSpamScore,
          };
        }
      }

      // Get domain backlink facts if domainId exists
      let domainBacklinks = undefined;
      if (item.domainId) {
        const domainFacts = await ctx.db
          .query("domainBacklinkFacts")
          .withIndex("by_domain_latest", (q) => q.eq("domainId", item.domainId!))
          .order("desc")
          .first();

        if (domainFacts) {
          domainBacklinks = {
            backlinks: domainFacts.backlinks,
            dofollowBacklinks: domainFacts.dofollowBacklinks,
            nofollowBacklinks: domainFacts.nofollowBacklinks,
            referringDomains: domainFacts.referringDomains,
            referringMainDomains: domainFacts.referringMainDomains,
            referringPages: domainFacts.referringPages,
            rank: domainFacts.rank,
            mainDomainRank: domainFacts.mainDomainRank,
            backlinksSpamScore: domainFacts.backlinksSpamScore,
          };
        }
      }

      results.push({
        _id: item._id,
        type: item.type,
        rankGroup: item.rankGroup,
        rankAbsolute: item.rankAbsolute,
        page: item.page,
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
        urlBacklinks,
        domainBacklinks,
      });
    }

    return results;
  },
});

