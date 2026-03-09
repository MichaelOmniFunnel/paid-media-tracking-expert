# OFM Attribution Philosophy

## Core Principle
Every platform overclaims. No single platform's numbers are accurate in isolation. The only accurate view is blended performance measured against actual revenue in the commerce platform.

## Practical Approach
1. Pull reported conversions from all active platforms for the same period
   - Google Ads: use `mcp__google-ads__get_campaign_performance` or `mcp__google-ads__run_gaql` for programmatic data
   - Meta Ads: use `mcp__meta-ads__get_insights` or Chrome browser
   - GA4 (neutral layer): use `mcp__google-analytics__run_report` for source/medium reconciliation
2. Compare the sum against actual orders in Shopify, NetSuite, or CRM
3. The ratio reveals the overlap and inflation factor for that client
4. Apply this factor when making optimization decisions

## Attribution Windows
- Google Ads: data-driven attribution preferred, 30-day click / 1-day view as fallback
- Meta Ads: 7-day click / 1-day view standard — never evaluate on 1-day click alone
- TikTok Ads: 7-day click / 1-day view — view-through is especially significant given TikTok's content consumption model

## Budget Decisions
Never adjust budget on one platform without evaluating the downstream impact on the others simultaneously. All budget decisions are portfolio decisions.