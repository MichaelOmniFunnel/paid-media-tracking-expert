# Google Ads Offline Conversion & Meta CAPI Code

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
