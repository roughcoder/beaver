/**
 * Helper query to get tracked keywords with SERP tracking enabled.
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getTrackedKeywordsWithSerp = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("trackedKeywords"),
      userId: v.id("users"),
      projectId: v.optional(v.id("projects")),
      keywordId: v.id("keywords"),
      contextId: v.id("keywordContexts"),
      trackSerpDaily: v.boolean(),
      fetchBacklinks: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    // Get all tracked keywords and filter in memory
    // Note: We could add a better index later if needed
    const all = await ctx.db.query("trackedKeywords").collect();
    return all.filter((t) => t.trackSerpDaily === true);
  },
});

