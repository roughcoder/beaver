/**
 * Computed keyword difficulty based on SERP + backlinks.
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Difficulty computation weights (configurable later)
const WEIGHTS = {
  w1: 1.0, // referringDomains
  w2: 0.8, // backlinks
  w3: 0.5, // rank
  w4: 0.6, // mainDomainRank
  w5: 0.3, // spamScore (penalty)
};

/**
 * Compute URL strength from backlink facts.
 */
function computeUrlStrength(
  referringDomains: number,
  backlinks: number,
  rank: number | undefined,
  mainDomainRank: number | undefined,
  spamScore: number | undefined
): number {
  const logRefDomains = Math.log(referringDomains + 1);
  const logBacklinks = Math.log(backlinks + 1);
  const rankScore = rank ? rank / 1000 : 0;
  const domainRankScore = mainDomainRank ? mainDomainRank / 1000 : 0;
  const spamPenalty = spamScore ? spamScore : 0;

  return (
    WEIGHTS.w1 * logRefDomains +
    WEIGHTS.w2 * logBacklinks +
    WEIGHTS.w3 * rankScore +
    WEIGHTS.w4 * domainRankScore -
    WEIGHTS.w5 * spamPenalty
  );
}

/**
 * Scale median strength to 0-100 difficulty.
 */
function scaleToDifficulty(medianStrength: number, minStrength: number, maxStrength: number): number {
  if (maxStrength === minStrength) return 50; // Default middle if no variance

  // Normalize to 0-1, then scale to 0-100
  const normalized = (medianStrength - minStrength) / (maxStrength - minStrength);
  return Math.max(0, Math.min(100, normalized * 100));
}

/**
 * Compute and persist keyword difficulty.
 */
export const computeDifficulty = internalMutation({
  args: {
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    serpSnapshotId: v.id("serpSnapshots"),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.id("keywordDifficultyComputed"),
  handler: async (ctx, args) => {
    // Get SERP snapshot
    const serpSnapshot = await ctx.db.get(args.serpSnapshotId);
    if (!serpSnapshot) {
      throw new Error("SERP snapshot not found");
    }

    // Get top 10 organic URLs
    const topOrganicItems = await ctx.db
      .query("serpItems")
      .withIndex("by_snapshot_rank", (q) => q.eq("serpSnapshotId", args.serpSnapshotId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "organic"),
          q.neq(q.field("rankAbsolute"), undefined)
        )
      )
      .order("asc")
      .take(10);

    if (topOrganicItems.length === 0) {
      throw new Error("No organic results in SERP snapshot");
    }

    const urlStrengths: number[] = [];
    const urlIds: Id<"urls">[] = [];
    const backlinkFactIds: Id<"urlBacklinkFacts">[] = [];
    const strengths: number[] = [];

    // Get backlink facts for each URL
    for (const item of topOrganicItems) {
      if (!item.urlId || !item.rankAbsolute) continue;

      urlIds.push(item.urlId);

      // Get latest backlink facts for this URL
      const backlinkFacts = await ctx.db
        .query("urlBacklinkFacts")
        .withIndex("by_url_latest", (q) => q.eq("urlId", item.urlId!))
        .order("desc")
        .first();

      if (backlinkFacts) {
        backlinkFactIds.push(backlinkFacts._id);

        const strength = computeUrlStrength(
          backlinkFacts.referringDomains || 0,
          backlinkFacts.backlinks || 0,
          backlinkFacts.rank,
          backlinkFacts.mainDomainRank,
          backlinkFacts.backlinksSpamScore
        );

        strengths.push(strength);
        urlStrengths.push(strength);
      } else {
        // No backlink data - use default low strength
        strengths.push(0);
        urlStrengths.push(0);
      }
    }

    if (strengths.length === 0) {
      throw new Error("No backlink data available for difficulty computation");
    }

    // Compute median
    const sorted = [...strengths].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Scale to 0-100
    const minStrength = Math.min(...strengths);
    const maxStrength = Math.max(...strengths);
    const difficulty = scaleToDifficulty(median, minStrength, maxStrength);

    // Compute median domain strength (optional)
    const domainStrengths: number[] = [];
    const domainBacklinkFactIds: Id<"domainBacklinkFacts">[] = [];

    for (const item of topOrganicItems) {
      if (!item.domainId) continue;

      const domainFacts = await ctx.db
        .query("domainBacklinkFacts")
        .withIndex("by_domain_latest", (q) => q.eq("domainId", item.domainId!))
        .order("desc")
        .first();

      if (domainFacts) {
        domainBacklinkFactIds.push(domainFacts._id);
        const domainStrength = computeUrlStrength(
          domainFacts.referringDomains || 0,
          domainFacts.backlinks || 0,
          domainFacts.rank,
          domainFacts.mainDomainRank,
          domainFacts.backlinksSpamScore
        );
        domainStrengths.push(domainStrength);
      }
    }

    const medianDomainStrength = domainStrengths.length > 0
      ? domainStrengths.sort((a, b) => a - b)[Math.floor(domainStrengths.length / 2)]
      : undefined;

    // Persist computed difficulty
    const computedAt = Date.now();
    const difficultyId = await ctx.db.insert("keywordDifficultyComputed", {
      userId: args.userId,
      projectId: args.projectId,
      keywordId: args.keywordId,
      contextId: args.contextId,
      serpSnapshotId: args.serpSnapshotId,
      computedAt,
      staleAt: computedAt + 24 * 60 * 60 * 1000, // 24 hours
      difficulty: Math.round(difficulty),
      medianUrlStrength: median,
      medianDomainStrength,
      topOrganicUrlIds: urlIds,
      usedUrlBacklinkFactIds: backlinkFactIds,
      usedDomainBacklinkFactIds: domainBacklinkFactIds.length > 0 ? domainBacklinkFactIds : undefined,
      stats: {
        urlCount: urlIds.length,
        backlinkFactsCount: backlinkFactIds.length,
        domainFactsCount: domainBacklinkFactIds.length,
        minStrength,
        maxStrength,
      },
    });

    return difficultyId;
  },
});

