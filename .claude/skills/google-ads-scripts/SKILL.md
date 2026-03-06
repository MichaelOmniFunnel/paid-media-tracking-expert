---
name: google-ads-scripts
description: MCC and account level scripts for budget pacing, search term mining, quality score tracking, anomaly alerts, and automated reporting. Use when someone mentions Google Ads scripts, automation, budget alerts, automated rules, MCC scripts, or wants to automate routine Google Ads tasks.
context: fork
---
# Google Ads Scripts

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

```javascript
function main() {
  MccApp.accounts().withLimit(50)
    .executeInParallel("processAccount", "allFinished");
}

function processAccount() {
  var account = AdsApp.currentAccount();
  var stats = account.getStatsFor("LAST_30_DAYS");
  return JSON.stringify({
    name: account.getName(), cost: stats.getCost(),
    conversions: stats.getConversions(), revenue: stats.getConversionValue()
  });
}

function allFinished(results) {
  var sheet = SpreadsheetApp.openByUrl("YOUR_SPREADSHEET_URL").getActiveSheet();
  sheet.clear();
  sheet.appendRow(["Account", "Cost", "Conversions", "Revenue"]);
  for (var i = 0; i < results.length; i++) {
    if (results[i].getStatus() === "OK") {
      var data = JSON.parse(results[i].getReturnValue());
      sheet.appendRow([data.name, data.cost, data.conversions, data.revenue]);
    }
  }
}
```

---

## Reporting Scripts

### Campaign Performance Report to Google Sheets

```javascript
function main() {
  var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_ID/edit";
  var DATE_RANGE = "LAST_30_DAYS";
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getActiveSheet();
  sheet.clear();
  sheet.appendRow([
    "Campaign", "Status", "Cost", "Impressions", "Clicks",
    "CTR", "Avg CPC", "Conversions", "Conv Rate", "Conv Value", "ROAS"
  ]);
  var campaigns = AdsApp.campaigns()
    .withCondition("Status = ENABLED").forDateRange(DATE_RANGE).get();
  while (campaigns.hasNext()) {
    var campaign = campaigns.next();
    var stats = campaign.getStatsFor(DATE_RANGE);
    var cost = stats.getCost();
    var convValue = stats.getConversionValue();
    var roas = cost > 0 ? (convValue / cost * 100).toFixed(0) + "%" : "N/A";
    sheet.appendRow([
      campaign.getName(), campaign.isEnabled() ? "Enabled" : "Paused",
      cost.toFixed(2), stats.getImpressions(), stats.getClicks(),
      (stats.getCtr() * 100).toFixed(2) + "%", stats.getAverageCpc().toFixed(2),
      stats.getConversions(), (stats.getConversionRate() * 100).toFixed(2) + "%",
      convValue.toFixed(2), roas
    ]);
  }
}
```

### GAQL Report Query

For complex reporting, use Google Ads Query Language (GAQL):

```javascript
function main() {
  var query = "SELECT campaign.name, metrics.cost_micros, " +
    "metrics.conversions, metrics.conversions_value " +
    "FROM campaign " +
    "WHERE segments.date DURING LAST_30_DAYS " +
    "AND campaign.status = \"ENABLED\" ORDER BY metrics.cost_micros DESC";
  var rows = AdsApp.search(query);
  while (rows.hasNext()) {
    var row = rows.next();
    Logger.log(row.campaign.name + " | Cost: $" +
      (row.metrics.costMicros / 1000000).toFixed(2));
  }
}
```

GAQL tips: cost returned in micros (divide by 1,000,000). Use AdsApp.search()
for new scripts. Date ranges: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or
explicit: segments.date BETWEEN "2026-01-01" AND "2026-01-31".

---

## Budget Management Scripts

### Monthly Budget Pacing Alert

```javascript
function main() {
  var CONFIG = {
    monthlyBudget: 10000, alertEmail: "team@omnifunnelmarketing.com",
    overpaceThreshold: 0.10
  };
  var today = new Date();
  var daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  var dayOfMonth = today.getDate();
  var expectedPace = (dayOfMonth / daysInMonth) * CONFIG.monthlyBudget;
  var actualSpend = AdsApp.currentAccount().getStatsFor("THIS_MONTH").getCost();
  var paceRatio = actualSpend / expectedPace;
  
  if (paceRatio > (1 + CONFIG.overpaceThreshold)) {
    MailApp.sendEmail(CONFIG.alertEmail,
      "ALERT: " + AdsApp.currentAccount().getName() +
      " overpacing by " + ((paceRatio - 1) * 100).toFixed(0) + "%",
      "Monthly Budget: $" + CONFIG.monthlyBudget + "\n" +
      "Expected: $" + expectedPace.toFixed(2) + "\n" +
      "Actual: $" + actualSpend.toFixed(2) + "\n" +
      "Day " + dayOfMonth + " of " + daysInMonth);
  }
}
```

### Auto Budget Adjustment Based on Pacing

```javascript
function main() {
  var MONTHLY_TARGET = 15000;
  var today = new Date();
  var daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  var daysRemaining = daysInMonth - today.getDate() + 1;
  var monthSpend = AdsApp.currentAccount().getStatsFor("THIS_MONTH").getCost();
  var idealDaily = Math.max((MONTHLY_TARGET - monthSpend) / daysRemaining, 10);
  
  // Count enabled campaigns, then distribute budget
  var count = 0;
  var counter = AdsApp.campaigns().withCondition("Status = ENABLED").get();
  while (counter.hasNext()) { counter.next(); count++; }
  var budgetEach = idealDaily / count;
  
  var campaigns = AdsApp.campaigns().withCondition("Status = ENABLED").get();
  while (campaigns.hasNext()) {
    var c = campaigns.next();
    c.getBudget().setAmount(budgetEach);
    Logger.log(c.getName() + " -> $" + budgetEach.toFixed(2));
  }
}
```

Note: This splits budget evenly. In practice, allocate proportionally by
campaign performance or priority labels.

---

## Bid Management Scripts

### POAS-Based Bid Adjustment by Label

```javascript
function main() {
  var MARGIN_ADJUSTMENTS = {
    "high_margin": 1.20, "medium_margin": 1.00, "low_margin": 0.80
  };
  var labels = Object.keys(MARGIN_ADJUSTMENTS);
  for (var i = 0; i < labels.length; i++) {
    var label = labels[i];
    var modifier = MARGIN_ADJUSTMENTS[label];
    var campaigns = AdsApp.campaigns()
      .withCondition("LabelNames CONTAINS_ANY [\"" + label + "\"]")
      .withCondition("Status = ENABLED").get();
    while (campaigns.hasNext()) {
      var adGroups = campaigns.next().adGroups()
        .withCondition("Status = ENABLED").get();
      while (adGroups.hasNext()) {
        var ag = adGroups.next();
        var bid = ag.bidding().getCpc();
        if (bid) {
          ag.bidding().setCpc(bid * modifier);
          Logger.log(ag.getName() + ": " + bid.toFixed(2) +
            " -> " + (bid * modifier).toFixed(2));
        }
      }
    }
  }
}
```

---

## Negative Keyword Scripts

### Search Term Mining and Auto-Negative Application

Finds search terms with clicks but no conversions, adds them as negatives:

```javascript
function main() {
  var CONFIG = {
    minClicks: 10, maxConversions: 0, dateRange: "LAST_30_DAYS",
    negativeListName: "Script - Poor Performers",
    alertEmail: "team@omnifunnelmarketing.com"
  };
  // Get or create negative keyword list
  var negLists = AdsApp.negativeKeywordLists()
    .withCondition("Name = \"" + CONFIG.negativeListName + "\"").get();
  var negList;
  if (negLists.hasNext()) {
    negList = negLists.next();
  } else {
    negList = AdsApp.newNegativeKeywordListBuilder()
      .withName(CONFIG.negativeListName).build().getResult();
  }
  // Query search terms via GAQL
  var query = "SELECT search_term_view.search_term, " +
    "metrics.clicks, metrics.conversions, metrics.cost_micros " +
    "FROM search_term_view " +
    "WHERE segments.date DURING " + CONFIG.dateRange +
    " AND metrics.clicks >= " + CONFIG.minClicks +
    " AND metrics.conversions <= " + CONFIG.maxConversions;
  var rows = AdsApp.search(query);
  var newNegatives = [];
  while (rows.hasNext()) {
    var row = rows.next();
    var term = row.searchTermView.searchTerm;
    negList.addNegativeKeyword("[" + term + "]");
    newNegatives.push(term + " (clicks: " + row.metrics.clicks +
      ", cost: $" + (row.metrics.costMicros / 1000000).toFixed(2) + ")");
  }
  if (newNegatives.length > 0) {
    MailApp.sendEmail(CONFIG.alertEmail,
      "Negative Keywords Added: " + newNegatives.length + " terms",
      "Added to \"" + CONFIG.negativeListName + "\":\n\n" +
      newNegatives.join("\n"));
  }
}
```

### N-Gram Analysis Script

Breaks search terms into 1/2/3-word segments for pattern identification:

```javascript
function main() {
  var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_ID/edit";
  var ngramData = {};
  var query = "SELECT search_term_view.search_term, " +
    "metrics.impressions, metrics.clicks, metrics.conversions, " +
    "metrics.cost_micros FROM search_term_view " +
    "WHERE segments.date DURING LAST_30_DAYS";
  var rows = AdsApp.search(query);
  while (rows.hasNext()) {
    var row = rows.next();
    var words = row.searchTermView.searchTerm.toLowerCase().split(" ");
    for (var n = 1; n <= 3; n++) {
      for (var j = 0; j <= words.length - n; j++) {
        var ngram = words.slice(j, j + n).join(" ");
        if (!ngramData[ngram]) {
          ngramData[ngram] = {imp: 0, clicks: 0, conv: 0, cost: 0, count: 0};
        }
        ngramData[ngram].imp += row.metrics.impressions;
        ngramData[ngram].clicks += row.metrics.clicks;
        ngramData[ngram].conv += row.metrics.conversions;
        ngramData[ngram].cost += row.metrics.costMicros / 1000000;
        ngramData[ngram].count++;
      }
    }
  }
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getActiveSheet();
  sheet.clear();
  sheet.appendRow(["N-Gram", "Occurrences", "Impressions", "Clicks",
    "CTR", "Conversions", "Cost", "CPA"]);
  var keys = Object.keys(ngramData);
  for (var i = 0; i < keys.length; i++) {
    var d = ngramData[keys[i]];
    if (d.imp >= 100) {
      sheet.appendRow([keys[i], d.count, d.imp, d.clicks,
        (d.imp > 0 ? (d.clicks / d.imp * 100).toFixed(2) : "0") + "%",
        d.conv, "$" + d.cost.toFixed(2),
        d.conv > 0 ? "$" + (d.cost / d.conv).toFixed(2) : "N/A"]);
    }
  }
}
```

---

## Quality Score Monitoring

### Daily Quality Score Tracker to Sheets

```javascript
function main() {
  var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_ID/edit";
  var today = Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd");
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Campaign", "Ad Group", "Keyword", "Match Type",
      "QS", "Expected CTR", "Ad Relevance", "Landing Page", "Impr", "Clicks", "Cost"]);
  }
  var query = "SELECT campaign.name, ad_group.name, " +
    "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, " +
    "ad_group_criterion.quality_info.quality_score, " +
    "ad_group_criterion.quality_info.search_predicted_ctr, " +
    "ad_group_criterion.quality_info.creative_quality_score, " +
    "ad_group_criterion.quality_info.post_click_quality_score, " +
    "metrics.impressions, metrics.clicks, metrics.cost_micros " +
    "FROM keyword_view " +
    "WHERE ad_group_criterion.quality_info.quality_score IS NOT NULL " +
    "AND campaign.status = \"ENABLED\" AND ad_group.status = \"ENABLED\"";
  var rows = AdsApp.search(query);
  while (rows.hasNext()) {
    var r = rows.next();
    sheet.appendRow([today, r.campaign.name, r.adGroup.name,
      r.adGroupCriterion.keyword.text, r.adGroupCriterion.keyword.matchType,
      r.adGroupCriterion.qualityInfo.qualityScore,
      r.adGroupCriterion.qualityInfo.searchPredictedCtr,
      r.adGroupCriterion.qualityInfo.creativeQualityScore,
      r.adGroupCriterion.qualityInfo.postClickQualityScore,
      r.metrics.impressions, r.metrics.clicks,
      (r.metrics.costMicros / 1000000).toFixed(2)]);
  }
}
```

---

## Landing Page Status Checker

```javascript
function main() {
  var ALERT_EMAIL = "team@omnifunnelmarketing.com";
  var brokenUrls = [];
  var checkedUrls = {};
  var ads = AdsApp.ads().withCondition("Status = ENABLED")
    .withCondition("CampaignStatus = ENABLED")
    .withCondition("AdGroupStatus = ENABLED").get();
  while (ads.hasNext()) {
    var ad = ads.next();
    var finalUrl = ad.urls().getFinalUrl();
    if (!finalUrl || checkedUrls[finalUrl]) continue;
    checkedUrls[finalUrl] = true;
    try {
      var code = UrlFetchApp.fetch(finalUrl, {
        muteHttpExceptions: true, followRedirects: true
      }).getResponseCode();
      if (code >= 400) {
        brokenUrls.push(ad.getCampaign().getName() + " > " +
          ad.getAdGroup().getName() + " | " + finalUrl + " (" + code + ")");
      }
    } catch (e) {
      brokenUrls.push(ad.getCampaign().getName() + " > " +
        ad.getAdGroup().getName() + " | " + finalUrl + " (Error)");
    }
  }
  if (brokenUrls.length > 0) {
    MailApp.sendEmail(ALERT_EMAIL, "Broken Landing Pages: " +
      brokenUrls.length, brokenUrls.join("\n"));
  }
}
```

---

## Campaign Management Scripts

### Pause Low Performers (with Dry Run)

```javascript
function main() {
  var CONFIG = {
    maxCostNoConversion: 100, dateRange: "LAST_14_DAYS",
    alertEmail: "team@omnifunnelmarketing.com", dryRun: true
  };
  var paused = [];
  var adGroups = AdsApp.adGroups().withCondition("Status = ENABLED")
    .withCondition("CampaignStatus = ENABLED").forDateRange(CONFIG.dateRange).get();
  while (adGroups.hasNext()) {
    var ag = adGroups.next();
    var stats = ag.getStatsFor(CONFIG.dateRange);
    if (stats.getCost() >= CONFIG.maxCostNoConversion && stats.getConversions() === 0) {
      paused.push(ag.getCampaign().getName() + " > " + ag.getName() +
        " ($" + stats.getCost().toFixed(2) + ")");
      if (!CONFIG.dryRun) ag.pause();
    }
  }
  if (paused.length > 0) {
    var mode = CONFIG.dryRun ? "[DRY RUN] " : "";
    MailApp.sendEmail(CONFIG.alertEmail,
      mode + paused.length + " Ad Groups - No Conversions",
      paused.join("\n"));
  }
}
```

### Seasonal Campaign Scheduler (Sheet-Driven)

```javascript
function main() {
  var sheet = SpreadsheetApp.openByUrl("YOUR_SPREADSHEET_URL").getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var today = new Date(); today.setHours(0, 0, 0, 0);
  // Sheet columns: Campaign Name | Start Date | End Date
  for (var i = 1; i < data.length; i++) {
    var campaigns = AdsApp.campaigns()
      .withCondition("Name = \"" + data[i][0] + "\"").get();
    if (campaigns.hasNext()) {
      var c = campaigns.next();
      var active = (today >= new Date(data[i][1]) && today <= new Date(data[i][2]));
      if (active && !c.isEnabled()) { c.enable(); Logger.log("Enabled: " + data[i][0]); }
      else if (!active && c.isEnabled()) { c.pause(); Logger.log("Paused: " + data[i][0]); }
    }
  }
}
```

---

## Alert Scripts

### Anomaly Detection: Spend and Conversion Alerts

```javascript
function main() {
  var CONFIG = {
    alertEmail: "team@omnifunnelmarketing.com",
    spendThreshold: 0.30, convThreshold: 0.40
  };
  var yStats = AdsApp.currentAccount().getStatsFor("YESTERDAY");
  var avgStats = AdsApp.currentAccount().getStatsFor("LAST_14_DAYS");
  var yCost = yStats.getCost();
  var yConv = yStats.getConversions();
  var avgCost = avgStats.getCost() / 14;
  var avgConv = avgStats.getConversions() / 14;
  var alerts = [];
  if (avgCost > 0 && Math.abs((yCost - avgCost) / avgCost) > CONFIG.spendThreshold) {
    alerts.push("Spend: $" + yCost.toFixed(2) + " vs $" + avgCost.toFixed(2) + " avg");
  }
  if (avgConv > 0 && (yConv - avgConv) / avgConv < -CONFIG.convThreshold) {
    alerts.push("Conv drop: " + yConv.toFixed(0) + " vs " + avgConv.toFixed(1) + " avg");
  }
  if (alerts.length > 0) {
    MailApp.sendEmail(CONFIG.alertEmail,
      "ANOMALY: " + AdsApp.currentAccount().getName(),
      alerts.join("\n\n"));
  }
}
```

### Disapproved Ads Alert

```javascript
function main() {
  var ALERT_EMAIL = "team@omnifunnelmarketing.com";
  var query = "SELECT campaign.name, ad_group.name, ad_group_ad.ad.id " +
    "FROM ad_group_ad " +
    "WHERE ad_group_ad.policy_summary.approval_status = \"DISAPPROVED\" " +
    "AND campaign.status = \"ENABLED\"";
  var rows = AdsApp.search(query);
  var items = [];
  while (rows.hasNext()) {
    var r = rows.next();
    items.push(r.campaign.name + " > " + r.adGroup.name + " (Ad " + r.adGroupAd.ad.id + ")");
  }
  if (items.length > 0) {
    MailApp.sendEmail(ALERT_EMAIL,
      items.length + " Disapproved Ads - " + AdsApp.currentAccount().getName(),
      items.join("\n"));
  }
}
```

---

## Google Sheets Integration Patterns

### Reading Config from a Sheet

```javascript
function getConfigFromSheet(url, sheetName) {
  var data = SpreadsheetApp.openByUrl(url).getSheetByName(sheetName)
    .getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) config[data[i][0]] = data[i][1];
  return config;
}
```

### Writing Results with Timestamps

```javascript
function writeResults(url, sheetName, headers, rows) {
  var ss = SpreadsheetApp.openByUrl(url);
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var ts = Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd HH:mm:ss");
  if (sheet.getLastRow() === 0) sheet.appendRow(["Timestamp"].concat(headers));
  for (var i = 0; i < rows.length; i++) sheet.appendRow([ts].concat(rows[i]));
}
```

---

## Using Labels for Script Targeting

```javascript
function main() {
  var labelName = "High Spend - No Conv";
  var existing = AdsApp.labels().withCondition("Name = \"" + labelName + "\"").get();
  if (!existing.hasNext()) {
    AdsApp.createLabel(labelName, "High spend, no conversions", "red");
  }
  var campaigns = AdsApp.campaigns().withCondition("Status = ENABLED")
    .forDateRange("LAST_7_DAYS").get();
  while (campaigns.hasNext()) {
    var c = campaigns.next();
    var stats = c.getStatsFor("LAST_7_DAYS");
    if (stats.getCost() > 500 && stats.getConversions() === 0) c.applyLabel(labelName);
    else c.removeLabel(labelName);
  }
}
```

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

### Script Heartbeat Monitor

```javascript
function logHeartbeat(url) {
  var ss = SpreadsheetApp.openByUrl(url);
  var sheet = ss.getSheetByName("Heartbeat") || ss.insertSheet("Heartbeat");
  if (sheet.getLastRow() === 0) sheet.appendRow(["Script", "Last Run", "Status"]);
  sheet.appendRow(["Budget Pacing",
    Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd HH:mm:ss"), "OK"]);
}
```

---

## Common Patterns Reference

### Filter by Labels
```javascript
var campaigns = AdsApp.campaigns()
  .withCondition("LabelNames CONTAINS_ANY [\"target_label\"]").get();
```

### Custom Date Range in GAQL
```javascript
var formatDate = function(d) {
  return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) +
    "-" + ("0" + d.getDate()).slice(-2);
};
var start = new Date(); start.setDate(start.getDate() - 30);
var clause = "segments.date BETWEEN \"" + formatDate(start) +
  "\" AND \"" + formatDate(new Date()) + "\"";
```

### Safe Division
```javascript
function safeDivide(num, denom, dec) {
  if (!denom || denom === 0) return 0;
  var r = num / denom;
  return dec !== undefined ? parseFloat(r.toFixed(dec)) : r;
}
```

### Batch Processing to Avoid Timeouts
```javascript
function main() {
  var startTime = new Date().getTime();
  var MAX_MS = 25 * 60 * 1000; // 25 min safety margin
  var keywords = AdsApp.keywords().withCondition("Status = ENABLED")
    .withLimit(50000).get();
  while (keywords.hasNext()) {
    if (new Date().getTime() - startTime > MAX_MS) {
      Logger.log("Time limit approaching. Stopping.");break;
    }
    var kw = keywords.next();
    // process keyword
  }
}
```

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
