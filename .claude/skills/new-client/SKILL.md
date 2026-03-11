---
name: new-client
description: Onboard a new client with profile setup, tracking reconnaissance, and initial platform discovery. Use when someone mentions 'new client', 'onboarding', 'client setup', 'just signed a new account', or 'new engagement'.
argument-hint: "[client-name] [website-url]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# New Client Onboarding

Automated onboarding workflow. Creates the client profile, discovers their ad accounts across all MCP-connected platforms, performs website reconnaissance, sets up Asana tracking, and delivers an initial health snapshot. Most steps run in parallel.

## Context

The user is adding a new client to the system. This skill gathers information from the user, then automates discovery across all connected platforms before asking Michael to fill any gaps.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Website URL (required)
- Industry / business type (required)
- Ad platforms in use (Google Ads, Meta Ads, TikTok Ads)
- Business model (e-commerce, lead gen, SaaS, local services, etc.)
- Known ad account IDs (optional, will auto-discover if not provided)
- Known pixel/tracking IDs (optional, will auto-discover if not provided)
- Primary conversion goals (optional)
- Monthly ad spend range (optional)
- Key contacts (optional)

## Instructions

### Step 1: Check for Existing Client

Before creating anything, check if this client already exists:
1. Scan `clients/` for name matches (abbreviations, alternate spellings)
2. Search Asana for existing tasks mentioning this client name
3. If found: read existing history.md and open-items.md, then ask Michael how to proceed
4. If not found: continue with onboarding

### Step 2: Create Client Directory and Asana Task (Parallel)

**Local files:**
```
clients/{client-name}/
├── profile.json          # Core client information
├── tracking-config.json  # Discovered tracking setup
├── history.md            # Session history (initialize with onboarding date)
├── open-items.md         # Running list of open items
├── findings/             # Future audit findings
└── reports/              # Future audit reports
```

**Asana:** Create a parent task under the Clients section (GID: 1213569929327932):
- Title: "[Client Name]"
- Description: "[Industry] | [Website] | [Business Model] | Onboarded [DATE]"
- Create subtask: "Onboarding: Initial Setup and Discovery"
- Mark subtask in progress

### Step 3: Automated Platform Discovery (Parallel Agents)

Launch these discovery checks simultaneously. Do NOT wait for one to finish before starting the next.

**Agent 1: Google Ads Discovery**
```
mcp__google-ads__list_accounts
```
Search results for client name or domain. If found:
- Record account ID(s)
- Pull last 30 days campaign performance summary
- Check conversion actions configured
- Note any active campaigns

**Agent 2: Meta Ads Discovery**
```
mcp__meta-ads__get_ad_accounts
```
Search across all 27 accessible accounts for client name match. If found:
- Record ad account ID(s)
- Check pixel status via mcp__meta-ads__get_pixels
- Pull last 30 days insights summary
- Note active campaigns and their status

**Agent 3: GA4 Discovery**
```
mcp__google-analytics__get_account_summaries
```
Search for property matching client name or domain. If found:
- Record property ID
- Pull last 7 days event summary
- Check conversion events configured
- Note any custom dimensions related to ad tracking

**Agent 4: GSC Discovery**
```
mcp__google-search-console__list_sites
```
Search for client domain. If found:
- Record site URL
- Pull last 28 days search performance summary
- Note indexing status

**Agent 5: Browser Reconnaissance**
Navigate to client website using Chrome tools and discover:
1. **Tech stack**: CMS (WordPress, Shopify, Webflow, custom), frameworks, hosting
2. **Tag management**: GTM container IDs, other tag managers
3. **Tracking pixels**: Google, Meta, TikTok pixel IDs found in page source
4. **Site structure**: Key pages, landing pages, forms, product pages, checkout
5. **Conversion points**: Forms, phone numbers, chat widgets, checkout flows
6. **Cookie consent**: Banner type, consent tool provider
7. **Server-side indicators**: Check for Stape/SGTM custom domains, CAPI indicators

### Step 4: Compile Discovery Results

Merge all agent results into tracking-config.json:

```json
{
  "google_ads": {
    "account_ids": [],
    "conversion_actions": [],
    "active_campaigns": 0,
    "access_confirmed": true/false
  },
  "meta_ads": {
    "account_ids": [],
    "pixel_ids": [],
    "capi_status": "unknown/active/inactive",
    "active_campaigns": 0,
    "access_confirmed": true/false
  },
  "ga4": {
    "property_id": "",
    "measurement_id": "",
    "conversion_events": [],
    "access_confirmed": true/false
  },
  "gsc": {
    "site_url": "",
    "access_confirmed": true/false
  },
  "gtm": {
    "container_ids": [],
    "server_container": "unknown"
  },
  "website": {
    "url": "",
    "cms": "",
    "consent_tool": "",
    "ssl": true/false
  },
  "tiktok": {
    "pixel_id": "",
    "events_api": "unknown"
  }
}
```

### Step 5: Identify Gaps and Flag to Michael

Compare what was discovered vs what was expected. Flag:
- Platforms mentioned by Michael but not found in MCP (need account IDs or access)
- Pixels found on website but no matching ad account in MCP
- Ad accounts found but no tracking pixel on the website
- Missing server-side tracking (no Stape/SGTM indicators)
- No consent banner on a site that might serve EU traffic

Present gaps clearly: "I found X but could not find Y. I need [specific access/ID] to continue."

### Step 6: Initial Health Snapshot

Based on discovery data, produce a quick-read summary:

```
## [Client Name] Onboarding Summary
Date: [DATE]

### Platforms Discovered
- Google Ads: [found/not found] | [X active campaigns] | [spend last 30d]
- Meta Ads: [found/not found] | [X active campaigns] | [spend last 30d]
- GA4: [found/not found] | [X events configured]
- GSC: [found/not found]
- GTM: [found/not found] | Container: [ID]

### Tracking Health (Quick Read)
- Pixels on site: [list]
- Server-side tracking: [yes/no/unknown]
- Consent mode: [implemented/missing/unknown]
- Event dedup: [verified/unverified/missing]

### Immediate Flags
[Any critical issues spotted during discovery]

### Recommended Next Steps
1. [Most urgent action, e.g., "Run tracking audit: pixel found but no CAPI detected"]
2. [Second priority]
3. [Third priority]

### Access Gaps (Need from Michael)
[List any missing access or IDs needed]
```

### Step 7: Update Asana

- Mark onboarding subtask complete with summary note
- Create subtasks for each recommended next step
- Add any access gaps as blocked subtasks

### Step 8: Save Session to History

Append to clients/{client-name}/history.md:
```
## [DATE] - Onboarding

### What was done
- Client directory created with profile and tracking config
- Platform discovery completed across [X] MCP servers
- Website reconnaissance via Chrome browser
- Asana parent task created: [GID]

### What was found
[Key discoveries]

### Open items
[Transferred to open-items.md]
```

## Output Verification

Before presenting to Michael, confirm:
- Client directory created with all required files
- All 5 discovery agents ran (or were skipped with documented reason)
- tracking-config.json has real discovered data, not placeholders
- Access gaps are specific ("need Meta ad account ID 123456") not vague
- Asana parent task exists in Clients section
- Initial assessment includes specific next steps with clear priority order
- history.md initialized with onboarding session

## Output

A fully populated client profile with automated platform discovery results, gaps identified, and prioritized next steps.
