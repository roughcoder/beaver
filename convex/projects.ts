import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const projectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  description: v.string(),
  url: v.string(),
  default_region: v.string(),
  default_language: v.string(),
});

export const listMine = query({
  args: {},
  returns: v.array(projectValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  returns: v.union(projectValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    if (project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    url: v.string(),
    default_region: v.string(),
    default_language: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("projects", {
      userId,
      name: args.name,
      description: args.description,
      url: args.url,
      default_region: args.default_region,
      default_language: args.default_language,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      url: v.optional(v.string()),
      default_region: v.optional(v.string()),
      default_language: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Forbidden");

    await ctx.db.patch(args.projectId, args.patch);
    return null;
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Forbidden");

    await ctx.db.delete(args.projectId);
    return null;
  },
});


