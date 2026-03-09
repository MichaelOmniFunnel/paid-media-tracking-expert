---
name: tracking-audit
description: Focused tracking implementation audit across Google Ads, Meta Ads, and TikTok. Evaluates pixel installation, GTM setup, event configuration, CAPI health, and data layer accuracy. Use when someone mentions 'tracking audit', 'check my pixels', 'conversion tracking issues', 'are my tags firing', 'GTM audit', or tracking problems.
argument-hint: "[client-name] [website-url]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent, mcp__google-analytics__run_report, mcp__google-analytics__get_account_summaries, mcp__google-analytics__get_property_details, mcp__google-analytics__get_custom_dimensions_and_metrics
---
# Tracking Implementation Audit

Focused audit of conversion tracking setup across Google Ads, Meta Ads, and TikTok Ads.

## Context

The user wants to audit only the tracking implementation for a specific client. This is a focused version of the full audit that covers pixel installation, event configuration, tag manager setup, consent implementation, and data quality.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Website URL (required)
- Specific pages to audit (optional)
- Which platforms to focus on (optional, defaults to all)

## Instructions

### Step 1: Load Client Context

Check `clients/{client-name}/` for existing profile and tracking config. Build on previous findings.

### Step 2: GA4 Event Verification via MCP

Before inspecting tags in the browser, verify what GA4 is actually receiving:
- Use `mcp__google-analytics__run_report` with event_name dimension to check which events are firing and their volume
- Use `mcp__google-analytics__get_custom_dimensions_and_metrics` to verify event parameters are registered
- Use `mcp__google-analytics__get_property_details` for data stream and measurement ID confirmation
- Compare GA4 received events against what the tracking implementation claims to send

### Step 3: Browser-Based Tracking Inspection

Using Chrome tools, for each key page:

1. **Navigate to page** and wait for full load
2. **Read page source** via JavaScript tool - search for:
   - GTM container snippets (`googletagmanager.com/gtm.js`)
   - Google Ads tags (`gtag.js`, `AW-` IDs)
   - Meta Pixel (`fbevents.js`, `fbq(`)
   - TikTok Pixel (`analytics.tiktok.com`, `ttq.`)
   - Data layer pushes (`dataLayer.push`)
3. **Check network requests** for pixel fires:
   - `google-analytics.com/collect` or `analytics.google.com`
   - `www.facebook.com/tr` (Meta pixel fires)
   - `analytics.tiktok.com` (TikTok events)
4. **Test conversion events** by interacting with forms, buttons, cart:
   - Monitor for conversion event fires
   - Verify event parameters contain correct values
   - Check for duplicate events

### Step 4: Analysis

Apply the full methodology from `.claude/agents/tracking-auditor.md`:
- Tag discovery and conflict detection
- Event configuration completeness per platform
- Data quality verification
- Consent mode status

### Step 5: Report Generation

Save findings to `clients/{client-name}/reports/{date}-tracking-audit.md` and update tracking config.

Use the developer handoff format from `templates/developer-handoff.md` for maximum implementability.

## Output Verification

Before presenting findings to Michael, confirm:
- Pixel fires were observed via network requests, not just source code presence
- Event parameters were verified against actual page data (correct values, not placeholders)
- CAPI/server-side events were checked in Events Manager, not just client-side
- GTM tags use ES5 only (no const, let, arrow functions, template literals)
- event_id deduplication was verified for all conversion events
- Consent Mode implementation was checked for EU-relevant clients
