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

  // Canonical entities
  keywords: defineTable({
    text: v.string(),
    norm: v.string(), // normalized keyword text
    createdAt: v.number(),
  })
    .index("by_norm", ["norm"]),

  keywordContexts: defineTable({
    seType: v.string(), // "google"
    locationCode: v.number(),
    languageCode: v.string(),
    device: v.optional(v.string()), // "desktop" | "mobile"
    createdAt: v.number(),
  })
    .index("by_location_language", ["locationCode", "languageCode"]),

  domains: defineTable({
    domain: v.string(),
    domainNorm: v.string(), // normalized domain
    createdAt: v.number(),
  })
    .index("by_domainNorm", ["domainNorm"]),

  urls: defineTable({
    url: v.string(),
    urlNorm: v.string(), // normalized URL
    domainId: v.id("domains"),
    createdAt: v.number(),
  })
    .index("by_urlNorm", ["urlNorm"])
    .index("by_domainId", ["domainId"]),

  // Project tracking
  trackedKeywords: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    // Tracking toggles
    refreshKeywordMetrics: v.boolean(), // default ON, 7d TTL
    trackSerpDaily: v.boolean(), // default OFF, 24h TTL
    fetchBacklinks: v.boolean(), // default OFF, 7d TTL (only if SERP tracking enabled)
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_keyword_context", ["keywordId", "contextId"])
    .index("by_project_tracking", ["projectId", "trackSerpDaily"]),

  // API call ledger
  apiCalls: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    provider: v.string(), // "dataforseo"
    endpoint: v.string(),
    method: v.string(), // "POST"
    requestHash: v.string(),
    requestPayload: v.optional(v.any()),
    requestedAt: v.number(),
    responseAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    httpStatus: v.optional(v.number()),
    dataforseoStatusCode: v.optional(v.number()),
    dataforseoStatusMessage: v.optional(v.string()),
    currency: v.string(), // "USD"
    costUsd: v.number(),
    tasksCount: v.optional(v.number()),
    tasksCostUsd: v.optional(v.array(v.number())),
    error: v.optional(v.string()),
  })
    .index("by_project_time", ["projectId", "requestedAt"])
    .index("by_user_time", ["userId", "requestedAt"])
    .index("by_project_endpoint_time", ["projectId", "endpoint", "requestedAt"])
    .index("by_requestHash", ["requestHash"]),

  // Keyword metrics snapshots (TTL 7d)
  keywordSnapshots: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    source: v.string(), // "labs_keyword_overview" | "labs_keyword_suggestions" | "labs_related_keywords" | "bulk_keyword_difficulty"
    fetchedAt: v.number(),
    staleAt: v.number(), // fetchedAt + 7 days
    // Explicit fields
    keywordInfo: v.optional(v.object({
      volume: v.optional(v.number()),
      cpc: v.optional(v.number()),
      competition: v.optional(v.number()),
      competitionLevel: v.optional(v.string()),
      bids: v.optional(v.number()),
      monthlySearches: v.optional(v.array(v.object({
        year: v.number(),
        month: v.number(),
        searchVolume: v.number(),
      }))),
      trend: v.optional(v.array(v.number())),
    })),
    keywordProperties: v.optional(v.object({
      coreKeyword: v.optional(v.string()),
      keywordDifficulty: v.optional(v.number()), // 0-100
      language: v.optional(v.string()),
      clustering: v.optional(v.number()),
      wordsCount: v.optional(v.number()),
    })),
    serpInfo: v.optional(v.object({
      serpItemTypes: v.optional(v.array(v.string())),
      resultsCount: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })),
    avgBacklinksInfo: v.optional(v.object({
      avgBacklinks: v.optional(v.number()),
      avgReferringDomains: v.optional(v.number()),
      avgRank: v.optional(v.number()),
    })),
    searchIntentInfo: v.optional(v.object({
      mainIntent: v.optional(v.string()),
      foreignIntent: v.optional(v.array(v.string())),
    })),
    rawJson: v.any(),
  })
    .index("by_keyword_context_source", ["keywordId", "contextId", "source"])
    .index("by_project_time", ["projectId", "fetchedAt"])
    .index("by_project_keyword_context_time", ["projectId", "keywordId", "contextId", "fetchedAt"])
    .index("by_staleAt", ["staleAt"]),

  keywordOrigins: defineTable({
    seedKeywordId: v.id("keywords"),
    derivedKeywordId: v.id("keywords"),
    method: v.string(), // "suggestions" | "related"
    fetchedAt: v.number(),
  })
    .index("by_seed", ["seedKeywordId"])
    .index("by_derived", ["derivedKeywordId"]),

  // SERP snapshots (TTL 24h)
  serpSnapshots: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    fetchedAt: v.number(),
    staleAt: v.number(), // fetchedAt + 24 hours
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
  })
    .index("by_keyword_context_time", ["keywordId", "contextId", "fetchedAt"])
    .index("by_project_time", ["projectId", "keywordId", "contextId", "fetchedAt"])
    .index("by_apiCall", ["apiCallId"])
    .index("by_staleAt", ["staleAt"]),

  serpItems: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    serpSnapshotId: v.id("serpSnapshots"),
    type: v.string(), // "organic" | "people_also_ask" | "local_pack" | "paid" | "images" | "videos" | etc.
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
    payload: v.optional(v.any()), // type-specific fields
  })
    .index("by_snapshot_type", ["serpSnapshotId", "type"])
    .index("by_snapshot_rank", ["serpSnapshotId", "rankAbsolute"])
    .index("by_domain", ["domainId"])
    .index("by_url", ["urlId"]),

  // Backlinks/Authority (TTL 7d)
  backlinkSnapshots: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    fetchedAt: v.number(),
    staleAt: v.number(), // fetchedAt + 7 days
    targetType: v.string(), // "url" | "domain" | "mixed"
    targetsCount: v.number(),
    rawJson: v.any(),
  })
    .index("by_project_time", ["projectId", "fetchedAt"])
    .index("by_apiCall", ["apiCallId"])
    .index("by_staleAt", ["staleAt"]),

  urlBacklinkFacts: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    backlinkSnapshotId: v.id("backlinkSnapshots"),
    urlId: v.id("urls"),
    domainId: v.optional(v.id("domains")),
    fetchedAt: v.number(),
    staleAt: v.number(), // fetchedAt + 7 days
    // Explicit metrics
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
    // Breakdown maps
    referringLinksTld: v.optional(v.any()),
    referringLinksTypes: v.optional(v.any()),
    referringLinksAttributes: v.optional(v.any()),
    referringLinksPlatforms: v.optional(v.any()),
    referringLinksSemantics: v.optional(v.any()),
    referringLinksCountries: v.optional(v.any()),
  })
    .index("by_url_latest", ["urlId", "fetchedAt"])
    .index("by_url_staleAt", ["urlId", "staleAt"])
    .index("by_domain_latest", ["domainId", "fetchedAt"])
    .index("by_snapshot", ["backlinkSnapshotId"]),

  domainBacklinkFacts: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    apiCallId: v.id("apiCalls"),
    backlinkSnapshotId: v.id("backlinkSnapshots"),
    domainId: v.id("domains"),
    fetchedAt: v.number(),
    staleAt: v.number(), // fetchedAt + 7 days
    // Explicit metrics (same as URL facts)
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
    // Breakdown maps
    referringLinksTld: v.optional(v.any()),
    referringLinksTypes: v.optional(v.any()),
    referringLinksAttributes: v.optional(v.any()),
    referringLinksPlatforms: v.optional(v.any()),
    referringLinksSemantics: v.optional(v.any()),
    referringLinksCountries: v.optional(v.any()),
  })
    .index("by_domain_latest", ["domainId", "fetchedAt"])
    .index("by_domain_staleAt", ["domainId", "staleAt"])
    .index("by_snapshot", ["backlinkSnapshotId"]),

  // Computed difficulty (TTL 24h)
  keywordDifficultyComputed: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    keywordId: v.id("keywords"),
    contextId: v.id("keywordContexts"),
    serpSnapshotId: v.id("serpSnapshots"),
    computedAt: v.number(),
    staleAt: v.number(), // computedAt + 24 hours
    difficulty: v.number(), // 0-100
    medianUrlStrength: v.number(),
    medianDomainStrength: v.optional(v.number()),
    topOrganicUrlIds: v.array(v.id("urls")),
    usedUrlBacklinkFactIds: v.array(v.id("urlBacklinkFacts")),
    usedDomainBacklinkFactIds: v.optional(v.array(v.id("domainBacklinkFacts"))),
    stats: v.optional(v.any()), // diagnostics
  })
    .index("by_keyword_context_time", ["keywordId", "contextId", "computedAt"])
    .index("by_project_keyword_context_time", ["projectId", "keywordId", "contextId", "computedAt"])
    .index("by_serpSnapshot", ["serpSnapshotId"])
    .index("by_staleAt", ["staleAt"]),

  // Jobs/activity
  jobs: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    status: v.string(), // "queued" | "running" | "completed" | "failed"
    stage: v.string(), // "discovery" | "bulk_kd" | "enrichment" | "serp" | "backlinks" | "difficulty"
    progress: v.number(), // 0-100
    error: v.optional(v.string()),
    costSoFarUsd: v.number(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    // Job-specific metadata
    metadata: v.optional(v.any()),
  })
    .index("by_project_status", ["projectId", "status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_project_time", ["projectId", "createdAt"]),
});
 
export default schema;