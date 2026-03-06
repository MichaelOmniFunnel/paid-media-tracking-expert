# Full Paid Media & Tracking Audit

Comprehensive audit of a client's entire advertising performance ecosystem. This orchestrates all five specialist agents in parallel to produce a complete assessment.

## Context

The user wants a complete audit of a client's marketing infrastructure covering tracking, landing pages, signal quality, platform strategy, and attribution measurement. This is the most thorough analysis available.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Website URL (required)
- Specific landing page URLs (optional, will be discovered via browser)
- Known ad platforms in use (Google Ads, Meta Ads, TikTok Ads)
- Any known issues or areas of concern

## Instructions

### Step 1: Client Profile Setup

Check if the client exists in `clients/{client-name}/`. If not, create the client directory and profile:

```
clients/{client-name}/
├── profile.json
├── findings/
├── reports/
└── tracking-config.json
```

If the client exists, read their profile and all previous findings to build on prior knowledge.

### Step 2: Browser Reconnaissance

Before launching specialist agents, perform initial site reconnaissance:

1. Navigate to the client's homepage using Chrome tools
2. Identify the site's tech stack (CMS, frameworks, tag managers)
3. Discover key pages: landing pages, product pages, forms, checkout, thank you pages
4. Note the overall site structure and navigation

### Step 3: Parallel Agent Deployment

Launch the following analyses simultaneously using subagents:

**Agent 1: Tracking Auditor**
- Read `.claude/agents/tracking-auditor/tracking-auditor.md` for methodology
- Audit all tracking implementations across discovered pages
- Use Chrome tools to inspect page source and network requests

**Agent 2: Landing Page Analyst**
- Read `.claude/agents/landing-page-analyst/landing-page-analyst.md` for methodology
- Evaluate all key landing pages for conversion optimization
- Test mobile experience, forms, and conversion flows

**Agent 3: Signal Architect**
- Read `.claude/agents/signal-architect/signal-architect.md` for methodology
- Map signal flow from website to each ad platform
- Evaluate CAPI, enhanced conversions, first-party data infrastructure

**Agent 4: Platform Strategist**
- Read `.claude/agents/platform-strategist/platform-strategist.md` for methodology
- Assess campaign structure readiness, audience infrastructure, feed/catalog health

**Agent 5: Attribution Analyst**
- Read `.claude/agents/attribution-analyst/attribution-analyst.md` for methodology
- Identify measurement gaps, attribution blind spots, cross-platform issues

### Step 4: Report Synthesis

Consolidate all agent findings into a single report following the template in `templates/audit-report.md`:

1. **Executive Summary** - Top 5 findings ranked by performance impact
2. **Tracking Implementation** - All tracking findings
3. **Landing Page Performance** - All LP/UX findings
4. **Signal Quality** - All data signal findings
5. **Platform Strategy** - All campaign structure findings
6. **Attribution & Measurement** - All measurement findings
7. **Implementation Roadmap** - Prioritized action plan with phases

### Step 5: Save Results

1. Save the full report to `clients/{client-name}/reports/{date}-full-audit.md`
2. Save individual findings to `clients/{client-name}/findings/`
3. Update `clients/{client-name}/tracking-config.json` with discovered tracking setup
4. Update `clients/{client-name}/profile.json` with any new information

## Output

The final deliverable is a comprehensive audit report suitable for direct handoff to developers and internal teams, with:
- Clear problem identification
- Specific performance impact explanations
- Exact implementation steps for each fix
- Priority ranking and phased implementation roadmap
