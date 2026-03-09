---
name: klaviyo-integration
description: Audience sync to Google, Meta, and TikTok, revenue attribution, server-side event forwarding, ecommerce integrations, and webhook automation. Use when someone mentions Klaviyo, email audience sync, Klaviyo segments to ads, or Klaviyo webhook integration.
disable-model-invocation: true
model: sonnet
allowed-tools: Read, Grep, Glob
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

**Server-side event tracking:** POST to `https://a.klaviyo.com/api/events` with Klaviyo-API-Key header and revision header.

**Client-side:** `_learnq.push(["identify", {...}])` and `_learnq.push(["track", "Event", {...}])`. Subject to ad blockers.

**Rate limits:** Burst 350 req/sec, steady 3,500 req/min. Use batch endpoints for bulk operations.

For complete API code (server-side event creation, client-side tracking, payload examples), read references/api-and-enhanced-conversions.md

---

## Enhanced Conversions & Advanced Matching

Klaviyo profile data enriches Google Enhanced Conversions and Meta Advanced Matching:

**Google:** Push user_data (email, phone, address) in purchase dataLayer event. Improves conversion-to-click matching.

**Meta:** Initialize pixel with Advanced Matching fields (em, ph, fn, ln, ct, st, zp, country, external_id using Klaviyo profile ID). Target EMQ 7+.

For dataLayer push examples and Meta pixel init code, read references/api-and-enhanced-conversions.md

---

## Klaviyo Flow Triggers from Ad Events

Send "Ad Lead Captured" event to Klaviyo API when form submitted with GCLID. Include source, campaign, keyword. Flow can branch by source property for platform-specific nurture sequences.

**Flow webhooks:** POST profile + event data to SGTM endpoint. Enables feeding Klaviyo engagement data back to ad platforms. HMAC-SHA256 signing available.

For flow trigger code and webhook payload templates, read references/flows-ecommerce-serverside.md

---

## Ecommerce Platform Integrations

**Shopify:** Native real-time sync (Placed Order, Started Checkout, Added to Cart, Viewed Product, Fulfilled, Cancelled, Refunded). Auto catalog sync.

**WooCommerce:** Plugin-based. Placed Order fires on "processing" status. Watch for payment gateway status mapping, caching plugin conflicts, and SGTM double-fire.

**Custom/Headless:** Use Klaviyo API directly. Send Placed Order with Items array (ProductName, SKU, Quantity, ItemPrice, RowTotal, ProductURL, ImageURL).

For Shopify event properties, WooCommerce troubleshooting, and custom integration code, read references/flows-ecommerce-serverside.md

---

## Server-Side Event Forwarding via Stape

```
Browser -> GTM Web -> GTM SS (Stape) -> Klaviyo API
                                    -> Google Ads
                                    -> Meta CAPI
                                    -> TikTok Events API
```

Add Klaviyo tag from Stape Template Gallery. Configure: public key, action type, contact email, event name, properties. Bypasses ad blockers, enables first-party cookies, single event fans out to all platforms.

For Stape Klaviyo tag setup and email cookie persistence, read references/flows-ecommerce-serverside.md

---

## Common Issues

1. **Audience sync not updating** - Check OAuth, segment size (>1,000 for Google), allow 24-48h
2. **Revenue double-counting** - Use Shopify as truth, blended ROAS, report Klaviyo email revenue separately
3. **JS blocked by ad blockers** - Implement server-side via Stape, proxy through first-party domain
4. **Suppression delays** - Sync is hourly + 24-48h platform processing. Use CAPI for real-time suppression
5. **WooCommerce missing orders** - Check order status mapping, plugin version, caching conflicts
6. **Attribution window conflicts** - Klaviyo 5-day open overlaps Google 30-day click. Consider last-click only for reporting

For detailed diagnosis and resolution steps, read references/webhooks-and-troubleshooting.md

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
