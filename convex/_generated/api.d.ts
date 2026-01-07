/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as actions_dataforseo from "../actions/dataforseo.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as difficulty from "../difficulty.js";
import type * as http from "../http.js";
import type * as internal_cache from "../internal/cache.js";
import type * as internal_getTrackedKeywordsWithSerp from "../internal/getTrackedKeywordsWithSerp.js";
import type * as internal_helpers from "../internal/helpers.js";
import type * as internal_refreshTrackedKeywords from "../internal/refreshTrackedKeywords.js";
import type * as internal_writeModels from "../internal/writeModels.js";
import type * as keywordContexts from "../keywordContexts.js";
import type * as keywordResearch from "../keywordResearch.js";
import type * as lib_dataforseoClient from "../lib/dataforseoClient.js";
import type * as lib_requestHash from "../lib/requestHash.js";
import type * as projects from "../projects.js";
import type * as tasks from "../tasks.js";
import type * as trackedKeywords from "../trackedKeywords.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  "actions/dataforseo": typeof actions_dataforseo;
  auth: typeof auth;
  crons: typeof crons;
  difficulty: typeof difficulty;
  http: typeof http;
  "internal/cache": typeof internal_cache;
  "internal/getTrackedKeywordsWithSerp": typeof internal_getTrackedKeywordsWithSerp;
  "internal/helpers": typeof internal_helpers;
  "internal/refreshTrackedKeywords": typeof internal_refreshTrackedKeywords;
  "internal/writeModels": typeof internal_writeModels;
  keywordContexts: typeof keywordContexts;
  keywordResearch: typeof keywordResearch;
  "lib/dataforseoClient": typeof lib_dataforseoClient;
  "lib/requestHash": typeof lib_requestHash;
  projects: typeof projects;
  tasks: typeof tasks;
  trackedKeywords: typeof trackedKeywords;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
