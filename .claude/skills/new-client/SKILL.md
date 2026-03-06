---
name: new-client
description: Onboard a new client with profile setup, tracking reconnaissance, and initial platform discovery. Use when someone mentions 'new client', 'onboarding', 'client setup', 'just signed a new account', or 'new engagement'.
argument-hint: "[client-name] [website-url]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# New Client Onboarding

Sets up a new client in the system with profile, tracking configuration, and initial reconnaissance.

## Context

The user is adding a new client to the system. This command gathers all necessary information, performs initial browser-based research, and creates the client's persistent profile.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Website URL (required)
- Industry / business type (required)
- Ad platforms in use (Google Ads, Meta Ads, TikTok Ads)
- Business model (e-commerce, lead gen, SaaS, local services, etc.)
- Known ad account IDs (optional)
- Known pixel/tracking IDs (optional)
- Primary conversion goals (optional)
- Monthly ad spend range (optional)
- Key contacts (optional)

## Instructions

### Step 1: Create Client Directory

```
clients/{client-name}/
├── profile.json          # Core client information
├── tracking-config.json  # Discovered tracking setup
├── findings/             # Future audit findings
└── reports/              # Future audit reports
```

### Step 2: Browser Reconnaissance

Navigate to the client's website using Chrome tools and discover:

1. **Tech Stack**: CMS (WordPress, Shopify, Webflow, custom), frameworks, hosting
2. **Tag Management**: GTM containers, other tag managers
3. **Tracking Pixels**: Google, Meta, TikTok pixel IDs found in source
4. **Site Structure**: Key pages, landing pages, forms, product pages, checkout
5. **Conversion Points**: Forms, phone numbers, chat widgets, checkout flows
6. **Cookie Consent**: Banner type, consent tool provider

### Step 3: Populate Profile

Fill in `profile.json` with all gathered information. Use the template from `clients/_template/profile.json`.

### Step 4: Populate Tracking Config

Fill in `tracking-config.json` with all discovered tracking implementations.

### Step 5: Initial Assessment

Provide a brief summary of:
- Overall tracking health (good / needs work / critical gaps)
- Biggest immediate opportunities
- Recommended next steps (which audit to run first)

## Output

A fully populated client profile ready for deeper audits, plus an initial assessment summary.
