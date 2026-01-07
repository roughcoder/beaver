/**
 * Internal function to refresh tracked keywords that need updates.
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const refreshTrackedKeywords = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    serpJobsQueued: v.number(),
    backlinkJobsQueued: v.number(),
    difficultyJobsQueued: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    let processed = 0;
    let serpJobsQueued = 0;
    let backlinkJobsQueued = 0;
    let difficultyJobsQueued = 0;

    // Find tracked keywords with SERP tracking enabled that need refresh
    const trackedWithSerp = await ctx.runQuery(
      internal.internal.getTrackedKeywordsWithSerp.getTrackedKeywordsWithSerp,
      {},
    );

    for (const tracked of trackedWithSerp) {
      // Check if SERP snapshot is stale
      const latestSerp = await ctx.runQuery(internal.internal.helpers.getLatestSerpSnapshot, {
        keywordId: tracked.keywordId,
        contextId: tracked.contextId,
      });

      const needsSerpRefresh = !latestSerp || latestSerp.staleAt <= now;

      if (needsSerpRefresh) {
        const keyword = await ctx.runQuery(internal.internal.helpers.getKeyword, {
          keywordId: tracked.keywordId,
        });
        const context = await ctx.runQuery(internal.internal.helpers.getKeywordContext, {
          contextId: tracked.contextId,
        });
        
        if (!keyword || !context) continue;

        // Create job first
        const jobId = await ctx.runMutation(internal.internal.helpers.createJob, {
          userId: tracked.userId,
          projectId: tracked.projectId,
          status: "queued",
          stage: "serp",
          progress: 0,
          costSoFarUsd: 0,
          metadata: { trackedKeywordId: tracked._id },
        });

        // Queue SERP snapshot job
        await ctx.scheduler.runAfter(0, internal.actions.dataforseo.runSerpSnapshotJob, {
          jobId,
          keyword: keyword.text,
          locationCode: context.locationCode,
          languageCode: context.languageCode,
          device: context.device,
          userId: tracked.userId,
          projectId: tracked.projectId,
        });

        serpJobsQueued++;
        processed++;
      }

      // If SERP was just refreshed or exists, check if we need backlinks
      if (tracked.fetchBacklinks && latestSerp) {
        // Check if backlinks are stale
        const latestBacklinks = await ctx.runQuery(internal.internal.helpers.getLatestBacklinkSnapshot, {
          projectId: tracked.projectId,
        });

        const needsBacklinksRefresh = !latestBacklinks || latestBacklinks.staleAt <= now;

        if (needsBacklinksRefresh && latestSerp.topOrganicUrlIds && latestSerp.topOrganicUrlIds.length > 0) {
          // Get URLs
          const urls = await ctx.runQuery(internal.internal.helpers.getUrlsByIds, {
            urlIds: latestSerp.topOrganicUrlIds.slice(0, 10),
          });

          if (urls.length > 0) {
            const jobId = await ctx.runMutation(internal.internal.helpers.createJob, {
              userId: tracked.userId,
              projectId: tracked.projectId,
              status: "queued",
              stage: "backlinks",
              progress: 0,
              costSoFarUsd: 0,
              metadata: { trackedKeywordId: tracked._id, serpSnapshotId: latestSerp._id },
            });

            await ctx.scheduler.runAfter(0, internal.actions.dataforseo.runBacklinksBulkPagesSummaryJob, {
              jobId,
              urls: urls.map((u: { url: string }) => u.url),
              userId: tracked.userId,
              projectId: tracked.projectId,
            });

            backlinkJobsQueued++;
          }
        }
      }

      // Check if we need to compute difficulty
      if (latestSerp) {
        const latestDifficulty = await ctx.runQuery(internal.internal.helpers.getLatestDifficulty, {
          serpSnapshotId: latestSerp._id,
        });

        if (!latestDifficulty || latestDifficulty.staleAt <= now) {
          // Check if we have backlink facts for the top URLs
          let hasBacklinkData = false;
          if (latestSerp.topOrganicUrlIds && latestSerp.topOrganicUrlIds.length > 0) {
            for (const urlId of latestSerp.topOrganicUrlIds.slice(0, 3)) {
              const backlinkFacts = await ctx.runQuery(internal.internal.helpers.getLatestUrlBacklinkFacts, {
                urlId,
              });

              if (backlinkFacts) {
                hasBacklinkData = true;
                break;
              }
            }
          }

          if (hasBacklinkData) {
            await ctx.scheduler.runAfter(0, internal.difficulty.computeDifficulty, {
              keywordId: tracked.keywordId,
              contextId: tracked.contextId,
              serpSnapshotId: latestSerp._id,
              userId: tracked.userId,
              projectId: tracked.projectId,
            });

            difficultyJobsQueued++;
          }
        }
      }
    }

    return {
      processed,
      serpJobsQueued,
      backlinkJobsQueued,
      difficultyJobsQueued,
    };
  },
});
