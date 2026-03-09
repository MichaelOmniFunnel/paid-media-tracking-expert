# Negative Keywords, Quality Score & Campaign Scripts

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
