---
name: attribution-measurement
description: Cross-platform attribution, conversion modeling, measurement frameworks, value-based bidding readiness, and incrementality testing. Use when someone mentions attribution, cross-platform measurement, conversion modeling, VBB readiness, data-driven attribution, last-click vs multi-touch, or which platform is driving results.
model: sonnet
---

# Attribution & Measurement for Paid Media

## Platform Attribution Models

### Google Ads
- **Data-Driven Attribution (DDA)** - Default, ML-based, distributes credit across touchpoints
- **Last Click** - 100% credit to last click before conversion
- **Cross-device** - Google links users across devices via Google account
- **Conversion modeling** - Google estimates conversions for users who didn't consent to tracking
- **Attribution window**: Click (1-90 days), View-through (1-30 days)

### Meta Ads
- **Post-iOS 14.5 Model**: 7-day click, 1-day view (default)
- **Aggregated Event Measurement (AEM)**: Statistical estimation for iOS users
- **Conversions API** provides server-side attribution data
- **Conversion modeling**: Meta estimates ~15-30% of conversions that can't be directly observed
- View-through attribution significantly reduced post-ATT

### TikTok Ads
- **Click-through**: Default 7 days or 28 days
- **View-through**: 1 day default
- **Self-attributing network (SAN)**: TikTok reports its own conversions
- **Events API** improves attribution accuracy

## Cross-Platform Attribution Challenges

### The Double-Counting Problem
All platforms claim credit for conversions they touched:
- User sees Meta ad → clicks Google ad → converts
- Both Meta (view-through) and Google (click-through) claim the conversion
- Total platform-reported conversions > actual conversions

### Solutions
1. **UTM parameters + GA4** as neutral source of truth
2. **CRM-based attribution** - Track actual revenue by channel
3. **Incrementality testing** - Measure true lift per channel
4. **Media Mix Modeling (MMM)** - Statistical modeling of channel contribution

## UTM Parameter Framework

Consistent UTM structure for accurate GA4 attribution:

```
?utm_source=google&utm_medium=cpc&utm_campaign={campaign_name}&utm_content={ad_id}&utm_term={keyword}
?utm_source=facebook&utm_medium=paid-social&utm_campaign={campaign_name}&utm_content={adset_name}
?utm_source=tiktok&utm_medium=paid-social&utm_campaign={campaign_name}&utm_content={ad_name}
```

### Common UTM Mistakes
- Inconsistent source names (facebook vs meta vs fb)
- Missing UTMs on some campaigns
- Auto-tagging conflicts with manual UTMs in Google Ads
- UTMs stripped by redirects

## Value-Based Bidding

### Requirements for Value-Based Bidding
1. **Variable conversion values** - Not all conversions worth the same amount
2. **Accurate value data** - Values reflect true business value
3. **Sufficient volume** - 30+ conversions/week for Google, 50+ for Meta
4. **Consistent reporting** - Values don't fluctuate wildly

### Value Signal Types
| Signal Type | Platform Use | Implementation |
|-------------|-------------|----------------|
| Revenue | Direct ROAS optimization | Pass actual transaction value |
| Lead score | Optimize for quality leads | Assign value by lead quality tier |
| LTV prediction | Optimize for long-term value | Pass predicted LTV as conversion value |
| Profit margin | Optimize for profit, not revenue | Pass margin instead of revenue |

### Google Ads Value Rules
```
Value rules allow adjusting conversion values by:
- Audience (returning customers worth 2x)
- Location (some markets more valuable)
- Device (desktop converts at higher value)
```

## Offline Conversion Tracking

### Google Ads Offline Conversions
1. Capture GCLID on form submission
2. Store GCLID with lead in CRM
3. When lead converts to customer, upload: GCLID + conversion time + value
4. Google matches back to the original click for optimization

### Meta Offline Events
1. Capture FBCLID and FBP/FBC cookies
2. Store with lead in CRM
3. Upload via Offline Events API or manual CSV
4. Meta matches to ad exposure

### Implementation Methods
- **Direct API** - Most real-time, requires development
- **CRM integrations** - HubSpot, Salesforce connectors
- **Zapier/Make** - No-code automation
- **Manual upload** - CSV upload in platform UI (least recommended)

## Measurement Maturity Framework

### Level 1: Foundation
- All conversion events firing correctly
- Values are accurate
- Basic UTM tracking in place
- GA4 configured and linked

### Level 2: Enhanced
- Enhanced conversions / Advanced Matching active
- Server-side tracking (CAPI) implemented
- Deduplication working
- Cross-platform UTM consistency

### Level 3: Advanced
- Offline conversion imports active
- Value-based bidding enabled
- Customer list syncing automated
- CRM-to-platform data flow established

### Level 4: Sophisticated
- Incrementality testing program
- LTV-based conversion values
- Profit-based optimization
- Media mix modeling
- Custom attribution models

## Key Metrics to Audit

| Metric | What It Reveals | Red Flag |
|--------|-----------------|----------|
| Platform conversions vs CRM | Attribution accuracy | >50% discrepancy |
| Event Match Quality (Meta) | Data matching quality | Below 6/10 |
| Enhanced conversion rate (Google) | User data coverage | Below 50% |
| Modeled conversion % | Signal gap size | Above 30% modeled |
| Customer list match rate | Data quality | Below 40% (Google), 50% (Meta) |
