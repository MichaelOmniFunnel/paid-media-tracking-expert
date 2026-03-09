# Verification Comment Rules

## Standing Order (non negotiable, automatic)

Whenever a task or subtask is verified, validated, confirmed, checked, QA'd, tested, or proven complete through any available tool (MCP APIs, Chrome browser, direct API calls, file inspection, etc.), you MUST add an Asana comment to that subtask documenting the verification.

## What the Comment Must Include

1. **What was verified:** Clear statement of what the task required and what was checked
2. **How it was verified:** Which specific tool, MCP call, API endpoint, Chrome page, or inspection method was used
3. **Proof and evidence:** Concrete data points, status values, event counts, response codes, configuration values, or observed results that confirm correctness
4. **Confidence statement:** "Verified 100%" or explain any caveats if partial verification

## Example Comment Format

```
VERIFICATION: [Task Description]

Method: Used mcp__google-ads__run_gaql to query conversion actions for account 596-932-2299
Evidence: Enhanced Conversions active on "Purchase" action (ID: 123456789), status: ENABLED, recent conversions: 47 in last 7 days, match rate: 92%
Result: Verified 100%. Enhanced Conversions correctly configured and actively receiving matched data.
```

## When This Applies

This applies to ANY task where verification is requested or performed, including but not limited to:
- Tracking implementation checks (pixels firing, events registering, CAPI connected)
- Campaign structure validation (settings correct, targeting applied, budgets set)
- Creative deployment confirmation (ads live, approved, serving)
- Reporting accuracy checks (numbers match across platforms)
- Technical implementation verification (GTM tags, consent mode, server side events)
- Asana board structure or task organization checks

## Tools Available for Verification

- Google Ads MCP: campaign status, conversion actions, bid strategies, settings
- Meta Ads MCP: campaign delivery, pixel health, CAPI events, creative status
- Google Analytics MCP: event data, conversion counts, source/medium validation
- Google Search Console MCP: indexing, crawl status, search performance
- Asana MCP: task status, subtask completion, project structure
- Chrome Browser: GTM preview, Stape logs, Events Manager, platform UIs, page inspection
- Direct API calls: any Asana or platform API endpoint not covered by MCP

## This is Automatic

Do not wait to be asked. If you verify something, you comment it. Michael should never have to remind you.
