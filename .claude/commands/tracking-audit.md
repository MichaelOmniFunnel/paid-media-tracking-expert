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

### Step 2: Browser-Based Tracking Inspection

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

### Step 3: Analysis

Apply the full methodology from `.claude/agents/tracking-auditor/tracking-auditor.md`:
- Tag discovery and conflict detection
- Event configuration completeness per platform
- Data quality verification
- Consent mode status

### Step 4: Report Generation

Save findings to `clients/{client-name}/reports/{date}-tracking-audit.md` and update tracking config.

Use the developer handoff format from `templates/developer-handoff.md` for maximum implementability.
