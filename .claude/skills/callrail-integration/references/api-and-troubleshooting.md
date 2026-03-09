# CallRail API & Troubleshooting

## CallRail API for Reporting

### API Authentication

```javascript
// CallRail API v3
// Base URL: https://api.callrail.com/v3/a/ACCOUNT_ID
// Authentication: Bearer token in Authorization header

var CALLRAIL_API_KEY = 'your_api_key_here';
var ACCOUNT_ID = 'your_account_id';

function callRailRequest(endpoint, callback) {
  var https = require('https');

  var options = {
    hostname: 'api.callrail.com',
    path: '/v3/a/' + ACCOUNT_ID + endpoint,
    method: 'GET',
    headers: {
      'Authorization': 'Token token=' + CALLRAIL_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      callback(null, JSON.parse(body));
    });
  });

  req.on('error', function(err) {
    callback(err, null);
  });

  req.end();
}
```

### Common API Endpoints

```javascript
// List all calls with filtering
// GET /v3/a/{account_id}/calls.json
// Query params: date_range, source, status, duration, fields

callRailRequest('/calls.json?date_range=last_30_days&status=completed&fields=id,caller_number,duration,source,gclid,start_time,first_call,tags', function(err, data) {
  if (err) {
    console.error('API Error:', err);
    return;
  }
  console.log('Total calls:', data.total_results);
  // Process calls for reporting
  var calls = data.calls || [];
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];
    console.log(
      call.start_time + ' | ' +
      call.source + ' | ' +
      call.duration + 's | ' +
      (call.gclid ? 'GCLID: ' + call.gclid : 'No GCLID')
    );
  }
});

// List form submissions
// GET /v3/a/{account_id}/form_submissions.json
callRailRequest('/form_submissions.json?date_range=last_30_days', function(err, data) {
  if (err) return;
  var forms = data.form_submissions || [];
  for (var i = 0; i < forms.length; i++) {
    console.log(
      forms[i].submitted_at + ' | ' +
      forms[i].source + ' | ' +
      forms[i].form_name
    );
  }
});

// Get call summary by source (for dashboard reporting)
// GET /v3/a/{account_id}/calls/summary.json
callRailRequest('/calls/summary.json?date_range=last_30_days&group_by=source', function(err, data) {
  if (err) return;
  // Returns call volume, average duration, first-time callers by source
  console.log(JSON.stringify(data, null, 2));
});

// Mark a call as spam
// PUT /v3/a/{account_id}/calls/{call_id}.json
// Body: { "spam": true }

// Tag a call as qualified
// PUT /v3/a/{account_id}/calls/{call_id}.json
// Body: { "tags": ["qualified", "appointment-set"] }
```

### Pulling CallRail Data into Reporting Dashboards

```javascript
// Common reporting integrations:

// 1. LOOKER STUDIO (Google Data Studio)
//    Use CallRail's native Looker Studio connector
//    Or use the API with Google Apps Script as a data source

// 2. GOOGLE SHEETS (for simple reporting)
//    Use Google Apps Script to pull CallRail API data on a schedule:

function pullCallRailData() {
  var apiKey = 'your_api_key';
  var accountId = 'your_account_id';
  var url = 'https://api.callrail.com/v3/a/' + accountId + '/calls.json?date_range=last_7_days&fields=id,start_time,source,duration,first_call,gclid,tags';

  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Token token=' + apiKey
    }
  };

  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CallRail Data');

  // Clear existing data
  sheet.getRange('A2:Z').clearContent();

  // Write call data
  var calls = data.calls || [];
  for (var i = 0; i < calls.length; i++) {
    var row = i + 2;
    sheet.getRange(row, 1).setValue(calls[i].start_time);
    sheet.getRange(row, 2).setValue(calls[i].source);
    sheet.getRange(row, 3).setValue(calls[i].duration);
    sheet.getRange(row, 4).setValue(calls[i].first_call ? 'Yes' : 'No');
    sheet.getRange(row, 5).setValue(calls[i].gclid || '');
    sheet.getRange(row, 6).setValue((calls[i].tags || []).join(', '));
  }
}

// 3. CUSTOM DASHBOARDS
//    Use the API with your BI tool of choice
//    Pagination: CallRail returns max 250 results per page
//    Use ?page=2&per_page=250 for additional results
```

---

## Common Issues & Troubleshooting

### 1. DNI Breaking Click ID Capture

**Symptoms:** GCLID/FBCLID not being captured on calls; calls show "Direct" source instead of paid.

**Root Causes & Fixes:**

```javascript
// CAUSE 1: CallRail JS loads before URL parameters are available
// FIX: Ensure CallRail snippet loads AFTER the page URL is settled
// In GTM, use "Window Loaded" trigger instead of "Page View" if needed

// CAUSE 2: Redirect chains stripping URL parameters
// Example: ad click -> yourdomain.com/?gclid=abc -> redirect to
//          yourdomain.com/landing-page/ (gclid lost!)
// FIX: Ensure redirects preserve query parameters
// Test: Click your own ad and verify gclid appears in final URL

// CAUSE 3: Caching plugins serving stale HTML
// WordPress plugins (WP Rocket, W3 Total Cache, LiteSpeed Cache)
// can cache the page with a previously-swapped number
// FIX: Exclude CallRail's swap.js from caching/minification
// In WP Rocket: Settings > File Optimization > Exclude JS:
//   cdn.callrail.com

// CAUSE 4: SPA (Single-Page App) not re-initializing CallRail
// FIX: Call CallTrk.swap() on route changes:
// window.addEventListener('popstate', function() {
//   if (window.CallTrk) { window.CallTrk.swap(); }
// });

// CAUSE 5: Multiple CallRail snippets on the page
// FIX: Ensure only ONE CallRail snippet is installed
// Check: GTM + hardcoded snippet = conflict
```

### 2. Call Attribution Gaps

**Symptoms:** Calls show up in CallRail but with "Unknown" or "Direct" source when they should be attributed to Google Ads or Meta.

**Diagnosis Checklist:**
- Is Google auto-tagging enabled? (Admin > Account Settings > Auto-tagging)
- Is the GCLID visible in the landing page URL when clicking the ad?
- Does the landing page redirect strip the query parameters?
- Is CallRail's JS snippet on the landing page?
- Is the tracking number pool large enough? (Pool exhaustion = untracked calls)
- Is the visitor using a different device to call than they used to click? (Cross-device = no GCLID)

### 3. Spam Call Filtering

**Symptoms:** High call volume inflating conversion counts; many short or robocall entries.

```javascript
// CallRail's built-in spam detection:
// Settings > Call Flows > Spam Detection
// Options:
// - Block known spam numbers (CallRail's database)
// - Flag short calls (< 10 seconds) for review
// - Block specific area codes or number patterns

// API-based spam filtering for custom rules:
function filterSpamCalls(calls) {
  var validCalls = [];
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];

    // Skip calls under 15 seconds (likely robocalls/hangups)
    if (call.duration < 15) continue;

    // Skip calls already tagged as spam
    if (call.tags && call.tags.indexOf('spam') !== -1) continue;

    // Skip unanswered calls
    if (!call.answered) continue;

    // Skip repeat callers calling 5+ times per day (likely spam)
    // (requires additional logic to count calls per number per day)

    validCalls.push(call);
  }
  return validCalls;
}

// When reporting conversions to Google/Meta, ONLY send valid calls
// This prevents spam from polluting your conversion data and
// causing Smart Bidding to optimize for junk leads
```

### 4. Conversion Count Discrepancies (CallRail vs. Google Ads)

**Symptoms:** CallRail shows 50 Google Ads calls, but Google Ads shows 35 conversions.

**Common Causes:**
- Google Ads only counts conversions with a valid GCLID (case-sensitive)
- Calls from GCLID-less clicks (iOS Safari with ITP) may not import
- Google Ads deduplicates: one conversion per click per conversion window
- CallRail counts ALL calls; Google Ads may use "one per click" counting
- Conversion window mismatch: Google's default is 30 days; old clicks beyond the window are excluded

### 5. CallRail + Meta Attribution Conflicts

**Symptoms:** Meta reports 0 phone call conversions even though calls are coming from Meta ad clicks.

**Root Cause:** Meta does not natively receive CallRail data. Unlike Google Ads, there is no direct integration.

**Fix:** Implement the Meta CAPI integration described in the "Meta CAPI Integration" section above. You must actively send call conversion data to Meta via server-side endpoint, webhook middleware, or automation platform.

### 6. Form Tracking Conflicts (CallRail vs. GTM)

**Symptoms:** Form submissions counted twice in Google Ads or Meta dashboards.

```javascript
// Deduplication strategy:
// Use ONE system as the primary conversion source per platform

// Recommended setup:
// Google Ads conversions:
//   - Phone calls -> CallRail integration (automatic GCLID import)
//   - Form submissions -> GTM conversion tag (fires on thank-you page)
//   - Do NOT also send CallRail form data to Google Ads

// Meta conversions:
//   - Phone calls -> CallRail webhook -> SGTM -> Meta CAPI
//   - Form submissions -> Meta Pixel (browser) + Meta CAPI (server)
//   - Deduplicate with event_id matching between browser and server

// If using CallRail for BOTH calls and forms to Google Ads:
//   - Disable GTM's Google Ads conversion tag for forms
//   - Let CallRail be the single form conversion source
//   - This simplifies attribution but reduces real-time conversion data
```

---
