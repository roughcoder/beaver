import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    url: v.string(),
    default_region: v.string(),
    default_language: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
});
 
export default schema;