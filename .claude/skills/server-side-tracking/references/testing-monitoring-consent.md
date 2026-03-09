# Testing, Monitoring, Enrichment & Consent

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
