/**
 * Internal mutations for writing normalized entities and snapshots.
 */

import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

/**
 * Normalize and upsert a keyword.
 */
export const upsertKeyword = internalMutation({
  args: {
    text: v.string(),
  },
  returns: v.id("keywords"),
  handler: async (ctx, args) => {
    const norm = args.text.toLowerCase().trim();
    
    // Check if exists
    const existing = await ctx.db
      .query("keywords")
      .withIndex("by_norm", (q) => q.eq("norm", norm))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("keywords", {
      text: args.text,
      norm,
      createdAt: Date.now(),
    });
  },
});

/**
 * Normalize and upsert a domain.
 */
export const upsertDomain = internalMutation({
  args: {
    domain: v.string(),
  },
  returns: v.id("domains"),
  handler: async (ctx, args) => {
    const domainNorm = args.domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    
    const existing = await ctx.db
      .query("domains")
      .withIndex("by_domainNorm", (q) => q.eq("domainNorm", domainNorm))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("domains", {
      domain: args.domain,
      domainNorm,
      createdAt: Date.now(),
    });
  },
});

/**
 * Normalize and upsert a URL.
 */
export const upsertUrl = internalMutation({
  args: {
    url: v.string(),
    domainId: v.id("domains"),
  },
  returns: v.id("urls"),
  handler: async (ctx, args) => {
    const urlNorm = args.url.toLowerCase().trim();
    
    const existing = await ctx.db
      .query("urls")
      .withIndex("by_urlNorm", (q) => q.eq("urlNorm", urlNorm))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("urls", {
      url: args.url,
      urlNorm,
      domainId: args.domainId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Upsert a keyword context.
 */
export const upsertKeywordContext = internalMutation({
  args: {
    seType: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
  },
  returns: v.id("keywordContexts"),
  handler: async (ctx, args) => {
    // Check if exists
    const existing = await ctx.db
      .query("keywordContexts")
      .withIndex("by_location_language", (q) =>
        q.eq("locationCode", args.locationCode).eq("languageCode", args.languageCode)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("seType"), args.seType),
          args.device ? q.eq(q.field("device"), args.device) : q.eq(q.field("device"), undefined)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("keywordContexts", {
      seType: args.seType,
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
      createdAt: Date.now(),
    });
  },
});

/**
 * Write a keyword snapshot.
 */
export const writeKeywordSnapshot = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    source: v.string(),
    fetchedAt: v.number(),
    staleAt: v.number(),
    keywordInfo: v.optional(v.any()),
    keywordProperties: v.optional(v.any()),
    serpInfo: v.optional(v.any()),
    avgBacklinksInfo: v.optional(v.any()),
    searchIntentInfo: v.optional(v.any()),
    rawJson: v.any(),
  },
  returns: v.id("keywordSnapshots"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("keywordSnapshots", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      keywordId: args.keywordId,
      contextId: args.contextId,
      source: args.source,
      fetchedAt: args.fetchedAt,
      staleAt: args.staleAt,
      keywordInfo: args.keywordInfo,
      keywordProperties: args.keywordProperties,
      serpInfo: args.serpInfo,
      avgBacklinksInfo: args.avgBacklinksInfo,
      searchIntentInfo: args.searchIntentInfo,
      rawJson: args.rawJson,
    });
  },
});

/**
 * Write a SERP snapshot.
 */
export const writeSerpSnapshot = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    fetchedAt: v.number(),
    staleAt: v.number(),
    seType: v.string(),
    seDomain: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
    resultsCount: v.optional(v.number()),
    itemsCount: v.optional(v.number()),
    pagesCount: v.optional(v.number()),
    serpItemTypesPresent: v.optional(v.array(v.string())),
    topOrganicDomainIds: v.optional(v.array(v.id("domains"))),
    topOrganicUrlIds: v.optional(v.array(v.id("urls"))),
    rawJson: v.any(),
  },
  returns: v.id("serpSnapshots"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("serpSnapshots", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      keywordId: args.keywordId,
      contextId: args.contextId,
      fetchedAt: args.fetchedAt,
      staleAt: args.staleAt,
      seType: args.seType,
      seDomain: args.seDomain,
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
      resultsCount: args.resultsCount,
      itemsCount: args.itemsCount,
      pagesCount: args.pagesCount,
      serpItemTypesPresent: args.serpItemTypesPresent,
      topOrganicDomainIds: args.topOrganicDomainIds,
      topOrganicUrlIds: args.topOrganicUrlIds,
      rawJson: args.rawJson,
    });
  },
});

/**
 * Write a SERP item.
 */
export const writeSerpItem = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    serpSnapshotId: v.id("serpSnapshots"),
    type: v.string(),
    rankGroup: v.optional(v.number()),
    rankAbsolute: v.optional(v.number()),
    page: v.optional(v.number()),
    domainId: v.optional(v.id("domains")),
    urlId: v.optional(v.id("urls")),
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
    payload: v.optional(v.any()),
  },
  returns: v.id("serpItems"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("serpItems", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      serpSnapshotId: args.serpSnapshotId,
      type: args.type,
      rankGroup: args.rankGroup,
      rankAbsolute: args.rankAbsolute,
      page: args.page,
      domainId: args.domainId,
      urlId: args.urlId,
      domain: args.domain,
      url: args.url,
      title: args.title,
      description: args.description,
      breadcrumb: args.breadcrumb,
      websiteName: args.websiteName,
      isFeaturedSnippet: args.isFeaturedSnippet,
      isVideo: args.isVideo,
      isImage: args.isImage,
      isMalicious: args.isMalicious,
      isWebStory: args.isWebStory,
      payload: args.payload,
    });
  },
});

/**
 * Write a backlink snapshot.
 */
export const writeBacklinkSnapshot = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    fetchedAt: v.number(),
    staleAt: v.number(),
    targetType: v.string(),
    targetsCount: v.number(),
    rawJson: v.any(),
  },
  returns: v.id("backlinkSnapshots"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("backlinkSnapshots", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      fetchedAt: args.fetchedAt,
      staleAt: args.staleAt,
      targetType: args.targetType,
      targetsCount: args.targetsCount,
      rawJson: args.rawJson,
    });
  },
});

/**
 * Write URL backlink facts.
 */
export const writeUrlBacklinkFacts = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    backlinkSnapshotId: v.id("backlinkSnapshots"),
    urlId: v.id("urls"),
    domainId: v.optional(v.id("domains")),
    fetchedAt: v.number(),
    staleAt: v.number(),
    rank: v.optional(v.number()),
    mainDomainRank: v.optional(v.number()),
    backlinks: v.optional(v.number()),
    dofollowBacklinks: v.optional(v.number()),
    nofollowBacklinks: v.optional(v.number()),
    referringDomains: v.optional(v.number()),
    referringMainDomains: v.optional(v.number()),
    referringPages: v.optional(v.number()),
    brokenBacklinks: v.optional(v.number()),
    brokenPages: v.optional(v.number()),
    backlinksSpamScore: v.optional(v.number()),
    firstSeen: v.optional(v.string()),
    lostDate: v.optional(v.string()),
    referringLinksTld: v.optional(v.any()),
    referringLinksTypes: v.optional(v.any()),
    referringLinksAttributes: v.optional(v.any()),
    referringLinksPlatforms: v.optional(v.any()),
    referringLinksSemantics: v.optional(v.any()),
    referringLinksCountries: v.optional(v.any()),
  },
  returns: v.id("urlBacklinkFacts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("urlBacklinkFacts", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      backlinkSnapshotId: args.backlinkSnapshotId,
      urlId: args.urlId,
      domainId: args.domainId,
      fetchedAt: args.fetchedAt,
      staleAt: args.staleAt,
      rank: args.rank,
      mainDomainRank: args.mainDomainRank,
      backlinks: args.backlinks,
      dofollowBacklinks: args.dofollowBacklinks,
      nofollowBacklinks: args.nofollowBacklinks,
      referringDomains: args.referringDomains,
      referringMainDomains: args.referringMainDomains,
      referringPages: args.referringPages,
      brokenBacklinks: args.brokenBacklinks,
      brokenPages: args.brokenPages,
      backlinksSpamScore: args.backlinksSpamScore,
      firstSeen: args.firstSeen,
      lostDate: args.lostDate,
      referringLinksTld: args.referringLinksTld,
      referringLinksTypes: args.referringLinksTypes,
      referringLinksAttributes: args.referringLinksAttributes,
      referringLinksPlatforms: args.referringLinksPlatforms,
      referringLinksSemantics: args.referringLinksSemantics,
      referringLinksCountries: args.referringLinksCountries,
    });
  },
});

/**
 * Write domain backlink facts.
 */
export const writeDomainBacklinkFacts = internalMutation({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    backlinkSnapshotId: v.id("backlinkSnapshots"),
    domainId: v.id("domains"),
    fetchedAt: v.number(),
    staleAt: v.number(),
    rank: v.optional(v.number()),
    mainDomainRank: v.optional(v.number()),
    backlinks: v.optional(v.number()),
    dofollowBacklinks: v.optional(v.number()),
    nofollowBacklinks: v.optional(v.number()),
    referringDomains: v.optional(v.number()),
    referringMainDomains: v.optional(v.number()),
    referringPages: v.optional(v.number()),
    brokenBacklinks: v.optional(v.number()),
    brokenPages: v.optional(v.number()),
    backlinksSpamScore: v.optional(v.number()),
    firstSeen: v.optional(v.string()),
    lostDate: v.optional(v.string()),
    referringLinksTld: v.optional(v.any()),
    referringLinksTypes: v.optional(v.any()),
    referringLinksAttributes: v.optional(v.any()),
    referringLinksPlatforms: v.optional(v.any()),
    referringLinksSemantics: v.optional(v.any()),
    referringLinksCountries: v.optional(v.any()),
  },
  returns: v.id("domainBacklinkFacts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("domainBacklinkFacts", {
      userId: args.userId,
      projectId: args.projectId,
      apiCallId: args.apiCallId,
      backlinkSnapshotId: args.backlinkSnapshotId,
      domainId: args.domainId,
      fetchedAt: args.fetchedAt,
      staleAt: args.staleAt,
      rank: args.rank,
      mainDomainRank: args.mainDomainRank,
      backlinks: args.backlinks,
      dofollowBacklinks: args.dofollowBacklinks,
      nofollowBacklinks: args.nofollowBacklinks,
      referringDomains: args.referringDomains,
      referringMainDomains: args.referringMainDomains,
      referringPages: args.referringPages,
      brokenBacklinks: args.brokenBacklinks,
      brokenPages: args.brokenPages,
      backlinksSpamScore: args.backlinksSpamScore,
      firstSeen: args.firstSeen,
      lostDate: args.lostDate,
      referringLinksTld: args.referringLinksTld,
      referringLinksTypes: args.referringLinksTypes,
      referringLinksAttributes: args.referringLinksAttributes,
      referringLinksPlatforms: args.referringLinksPlatforms,
      referringLinksSemantics: args.referringLinksSemantics,
      referringLinksCountries: args.referringLinksCountries,
    });
  },
});

