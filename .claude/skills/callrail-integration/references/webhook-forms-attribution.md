# Webhook, Forms & Multi-Touch Attribution

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
