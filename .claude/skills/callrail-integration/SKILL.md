---
name: callrail-integration
description: DNI setup, offline conversion import, CAPI integration, webhook to SGTM, form tracking, multi-touch attribution, and API usage. Use when someone mentions CallRail, call tracking, dynamic number insertion, offline conversions from calls, or phone lead attribution.
disable-model-invocation: true
model: sonnet
allowed-tools: Read, Grep, Glob
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

CallRail captures GCLID from ad click URLs, associates it with phone calls, and sends conversion data back to Google Ads automatically.

**Setup:** CallRail > Settings > Integrations > Google Ads > Connect. Enable auto-tagging. Map events (First-Time Caller, Qualified Call, Form Submission) to Google Ads conversion actions.

**Enhanced Conversions:** Sends hashed email, phone, GCLID, WBRAID, GBRAID when enabled in both systems.

**Critical:** GCLID values are CASE-SENSITIVE. CRM systems that lowercase input will break conversion import.

For setup steps, enhanced conversions code, WBRAID/GBRAID details, and manual backfill instructions, read references/google-meta-code.md

---

## Meta CAPI Integration (Server-Side Call Conversions)

CallRail has no native Meta CAPI integration. Architecture options:

```
CallRail Webhook -> SGTM (Stape) -> Meta CAPI Tag
                -> Custom Server -> Meta Conversions API
                -> Zapier/n8n -> Meta Conversions API
```

Required CAPI fields: event_name "Lead", action_source "phone_call", hashed ph/ct/st, fbc from landing page fbclid.

Filter before sending: minimum 30s duration, answered, inbound, not spam.

For Node.js CAPI handler, call qualification filter, and full payload examples, read references/google-meta-code.md

---

## CallRail Webhook to Server-Side GTM

```
CallRail Post-Call Webhook -> Stape SGTM
  -> Meta CAPI Tag
  -> Google Ads EC Tag
  -> GA4 Measurement Protocol
```

Receive at `/callrail-webhook` via Stape Webhook Client. Map event_name to "phone_call". Trigger conditions: duration > 30, answered, inbound.

For webhook client config, trigger setup, payload mapping, and security, read references/webhook-forms-attribution.md

---

## Form Tracking: CallRail vs. GTM

| Scenario | CallRail | GTM |
|---|---|---|
| Unified call + form attribution | Yes | No |
| Multi-touch attribution with calls | Yes | No |
| Complex form validation | No | Yes |
| Ecommerce checkout | No | Yes |

Recommended: dual tracking with dedup. Use ONE system as primary per platform.

For form setup, dual tracking code, and dedup strategy, read references/webhook-forms-attribution.md

---

## Multi-Touch Attribution

| Model | Distribution | Best For |
|---|---|---|
| First Touch | 100% first | Discovery channels |
| Lead Creation | 100% conversion | Direct response |
| 50/50 | Split | Balanced view |
| W-Shaped | 33% each | Full-funnel |
| Qualified | 100% qualifying | Sales-focused |

Three milestones: First Touch, Lead Creation, Qualified. API provides source/medium/campaign/keyword for each.

For milestone details, API examples, and reporting patterns, read references/webhook-forms-attribution.md

---

## CallRail API

Base URL: `https://api.callrail.com/v3/a/ACCOUNT_ID`
Auth: `Authorization: Token token=YOUR_API_KEY`
Rate: 10 req/sec. Pagination: max 250/page.

Key endpoints: /calls.json, /calls/{id}.json, /calls/summary.json, /form_submissions.json

For API code, endpoint reference, Google Sheets integration, and Looker Studio setup, read references/api-and-troubleshooting.md

---

## Common Issues

1. **DNI breaking click ID capture** - JS loading order, redirect chains, caching plugins, SPA re-init
2. **Call attribution gaps** - Missing GCLID from auto-tagging, redirects, pool exhaustion, cross-device
3. **Spam calls** - Built-in spam detection + custom filters (min 15s, answered, no spam tag)
4. **Count discrepancies** - Google deduplicates per click, uses conversion window, requires valid GCLID
5. **Meta zero calls** - No native integration; must implement CAPI via webhook
6. **Double-counting forms** - Use ONE system primary per platform; deduplicate with event_id

For detailed diagnosis steps and code fixes, read references/api-and-troubleshooting.md

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
