# Webhooks & Troubleshooting

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
