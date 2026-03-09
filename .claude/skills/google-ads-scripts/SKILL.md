---
name: google-ads-scripts
description: MCC and account level scripts for budget pacing, search term mining, quality score tracking, anomaly alerts, and automated reporting. Use when someone mentions Google Ads scripts, automation, budget alerts, automated rules, MCC scripts, or wants to automate routine Google Ads tasks.
context: fork
allowed-tools: Read, Grep, Glob
---

## Overview

Google Ads Scripts let you programmatically control Google Ads accounts using
JavaScript that runs directly in the Google Ads interface. Scripts can read
performance data, modify bids and budgets, pause or enable entities, generate
reports to Google Sheets, send email alerts, and call external APIs. They are
the most accessible automation layer for agencies that need custom logic without
building a full Google Ads API integration.

### When to Use This Skill

- Automating repetitive account management tasks
- Building custom alerts for spend anomalies, conversion drops, or disapprovals
- Creating automated performance reports in Google Sheets
- Implementing custom bidding logic (POAS-based adjustments, dayparting)
- Mining search terms and applying negative keywords at scale
- Monitoring quality scores, landing page status, or budget pacing
- Managing campaigns across an MCC with MCC-level scripts

### Key Limitations

- Scripts use an older JavaScript environment (ES5-like, not modern ES6+)
- No const, let, arrow functions, template literals, destructuring, or Promises
- Execution time limit: 30 minutes for single accounts, 60 minutes for MCC
  scripts using executeInParallel with a callback
- Selector limit: 10,000 IDs maximum in selector.withIds()
- Cannot manage Performance Max campaigns directly (limited PMax support)
- Cannot modify Smart Bidding strategies
- Scheduling: Hourly at most frequent

---

## Script Environment and Syntax

### ES5 Requirement

Google Ads Scripts run in a sandboxed environment that does NOT support ES6+.
All code must use ES5 patterns:

```javascript
// WRONG - These cause errors: const, let, =>, template literals, destructuring
// CORRECT - Use var, function expressions, string concatenation:
var x = 5;
var fn = function() { return x; };
var msg = "Hello " + name;
```

Every script must have a main() function as entry point. Available services:
AdsApp (entities), MccApp (MCC accounts), SpreadsheetApp (Sheets),
MailApp (email), UrlFetchApp (HTTP), Logger (debug), Utilities (formatting).

---

## Account-Level vs MCC-Level Scripts

### Account-Level: Iterate Campaigns

```javascript
function main() {
  var campaigns = AdsApp.campaigns()
    .withCondition("Status = ENABLED")
    .get();
  while (campaigns.hasNext()) {
    var campaign = campaigns.next();
    Logger.log("Campaign: " + campaign.getName());
  }
}
```

### MCC-Level: Iterate Accounts

```javascript
function main() {
  var accounts = MccApp.accounts()
    .withCondition("LabelNames CONTAINS \"Active Clients\"")
    .get();
  while (accounts.hasNext()) {
    var account = accounts.next();
    MccApp.select(account);
    var stats = AdsApp.currentAccount().getStatsFor("LAST_7_DAYS");
    Logger.log(account.getName() + " - Cost: " + stats.getCost());
  }
}
```

### MCC Parallel Execution

For processing many accounts faster (up to 50 simultaneously, 60-min limit):

For detailed implementation, read references/mcc-parallel-execution.md

---


## Reporting Scripts

Campaign performance to Google Sheets (cost, clicks, conversions, ROAS). GAQL queries for advanced reporting (cost in micros, divide by 1,000,000). Date ranges: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or explicit dates.

For complete reporting scripts and GAQL examples, read references/reporting-budget-bid.md

---

## Budget Management Scripts

**Pacing alert:** Compare actual spend vs expected pace (day/month ratio). Email when overpacing by threshold.

**Auto adjustment:** Calculate ideal daily = (monthly target minus month spend) / days remaining. Distribute across enabled campaigns.

For pacing alert and auto-adjustment scripts, read references/reporting-budget-bid.md

---

## Bid Management Scripts

**POAS-based bid adjustment:** Use campaign labels (high_margin, medium_margin, low_margin) with multipliers. Apply to ad group CPC bids.

For POAS bid script, read references/reporting-budget-bid.md

---

## Negative Keyword Scripts

**Search term mining:** GAQL query for terms with clicks > threshold and zero conversions. Auto-add as exact match negatives to a shared list. Email notification.

**N-gram analysis:** Break search terms into 1/2/3-word segments. Output to Sheets with impressions, clicks, conversions, CPA per n-gram. Surfaces patterns like "free", "jobs", "diy".

For search term mining and n-gram scripts, read references/negative-quality-campaign.md

---

## Quality Score Monitoring

Daily tracker to Sheets: QS, expected CTR, ad relevance, landing page experience per keyword. GAQL query on keyword_view with quality_info fields.

For QS tracker script, read references/negative-quality-campaign.md

---

## Landing Page & Campaign Management

**Landing page checker:** Iterate enabled ads, fetch finalUrl, flag 4xx/5xx codes. Email broken URLs.

**Pause low performers:** Find ad groups with cost > threshold and zero conversions. Dry-run mode with email notification before actual pausing.

**Seasonal scheduler:** Sheet-driven campaign enable/pause by date range.

For landing page checker, pause script (with dry run), and scheduler, read references/negative-quality-campaign.md

---

## Alert & Utility Scripts

**Anomaly detection:** Compare yesterday spend/conversions against 14-day average. Alert on spend spikes (>30%) or conversion drops (>40%).

**Disapproved ads:** GAQL query for DISAPPROVED approval_status in enabled campaigns. Email list.

**Sheets patterns:** Read config from sheet, write timestamped results. Heartbeat logger for monitoring script execution.

**Labels:** Create/apply labels for high-spend zero-conversion campaigns. Use labels as script targeting filters.

For alert scripts, Sheets patterns, label usage, scheduling recommendations, batch processing, and execution limits table, read references/alerts-patterns-reference.md

---

## Script Scheduling and Monitoring

### Recommended Frequencies

| Script Type | Frequency | Rationale |
|-------------|-----------|-----------|
| Budget pacing | Daily (morning) | Catch overspend early |
| Anomaly alerts | Daily | Yesterday vs. historical |
| Negative keywords | Weekly | Accumulate enough data |
| Quality score tracker | Weekly | QS changes slowly |
| Landing page checker | Weekly | URLs change infrequently |
| Seasonal scheduler | Daily | Activate campaigns on time |
| Performance reports | Weekly/monthly | Match reporting cadence |
| Bid adjustments | Daily/hourly | React to performance shifts |


---

## Execution Limits Reference

| Limit | Value |
|-------|-------|
| Execution time (account-level) | 30 minutes |
| Execution time (MCC parallel) | 60 minutes |
| Max parallel accounts | 50 |
| Max IDs in selector.withIds() | 10,000 |
| Bulk upload file size | 50 MB |
| Bulk upload row limit | 1,000,000 |
| URL fetch calls per run | ~2,000 |
| Email sends per run | 250 |
| Min scheduling interval | Hourly |
| Default iterator max entities | 50,000 |

---

## Troubleshooting

**"Exceeded execution time limit"**: Use .withLimit(), implement batch processing
with time checks, use executeInParallel for MCC scripts, tighten GAQL WHERE clauses.

**"Cannot read property of undefined"**: Metric may not exist for the date range.
Check entity existence before accessing properties. Use try/catch.

**Script runs but makes no changes**: Verify condition strings (case-sensitive),
label names (exact match), date range has data. Add Logger.log() to trace flow.

**GAQL query errors**: Column names are case-sensitive. Escape quotes properly.
Dates must be YYYY-MM-DD. Not all fields can be selected together.

---

## Integration with OFM Workflows

### Recommended Script Stack for New Clients

1. Budget Pacing Alert (daily): Prevent overspend
2. Anomaly Detection (daily): Catch spend spikes and conversion drops
3. Landing Page Checker (weekly): Verify ad URLs are working
4. Disapproved Ads Alert (daily): Catch policy issues immediately
5. Performance Report (weekly): Auto-generate report data to Sheets
6. Search Term Mining (weekly): Surface wasted spend
7. Quality Score Tracker (weekly): Monitor keyword quality trends

### MCC-Level Agency Scripts

- Account Summary Report: All-client KPI overview
- Cross-Account Budget Tracker: Monthly pacing for all clients
- Disapproval Scanner: Policy issue check across all accounts

### Script + Feed Integration

Scripts can complement feed optimization by pulling Shopping campaign product
performance data to Google Sheets, which then serves as a supplemental feed
data source for custom labels (bestseller, average, underperformer). Feed the
Sheet into Merchant Center as a supplemental feed for automated performance
tier classification.

---

## References

- Google Ads Scripts documentation: https://developers.google.com/google-ads/scripts
- AdsApp reference: https://developers.google.com/google-ads/scripts/docs/reference/adsapp/adsapp
- GAQL reference: https://developers.google.com/google-ads/api/docs/query/overview
- Script limits: https://developers.google.com/google-ads/scripts/docs/limits
- Script best practices: https://developers.google.com/google-ads/scripts/docs/best-practices
- Solution scripts library: https://developers.google.com/google-ads/scripts/docs/solutions
