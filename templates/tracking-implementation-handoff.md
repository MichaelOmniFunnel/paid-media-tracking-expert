# Tracking Implementation Handoff: {CLIENT_NAME}

Prepared by: OmniFunnel Marketing
Date: {DATE}
Version: 1.0

## Overview

Complete tracking implementation specification for {CLIENT_NAME}. Contains everything a developer needs to implement the required tracking changes without additional context.

## Current State

| Component | Status | Notes |
|---|---|---|
| GTM Client Container | | Container ID: |
| GTM Server Container | | Stape container: |
| Google Ads Pixel | | Conversion ID: |
| Meta Pixel | | Pixel ID: |
| TikTok Pixel | | Pixel ID: |
| GA4 | | Measurement ID: |
| Consent Mode | | |

## Implementation Tasks

### Task 1: {Description}

**Priority:** {Critical/High/Medium/Low}
**Estimated effort:** {hours}
**Depends on:** {none or other task}

**What to do:**
{Step by step instructions}

**Code (if applicable):**
```javascript
// ES5 compliant. No const, let, arrow functions, or template literals.
```

**Where to implement:**
{Exact location: GTM tag name, file path, CMS template, etc.}

**How to verify:**
{Specific verification steps the developer can follow}

---

### Task 2: {Description}

{Repeat format for each task}

---

## Testing Checklist

After implementation, verify each item:

- [ ] All conversion events fire on correct pages
- [ ] Event IDs present for deduplication (check browser console for event_id parameter)
- [ ] Server-side events visible in Stape logs
- [ ] Meta Events Manager shows events with EMQ score
- [ ] Google Ads conversion actions show recent data
- [ ] No ES6 syntax in any GTM Custom HTML tag
- [ ] Consent Mode respects user consent state
- [ ] Click IDs (gclid, fbclid) persist through conversion path
- [ ] No duplicate events in any platform
- [ ] Forms, phone numbers, and chat widgets trigger correct events

## Environment Details

- Staging URL:
- Production URL:
- GTM Preview link:
- Access credentials needed: {list what the dev needs access to}

## Contact

Questions about this spec: Michael Tate, OmniFunnel Marketing
