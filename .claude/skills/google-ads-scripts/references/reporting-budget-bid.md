# Reporting, Budget & Bid Scripts

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
