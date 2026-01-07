/**
 * Cron jobs for periodic keyword tracking refresh.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 15 minutes to check for stale tracked keywords
crons.interval(
  "refresh-tracked-keywords",
  { minutes: 15 },
  internal.internal.refreshTrackedKeywords.refreshTrackedKeywords
);

export default crons;

