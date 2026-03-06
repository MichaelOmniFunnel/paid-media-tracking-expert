# Anomaly Flagging Rules

Automatically flag these anomalies during any platform session without being asked.

## Google Ads
- Campaigns in limited budget that are hitting targets
- Bidding strategies still in learning
- Conversion actions with zero recent data
- Duplicate conversion tracking
- Search terms with high spend and zero conversions
- Quality scores below 5 on high-spend keywords
- Assets with low performance ratings in P-MAX
- Conversion value declining while volume stable (cost per value rising)
- High impression share but low search impression share (budget vs competition)

## Meta Ads
- Campaigns in learning phase (especially if recently edited)
- Ad sets with audience overlap above 20%
- Creative with frequency above 3.0 on cold audiences
- CAPI event match quality below 6.0
- Any sudden CPM spike above 30% week over week
- Match quality declining trend (data quality erosion)
- Significant CPM variation without corresponding reach changes

## TikTok Ads
- Creative CTR below 1% after 1000+ impressions
- Conversion events not registering in Events Manager
- Ad groups with no spend in 48 hours despite active status
- Ads flagged for incomplete setup but still receiving spend
- Conversion window not matching sales cycle

## Tracking
- Any mismatch between client-side and server-side event counts
- Missing event_id on any conversion event (deduplication failure)
- GTM tags with ES6 syntax
- Consent Mode not implemented
- Click ID capture failures (GCLID/FBCLID not persisting through redirects)
