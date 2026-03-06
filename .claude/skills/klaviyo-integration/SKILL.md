---
name: klaviyo-integration
description: Audience sync to Google, Meta, and TikTok, revenue attribution, server-side event forwarding, ecommerce integrations, and webhook automation. Use when someone mentions Klaviyo, email audience sync, Klaviyo segments to ads, or Klaviyo webhook integration.
disable-model-invocation: true
model: sonnet
---

# Klaviyo Integration for Paid Media & Tracking

## Overview

Klaviyo is the CRM/ESP (Email Service Provider) at the center of the OFM tracking ecosystem. It serves three critical functions for paid media:

1. **Audience Sync** - Push customer segments to ad platforms as custom audiences for targeting, suppression, and lookalike creation
2. **Revenue Attribution** - Track email/SMS-driven revenue vs. ad-driven revenue (and resolve double-counting)
3. **Data Enrichment** - Feed customer lifecycle data back into ad platforms for enhanced conversions and advanced matching

Klaviyo integrates natively with Shopify, WooCommerce, and custom ecommerce, and can sync audiences to Google Ads, Meta Ads, and TikTok Ads.

---

## Audience Sync to Ad Platforms

### How Audience Sync Works

Klaviyo pushes hashed PII (email, phone) from lists and segments to ad platforms. The sync is:
- **One-way** - Klaviyo pushes to platforms; platforms do not push back
- **Hourly** - As profiles are added/removed from segments, changes sync hourly
- **Hashed** - SHA-256 hashing applied before transmission (privacy-compliant)
- **Initial Population** - First sync can take 24-48 hours to populate on the platform side

### Google Ads Audience Sync

```
Setup Path: Klaviyo > Integrations > Google Ads > Connect
```

**Configuration Steps:**
1. Connect Google Ads account via OAuth in Klaviyo
2. Navigate to Lists & Segments
3. Select a segment > Manage Audience Sync > Google Ads
4. Choose "Create new audience" or map to existing Google Ads audience
5. Klaviyo creates a Customer Match list in Google Ads

**Key Behaviors:**
- Minimum 1,000 matched profiles required for Google to activate the audience
- Google may take up to 48 hours to process received data after each sync
- Real-time ongoing sync once initial population completes
- Syncs email and phone number (if available on profile)

**Use Cases for Paid Media:**
- **Suppression**: Exclude existing customers from acquisition campaigns
- **Upsell**: Target repeat buyers with higher-AOV products
- **Winback**: Re-engage lapsed customers via Search/Display/YouTube
- **Similar Audiences**: Seed high-LTV segments for Google's similar audience modeling

### Meta Ads Audience Sync

```
Setup Path: Klaviyo > Integrations > Facebook/Meta > Connect
```

**Configuration Steps:**
1. Connect Meta Business account via OAuth
2. Select Ad Account to sync audiences into
3. Navigate to segment > Manage Audience Sync > Meta
4. Choose "Create new audience" or connect to existing Custom Audience

**Key Behaviors:**
- Custom audiences update hourly as segment membership changes
- Meta can take 24-48 hours to fully process audience updates
- Supports Lookalike Audience creation from synced Custom Audiences
- Email and phone hashed with SHA-256 before transmission

**Strategic Audience Sync Patterns:**

```javascript
// Example: Segment definitions for common paid media use cases

// HIGH-VALUE SUPPRESSION SEGMENT
// Definition in Klaviyo:
// "Placed Order at least 3 times in last 90 days"
// AND "Average Order Value is at least $100"
// Sync to: Meta + Google as suppression list

// WINBACK SEGMENT
// Definition in Klaviyo:
// "Placed Order at least once over all time"
// AND "Placed Order zero times in last 180 days"
// Sync to: Meta + Google for re-engagement campaigns

// LOOKALIKE SEED SEGMENT
// Definition in Klaviyo:
// "Customer Lifetime Value is at least $500"
// AND "Placed Order at least 2 times in last 365 days"
// Sync to: Meta for 1% Lookalike, Google for Similar Audiences

// CART ABANDONER SEGMENT (cross-channel retargeting)
// Definition in Klaviyo:
// "Started Checkout at least once in last 7 days"
// AND "Placed Order zero times in last 7 days"
// Sync to: Meta + Google for retargeting alongside email flows
```

### TikTok Ads Audience Sync

TikTok audience sync works via Klaviyo's integration (available on Klaviyo's higher-tier plans):
1. Connect TikTok Ads Manager via OAuth
2. Select segment to sync
3. TikTok creates a Custom Audience from hashed email/phone data

**Note:** TikTok match rates tend to be lower than Meta/Google due to smaller user-email overlap. Phone number matching is often stronger on TikTok.

---

## Revenue Attribution: Klaviyo vs. Ad Platforms

### The Double-Counting Problem

Every attribution system claims credit for conversions within its window:

| Platform | Default Attribution Window |
|----------|---------------------------|
| Klaviyo | 5-day email open, 1-day email click, 24hr SMS click |
| Google Ads | 30-day click, 1-day view (varies by campaign type) |
| Meta Ads | 7-day click, 1-day view |
| TikTok Ads | 7-day click, 1-day view |

**Example Overlap Scenario:**
1. User clicks Google Ads on Day 1 (Google claims attribution for 30 days)
2. User receives Klaviyo email on Day 3, opens it (Klaviyo claims attribution for 5 days)
3. User purchases on Day 4
4. **Result:** Both Google Ads AND Klaviyo report the same revenue

### Resolution Strategy

```javascript
// APPROACH 1: Last-click deduplication via UTM analysis
// Pull Klaviyo's "Placed Order" events and check the
// "$attributed_message" vs the referring UTM source

// In Klaviyo's Placed Order event, check these properties:
// $attributed_message.campaign_name - the Klaviyo campaign
// $attributed_message.message - the specific email/SMS
// $source - the acquisition source (e.g., "Google Ads")

// APPROACH 2: Blended ROAS calculation
// Total Revenue / Total Ad Spend across all platforms
// This avoids double-counting entirely by using ONE revenue source
// Revenue source: Shopify/WooCommerce (single source of truth)

// APPROACH 3: Platform-reported with Klaviyo holdout
// Subtract Klaviyo-attributed revenue from total when it overlaps
// with a paid media attribution window
```

**OFM Standard Practice:**
- Use **Shopify/WooCommerce** as the single source of truth for total revenue
- Use **platform-reported conversions** for campaign optimization (let algorithms use their own data)
- Use **Klaviyo-reported revenue** for email/SMS program performance measurement
- Calculate **blended ROAS** (Total Shopify Revenue / Total Ad Spend) as the north star metric
- Never sum platform-reported revenues as they will exceed actual revenue by 20-60%

---

## Klaviyo API Integration

### Create Event (Server-Side Event Tracking)

```javascript
// POST https://a.klaviyo.com/api/events
// Server-side event creation using Klaviyo's revision 2024-02-15+ API

var https = require('https');

function sendKlaviyoEvent(apiKey, eventData) {
  var payload = JSON.stringify({
    data: {
      type: 'event',
      attributes: {
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: eventData.eventName
            }
          }
        },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: eventData.email,
              phone_number: eventData.phone,
              first_name: eventData.firstName,
              last_name: eventData.lastName,
              properties: {
                source: eventData.source || 'website'
              }
            }
          }
        },
        properties: eventData.properties || {},
        value: eventData.value || 0,
        time: eventData.time || new Date().toISOString(),
        unique_id: eventData.uniqueId || null
      }
    }
  });

  var options = {
    hostname: 'a.klaviyo.com',
    path: '/api/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Klaviyo-API-Key ' + apiKey,
      'revision': '2024-10-15',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      if (res.statusCode === 202) {
        console.log('Event created successfully');
      } else {
        console.error('Error: ' + res.statusCode + ' - ' + body);
      }
    });
  });

  req.on('error', function(err) {
    console.error('Request error: ' + err.message);
  });

  req.write(payload);
  req.end();
}

// Usage: Track a purchase event
sendKlaviyoEvent('pk_your_private_api_key', {
  eventName: 'Placed Order',
  email: 'customer@example.com',
  phone: '+15551234567',
  firstName: 'John',
  lastName: 'Doe',
  value: 149.99,
  properties: {
    OrderId: 'ORD-12345',
    Items: [
      { ProductName: 'Widget', SKU: 'WDG-001', Quantity: 2, Price: 49.99 },
      { ProductName: 'Gadget', SKU: 'GDG-002', Quantity: 1, Price: 50.01 }
    ],
    Source: 'google_ads',
    GCLID: 'abc123def456'
  }
});
```

### Client-Side Event Tracking

```javascript
// Client-side tracking using Klaviyo's JavaScript SDK
// This fires from the browser - subject to ad blockers and ITP

// Identify a user (call after login, form submit, or purchase)
var _learnq = window._learnq || [];
_learnq.push(['identify', {
  '$email': 'customer@example.com',
  '$first_name': 'John',
  '$last_name': 'Doe',
  '$phone_number': '+15551234567',
  'Source': 'paid_search',
  'GCLID': getUrlParam('gclid') || getCookie('_gcl_aw'),
  'FBCLID': getUrlParam('fbclid') || getCookie('_fbc')
}]);

// Track a custom event
_learnq.push(['track', 'Started Checkout', {
  '$value': 149.99,
  'ItemCount': 3,
  'CheckoutURL': window.location.href
}]);

// Helper: Extract URL parameter
function getUrlParam(param) {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || '';
}

// Helper: Read cookie value
function getCookie(name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
```

**Rate Limits (Server-Side API):**
- Burst: 350 requests/second
- Steady: 3,500 requests/minute
- Use batch endpoints for bulk operations

---

## Enhanced Conversions & Advanced Matching with Klaviyo Data

### Feeding Klaviyo Data to Google Enhanced Conversions

Klaviyo profile data can enrich Google's Enhanced Conversions by providing hashed PII on the conversion event:

```javascript
// In GTM or server-side GTM: enrich purchase dataLayer with Klaviyo profile data
// This improves Google's ability to match conversions to ad clicks

// dataLayer push on purchase confirmation page
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'purchase',
  'transaction_id': 'ORD-12345',
  'value': 149.99,
  'currency': 'USD',
  // Enhanced conversion data (from Klaviyo profile or checkout form)
  'user_data': {
    'email': 'customer@example.com',       // or SHA-256 hash
    'phone_number': '+15551234567',         // or SHA-256 hash
    'address': {
      'first_name': 'John',
      'last_name': 'Doe',
      'street': '123 Main St',
      'city': 'Austin',
      'region': 'TX',
      'postal_code': '78701',
      'country': 'US'
    }
  }
});
```

### Feeding Klaviyo Data to Meta Advanced Matching

```javascript
// Initialize Meta Pixel with Advanced Matching using Klaviyo profile data
// This dramatically improves Event Match Quality (target: 7+)

fbq('init', 'PIXEL_ID', {
  em: 'customer@example.com',     // email (auto-hashed by pixel)
  ph: '15551234567',              // phone (auto-hashed by pixel)
  fn: 'john',                     // first name (auto-hashed)
  ln: 'doe',                      // last name (auto-hashed)
  ct: 'austin',                   // city
  st: 'tx',                       // state
  zp: '78701',                    // zip
  country: 'us',                  // country
  external_id: 'klav_abc123'      // Klaviyo profile ID as external_id
});
```

---

## Klaviyo Flow Triggers from Ad Conversion Events

### Triggering Flows from Ad-Driven Actions

Klaviyo flows can be triggered by events that originate from ad clicks:

```javascript
// Example: Server-side event that triggers a Klaviyo flow
// When a lead comes from Google Ads, send them into a nurture sequence

// POST to Klaviyo API when form is submitted with GCLID present
sendKlaviyoEvent('pk_your_private_api_key', {
  eventName: 'Ad Lead Captured',
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
  value: 0,
  properties: {
    'Source': 'google_ads',
    'Campaign': utmData.campaign,
    'AdGroup': utmData.adGroup,
    'Keyword': utmData.keyword,
    'GCLID': utmData.gclid,
    'LandingPage': utmData.landingPage,
    'FormName': formData.formName
  }
});

// In Klaviyo, create a flow triggered by "Ad Lead Captured" metric
// Flow can branch based on Source property:
//   - Google Ads leads -> send specific nurture sequence
//   - Meta Ads leads -> send different creative sequence
//   - TikTok leads -> send mobile-optimized sequence
```

### Webhook Actions in Flows

Klaviyo flows can include webhook actions that POST data to external endpoints:

```javascript
// Klaviyo Flow Webhook Configuration
// Action: Webhook in a flow step
// URL: https://sgtm.yourdomain.com/klaviyo-webhook
// Method: POST
// Headers: Content-Type: application/json

// The webhook sends profile and event data to your server-side GTM
// This enables feeding Klaviyo engagement data BACK to ad platforms

// Example: When a Klaviyo email drives a purchase, notify SGTM
// so it can fire enhanced conversion events to Google/Meta

// Webhook payload template (configured in Klaviyo):
// {
//   "email": "{{ person.email }}",
//   "phone": "{{ person.phone_number }}",
//   "first_name": "{{ person.first_name }}",
//   "last_name": "{{ person.last_name }}",
//   "event_name": "{{ event.name }}",
//   "order_value": "{{ event.value }}",
//   "order_id": "{{ event.OrderId }}",
//   "klaviyo_profile_id": "{{ person.id }}"
// }
```

**Webhook Limitations:**
- Maximum 10 webhooks per Klaviyo account (system webhooks)
- Flow webhooks do not count against this limit
- Webhooks may take up to 3 minutes to begin forwarding after creation
- HMAC-SHA256 signing available for payload verification

---

## Ecommerce Platform Integrations

### Shopify + Klaviyo

**Native Integration Features:**
- Real-time event sync for: Active on Site, Viewed Product, Added to Cart, Started Checkout, Placed Order, Ordered Product, Fulfilled Order, Cancelled Order, Refunded Order
- Automatic catalog sync for product recommendations
- Back-in-stock flow triggers
- Customer property sync (total spent, order count, tags)

**Key Events for Paid Media:**

| Klaviyo Event | Trigger | Value Field | Use in Paid Media |
|---------------|---------|-------------|-------------------|
| Placed Order | Checkout complete | Order total | Revenue attribution |
| Started Checkout | Checkout initiated | Cart value | Retargeting audiences |
| Added to Cart | Cart action | Item price | Retargeting audiences |
| Viewed Product | Product page view | Product price | Prospecting signals |

**Placed Order Event Properties (Shopify):**
```javascript
// Shopify Placed Order event properties available in Klaviyo:
// $value - order total (used for revenue metrics)
// OrderId - Shopify order ID
// Categories - product categories
// ItemNames - array of product names
// Items - array of line item objects with:
//   ProductName, SKU, Quantity, ItemPrice, RowTotal, ProductURL, ImageURL
// Tags - Shopify order tags
// DiscountCodes - applied discount codes
// DiscountValue - total discount amount
// SourceName - "web", "pos", "shopify_draft_order", etc.
```

### WooCommerce + Klaviyo

**Integration Notes:**
- Placed Order fires when WooCommerce order status = "processing"
- Custom order statuses may not trigger Placed Order (common issue)
- Real-time sync for orders, checkout, and product views
- Requires Klaviyo WooCommerce plugin installed and activated

**Common WooCommerce Issues:**
- Payment gateway order status mapping (some gateways use "on-hold" instead of "processing")
- Caching plugins (WP Rocket, W3 Total Cache) can interfere with Klaviyo's JavaScript tracking
- If using server-side tracking via Stape, ensure events are not double-fired from both plugin and SGTM

### Custom Ecommerce (Headless / Custom Platforms)

For non-Shopify/WooCommerce stores, use the Klaviyo API directly:

```javascript
// Server-side integration for custom ecommerce
// Call this from your order processing backend

function trackPurchaseToKlaviyo(orderData) {
  var items = [];
  for (var i = 0; i < orderData.lineItems.length; i++) {
    var item = orderData.lineItems[i];
    items.push({
      ProductName: item.name,
      SKU: item.sku,
      Quantity: item.quantity,
      ItemPrice: item.price,
      RowTotal: item.price * item.quantity,
      ProductURL: item.url,
      ImageURL: item.imageUrl,
      Categories: item.categories
    });
  }

  sendKlaviyoEvent('pk_your_private_api_key', {
    eventName: 'Placed Order',
    email: orderData.customerEmail,
    phone: orderData.customerPhone,
    firstName: orderData.firstName,
    lastName: orderData.lastName,
    value: orderData.orderTotal,
    uniqueId: orderData.orderId,
    properties: {
      OrderId: orderData.orderId,
      Categories: orderData.categories,
      ItemNames: orderData.itemNames,
      Items: items,
      DiscountCodes: orderData.discountCodes || [],
      DiscountValue: orderData.discountTotal || 0,
      Source: orderData.trafficSource || 'direct'
    }
  });
}
```

---

## Server-Side Event Forwarding via Stape + GTM SS

### Architecture: Klaviyo Tag in Server-Side GTM

```
Browser -> GTM Web Container -> GTM Server Container (Stape) -> Klaviyo API
                                     |-> Google Ads API
                                     |-> Meta CAPI
                                     |-> TikTok Events API
```

### Stape Klaviyo Tag Setup

1. In your server GTM container, add the **Klaviyo tag** from the Template Gallery
2. Configure the tag:
   - **Klaviyo Public API Key**: Your site's public key (starts with site_)
   - **Action Type**: "Event" (for tracking), "Active on Site" (for page views), "Add to List", or "Create/Update Profile"
   - **Contact Email**: Map from event data variable
   - **Event Name**: Map to the event name (e.g., "Placed Order")
   - **Event Properties**: Map individual properties or pass entire event object

3. **Trigger**: Fire on the appropriate server-side event (e.g., purchase event from GA4 client)

### Server-Side Tracking Benefits for Klaviyo

- **Bypass ad blockers**: Klaviyo's client-side JS is blocked by many ad blockers
- **First-party cookies**: Store Klaviyo's exchange_id in a first-party cookie set by your server
- **Data enrichment**: Add server-side data (CRM fields, lead scores) before sending to Klaviyo
- **Single event source**: One browser event fans out to Klaviyo + Google + Meta + TikTok

### Email Cookie Persistence

```javascript
// Server-side GTM: Store email in first-party cookie for Klaviyo
// When a user identifies themselves (form, login, purchase),
// store their email in a server-set cookie for future page views

// In server-side GTM, use the Klaviyo tag's built-in option:
// "Store email in cookies" = enabled
// This allows the tag to use the stored email on subsequent
// page views even when the user is not actively identified

// Cookie name: _klav_email (set by server GTM)
// Duration: 365 days (configurable)
// Domain: your first-party domain
```

---

## Klaviyo Webhooks for System Integration

### System Webhook Topics

Klaviyo supports subscribing to these webhook topics:

| Topic | Description | Paid Media Use Case |
|-------|-------------|---------------------|
| profile.created | New profile added | Trigger welcome ad sequence |
| profile.updated | Profile data changed | Update audience membership |
| flow.message.sent | Flow email/SMS sent | Attribution tracking |
| campaign.message.sent | Campaign sent | Suppress from ads |
| subscription.created | Email/SMS opt-in | Add to ad audiences |
| subscription.deleted | Unsubscribed | Suppression lists |

### Webhook Security

```javascript
// Verify Klaviyo webhook signatures (HMAC-SHA256)
var crypto = require('crypto');

function verifyKlaviyoWebhook(payload, signature, secret) {
  var expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
// var isValid = verifyKlaviyoWebhook(
//   req.rawBody,
//   req.headers['x-klaviyo-signature'],
//   'your_webhook_secret'
// );
```

---

## Common Issues & Troubleshooting

### 1. Audience Sync Not Updating

**Symptoms:** Profiles added to Klaviyo segment but not appearing in Google/Meta audience.

**Diagnosis:**
- Check that the integration is still authorized (OAuth tokens can expire)
- Verify segment has > 1,000 members (Google minimum)
- Check Klaviyo's sync status in Lists & Segments > [Segment] > Audience Sync
- Allow 24-48 hours for initial population
- Ongoing syncs are hourly; check if enough time has passed

### 2. Revenue Double-Counting

**Symptoms:** Sum of Google Ads + Meta Ads + Klaviyo revenue exceeds Shopify revenue.

**Resolution:**
- Accept that every platform will over-report by 20-60%
- Use Shopify as single source of truth for total revenue
- Calculate blended ROAS: Total Revenue / Total Ad Spend
- Do NOT reduce platform-reported conversions for optimization; let algorithms use their own attribution
- Report Klaviyo revenue separately as "email/SMS program performance"

### 3. Klaviyo JS Blocked by Ad Blockers

**Symptoms:** Klaviyo identify/track calls not firing for 30-40% of users.

**Resolution:**
- Implement server-side tracking via Stape/GTM SS
- Proxy Klaviyo's tracking endpoint through your first-party domain
- Use server-side API for critical events (purchases, leads)
- Client-side tracking for nice-to-have events (product views, page views)

### 4. List Sync Delays Impacting Suppression

**Symptoms:** Recent purchasers still seeing acquisition ads.

**Resolution:**
- Klaviyo syncs hourly, but platform processing adds 24-48 hours
- For time-sensitive suppression, use platform-native purchase events (Meta CAPI, Google Enhanced Conversions) in addition to Klaviyo audience sync
- Audience sync is best for strategic segmentation, NOT real-time suppression

### 5. WooCommerce Orders Not Tracking

**Symptoms:** Placed Order events missing in Klaviyo for WooCommerce store.

**Resolution:**
- Verify order status is "processing" (not "on-hold" or custom status)
- Check that Klaviyo WooCommerce plugin is active and up to date
- Verify API keys in plugin settings
- Check for caching plugin conflicts (WP Rocket, W3TC)
- If using server-side GTM, ensure events are not duplicated between plugin and SGTM

### 6. Attribution Window Conflicts

**Symptoms:** Klaviyo claims credit for purchases that were clearly ad-driven.

**Resolution:**
- Klaviyo default windows: 5-day email open, 1-day email click, 24hr SMS
- These can overlap with Google's 30-day click window and Meta's 7-day click window
- Consider narrowing Klaviyo's attribution window to "last click only" for reporting
- Use UTM parameters on all Klaviyo emails to distinguish email traffic in analytics

---

## Integration Architecture Summary

```
                    +------------------+
                    |    SHOPIFY /      |
                    |  WOOCOMMERCE     |
                    +--------+---------+
                             |
              Real-time event sync (orders, carts, products)
                             |
                    +--------v---------+
                    |     KLAVIYO      |
                    |  (CRM / ESP)     |
                    +---+----+----+----+
                        |    |    |
           +------------+    |    +------------+
           |                 |                 |
    Audience Sync      Webhooks/API      Email/SMS Flows
    (hourly, hashed)   (real-time)       (trigger-based)
           |                 |                 |
    +------v------+  +------v-------+  +------v------+
    | Google Ads  |  | Server GTM   |  | Customer    |
    | Meta Ads    |  | (Stape)      |  | Engagement  |
    | TikTok Ads  |  +--------------+  +-------------+
    +-------------+
    Custom Audiences,
    Suppression Lists,
    Lookalike Seeds
```

---

## Quick Reference: Klaviyo API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/events | POST | Create tracking event |
| /api/profiles | POST | Create or update profile |
| /api/lists | GET | List all lists |
| /api/segments | GET | List all segments |
| /api/lists/{id}/relationships/profiles | POST | Add profiles to list |
| /api/campaigns | GET | List campaigns |
| /api/flows | GET | List flows |
| /api/metrics | GET | List metrics (event types) |
| /api/reporting | POST | Query campaign/flow performance |

**Authentication:** All API requests require the header:
```
Authorization: Klaviyo-API-Key pk_your_private_key
revision: 2024-10-15
```

**Public vs Private Key:**
- Public key (site_xxx): Client-side tracking only (identify, track)
- Private key (pk_xxx): Server-side API access (profiles, lists, segments, reporting)
- Never expose private keys in client-side code
