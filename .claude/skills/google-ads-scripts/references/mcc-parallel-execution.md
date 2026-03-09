# MCC Parallel Execution

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
