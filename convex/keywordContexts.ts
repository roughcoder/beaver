/**
 * Public APIs for keyword contexts.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Get or create a keyword context.
 */
export const getOrCreate = mutation({
  args: {
    seType: v.string(),
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()),
  },
  returns: v.id("keywordContexts"),
  handler: async (ctx, args): Promise<Id<"keywordContexts">> => {
    await getAuthUserId(ctx); // Ensure authenticated
    
    return await ctx.runMutation(internal.internal.writeModels.upsertKeywordContext, {
      seType: args.seType,
      locationCode: args.locationCode,
      languageCode: args.languageCode,
      device: args.device,
    });
  },
});

