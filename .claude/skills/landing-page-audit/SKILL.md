---
name: landing-page-audit
description: Landing page performance audit for paid media quality. Evaluates page speed, UX friction, conversion flow, mobile experience, and message match. Use when someone mentions 'landing page audit', 'conversion rate', 'page speed', 'post-click experience', 'quality score', or 'why aren't people converting'.
argument-hint: "[client-name] [landing-page-url]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# Landing Page Performance Audit

Focused audit of landing page experience, conversion flow, and UX for paid media performance.

## Context

The user wants to audit landing pages for a specific client, focusing on how page experience affects advertising campaign performance.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Landing page URL(s) (required)
- Type of campaign driving traffic (search, social, shopping)
- Primary conversion goal (lead, purchase, signup)

## Instructions

### Step 1: Load Client Context
Check `clients/{client-name}/` for existing profile. Load previous findings.

### Step 2: Page-by-Page Analysis
For each landing page, use Chrome tools to:

1. **Desktop analysis** - Navigate and evaluate full experience
2. **Mobile analysis** - Resize viewport to mobile and re-evaluate
3. **Conversion flow walkthrough** - Complete the intended conversion action
4. **Speed assessment** - Note load time, visual stability, interactivity

### Step 3: Analysis
Apply methodology from `.claude/agents/landing-page-analyst.md`:
- Page speed and technical performance
- Conversion flow friction
- Message match with ad themes
- First-party data capture opportunities

### Step 4: Report Generation
Save to `clients/{client-name}/reports/{date}-landing-page-audit.md`.
Include specific recommendations with mockup descriptions where helpful.
