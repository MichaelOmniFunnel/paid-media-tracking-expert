---
name: tiktok-ads-tracking
description: Implementation reference for TikTok Pixel, Events API, Advanced Matching, Catalog and Shop integration, Spark Ads tracking, and Smart+ campaigns. Use when someone mentions TikTok Pixel, TikTok Events API, TikTok tracking, TikTok Shop, or TikTok not tracking conversions.
model: sonnet
allowed-tools: Read, Grep, Glob
---

# TikTok Ads Tracking Implementation

## Event Name Mapping

TikTok uses different event names than Meta and Google. Case sensitivity matters.

| User Action | TikTok Event | Meta Event | GA4 Event |
|-------------|-------------|------------|-----------|
| View a product | ViewContent | ViewContent | view_item |
| Add to cart | AddToCart | AddToCart | add_to_cart |
| Start checkout | PlaceAnOrder | InitiateCheckout | begin_checkout |
| Complete purchase | CompletePayment | Purchase | purchase |
| Submit a lead form | SubmitForm | Lead | generate_lead |
| Create an account | CompleteRegistration | CompleteRegistration | sign_up |
| Subscribe | Subscribe | Subscribe | N/A (custom) |
| Search | Search | Search | search |
| Add to wishlist | AddToWishlist | AddToWishlist | add_to_wishlist |

For pixel base code, all standard event code examples, and Advanced Matching code, read references/pixel-code-examples.md

---

## Advanced Matching

Advanced Matching sends hashed user data with pixel events to improve match rates. TikTok accepts plaintext (auto-hashes) or pre-hashed SHA-256.

Key rules:
- Call identify() before any track() events in the same page session
- Phone numbers must include country code
- Email addresses must be lowercase and trimmed before hashing

---

## TikTok Events API (Server-Side)

### Key Architecture Points

- The Events API sends server-side events to complement browser pixel data
- All user data fields must be SHA-256 hashed (the API does NOT auto-hash like the browser pixel)
- The event_id must match between browser pixel and Events API for deduplication (48 hour window)
- The ttclid parameter must be captured from landing page URLs and passed in context.ad.callback

For full API request structure, all matching fields, and payload examples, read references/events-api-payloads.md

---

## TikTok Catalog and Shop Integration

### Critical Rule

The content_id in pixel events must exactly match the sku_id in the product feed. This is the single most common failure point in TikTok catalog ads.

For complete feed requirements, audience targeting details, and TikTok Shop considerations, read references/catalog-and-audiences.md

---

## Spark Ads Tracking Considerations

### How Spark Ads Attribution Works

- Spark Ads use the advertiser's pixel for conversion tracking, not the creator's
- When a user clicks a Spark Ad CTA, they land on the advertiser's website with ttclid attached
- In-app engagement is attributed to the campaign but does not trigger website pixel events
- Video views are tracked within TikTok analytics, not via the website pixel

### Tracking Setup for Spark Ads

1. Ensure the pixel is installed on the advertiser's landing page
2. ttclid capture must be working
3. Events API should be running server-side for conversion recovery
4. Separate Spark Ads into their own campaign/ad group to isolate performance

### Creator Collaboration Tracking

Creators provide an authorization code for the Spark Ad. All paid metrics appear in the advertiser's Ads Manager. Organic metrics appear in both dashboards. Separate organic engagement lift from paid conversion performance.

### UTM Strategy for Spark Ads

```
utm_source=tiktok
utm_medium=paid_social
utm_campaign={{campaign_name}}
utm_content=spark_{{creator_handle}}_{{post_id}}
```

---

## Conversion Window Optimization

### TikTok Attribution Windows

- Click attribution: 1 day, 7 days (default), 14 days, 28 days
- View-through attribution: off, 1 day (default), 7 days

### When to Adjust

**Shorter click windows (1 or 7 day):** Impulse buys, aligning with GA4, TikTok over-claiming

**Longer click windows (14 or 28 day):** High-ticket items, B2B, TikTok under-reporting

**View-through:** Can inflate reported conversions since video completion rates are high. OFM default: 7 day click / 1 day view for ecommerce, 7 day click / off for lead gen.

---

## Creative Performance Metrics

### Key Metrics

| Metric | Good Benchmark | What It Tells You |
|--------|----------------|-------------------|
| Thumb-stop rate | Above 25% | First frame captures attention |
| Average watch time | Above 5 seconds | Hook works beyond first frame |
| Video completion rate | Above 15% for 15s, above 5% for 60s | Full message lands |
| 2-second view rate | Above 40% | Quick hook quality filter |
| 6-second view rate | Above 20% | Mid-point engagement |
| CTR (all clicks) | Above 1.5% | Total engagement |
| CTR (destination) | Above 0.8% | Traffic quality |
| Engagement rate | Above 3% | Content resonance |
| Share rate | Above 0.5% | Organic amplification potential |

### Creative Fatigue Indicators

- CTR declining week over week while frequency increases
- Average watch time dropping below 3 seconds
- CPM increasing without seasonal explanation
- Engagement rate declining below 1%
- Frequency above 4.0 on the same audience

When creative fatigue is detected, the solution is new creative, not audience changes.

### Creative Testing Framework

- Test 3 to 5 creative variations per ad group
- Let each reach at least 1,000 impressions before deciding
- Kill creatives with thumb-stop rate below 15% after 2,000 impressions
- Scale creatives with above-average watch time AND below-average CPA
- Rotate new creative every 2 to 3 weeks even for top performers

---

## Smart+ Campaigns

### Tracking Requirements

- Minimum: 50 conversions per week for the optimization event
- Recommended: 100+ conversions per week for stable performance
- Events API strongly recommended to maximize signal volume
- Advanced Matching must be configured (email at minimum)
- Product catalog must be connected for Smart+ Shopping campaigns

### Campaign Types

**Smart+ Web:** Optimizes for website conversions. Requires pixel and Events API with sufficient volume.

**Smart+ Catalog:** Dynamic product ads from feed. Requires catalog with content_id matching pixel events.

**Smart+ App:** Optimizes for app installs. Requires TikTok SDK.

### Monitoring

- Check conversion volume daily during first two weeks
- If conversions drop below 50/week, campaign will struggle
- Do not make changes during learning phase
- If CPA is 2x target after 2 weeks with sufficient data, pause and restructure

---

## Debugging with Events Manager

### Key Checks

1. Total events received (browser + server) over time
2. Event breakdown by name
3. Match rate (percentage matched to a TikTok user)
4. Deduplication rate
5. Connection status for browser pixel and Events API
6. Parameter completeness

### Test Events Tool

Enter your website URL in Events Manager > Test Events. Perform actions on your site and verify: correct event names, all expected parameters, user data present, event_id present, server events arriving alongside browser events.

---

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No Advanced Matching | Poor user matching, higher CPAs | Add identify() calls with email and phone |
| Wrong event names | Events not recognized | Map to exact TikTok standard event names |
| No Events API | Losing conversions to browser blocking | Implement server-side via Stape |
| No event_id dedup | Double counting | Add matching event_id to both sides |
| Missing value/currency | Cannot optimize for ROAS | Pass dynamic values on all commerce events |
| Pixel loads late | Missed page_view events | Load pixel in head section |
| No ttclid capture | Cannot attribute server events | Capture ttclid from URL into cookie |
| content_id mismatch | Catalog ads show wrong products | Ensure pixel content_id matches feed sku_id |
| Expired access token | Server events stop silently | Monitor token expiry, refresh proactively |
| Creative fatigue | Rising CPAs, declining engagement | Rotate creative every 2 to 3 weeks |
