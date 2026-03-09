# Alerts, Patterns, Scheduling & Reference

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


