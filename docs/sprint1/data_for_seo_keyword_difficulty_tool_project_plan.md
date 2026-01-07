# DataForSEO Keyword Difficulty Tool — Project Plan (Convex)

## Goal
Build a low-cost keyword research + difficulty system (DataForSEO-only) that:
- Generates keyword ideas from seeds
- Tracks SERP history (daily)
- Computes a keyword difficulty score based on top-10 competitors using backlink/authority metrics
- Caches everything with TTLs to minimise API calls
- Tracks costs by **user** and **project**

---

## Key Design Decisions
- **Normalised storage** in Convex:
  - Canonical entities: `keywords`, `keywordContexts`, `domains`, `urls`
  - Time-based snapshots: keyword metrics (7d), SERPs (24h), backlinks summaries (7d)
  - Computed outputs: difficulty snapshots (24h, tied to SERP snapshot)
- **API call ledger** (`apiCalls`) with `userId` + `projectId` + `costUsd`, referenced by all snapshots.
- **Raw + explicit fields**:
  - Store important fields explicitly for queries/sorting
  - Store `rawJson` on snapshots for full-fidelity and future schema expansion

---

## Endpoints (DataForSEO)

### A) Keyword discovery & metrics (TTL: 7 days)
1) **Keyword Suggestions** (long-tail variants)
- Endpoint: `POST /v3/dataforseo_labs/google/keyword_suggestions/live`
- Use: generate ideas from seed keyword
- Store: suggestion items + keyword metrics + intent + SERP meta + avg top-10 backlink aggregates (when present)

2) **Related Keywords** (SERP “related searches” expansion)
- Endpoint: `POST /v3/dataforseo_labs/google/related_keywords/live`
- Use: topical expansion beyond substring matches

3) **Keyword Overview** (metrics + KD + intent)
- Endpoint: `POST /v3/dataforseo_labs/google/keyword_overview/live`
- Use: enrich shortlisted keywords with full metrics; includes `keyword_difficulty` (0–100)

4) **Bulk Keyword Difficulty** (KD-only at scale)
- Endpoint: `POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live`
- Use: get KD for up to 1000 keywords cheaply (optional if overview already used)


### B) SERP snapshots (TTL: 24 hours)
5) **Google Organic Live Advanced**
- Endpoint: `POST /v3/serp/google/organic/live/advanced`
- Use: capture daily SERP for each keyword+context
- Store: top 10 organic results + SERP feature types and blocks


### C) Competitor authority/backlinks (TTL: 7 days)
6) **Bulk Pages Summary** (URL/domain strength)
- Endpoint: `POST /v3/backlinks/bulk_pages_summary/live`
- Use: fetch backlink/authority metrics for top-10 URLs and/or their domains
- Store: rank, main_domain_rank, backlinks, referring domains/pages, spam score, breakdown maps

---

## SDK / Integration Notes (TypeScriptClient)
- Use the DataForSEO TypeScriptClient to call:
  - DataForSEO Labs API methods (keyword_suggestions, related_keywords, keyword_overview, bulk_keyword_difficulty)
  - SERP API method (google organic live advanced)
  - Backlinks API method (bulk_pages_summary)
- Auth: HTTP Basic (username/password) in the client’s `fetch` implementation.
- Dedupe calls by hashing `(endpoint + canonicalised JSON payload)` → `requestHash`.

### Canonical request hash
- Stable JSON serialisation: sort keys, remove undefined, normalise lists where order doesn’t matter.

---

## Cost Model & Ledger

### Why a ledger
- DataForSEO bills per request/task + sometimes per returned item.
- Track costs by **userId** and **projectId** for reporting and budget controls.

### Cost capture
- On each API response, record:
  - Total `costUsd`
  - Optional `tasksCostUsd[]` if present
  - Status metadata (http status, DataForSEO status_code/message)

### Reporting examples
- Cost by project per day/week/month
- Cost by endpoint
- Cost by feature group (LABS / SERP / BACKLINKS)

---

## Caching / Refresh Policy

### TTLs
- Keyword metrics snapshots (Labs): **7 days**
- Backlinks summaries: **7 days**
- SERP snapshots: **24 hours**
- Computed difficulty: **24 hours** (aligned with SERP)

### Fetch-or-cache algorithm
For each intended enrichment:
1) Check latest snapshot for `(entity, context, source)` with `staleAt > now`
2) If missing/stale, check for identical `apiCalls.requestHash` within TTL (to avoid duplicate billing)
3) If still missing, call API → store `apiCalls` → store snapshot rows referencing `apiCallId`

---

## Data Model (Convex) — Canonical Entities

### `keywords`
- `text`, `norm`, `createdAt`

### `keywordContexts`
- `seType` ("google"), `locationCode`, `languageCode`, optional `device`

### `domains`
- `domain`, `domainNorm`, `createdAt`

### `urls`
- `url`, `urlNorm`, `domainId`, `createdAt`

---

## Data Model (Convex) — Cost Ledger

### `apiCalls`
Fields:
- `userId`, `projectId`
- `provider`="dataforseo", `endpoint`, `method`
- `requestHash`, optional `requestPayload`
- `requestedAt`, `responseAt`, `durationMs`
- `httpStatus`, optional `dataforseoStatusCode`, `dataforseoStatusMessage`
- `currency`="USD", `costUsd`, optional `tasksCount`, optional `tasksCostUsd[]`
- optional `error`

Indexes:
- by project/time, by user/time, by project/endpoint/time, by requestHash

---

## Data Model (Convex) — Keyword Metrics Snapshots (TTL 7d)

### `keywordSnapshots`
Keys:
- `userId`, `projectId`, `apiCallId`
- `keywordId`, `contextId`
- `source` (labs_keyword_overview | labs_keyword_suggestions | labs_related_keywords | bulk_keyword_difficulty)
- `fetchedAt`, `staleAt`

Explicit stored groups (when present):
- `keywordInfo` (volume/CPC/competition/bids/monthly/trend)
- `keywordProperties` (core_keyword, keyword_difficulty, language, clustering, words_count)
- `serpInfo` (serp_item_types, results_count, updated times)
- `avgBacklinksInfo` (avg top-10 backlinks/ref domains/rank)
- `searchIntentInfo` (main intent, foreign intent)
- optional: normalised keyword info variants
- optional: clickstream keyword info
- optional: `bulkKeywordDifficulty`

Also:
- `rawJson` (full response)

Indexes:
- by keyword/context/source, by project/time, by staleAt

### `keywordOrigins` (optional)
- `seedKeywordId`, `derivedKeywordId`, `method` (suggestions/related), `fetchedAt`

---

## Data Model (Convex) — SERP Snapshots (TTL 24h)

### `serpSnapshots`
Keys:
- `userId`, `projectId`, `apiCallId`
- `keywordId`, `contextId`
- `fetchedAt`, `staleAt`

Explicit fields:
- `seType`, `seDomain`, `locationCode`, `languageCode`, optional `device`
- `resultsCount`, `itemsCount`, `pagesCount`
- `serpItemTypesPresent` (derived)
- `topOrganicDomainIds` / `topOrganicUrlIds` (derived convenience)
- `rawJson`

Indexes:
- by keyword/context/time, by project/time, by apiCall

### `serpItems`
Keys:
- `userId`, `projectId`, `apiCallId`, `serpSnapshotId`
- `type` (organic, people_also_ask, local_pack, paid, images, videos, etc.)

Common explicit fields:
- `rankGroup`, `rankAbsolute`, `page`
- `domainId`, `urlId`, plus raw strings `domain`, `url`
- `title`, `description`, `breadcrumb`, `websiteName`
- organic flags: `isFeaturedSnippet`, `isVideo`, `isImage`, `isMalicious`, `isWebStory`
- `payload` for type-specific fields

Indexes:
- by snapshot/type, by snapshot/rank, by domain, by url

---

## Data Model (Convex) — Backlinks/Authority (TTL 7d)

### `backlinkSnapshots`
Keys:
- `userId`, `projectId`, `apiCallId`
- `fetchedAt`, `staleAt`
- `targetType` (url/domain/mixed), `targetsCount`
- `rawJson`

Indexes:
- by project/time, by apiCall, by staleAt

### `urlBacklinkFacts`
Keys:
- `userId`, `projectId`, `apiCallId`, `backlinkSnapshotId`
- `urlId`, optional `domainId`
- `fetchedAt`, `staleAt`

Explicit metrics:
- `rank`, `mainDomainRank`
- `backlinks`, optional `dofollowBacklinks`, optional `nofollowBacklinks`
- `referringDomains`, `referringMainDomains`, `referringPages`
- optional nofollow variants
- optional `brokenBacklinks`, `brokenPages`
- optional `backlinksSpamScore`
- optional `firstSeen`, `lostDate`
- breakdown maps: `referringLinksTld`, `referringLinksTypes`, `referringLinksAttributes`, `referringLinksPlatforms`, `referringLinksSemantics`, `referringLinksCountries`

Indexes:
- by url/latest, by url/staleAt, by domain/latest, by snapshot

### `domainBacklinkFacts`
Same as URL facts but keyed by `domainId`.

---

## Computed Difficulty (Derived, TTL 24h)

### `keywordDifficultyComputed`
Keys:
- `userId`, `projectId`
- `keywordId`, `contextId`
- `serpSnapshotId`
- `computedAt`, `staleAt`

Outputs:
- `difficulty` (0–100)
- `medianUrlStrength`
- optional `medianDomainStrength`

Audit trail:
- `topOrganicUrlIds[]`
- `usedUrlBacklinkFactIds[]`
- optional `usedDomainBacklinkFactIds[]`
- optional `stats` (diagnostics)

Indexes:
- by keyword/context/time, by serpSnapshot

---

## Difficulty Score Approach (DataForSEO-only)

### Inputs
From SERP (top 10 organic):
- list of competitor URLs/domains

From Backlinks bulk pages summary (per URL/domain):
- `rank`, `main_domain_rank`
- `referring_domains`, `referring_main_domains`
- `backlinks`
- optional spam score

### Example scoring (suggested starting point)
Per URL:
- `strength_url = w1*log(referringDomains+1) + w2*log(backlinks+1) + w3*rank/1000 + w4*mainDomainRank/1000 - w5*spamScore`
Keyword difficulty:
- median(strength_url across top 10), scaled to 0–100.

Also compute **gap** vs your own domain (optional):
- compare competitor median to your domain strength.

---

## Implementation Phases

### Phase 1 — Foundations
- Convex schema: entities + apiCalls ledger + keyword snapshots
- DataForSEO TS client wrapper with request hashing + retry
- Seed → ideas pipeline (suggestions + related)

### Phase 2 — SERP history
- Daily SERP snapshot ingestion (24h TTL)
- Normalise `serpItems` + `domains` + `urls`

### Phase 3 — Backlinks enrichment
- Backlink fetch queue (optional)
- Bulk pages summary ingestion (7d TTL)
- Store `urlBacklinkFacts` / `domainBacklinkFacts`

### Phase 4 — Difficulty computation
- Compute & persist `keywordDifficultyComputed`
- Diagnostics views: “why hard” (top 10 competitor metrics)

### Phase 5 — Cost reporting & controls
- Aggregations by user/project/endpoint/time
- Budget alarms / caps (optional)

---

## Operational Notes
- Keep `rawJson` on snapshots for future extraction without re-fetching.
- Consider per-project settings for TTLs and max daily SERP pulls.
- Batch and queue backlinks requests to minimise API calls.

