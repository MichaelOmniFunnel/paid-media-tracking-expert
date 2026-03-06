---
name: server-side-tracking
description: GTM Server-Side, Stape.io, click ID persistence, event deduplication, first-party data enrichment, consent handling, and failure mode troubleshooting. Use whenever someone mentions Stape, SGTM, server container, server-side tagging, first-party cookies, click ID loss, event deduplication, or server-side tracking not working.
model: sonnet
---

# Server-Side Tracking Architecture

## Why Server-Side Tracking Matters

Browser-side tracking is increasingly degraded by:

- Ad blockers (30 to 40% of users in some demographics)
- Intelligent Tracking Prevention (ITP) in Safari limits cookies to 7 days (1 day for link-decorated traffic)
- Enhanced Tracking Protection (ETP) in Firefox blocks known trackers
- iOS App Tracking Transparency reduces Meta and TikTok browser matching
- Third-party cookie deprecation in Chrome
- Network-level ad blocking on corporate and mobile networks

Server-side tracking bypasses these by sending events from your server directly to platform APIs. The data never touches the browser on the outbound side, which means ad blockers and browser restrictions cannot interfere.

## Architecture Options

### Option 1: GTM Server-Side Container via Stape.io (OFM Standard)

This is the default architecture for all OFM clients. How it works:

1. Browser sends events to YOUR first-party domain (not google/facebook/tiktok domains)
2. GTM Server-Side container hosted on Stape receives events
3. Server container processes, enriches, and forwards to Google, Meta, TikTok APIs
4. First-party cookies are set from your domain (survives ITP)
5. Data is enriched with server-side user data before forwarding

Tagging server URL pattern:
```
https://sgtm.yourdomain.com
```

Stape.io manages the infrastructure so there is no DevOps overhead. Auto-scaling handles traffic spikes. Built-in CAPI tags are available for Meta, TikTok, and Google. Pricing starts around $20/month for low traffic sites.

### Option 2: Google Cloud Run (Self-Hosted)

For clients who require full infrastructure control or have compliance requirements that prohibit managed hosting. Requires a GCP project, Cloud Run service, and custom domain mapping. Higher operational overhead but full control over data residency and processing.

### Option 3: Direct API Integration

Custom server-side implementation where the backend directly calls platform APIs on conversion events. Maximum control and flexibility but requires development resources. Best for complex CRM-to-platform data flows, offline conversion imports, and situations where GTM SS cannot model the data flow.

### Option 4: Platform Native Integrations

- Shopify: Built-in CAPI for Meta (automatic), Google enhanced conversions
- WordPress/WooCommerce: Meta CAPI plugin, Google CAPI via GTM SS
- HubSpot: Native offline conversion connectors for Google and Meta

These are useful as a baseline but rarely sufficient for multi-platform advertisers who need full control over event parameters, deduplication, and enrichment.

---

## Click ID Capture and Persistence

Click IDs are the single most important signal for attributing conversions back to ad clicks. Every platform appends its own click ID to the landing page URL. If these are lost during navigation, form submissions, or redirects, server-side events cannot be attributed to the original click.

### Click ID Types

| Platform | Parameter | Cookie Name | Example Value |
|----------|-----------|-------------|---------------|
| Google Ads | gclid | _gcl_aw | EAIaIQobChMI... |
| Meta Ads | fbclid | _fbc | fb.1.1699999999.AbCdEf |
| TikTok Ads | ttclid | ttclid | E.C.P... |
| Microsoft Ads | msclkid | _uetmsclkid | abc123def |
| Google Ads (iOS) | gbraid | _gcl_gb | ... |
| Google Ads (web to app) | wbraid | _gcl_wb | ... |

### Capturing Click IDs on Landing

This script must run on every page, not just landing pages, because users may bookmark or share URLs with click IDs attached.

```javascript
// ES5 compatible. Place in GTM Custom HTML tag firing on All Pages.
(function() {
  var params = {};
  var search = window.location.search.substring(1);
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  var clickIds = ["gclid", "fbclid", "ttclid", "msclkid", "dclid", "wbraid", "gbraid"];
  var maxAge = 7776000; // 90 days in seconds

  for (var j = 0; j < clickIds.length; j++) {
    var key = clickIds[j];
    if (params[key]) {
      var expires = new Date();
      expires.setTime(expires.getTime() + (maxAge * 1000));
      document.cookie = key + "=" + encodeURIComponent(params[key]) +
        "; expires=" + expires.toUTCString() +
        "; path=/; SameSite=Lax; Secure";
    }
  }
})();
```

### Building the _fbc Cookie Value

Meta expects the _fbc cookie in a specific format. If the native Meta Pixel does not set it (which happens with ad blockers), you need to construct it yourself from the fbclid parameter.

```javascript
// ES5 compatible. Construct _fbc from fbclid.
(function() {
  var params = {};
  var search = window.location.search.substring(1);
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  if (params.fbclid) {
    var fbcValue = "fb.1." + Date.now() + "." + params.fbclid;
    var expires = new Date();
    expires.setTime(expires.getTime() + (7776000 * 1000));
    document.cookie = "_fbc=" + fbcValue +
      "; expires=" + expires.toUTCString() +
      "; path=/; SameSite=Lax; Secure";
  }
})();
```

### Generating the _fbp Cookie Value

The _fbp cookie is Meta's browser ID. If the Meta Pixel cannot set it (blocked by ad blocker), generate it server-side or client-side as a first-party cookie.

```javascript
// ES5 compatible. Generate _fbp if not already present.
(function() {
  var cookies = document.cookie.split("; ");
  var hasFbp = false;
  for (var i = 0; i < cookies.length; i++) {
    if (cookies[i].indexOf("_fbp=") === 0) {
      hasFbp = true;
      break;
    }
  }

  if (!hasFbp) {
    var randomPart = Math.floor(Math.random() * 2147483647);
    var fbpValue = "fb.1." + Date.now() + "." + randomPart;
    var expires = new Date();
    expires.setTime(expires.getTime() + (63072000 * 1000)); // 2 years
    document.cookie = "_fbp=" + fbpValue +
      "; expires=" + expires.toUTCString() +
      "; path=/; SameSite=Lax; Secure";
  }
})();
```

### Persisting Click IDs Through Form Submissions

When a user fills out a form, click IDs stored in cookies must be passed along with the form data so the backend can include them in server-side event calls.

```html
<input type="hidden" name="gclid" id="gclid_field">
<input type="hidden" name="fbclid" id="fbclid_field">
<input type="hidden" name="fbc" id="fbc_field">
<input type="hidden" name="fbp" id="fbp_field">
<input type="hidden" name="ttclid" id="ttclid_field">
<input type="hidden" name="msclkid" id="msclkid_field">
```

```javascript
// ES5 compatible. Populate hidden fields from cookies on form render.
(function() {
  function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      if (parts[0] === name) {
        return decodeURIComponent(parts.slice(1).join("="));
      }
    }
    return "";
  }

  var fields = [
    { cookie: "gclid", elementId: "gclid_field" },
    { cookie: "fbclid", elementId: "fbclid_field" },
    { cookie: "_fbc", elementId: "fbc_field" },
    { cookie: "_fbp", elementId: "fbp_field" },
    { cookie: "ttclid", elementId: "ttclid_field" },
    { cookie: "msclkid", elementId: "msclkid_field" }
  ];

  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i].elementId);
    if (el) {
      el.value = getCookie(fields[i].cookie);
    }
  }
})();
```

### Persisting Click IDs Through Redirects

When your site uses intermediate redirects (for example, a thank you page redirect, a CRM redirect, or a multi-step funnel), click IDs can be lost if they are only in the original URL query string. Two approaches to handle this:

**Approach A: Cookie-Based (Preferred)**
If the click ID capture script above runs on every page, cookies persist across redirects on the same domain automatically. No additional work needed.

**Approach B: URL Parameter Forwarding**
For cross-domain redirects where cookies do not carry over:

```javascript
// ES5 compatible. Append click ID parameters to redirect URLs.
(function() {
  function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      if (parts[0] === name) return decodeURIComponent(parts.slice(1).join("="));
    }
    return "";
  }

  function appendClickIds(url) {
    var ids = ["gclid", "fbclid", "ttclid", "msclkid"];
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    for (var i = 0; i < ids.length; i++) {
      var val = getCookie(ids[i]);
      if (val) {
        url = url + separator + ids[i] + "=" + encodeURIComponent(val);
        separator = "&";
      }
    }
    return url;
  }

  // Apply to all outbound links matching redirect domains
  var links = document.querySelectorAll("a[href]");
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute("href");
    if (href && href.indexOf("redirect-domain.com") !== -1) {
      links[i].setAttribute("href", appendClickIds(href));
    }
  }
})();
```

---

## Event Deduplication

When running client-side pixel and server-side API in parallel (which is the OFM standard), every event will be received twice by the platform unless deduplication is in place. Deduplication relies on a matching event_id sent from both the browser and the server for the same user action.

### How Deduplication Works

1. Browser fires a pixel event with an event_id
2. Server fires a CAPI/Events API event with the same event_id
3. Platform receives both, sees matching event_id, and counts it only once
4. If the browser event is blocked (ad blocker), only the server event arrives and it is counted
5. If the server event fails, the browser event is still counted

This redundancy is the entire point of running both in parallel.

### Generating event_id Values

The event_id must be unique per user action, deterministic enough to match between client and server, and generated before the event fires on either side.

```javascript
// ES5 compatible. Generate a unique event ID for deduplication.
function generateEventId(prefix) {
  var timestamp = Date.now().toString(36);
  var random = "";
  for (var i = 0; i < 8; i++) {
    random += Math.floor(Math.random() * 36).toString(36);
  }
  return (prefix || "evt") + "_" + timestamp + "_" + random;
}

// Usage per platform:
// Meta: generateEventId("meta")
// TikTok: generateEventId("tt")
// Google: generateEventId("goog")
```

### Sharing event_id Between Client and Server

**Method 1: DataLayer Push (GTM Standard)**

The client-side tag generates the event_id, pushes it to the dataLayer, and GTM sends it both to the browser pixel and to the server-side container via the GA4 transport.

```javascript
// ES5 compatible. Push purchase event with shared event_id.
var purchaseEventId = generateEventId("purchase");

window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "purchase",
  event_id: purchaseEventId,
  ecommerce: {
    transaction_id: "TXN-12345",
    value: 119.98,
    currency: "USD",
    items: [
      {
        item_id: "SKU-001",
        item_name: "Product Name",
        price: 59.99,
        quantity: 2
      }
    ]
  }
});
```

In the GTM server-side container, the event_id is extracted from the incoming event data and mapped to each outgoing tag (Meta CAPI tag, TikTok Events API tag, Google Enhanced Conversions tag).

**Method 2: Hidden Field on Confirmation Page**

For non-SPA sites where the purchase confirmation page is a new page load, embed the event_id in the page HTML so both the client-side tag and the server can read it.

```html
<!-- Server-rendered on the confirmation page -->
<script>
  var eventId = "purchase_{{ server_generated_uuid }}";
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "purchase",
    event_id: eventId,
    transaction_id: "{{ transaction_id }}",
    value: {{ order_total }},
    currency: "USD"
  });
</script>
```

The backend uses the same UUID when sending the server-side CAPI event.

**Method 3: Transaction ID as event_id**

For purchase events specifically, using the transaction ID (order number) as the event_id is a clean approach since it is naturally unique and available on both client and server.

```javascript
// The transaction ID itself becomes the event_id
var eventId = "order_" + transactionId;

// Client side
fbq("track", "Purchase", { value: 119.98, currency: "USD" }, { eventID: eventId });

// Server side uses the same value in the CAPI payload
```

### Platform-Specific event_id Behavior

| Platform | Client-Side Parameter | Server-Side Parameter | Dedup Window |
|----------|----------------------|----------------------|--------------|
| Meta | eventID (in options object) | event_id (in payload) | 48 hours |
| TikTok | event_id (in options object) | event_id (in payload) | 48 hours |
| Google | transaction_id | transaction_id | 24 hours |

---

## Async vs Sequential Event Firing

### When to Fire Sequentially

Events that depend on each other must fire in order:

- AddToCart must fire before InitiateCheckout (for funnel integrity)
- InitiateCheckout must fire before Purchase
- Identify/Advanced Matching must fire before the conversion event

In practice, these naturally happen on different pages or user actions, so sequencing is automatic.

### When Async Is Acceptable

On a single page where multiple platform events fire for the same action (for example, a purchase confirmation page fires Meta, TikTok, and Google events), these can and should fire asynchronously since they are independent of each other.

```javascript
// ES5 compatible. Fire multiple platform events in parallel.
var eventId = generateEventId("purchase");
var orderData = {
  value: 119.98,
  currency: "USD",
  transaction_id: "TXN-12345"
};

// These fire independently and do not block each other
fbq("track", "Purchase", {
  value: orderData.value,
  currency: orderData.currency,
  content_type: "product"
}, { eventID: eventId });

ttq.track("CompletePayment", {
  value: orderData.value,
  currency: orderData.currency
}, { event_id: eventId });

// GA4 goes through the dataLayer
window.dataLayer.push({
  event: "purchase",
  event_id: eventId,
  ecommerce: {
    transaction_id: orderData.transaction_id,
    value: orderData.value,
    currency: orderData.currency
  }
});
```

### GTM Server-Side Async Behavior

In the server-side container, tags fire asynchronously by default. When the GA4 client receives an event, all server-side tags that are triggered by that event fire in parallel. There is no guaranteed order. This is normally fine because each tag sends to a different platform.

If you need one server-side tag to fire before another (rare), use tag sequencing in the server-side container.

---

## Timeout and Retry Logic for Server-Side Calls

### Default Behavior in GTM SS

GTM server-side tags use HTTP requests to send events to platform APIs. By default:

- There is no built-in retry logic in GTM SS tags
- If a request fails (timeout, 5xx, network error), the event is lost
- Most Stape-managed tags have a 5 to 10 second timeout

### Implementing Retry Logic

For critical events like purchases, use a Custom Tag template in GTM SS with retry logic:

```javascript
// GTM Server-Side Custom Tag Template (sandboxed JavaScript)
// Note: GTM SS uses its own sandboxed JS, not browser JS

const sendHttpRequest = require("sendHttpRequest");
const getEventData = require("getEventData");
const logToConsole = require("logToConsole");

const url = "https://graph.facebook.com/v18.0/" + pixelId + "/events";
const maxRetries = 2;
var attempt = 0;

function sendEvent() {
  attempt++;
  sendHttpRequest(url, {
    method: "POST",
    timeout: 5000,
    headers: { "Content-Type": "application/json" }
  }, JSON.stringify(payload))
  .then(function(response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      data.gtmOnSuccess();
    } else if (attempt <= maxRetries) {
      logToConsole("Retry attempt " + attempt + " for event: " + eventName);
      sendEvent();
    } else {
      logToConsole("Failed after " + maxRetries + " retries: " + response.statusCode);
      data.gtmOnFailure();
    }
  })
  .catch(function(error) {
    if (attempt <= maxRetries) {
      sendEvent();
    } else {
      data.gtmOnFailure();
    }
  });
}

sendEvent();
```

### Timeout Recommendations by Event Type

| Event Type | Timeout | Retries | Rationale |
|------------|---------|---------|-----------|
| Purchase | 10 seconds | 2 | High value, must not be lost |
| Lead/SubmitForm | 8 seconds | 1 | Important but less critical |
| AddToCart | 5 seconds | 0 | High volume, acceptable loss |
| ViewContent | 3 seconds | 0 | Informational, loss is fine |
| PageView | 3 seconds | 0 | Highest volume, no retries |

---

## Testing Server-Side Tags

### Stape Debug Mode

Stape provides a built-in debug/preview mode for the server-side container that works independently from the GTM Preview mode.

**How to access:**
1. Log in to Stape.io
2. Select the container
3. Click "Preview" in the top right
4. A debug panel opens showing all incoming requests and outgoing tag fires

**What to verify in debug mode:**
- Incoming event data: confirm all parameters (event_id, user data, ecommerce data) arrive correctly
- Outgoing requests: confirm each tag fires and the payload is correct
- Response codes: confirm 200/202 responses from platform APIs
- Cookie values: confirm _fbc, _fbp, gclid are present in the incoming request

### GTM Server-Side Preview Mode

Separate from Stape debug, GTM itself has a Preview mode for the server-side container:

1. Open the server-side container in GTM
2. Click Preview
3. Enter the tagging server URL
4. GTM opens a debug panel similar to the client-side preview
5. Fire test events from the client-side container or directly via curl

### Testing in Production vs Staging

**Staging approach (recommended for initial setup):**
- Create a separate server-side container for staging
- Point it to test pixel IDs or use platform test event tools
- Use Meta Test Events tool (Events Manager > Test Events) to validate payloads
- Use TikTok Test Events tool in Events Manager
- Use Google Tag Assistant for Enhanced Conversions verification

**Production testing:**
- Use GTM Environments to push only to staging first
- Use Meta Test Events with a test event code (does not affect real data)
- Monitor the first 24 hours of events in each platform's diagnostics
- Check deduplication by comparing browser-only event count vs total event count

### Verifying with curl

Send a test event directly to the server-side container to verify it processes and forwards correctly:

```bash
curl -X POST https://sgtm.yourdomain.com/g/collect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "v=2&tid=G-XXXXXXX&en=purchase&ep.event_id=test_123&ep.transaction_id=TEST-001&epn.value=99.99&ep.currency=USD"
```

---

## Common Failure Modes and Troubleshooting

### Events Not Arriving at the Platform

**Symptom:** Server-side events are not showing in Meta Events Manager, TikTok Events Manager, or Google Ads conversion reporting.

**Diagnostic steps:**
1. Check Stape debug mode: is the incoming event arriving at the server container?
2. If yes: check the outgoing request. Is the tag firing? What is the response code?
3. If the tag is not firing: check trigger conditions. Most common issue is the trigger not matching the event name exactly.
4. If the tag fires but returns an error:
   - 400: payload format error. Check required fields.
   - 401/403: access token expired or invalid. Regenerate in platform.
   - 500: platform API is down. Retry later.
5. If the event is not arriving at the server container at all: check that the client-side GA4 tag is configured to send to the server-side container URL, not to Google's default endpoint.

### Duplicate Events

**Symptom:** Conversion count in the platform is roughly double what it should be.

**Root causes:**
- Missing event_id on either the client or server event
- event_id mismatch (different values on client vs server)
- Client-side and server-side events are using different event names (e.g., "purchase" vs "Purchase")
- Two separate server-side tags firing for the same event (check for duplicate tags)

**Fix:**
1. Verify event_id is present on both client and server events
2. In Stape debug mode, compare the event_id in the incoming request with the event_id in the outgoing CAPI payload
3. In Meta Events Manager, use the "Deduplicated" filter to see if events are being matched

### Missing User Data on Server Events

**Symptom:** Event Match Quality (EMQ) is low even though Advanced Matching is configured client-side.

**Root causes:**
- User data from the client-side pixel is not being forwarded to the server container
- The server-side tag is not mapping user data fields correctly
- Cookies (_fbc, _fbp) are not being sent with the request to the server container

**Fix:**
1. Check that the GA4 client-side tag includes user properties or custom event parameters for email, phone, etc.
2. In the server-side container, verify the Meta CAPI tag or TikTok Events API tag is mapping these fields from the incoming event data
3. For cookies: ensure the GA4 transport to server-side includes cookies. If using a custom transport, cookies must be forwarded explicitly.

### Stale or Expired Access Tokens

**Symptom:** Server events suddenly stop arriving. Everything was working previously.

**Root causes:**
- Meta system user token expired (rare with long-lived tokens but happens)
- TikTok access token expired (tokens expire after a set period)
- Google Ads API credentials rotated

**Fix:**
1. Regenerate the token in the respective platform
2. Update the token in the GTM server-side tag configuration
3. Publish the updated container
4. Set a calendar reminder to check token validity quarterly

### High Latency or Timeouts

**Symptom:** Events arrive intermittently. Some days have full data, others have gaps.

**Root causes:**
- Server container is under-provisioned for traffic volume
- Platform API is experiencing degraded performance
- Network issues between Stape and the platform API

**Fix:**
1. Check Stape dashboard for container CPU and memory utilization
2. Upgrade the container tier if it is consistently above 70% utilization
3. Check platform status pages for known outages
4. Review tag timeout settings and increase if needed for high-value events

---

## Stape Container Health Monitoring

### Key Metrics to Watch

| Metric | Healthy Range | Action if Outside |
|--------|---------------|-------------------|
| Request count | Stable day over day | Sudden drops indicate client-side issues |
| Error rate | Below 1% | Investigate failing tags |
| CPU utilization | Below 70% | Upgrade container tier |
| Memory utilization | Below 80% | Upgrade container tier |
| Average response time | Below 200ms | Check for heavy processing in tags |
| Outgoing request success rate | Above 98% | Check platform API health |

### Setting Up Alerts

Stape provides email alerts for:
- Container going offline
- Request volume dropping below threshold
- Error rate spiking above threshold
- Container resource limits being hit

Configure these in Stape dashboard > Container Settings > Alerts. Set the request volume alert to trigger if volume drops below 50% of the daily average, which indicates a tracking break.

### Monthly Health Check Procedure

1. Compare server-side event counts against client-side event counts for each platform
2. Server-side should be equal to or slightly higher than client-side (due to ad blocker recovery)
3. If server-side is significantly lower, something is broken in the pipeline
4. Check EMQ scores in Meta Events Manager (target 7+)
5. Check event match rates in TikTok Events Manager
6. Review container utilization trends and plan upgrades before they are needed

---

## First-Party Data Enrichment on the Server Side

One of the biggest advantages of server-side tracking is the ability to enrich events with data that is not available in the browser.

### What Can Be Enriched

| Data Point | Source | Platform Value |
|------------|--------|---------------|
| Customer lifetime value | CRM/database | Value-based bidding |
| Customer segment | CRM/database | Audience signals |
| Product margin | Product database | POAS calculation |
| Hashed email from logged-in users | User session | Higher match rates |
| Offline purchase history | POS system | Offline conversion signals |
| Lead quality score | CRM | Lead value optimization |

### Enrichment via Firestore Lookup

In GTM server-side, use the Firestore lookup feature to enrich events with stored customer data:

1. Store customer data in Google Firestore (or any queryable database accessible from the server container)
2. When a purchase event arrives, look up the customer by email or external_id
3. Append customer lifetime value, segment, or margin data to the outgoing event

### Enrichment via Custom API Lookup

For clients with their own APIs, build a custom variable in GTM SS that calls the client's API to retrieve enrichment data. Cache the response to avoid repeated lookups for the same user within a session.

### Cookie Enrichment from Server-Side

The server-side container can set first-party cookies on the response. This is critical because server-set cookies survive ITP (Safari treats them as true first-party, not JavaScript-set cookies which are capped at 7 days).

```
// In GTM SS, use the setCookie API
const setCookie = require("setCookie");

setCookie("_fpid", generateUniqueId(), {
  domain: "yourdomain.com",
  path: "/",
  "max-age": 63072000,  // 2 years
  secure: true,
  httpOnly: true,
  sameSite: "lax"
});
```

Server-set cookies with httpOnly flag cannot be read by JavaScript (additional security) but are automatically sent with every request to the server-side container, which is exactly what is needed.

---

## Server-Side Consent Handling

### How Consent Flows to the Server Container

1. User interacts with the cookie consent banner on the client side
2. Client-side GTM updates consent state (granted or denied)
3. When events are sent to the server-side container, the consent state is included in the request
4. Server-side tags can read consent state and conditionally fire or suppress

### Configuring Consent in GTM Server-Side

In the server-side container:

1. The GA4 client automatically reads consent state from incoming requests
2. Tags can be configured with built-in consent checks
3. If a user has not granted consent, marketing tags (Meta CAPI, TikTok Events API) should not fire
4. Analytics tags (GA4) can fire with consent mode modeling if analytics_storage is granted

### Consent State Forwarding

When using the GA4 transport from client to server, consent signals are forwarded automatically if the client-side container has Consent Mode configured. The server-side GA4 client will parse the consent state from the request and make it available to all server-side tags.

If you are using a custom transport (not GA4), you must manually include consent state as a parameter in the request and build custom logic in the server-side container to read and enforce it.

### Regional Consent Logic

For clients with global traffic:

- EU visitors: full consent required before any marketing tags fire (GDPR)
- US visitors (California, Colorado, Connecticut, Virginia, etc.): opt-out model in most states, but trending toward opt-in
- Canada: PIPEDA requires meaningful consent
- Rest of world: follow local requirements, default to the most restrictive applicable law

The server-side container should respect the same consent decisions as the client-side container. Never bypass consent on the server side just because it is technically possible.

---

## Implementation Checklist

### For Meta Conversions API via GTM SS:
- [ ] Access token generated from a system user in Business Manager (not personal account)
- [ ] Pixel ID confirmed and entered in tag configuration
- [ ] Server events include: event_name, event_time, event_source_url, action_source set to "website"
- [ ] User data parameters mapped: em, ph, fn, ln, external_id, client_ip_address, client_user_agent
- [ ] FBC and FBP cookie values captured client-side and forwarded to server
- [ ] event_id matches between browser pixel and CAPI (deduplication verified)
- [ ] Test events visible in Events Manager > Test Events tab
- [ ] Event Match Quality score checked (target: 7+)
- [ ] Deduplication verified: total events should not be double the expected count

### For Google Enhanced Conversions via GTM SS:
- [ ] Enhanced conversions enabled in Google Ads conversion settings
- [ ] User-provided data sent with conversion tag (email at minimum, phone and name preferred)
- [ ] For lead gen: GCLID captured from landing page, stored in CRM, included in server event
- [ ] Transaction ID set for purchase conversion deduplication
- [ ] Conversion linker tag running in the server container

### For TikTok Events API via GTM SS:
- [ ] Access token from TikTok Business Center (not expired)
- [ ] Pixel code confirmed
- [ ] Events include context: IP, user agent, page URL
- [ ] User data: hashed email, hashed phone, external_id
- [ ] event_id for deduplication with browser pixel
- [ ] ttclid captured from landing page URL and forwarded
- [ ] Test events verified in TikTok Events Manager

### Infrastructure:
- [ ] Stape container sized appropriately for traffic volume
- [ ] Custom domain configured (sgtm.yourdomain.com) with valid SSL
- [ ] Health alerts configured in Stape dashboard
- [ ] Monthly health check scheduled
- [ ] Access tokens documented with expiration dates
- [ ] Consent handling verified for all applicable regions

---

## Signal Recovery Estimates

| Scenario | Browser Only | With Server-Side | Recovery |
|----------|-------------|------------------|----------|
| Safari users | ~40% tracked | ~85% tracked | +45% |
| Firefox users | ~50% tracked | ~90% tracked | +40% |
| Ad blocker users | ~0% tracked | ~80% tracked | +80% |
| Cross-device | ~30% matched | ~60% matched | +30% |
| Overall | ~60% tracked | ~85% tracked | +25% |

These recoveries directly translate to more conversion data for platform algorithms, improving optimization and reducing CPAs. For a client spending $50,000/month with a 25% signal recovery improvement, this can mean the difference between a campaign that optimizes effectively and one that struggles with limited data.
