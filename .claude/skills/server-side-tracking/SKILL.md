---
name: server-side-tracking
description: GTM Server-Side, Stape.io, click ID persistence, event deduplication, first-party data enrichment, consent handling, and failure mode troubleshooting. Use whenever someone mentions Stape, SGTM, server container, server-side tagging, first-party cookies, click ID loss, event deduplication, or server-side tracking not working.
model: sonnet
allowed-tools: Read, Grep, Glob
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

Click IDs are the most important signal for attributing conversions to ad clicks.

| Platform | Parameter | Cookie | Example |
|---|---|---|---|
| Google Ads | gclid | _gcl_aw | EAIaIQobChMI... |
| Meta Ads | fbclid | _fbc | fb.1.169999.AbCd |
| TikTok Ads | ttclid | ttclid | E.C.P... |
| Microsoft Ads | msclkid | _uetmsclkid | abc123def |

Capture script runs on every page (ES5, GTM Custom HTML). Store in cookies with 90-day expiry. Build _fbc from fbclid. Generate _fbp if Meta Pixel blocked. Persist through forms via hidden fields. Forward through redirects via URL params or cookies.

For complete capture scripts (ES5), _fbc/_fbp generation, form hidden field code, and redirect forwarding, read references/click-id-code.md

---

## Event Deduplication

When running pixel + CAPI in parallel (OFM standard), both fire for each event. Dedup via matching event_id prevents double-counting.

1. Browser fires pixel event with event_id
2. Server fires CAPI event with same event_id
3. Platform matches and counts once

**Generating event_id:** Unique per action, deterministic, generated before either fires.

**Sharing methods:** DataLayer push (GTM standard), hidden field on confirmation page, or transaction_id as event_id for purchases.

| Platform | Client Param | Server Param | Window |
|---|---|---|---|
| Meta | eventID (options) | event_id (payload) | 48 hours |
| TikTok | event_id (options) | event_id (payload) | 48 hours |
| Google | transaction_id | transaction_id | 24 hours |

For event_id generation code, sharing patterns, and platform specifics, read references/dedup-async-timeout.md

---

## Async vs Sequential & Timeout Logic

Funnel events fire sequentially (natural page flow). Multi-platform events on same page fire in parallel. GTM SS tags fire async by default.

| Event Type | Timeout | Retries | Rationale |
|---|---|---|---|
| Purchase | 10s | 2 | High value |
| Lead/Form | 8s | 1 | Important |
| AddToCart | 5s | 0 | High volume |
| ViewContent | 3s | 0 | Informational |
| PageView | 3s | 0 | Highest volume |

For async firing code, GTM SS retry template, and timeout configuration, read references/dedup-async-timeout.md

---

## Testing & Troubleshooting

**Stape Debug Mode:** Container > Preview > inspect incoming events, outgoing tags, response codes, cookie values.

**GTM SS Preview:** Separate from Stape. Open SS container > Preview > enter tagging server URL.

**Common failures:**
- Events not arriving: check Stape debug > incoming request > tag firing > response code (400=payload, 401=token, 500=API down)
- Duplicate events: missing/mismatched event_id between client and server
- Low EMQ: user data not forwarded, cookies not included in request
- Token expiry: regenerate, update in GTM SS, publish, set quarterly reminder
- Intermittent gaps: container under-provisioned, check CPU/memory in Stape dashboard

For curl test commands, staging approach, and container health metrics, read references/testing-monitoring-consent.md

---

## Stape Container Health

| Metric | Healthy | Action |
|---|---|---|
| Error rate | <1% | Investigate tags |
| CPU | <70% | Upgrade tier |
| Memory | <80% | Upgrade tier |
| Response time | <200ms | Check tag processing |
| Success rate | >98% | Check API health |

Monthly: compare server-side vs client-side event counts. Server should be equal or higher (ad blocker recovery). Check EMQ 7+ in Meta.

For alert config, enrichment patterns, and consent handling, read references/testing-monitoring-consent.md

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
