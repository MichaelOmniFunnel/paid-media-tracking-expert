---
name: sgtm-health-monitor
description: Stape.io server-side GTM health monitoring and diagnostics. Checks container metrics, event flow, token expiry, client vs server event parity, and CAPI health. Use when someone mentions 'Stape health', 'SGTM monitoring', 'server container health', 'event parity check', 'CAPI health check', 'server-side not working', or 'check my Stape container'.
model: sonnet
allowed-tools: Read, Grep, Glob, Agent
---
# Stape SGTM Health Monitor

## Purpose

Ongoing health monitoring for Stape.io server-side GTM containers. This is not about implementation (see server-side-tracking skill for that). This is about catching problems before they cost the client data.

## When to Run

- Monthly as part of client health checks
- When a client reports tracking discrepancies
- After any GTM container publish (client or server side)
- After Stape plan changes or infrastructure updates
- When Meta EMQ drops or Google conversion counts decline unexpectedly

## Health Check Sequence

### Check 1: Container Uptime and Error Rate

**Via Chrome browser** (Stape dashboard):
Navigate to the client's Stape dashboard > Container > Overview

| Metric | Healthy | Warning | Critical |
|---|---|---|---|
| Uptime | 99.9%+ | 99-99.9% | Below 99% |
| Error rate | Below 1% | 1-5% | Above 5% |
| Avg response time | Below 200ms | 200-500ms | Above 500ms |
| CPU usage | Below 70% | 70-85% | Above 85% |
| Memory usage | Below 80% | 80-90% | Above 90% |

**If Critical:** Container may need tier upgrade. Check Stape pricing page for current container's request limit. Compare against actual traffic volume.

### Check 2: Event Flow Verification

**Compare client-side vs server-side event counts:**

Use GA4 MCP to pull event counts for the last 7 days:
```
mcp__google-analytics__run_report
  - Dimensions: eventName
  - Metrics: eventCount
  - Date range: last 7 days
```

Then compare with Events Manager data for the same period (via Chrome or Meta MCP).

| Comparison | Healthy | Investigate |
|---|---|---|
| Server events >= Client events | Normal (server catches ad-blocked users) | N/A |
| Server events 80-100% of client | Acceptable | Minor signal loss |
| Server events below 80% of client | Problem | Events not forwarding properly |
| Server events 2x+ client | Problem | Deduplication failure, events double-firing |

### Check 3: Platform-Specific CAPI Health

**Meta Conversions API:**
```
mcp__meta-ads__get_pixels (for each client ad account)
```
Check:
- Event Match Quality (EMQ) score: target 7+, investigate below 6
- Last event received timestamp: should be within last hour
- Event volume trend: compare last 7 days vs previous 7 days
- Deduplication: total events should not be approximately 2x browser-only baseline

**Google Enhanced Conversions:**
```
mcp__google-ads__run_gaql
  Query: SELECT conversion_action.name, conversion_action.status,
         metrics.conversions, metrics.all_conversions
  FROM conversion_action
  WHERE segments.date DURING LAST_7_DAYS
```
Check:
- Conversion actions show data (not zero)
- Enhanced conversions enabled and receiving matched data
- Conversion count stability (no sudden drops)

**TikTok Events API:**
Via Chrome browser > TikTok Events Manager:
- Check event status indicators (green = healthy)
- Event count trend
- Match rate metrics

### Check 4: Token and Credential Expiry

**Inventory all tokens used in server-side tags:**

| Platform | Token Type | Where Stored | Typical Expiry |
|---|---|---|---|
| Meta CAPI | System User Access Token | GTM SS tag config | Never (system user) or 60 days (user token) |
| Google EC | OAuth / API key | GTM SS tag config | Varies, check quarterly |
| TikTok Events API | Access Token | GTM SS tag config | 1 year, then manual refresh |

**Via Chrome browser:** Open GTM server container > Tags > inspect each CAPI/EC tag > verify token is not expired or about to expire.

Set calendar reminders for token refresh dates. A expired token = complete data blackout for that platform with zero warning in ad accounts.

### Check 5: Click ID Persistence

Verify click IDs survive through the full conversion path:

1. Visit client site with ?gclid=test123&fbclid=test456 appended to URL
2. Check cookies: _gcl_aw should contain gclid, _fbc should contain fbclid
3. Navigate through 2-3 pages, verify cookies persist
4. Check if cookies are first-party domain (should be sgtm.clientdomain.com or main domain)
5. Check cookie expiry: should be 90 days for _gcl_aw, 90 days for _fbc

**Common failure:** Stape custom domain SSL certificate expired or misconfigured. First-party cookies revert to third-party (short lifespan, blocked by Safari/Firefox).

### Check 6: Consent Mode Integration

If client has Consent Mode v2 implemented:
1. Load site with consent denied
2. Verify GTM fires tags in "consent granted" vs "consent denied" modes correctly
3. Server container should respect consent signals forwarded from client container
4. Check that conversion modeling is active in Google Ads (Settings > Conversions > includes modeled conversions)

### Check 7: Container Version Alignment

**Client container version vs Server container version:**
- If client container was published recently but server container was not updated to match, new events may not forward correctly
- Check both containers' last publish date
- Verify tag/trigger/variable alignment between client and server

## Output Template

After running the health check, produce a summary:

```
## SGTM Health Check: [Client Name]
Date: [DATE]

### Container Health
- Uptime: [X]%
- Error rate: [X]%
- Response time: [X]ms
- CPU: [X]% | Memory: [X]%
- Status: [Healthy/Warning/Critical]

### Event Flow
- Client-side events (7d): [X]
- Server-side events (7d): [X]
- Parity ratio: [X]%
- Status: [Healthy/Investigating/Problem]

### CAPI Health
- Meta EMQ: [X]/10
- Meta last event: [timestamp]
- Google EC status: [Active/Inactive]
- TikTok Events API: [Active/Inactive]
- Status: [Healthy/Degraded/Down]

### Tokens
- Meta token expires: [date or "never" for system user]
- Google token status: [valid/expiring/expired]
- TikTok token expires: [date]
- Action needed: [None/Refresh X by Y date]

### Click ID Persistence
- GCLID capture: [Pass/Fail]
- FBCLID capture: [Pass/Fail]
- Cookie domain: [first-party/third-party]
- Cookie expiry: [X days]

### Issues Found
[List any issues with severity and recommended action]

### Next Check
Scheduled for: [date, typically 30 days out]
```

## Automated Monitoring (Future State)

When /loop is available, set up recurring health checks:
- Daily: container error rate check (flag if above 5%)
- Weekly: event parity comparison (client vs server counts)
- Monthly: full health check (all 7 checks above)
- Quarterly: token expiry review and refresh

## References

- Implementation guide: .claude/skills/server-side-tracking/SKILL.md
- Container health metrics: .claude/skills/server-side-tracking/references/testing-monitoring-consent.md
- Click ID code: .claude/skills/server-side-tracking/references/click-id-code.md
- Meta tracking: .claude/skills/meta-ads-tracking/SKILL.md
