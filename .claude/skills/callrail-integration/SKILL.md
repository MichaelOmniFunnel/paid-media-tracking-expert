---
name: callrail-integration
description: DNI setup, offline conversion import, CAPI integration, webhook to SGTM, form tracking, multi-touch attribution, and API usage. Use when someone mentions CallRail, call tracking, dynamic number insertion, offline conversions from calls, or phone lead attribution.
disable-model-invocation: true
---

# CallRail Integration for Paid Media & Tracking

## Overview

CallRail is the call tracking and lead attribution platform used by OFM for lead generation clients. It is critical in verticals where phone calls are the primary conversion action:

- **Legal** (personal injury, family law, criminal defense)
- **Financial Services** (mortgage, insurance, financial advisory)
- **Franchise** (multi-location lead routing)
- **Home Services** (HVAC, plumbing, roofing, pest control)
- **Healthcare** (dental, medical practices, addiction treatment)

CallRail bridges the gap between online ad clicks and offline phone call conversions by:
1. **Dynamic Number Insertion (DNI)** - Swapping phone numbers per visitor to track source
2. **GCLID Capture** - Associating Google click IDs with phone calls for offline conversion import
3. **Webhook Firing** - Sending call data to server-side endpoints for CAPI and GTM SS integration
4. **Form Tracking** - Tracking form submissions alongside calls for unified lead attribution
5. **Multi-Touch Attribution** - Credit assignment across First Touch, Lead Creation, and Qualified milestones

---

## Dynamic Number Insertion (DNI)

### How DNI Works

1. CallRail assigns a pool of tracking phone numbers to your account
2. The JavaScript snippet detects the visitor's traffic source via referrer/UTM/cookie
3. A tracking number is swapped in place of your business number on the page
4. The visitor sees a unique number tied to their session
5. When they call, CallRail matches the tracking number to the visitor's session data
6. Session data includes: source, medium, campaign, keyword, GCLID, landing page, device

### JavaScript Snippet Installation

```html
<!-- CallRail tracking snippet - place before closing </body> tag -->
<!-- Can also be deployed via GTM as a Custom HTML tag -->
<script type="text/javascript">
  (function(a,e,c,f,g,h,b,d){var k={ak:"YOUR_ACCOUNT_ID",cl:"YOUR_COMPANY_ID",
  tf:function(a,b){},mu:a.location.href};a[c]=a[c]||function(){(a[c].q=a[c].q||
  []).push(arguments)};a[c].q=a[c].q||[];b=e.createElement(f);
  b.async=1;b.src="//cdn.callrail.com/companies/"+k.ak+"/"+k.cl+"/"+h+"/swap.js";
  d=e.getElementsByTagName(f)[0];d.parentNode.insertBefore(b,d);a[c]("setAccount",k);
  })(window,document,"CallTrk","script","","12345678901","");
</script>
```

### GTM Deployment

```javascript
// GTM Custom HTML Tag for CallRail
// Trigger: All Pages (or specific page triggers)
// Tag Firing Priority: Low (fire after other tracking scripts)

// NOTE: When deploying via GTM, ensure the tag fires on ALL pages
// where phone numbers appear, including dynamic/SPA page loads

// For single-page applications (React, Vue, Angular):
// Fire on History Change trigger in addition to Page View
// CallRail needs to re-scan the DOM for phone numbers after
// client-side navigation

// GTM Tag Configuration:
// Tag Type: Custom HTML
// HTML: [paste CallRail snippet]
// Trigger: All Pages + History Change (for SPAs)
// Tag Firing Options: Once per page
```

### DNI Number Pool Sizing

| Monthly Sessions | Recommended Pool Size | Notes |
|-----------------|----------------------|-------|
| < 5,000 | 4-6 numbers | Minimum for accurate tracking |
| 5,000 - 25,000 | 8-12 numbers | Standard for most lead gen sites |
| 25,000 - 100,000 | 15-25 numbers | High-traffic sites |
| 100,000+ | 25+ numbers | Enterprise; consult CallRail |

**Pool exhaustion** occurs when all tracking numbers are in use. Visitors arriving when the pool is exhausted see the default business number, and their calls are untracked. Monitor pool utilization in CallRail's settings.

---

## Google Ads Offline Conversion Import via GCLID

### How It Works

1. User clicks a Google Ad; Google appends `?gclid=abc123` to the landing page URL
2. CallRail's JavaScript captures the GCLID from the URL and stores it in a cookie
3. When the user calls, CallRail associates the GCLID with that call
4. CallRail sends the GCLID + conversion data back to Google Ads as an offline conversion
5. Google Ads matches the GCLID to the original click and records the conversion

### Setup Steps

```
1. Enable Google Ads integration in CallRail:
   CallRail > Settings > Integrations > Google Ads > Connect Account

2. Enable auto-tagging in Google Ads:
   Google Ads > Admin > Account Settings > Auto-tagging > ON
   (This appends gclid to all ad click URLs)

3. Configure conversion actions in Google Ads:
   Google Ads > Goals > Conversions > New Conversion Action > Import
   Select "Other data sources or CRMs" > "Track conversions from clicks"

4. Map CallRail events to Google Ads conversions:
   - Phone Call (First-Time Caller) -> Primary conversion
   - Phone Call (All Calls) -> Secondary conversion (for observation)
   - Qualified Call (if using CallRail's qualify feature) -> Primary conversion
   - Form Submission -> Primary or secondary conversion

5. Verify in CallRail:
   Activity > Calls > Click a call with a Google Ads source
   Verify "Google Click ID" field is populated
```

### Enhanced Conversions with CallRail

CallRail supports Google Ads Enhanced Conversions, which sends hashed first-party data alongside the GCLID for improved match rates:

```javascript
// CallRail's enhanced conversion data sent to Google Ads includes:
// - Hashed email (if captured via form or IVR)
// - Hashed phone number (the caller's phone number)
// - GCLID (captured from URL parameter)
// - WBRAID / GBRAID (for iOS 14.5+ Safari clicks)

// This is handled automatically by CallRail's Google Ads integration
// when Enhanced Conversions is enabled in both CallRail and Google Ads

// Setup in CallRail:
// Settings > Integrations > Google Ads > Edit
// Toggle "Enhanced Conversions" to ON

// Setup in Google Ads:
// Goals > Conversions > Settings > Enhanced Conversions > Turn On
// Select "Google Tag Manager" or "API" as the method
```

### GCLID, WBRAID, and GBRAID

```javascript
// CallRail captures three types of Google click identifiers:

// GCLID - Standard Google Click ID
//   Present on: Desktop clicks, Android clicks
//   Format: Long alphanumeric string
//   Cookie: _gcl_aw (set by Google's gtag or GTM)

// WBRAID - Web-to-app measurement (post-iOS 14.5)
//   Present on: iOS Safari clicks where cross-domain tracking is limited
//   Format: URL-safe base64 string
//   Used for: Modeled conversions when GCLID is not available

// GBRAID - App-to-web measurement
//   Present on: Clicks from Google app install campaigns
//   Format: URL-safe base64 string

// CallRail's JavaScript captures all three from URL parameters
// and cookie values. Ensure auto-tagging is enabled in Google Ads.

// IMPORTANT: GCLID values are CASE-SENSITIVE
// If any system lowercases the GCLID, conversion import will fail
// Common culprit: CRM systems or form processors that normalize input
```

### Manual Conversion Import (Backfill)

```javascript
// For backfilling missed conversions (up to 90 days):
// CallRail > Analytics > Call Log > Export

// Export includes:
// - Date/Time
// - Caller Number
// - Tracking Number
// - Duration
// - Google Click ID (gclid)
// - Source, Medium, Campaign, Keyword

// Format for Google Ads upload:
// Google Click ID, Conversion Name, Conversion Time, Conversion Value
// abc123def456, Phone Call, 2026-03-01 14:30:00, 0
// xyz789ghi012, Qualified Call, 2026-03-02 09:15:00, 150

// Upload in Google Ads:
// Goals > Conversions > Uploads > Upload file
// Use Google's CSV template for proper formatting
```

---

## Meta CAPI Integration (Server-Side Call Conversions)

### Architecture for Sending Call Conversions to Meta

CallRail does not have a native Meta CAPI integration. The recommended approach is:

```
CallRail Webhook -> Server-Side GTM (Stape) -> Meta CAPI Tag
                 -> OR -> Custom Server Endpoint -> Meta Conversions API
                 -> OR -> Zapier/n8n -> Meta Conversions API
```

### Option 1: CallRail Webhook to Server-Side GTM

```javascript
// Step 1: Configure CallRail webhook
// CallRail > Settings > Integrations > Webhooks
// Post-Call URL: https://sgtm.yourdomain.com/callrail-webhook
// Event: "Post-call" (fires after call completes)

// Step 2: CallRail sends POST with this JSON payload:
// {
//   "callrail_company_id": "123456789",
//   "callrail_company_name": "Client Name",
//   "id": "CAL123456789",
//   "type": "call",
//   "answered": true,
//   "direction": "inbound",
//   "duration": 185,
//   "first_call": true,
//   "caller_number": "+15551234567",
//   "caller_name": "John Doe",
//   "caller_city": "Austin",
//   "caller_state": "TX",
//   "tracking_number": "+15559876543",
//   "source": "Google Ads",
//   "medium": "cpc",
//   "campaign": "Brand Campaign",
//   "keyword": "best plumber near me",
//   "landing_page": "https://example.com/plumbing?gclid=abc123",
//   "gclid": "abc123def456",
//   "utm_source": "google",
//   "utm_medium": "cpc",
//   "utm_campaign": "brand",
//   "tags": ["qualified", "appointment-set"],
//   "start_time": "2026-03-05T14:30:00-06:00"
// }

// Step 3: In server-side GTM, create a Custom Client or use
// the Webhook Client (from Stape) to parse the incoming request

// Step 4: Create a Meta CAPI tag triggered by the CallRail event
// Map CallRail data to Meta's required fields:
// - event_name: "Lead" or custom "PhoneCall"
// - event_time: Unix timestamp from start_time
// - user_data.ph: Hash of caller_number
// - user_data.ct: Hash of caller_city
// - user_data.st: Hash of caller_state
// - user_data.fbc: Extract fbclid from landing_page URL if present
// - user_data.client_ip_address: Not available (server-to-server)
// - action_source: "phone_call"
```

### Option 2: Direct Meta Conversions API

```javascript
// Server-side Node.js handler for CallRail webhook -> Meta CAPI

var https = require('https');
var crypto = require('crypto');

function hashValue(value) {
  if (!value) return null;
  return crypto.createHash('sha256')
    .update(value.toString().trim().toLowerCase())
    .digest('hex');
}

function sendCallToMetaCAPI(callData, metaConfig) {
  var eventTime = Math.floor(new Date(callData.start_time).getTime() / 1000);

  // Extract fbclid from landing page URL if present
  var fbclid = null;
  if (callData.landing_page) {
    var fbclidMatch = callData.landing_page.match(/fbclid=([^&]+)/);
    if (fbclidMatch) {
      fbclid = 'fb.1.' + eventTime + '.' + fbclidMatch[1];
    }
  }

  var eventData = {
    data: [
      {
        event_name: 'Lead',
        event_time: eventTime,
        event_source_url: callData.landing_page || '',
        action_source: 'phone_call',
        user_data: {
          ph: [hashValue(callData.caller_number.replace(/[^0-9]/g, ''))],
          ct: [hashValue(callData.caller_city)],
          st: [hashValue(callData.caller_state)],
          country: [hashValue('us')],
          fbc: fbclid,
          external_id: [hashValue(callData.id)]
        },
        custom_data: {
          call_duration: callData.duration,
          call_source: callData.source,
          call_campaign: callData.campaign,
          first_time_caller: callData.first_call,
          value: callData.duration >= 60 ? 50 : 0,
          currency: 'USD'
        }
      }
    ],
    access_token: metaConfig.accessToken
  };

  var payload = JSON.stringify(eventData);

  var options = {
    hostname: 'graph.facebook.com',
    path: '/v21.0/' + metaConfig.pixelId + '/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      console.log('Meta CAPI response: ' + res.statusCode + ' ' + body);
    });
  });

  req.on('error', function(err) {
    console.error('Meta CAPI error: ' + err.message);
  });

  req.write(payload);
  req.end();
}

// Usage:
// sendCallToMetaCAPI(callrailWebhookPayload, {
//   pixelId: '123456789',
//   accessToken: 'EAAxxxxxx'
// });
```

### Qualifying Calls Before Sending to Meta

Not every call is a valid lead. Filter before sending to CAPI:

```javascript
// Filter criteria for qualified call conversions:
function isQualifiedCall(callData) {
  // Minimum duration (skip hang-ups and wrong numbers)
  if (callData.duration < 30) return false;

  // Must be answered
  if (!callData.answered) return false;

  // Must be inbound (not outbound follow-ups)
  if (callData.direction !== 'inbound') return false;

  // Check for spam tags
  if (callData.tags && callData.tags.indexOf('spam') !== -1) return false;

  // Optional: first-time callers only (avoid duplicate conversions)
  // if (!callData.first_call) return false;

  return true;
}

// In your webhook handler:
// if (isQualifiedCall(callData)) {
//   sendCallToMetaCAPI(callData, metaConfig);
//   sendCallToGoogleAds(callData, googleConfig);
// }
```

---

## CallRail Webhook Integration with Server-Side GTM via Stape

### Architecture

```
CallRail (Post-Call Webhook)
    |
    v POST JSON
Server-Side GTM Container (Stape)
    |
    +-> Webhook Client (parses incoming POST)
    |
    +-> Variables (extract call data from event)
    |
    +-> Tags:
         +-> Meta CAPI Tag (send Lead event)
         +-> Google Ads Conversion Tag (enhanced conversions)
         +-> GA4 Measurement Protocol (log call event)
         +-> Custom HTTP Request Tag (CRM, Slack, etc.)
```

### Stape Webhook Client Configuration

```javascript
// In server-side GTM, you need a Client to receive the CallRail webhook

// Option A: Use Stape's "Webhook" client (from Template Gallery)
// - Accepted Request Path: /callrail-webhook
// - This will parse the incoming JSON body and make it available
//   as event data for your tags

// Option B: Use a Custom Client template
// - Claim the request when path matches /callrail-webhook
// - Parse the JSON body
// - Set event data fields from the CallRail payload

// Event Data Mapping (in the client):
// event_name -> "phone_call" or "generate_lead"
// caller_phone -> from callData.caller_number
// call_duration -> from callData.duration
// call_source -> from callData.source
// gclid -> from callData.gclid
// fbclid -> extracted from callData.landing_page
// call_id -> from callData.id
// first_call -> from callData.first_call
```

### Trigger Configuration

```javascript
// Create a Custom Event trigger in server-side GTM:
// Trigger Type: Custom Event
// Event Name: "phone_call" (matches what the client sets)
//
// Add conditions for qualified calls only:
// call_duration > 30
// call_answered = true
// call_direction = "inbound"
//
// This prevents spam calls and hang-ups from firing conversion tags
```

### Webhook Security

```javascript
// CallRail webhooks do not include HMAC signatures by default.
// Protect your webhook endpoint with these approaches:

// 1. Secret URL path (obscurity layer - not sufficient alone)
//    https://sgtm.yourdomain.com/callrail-wh-s3cr3tpath123

// 2. IP allowlisting (if your SGTM host supports it)
//    CallRail webhook IPs should be whitelisted

// 3. Validate required fields in the webhook client
//    Reject requests missing callrail_company_id or id fields

// 4. API key in URL parameter
//    https://sgtm.yourdomain.com/callrail-webhook?key=YOUR_SECRET
//    Check the key in your client before claiming the request
```

---

## Form Tracking: CallRail vs. GTM

### When to Use CallRail Form Tracking

| Scenario | Use CallRail Forms | Use GTM Form Tracking |
|----------|-------------------|-----------------------|
| Need unified call + form attribution | Yes | No |
| Multi-touch attribution with calls | Yes | No |
| Simple form submission counting | Either | Yes |
| Complex form validation tracking | No | Yes |
| E-commerce checkout forms | No | Yes |
| Lead gen with phone + form | Yes | Optional |
| Form A/B testing | No | Yes (with Optimize) |

### CallRail Form Tracking Setup

```javascript
// CallRail can track form submissions two ways:

// METHOD 1: CallRail's Form Tracking (recommended for lead gen)
// CallRail replaces your existing forms with tracked versions
// or wraps existing forms to capture submissions
// Setup: CallRail > Tracking > Form Tracking > Create Form Tracker
// Select "Track an external form" or "Create a CallRail form"

// METHOD 2: Custom form integration via JavaScript
// For forms that CallRail cannot automatically track

// After form submission, push data to CallRail:
window.CallTrk = window.CallTrk || {};
window.CallTrk.setCustomData = function() {
  return {
    'form_name': 'Contact Form',
    'form_page': window.location.pathname,
    'form_source': getUrlParam('utm_source') || 'direct'
  };
};

// CallRail captures the same session data for forms as for calls:
// Source, Medium, Campaign, Keyword, GCLID, Landing Page, Device
```

### Dual Tracking Pattern (CallRail + GTM)

```javascript
// For maximum data coverage, track forms in BOTH systems:
// - CallRail: For unified call + form attribution
// - GTM: For platform-specific conversion events (Google Ads, Meta)

// GTM form submission handler
document.addEventListener('submit', function(e) {
  var form = e.target;
  if (form.id === 'lead-form' || form.classList.contains('tracked-form')) {
    // Push to dataLayer for GTM tags
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'form_submission',
      'form_name': form.id || form.getAttribute('name') || 'unknown',
      'form_action': form.action,
      'user_data': {
        'email': form.querySelector('input[type="email"]')
          ? form.querySelector('input[type="email"]').value : '',
        'phone': form.querySelector('input[type="tel"]')
          ? form.querySelector('input[type="tel"]').value : ''
      }
    });
  }
});

// Both CallRail and GTM will record the form submission
// CallRail handles attribution back to call tracking numbers
// GTM handles firing Google Ads conversion, Meta Pixel, etc.
```

---

## Multi-Touch Attribution with CallRail

### Attribution Models

CallRail supports multiple attribution models:

| Model | Credit Distribution | Best For |
|-------|--------------------|----------|
| First Touch | 100% to first interaction | Understanding discovery channels |
| Lead Creation | 100% to the conversion touchpoint | Direct response campaigns |
| 50/50 | 50% First Touch, 50% Lead Creation | Balanced view |
| W-Shaped | 33% First Touch, 33% Lead, 33% Qualified | Full-funnel analysis |
| Qualified | 100% to qualifying touchpoint | Sales-focused reporting |

### Attribution Milestones

```javascript
// CallRail tracks three key milestones per lead:

// 1. FIRST TOUCH
//    The first time a person interacts with your marketing
//    Could be: ad click, organic visit, social media click
//    Captured via: DNI session data or form submission source

// 2. LEAD CREATION
//    The touchpoint where they became a lead (called or submitted form)
//    This is the conversion moment
//    Contains: source, medium, campaign, keyword, GCLID

// 3. QUALIFIED
//    When the lead is marked as "qualified" in CallRail
//    Can be set manually, via tags, or via CallRail's automation
//    Represents sales-qualified leads vs raw conversions

// API response for a call includes milestone data:
// GET https://api.callrail.com/v3/a/ACCOUNT_ID/calls/CALL_ID.json
// Response includes:
// {
//   "milestones": {
//     "first_touch": {
//       "source": "Google Ads",
//       "medium": "cpc",
//       "campaign": "Brand",
//       "keyword": "plumber austin",
//       "landing_page": "https://example.com/plumbing",
//       "referrer": "https://www.google.com",
//       "occurred_at": "2026-02-28T10:00:00-06:00"
//     },
//     "lead_creation": {
//       "source": "Google Ads",
//       "medium": "cpc",
//       "campaign": "Service Area",
//       "keyword": "emergency plumber",
//       "occurred_at": "2026-03-01T14:30:00-06:00"
//     },
//     "qualified": {
//       "occurred_at": "2026-03-01T14:35:00-06:00"
//     }
//   }
// }
```

### Multi-Touch Reporting for Paid Media

```javascript
// Use CallRail's Multi-Touch CPL report for paid media analysis:
// CallRail > Analytics > Attribution > Multi-Touch Cost Per Lead

// This report shows:
// - First Touch source + Lead Creation source side by side
// - Whether discovery channel differs from conversion channel
// - Cost per lead at each attribution model

// Common insights for paid media:
// "Google Ads gets 60% of First Touch credit but only 40% of
//  Lead Creation credit - meaning it drives awareness but users
//  often convert through another channel (direct, organic)"

// "Meta Ads gets 20% of First Touch but 35% of Lead Creation -
//  meaning retargeting campaigns are converting leads that
//  Google Ads initially drove"
```

---

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

## Integration Architecture Summary

```
                    +------------------+
                    |   WEBSITE        |
                    |  (Landing Pages) |
                    +---+----+---------+
                        |    |
           CallRail JS  |    |  GTM / Tracking JS
           (DNI + forms) |    |  (GA4, pixels, etc.)
                        |    |
              +---------v-+  +--v-----------+
              | CALLRAIL  |  | GTM WEB      |
              | (Calls +  |  | (Browser     |
              |  Forms)   |  |  events)     |
              +---+---+---+  +------+-------+
                  |   |              |
     GCLID import |   | Webhooks    | SGTM events
     (automatic)  |   | (POST)     |
                  |   |             |
            +-----v-+ +---v---------v-------+
            |GOOGLE |  | SERVER-SIDE GTM    |
            |ADS    |  | (Stape)            |
            |       |  +----+------+--------+
            +-------+       |      |
                             |      |
                      +------v-+  +-v--------+
                      |META    |  |GOOGLE    |
                      |CAPI    |  |ADS (EC)  |
                      +--------+  +----------+
```

---

## Quick Reference: CallRail Webhook Events

| Event | Trigger | Key Fields | Use Case |
|-------|---------|------------|----------|
| pre_call | Before call is routed | caller_number, tracking_number, source | Real-time CRM popup |
| post_call | After call completes | All call data, duration, recording_url | Conversion tracking, CAPI |
| call_modified | Call is tagged/scored | tags, notes, value | Qualified lead events |
| form_submission | Form is submitted | form_data, source, gclid | Lead tracking |
| text_received | SMS received | message, caller_number | SMS lead tracking |
| text_sent | SMS sent | message, recipient | Response tracking |

---

## Quick Reference: CallRail API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /calls.json | GET | List all calls (filterable) |
| /calls/{id}.json | GET | Single call details |
| /calls/{id}.json | PUT | Update call (tags, spam, notes) |
| /calls/summary.json | GET | Aggregated call stats |
| /form_submissions.json | GET | List form submissions |
| /form_submissions/{id}.json | GET | Single form details |
| /tracker_numbers.json | GET | List tracking numbers |
| /companies.json | GET | List companies in account |
| /integrations.json | GET | List active integrations |

**Authentication Header:**
```
Authorization: Token token=YOUR_API_KEY
```

**Pagination:** Max 250 results per page. Use `?page=N&per_page=250` for additional pages.

**Rate Limits:** CallRail allows 10 requests per second per API key. Implement exponential backoff for batch operations.
