# UI Strategy — Keyword Research & Difficulty (Convex + DataForSEO)

## Product intent
A wizard-based workflow that feels instant, keeps costs low, and progressively enriches data. Users can stop after discovery (cheap) or opt into tracking/enrichment (more cost).

---

## Core principles
- **Progressive results**: show keyword ideas quickly; enrich in the background.
- **Spend control**: clear estimated cost before any paid step; avoid automatic deep enrichment.
- **Cache-first**: reuse snapshots when fresh (keywords 7d, SERPs 24h, backlinks 7d).
- **User trust**: show what’s queued, what’s running, what it cost, and what was free (cached).

---

## Default settings (good starting point)
- Location: **United Kingdom** (user can narrow to Surrey/Guildford)
- Language: **English**
- Device: **desktop**
- Expansion sources: **Keyword Suggestions + Related Keywords enabled**
- Keyword metrics TTL: **7 days**
- SERP TTL: **24 hours** (only when tracking is enabled)
- Backlinks TTL: **7 days**
- Limits: ~**200–500 ideas per seed** (adjustable)

---

## Screen 1 — Add Keywords (Wizard Step 1: Seeds + Targeting)

### Primary inputs (always visible)
- **Seed keywords** textarea (one per line)
- **Location** selector (UK default; allow Surrey/Guildford)
- **Language** selector (English default)
- Optional: **Device** (desktop/mobile)

### Advanced (collapsed by default)
**Targeting**
- Search engine domain (e.g. google.co.uk)
- Search partners toggle (if used in Labs)

**Expansion sources**
- ✅ Keyword Suggestions (default on)
- ✅ Related Keywords (default on)

**Limits & filters**
- Max ideas per seed (slider/input)
- Include terms (comma-separated)
- Exclude terms / negative keywords
- Allow/avoid duplicates (merge normalised keywords)

**Data richness toggles (cost control)**
- Include intent (on/off)
- Include SERP meta (on/off)
- Include avg top-10 backlink aggregates (on/off)

**Refresh policy overrides**
- Keyword metrics TTL override (default 7d)
- SERP TTL override (default 24h)

### Action
- **Continue** starts the pipeline (queued) and moves to results.

---

## After Continue — Execution model

### Do users wait?
No full blocking. Use **queue + progressive loading**.

### What runs immediately (fast + cheap)
- DataForSEO Labs: **keyword_suggestions** per seed
- DataForSEO Labs: **related_keywords** per seed

### What runs next (optional depending on toggles)
- DataForSEO Labs: **bulk_keyword_difficulty** for merged idea list (KD-only)
- DataForSEO Labs: **keyword_overview** only for shortlist/selected (richer)

### UI treatment
- Show a compact **progress panel** with stages:
  - Discovering ideas
  - Calculating baseline difficulty
  - Enriching metrics (if enabled)
- Show **cost-to-date** and “cached vs billed” counters.

---

## Screen 2 — Keyword Ideas (Wizard Step 2: Review & Select)

### Main table (progressively populated)
**Columns (available early)**
- Keyword
- Source (seed / suggestions / related)
- Baseline KD (from bulk KD if run)
- Freshness (Fresh/Cached/Stale)

**Columns (fill in as enrichment arrives)**
- Search volume
- CPC
- Competition level
- Intent
- SERP features present (types)
- Avg top-10 backlink aggregates (if enabled)

### Controls (must-have)
- Search within results
- Sort: KD asc/desc, volume desc, intent, CPC
- Filters:
  - Min volume / max KD
  - Intent (informational/commercial/transactional/navigational)
  - Include/exclude terms
  - Location modifiers (e.g. “guildford”, “surrey”, “near me”)
  - Source (suggestions vs related)

### Selection & actions
- Multi-select checkboxes + select all (filtered)
- Actions:
  - **Add to project**
  - **Enrich selected** (runs keyword_overview on selection)
  - **Pull SERP + competitor strength** (starts tracking + competitor scoring) — optional action if you want it here
  - Export CSV

### Cost transparency (always visible)
- “Estimated cost to enrich selected”
- “Estimated cost to run SERP for selected (daily)”
- “This will be free (cached): N keywords”
- “Spent this run: $X”

---

## Screen 3 — Add to Project (Wizard Step 3)

### Required
- Choose project (or create new)
- Confirm number of keywords selected

### Option A (the chosen default): **Add only (no extra cost now)**
When user selects **Option A**:
- Create `trackedKeywords` records linking (projectId, keywordId, contextId)
- **Do not trigger heavy APIs immediately**
- Set schedules:
  - Keyword metrics refresh every **7 days**
  - SERP tracking **OFF by default** (toggle)

#### Option A toggles
- ✅ “Refresh keyword metrics every 7 days” (default ON)
- ⛔ “Track SERP daily (24h)” (default OFF)
- ⛔ “Fetch competitor backlink summaries (7d)” (default OFF, only needed if SERP tracking enabled)

#### Option A messaging
- “Added to project with cached data where available.”
- “No additional API calls will run now.”
- “You can enrich or enable daily tracking at any time.”

### Optional upgrades on this screen (but not default)
- Enable daily SERP tracking (24h)
- Run one-time enrichment now (keyword_overview)
- Run SERP snapshot now (and backlinks summaries) — only if user explicitly opts in

---

## Project Dashboard — Tracked Keywords

### Table
Per keyword row show:
- Latest computed difficulty (if tracking enabled)
- DataForSEO KD (if available)
- Volume, intent
- Last updated times (metrics / SERP)
- Next scheduled refresh

### Controls
- Filters: tracking enabled, max difficulty, min volume, intent, location modifiers
- Bulk actions:
  - Enable daily SERP tracking
  - Enrich selected
  - Remove from tracking

### Costs widget
- Spend this week/month by project
- Spend by feature group (Labs / SERP / Backlinks)

---

## Keyword Detail Screen

Tabs:
1) Overview (metrics, intent, KD, computed difficulty)
2) SERP History (daily snapshots timeline)
3) Competitors (latest top-10 with URL/domain strength metrics)
4) Costs (apiCalls attributed to this keyword)

---

## Activity / Jobs Screen

Purpose: show background queue and retries.
- Running / queued / failed
- Per job: stage, progress %, estimated remaining work, cost so far
- Retry button, error details

---

## Backend behaviour that supports the UI

### Queue-first pipeline
- Discovery jobs (suggestions + related) start immediately
- Bulk KD job starts once enough ideas exist
- Enrichment jobs run only when requested (selected keywords)

### Cache-first requests
- Before any API call: check latest snapshot with `staleAt > now`
- If fresh, mark row as “cached” and skip API call

### Cost ledger integration
- Every API request creates an `apiCalls` record with (userId, projectId, endpoint, requestHash, costUsd)
- Snapshots and items reference `apiCallId` for attribution and reporting

---

## Suggested UX copy snippets (cost + control)
- “No new API calls will run for Option A.”
- “Cached data found — no cost for these keywords.”
- “Enrichment will run only for the selected keywords.”
- “Daily SERP tracking can be enabled later from the project dashboard.”

