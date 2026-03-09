# Platform Testing Guides

## Google Ads Experiments

### Experiment Center (2026)

Google consolidated A/B testing experiments and lift studies into the Experiment Center
in January 2026. This unified interface manages:

- Custom experiments (campaign-level A/B tests)
- Ad variation tests
- Video experiments
- Campaign Mix Experiments (cross-campaign testing)
- Performance Max experiments
- Lift studies (brand lift, search lift, conversion lift)

### Setting Up a Campaign Experiment

1. **Navigate** to Experiments in the left nav (or Experiment Center)
2. **Select** Custom Experiment
3. **Choose** the base campaign to test against
4. **Configure** the experiment:
   - Name the experiment clearly (e.g., "tCPA-35-vs-tROAS-400-SearchBrand-Mar2026")
   - Set traffic split to 50/50 (cookie-based recommended)
   - Set start and end dates (minimum 2 weeks)
   - Define the single variable to change
5. **Apply** the experiment and let it run

### Cookie-Based vs. Search-Based Split

- **Cookie-based (recommended):** Each user consistently sees the same variant.
  Prevents the same user from seeing both versions. Best for most tests.
- **Search-based:** Each search query is randomly assigned. Can result in the same
  user seeing both variants. Only use for keyword-level tests.

### Reading Experiment Results

Google reports results with confidence intervals. Key metrics to evaluate:

- **Primary metric:** The KPI you are optimizing (CPA, ROAS, conversion rate)
- **Confidence level:** Google shows whether the result has reached 95% significance
- **Directional indicators:** Blue = experiment winning, Gray = no clear winner
- **Secondary metrics:** Watch for trade-offs (e.g., lower CPA but also lower volume)

### Common Google Ads Tests

```
Test: Bidding Strategy Migration
Hypothesis: Switching from tCPA $35 to tROAS 400% will increase
            profit by maintaining volume while improving ROAS.
Variable: Bid strategy only (all other settings identical)
Split: 50/50 cookie-based
Duration: 4 weeks (1 week learning + 3 weeks measurement)
Primary Metric: Conversion value / cost
Secondary Metrics: Conversions, CPA, impression share
Success Criteria: tROAS arm achieves >= 10% higher ROAS with
                  no more than 5% volume loss
```

### Implementing Winners

**Critical:** Roll out winning experiments within 3-5 days of reaching significance.
Delayed rollouts destroy compounding gains and slow annual efficiency growth. Apply the
experiment to the base campaign directly from the Experiment Center.

---

## Meta Ads A/B Testing

### Built-in Split Testing

Meta's A/B testing tool creates a controlled experiment by splitting your audience into
non-overlapping groups. Available test variables:

- **Creative** -- Different images, videos, or ad copy
- **Audience** -- Different targeting configurations
- **Placement** -- Different delivery placements (Feed, Stories, Reels)
- **Delivery Optimization** -- Different optimization goals or bid strategies

#### Setup Process

1. Go to **Ads Manager > A/B Test** (or from an existing campaign, click "A/B Test")
2. Select test variable (one variable per test)
3. Choose "Even Split" for budget distribution (always 50/50)
4. Set test duration (minimum 7 days; recommended 2-4 weeks)
5. Select the key metric for determining the winner
6. Launch the test

#### Reading Results

Meta reports a "winning" variant only when results reach statistical significance.
The results dashboard shows:

- Cost per result for each variant
- Confidence level as a percentage
- Estimated probability of one variant beating the other
- Whether results are conclusive or need more data

### Conversion Lift Studies

Conversion Lift studies are Meta's gold standard for measuring incrementality. They
use a randomized controlled trial (RCT) design:

- **Test group:** Sees your ads as normal
- **Holdout group:** Does not see your ads (or sees a public service announcement)
- **Measurement:** Compare conversion rates between groups to isolate ad-driven lift

#### Requirements

- Minimum audience size: 5,000 users in target group (larger is better)
- Recommended study duration: 2-4 weeks
- Budget minimum (US): approximately USD 120,000 over the study duration for
  Brand Lift; Conversion Lift can work with lower budgets depending on volume
- Must have Meta Pixel or Conversions API (CAPI) implemented

#### Interpreting Results

```
Key Metrics from Conversion Lift:
- Incremental conversions: Conversions caused by ads (not just correlated)
- Incremental ROAS: Revenue from incremental conversions / ad spend
- Incrementality factor: Ratio of incremental to total conversions (e.g., 0.70
  means 70% of reported conversions were truly incremental)

Practical Application:
  Platform-reported ROAS: 4.2x
  Incrementality factor: 0.70
  True incremental ROAS: 4.2 x 0.70 = 2.94x
```

### Holdout Studies

For ongoing incrementality measurement, maintain a persistent holdout:

- Reserve 5-10% of your audience as a control group
- Never serve ads to the holdout
- Compare conversion behavior between exposed and holdout groups
- Recalibrate your incrementality factor quarterly

---

## TikTok Ads Split Testing

### Capabilities

TikTok Ads Manager supports split testing with these testable variables:

- **Targeting** -- Compare two different audience configurations
- **Creative** -- Test different ad creatives against each other
- **Bidding & Optimization** -- Compare optimization goals or bid amounts
- **Placement** -- Test different placement configurations

### Setup and Best Practices

1. Create a new campaign and enable "Split Test"
2. Select one variable to test
3. Choose "Even Split" for 50/50 budget distribution
4. Set minimum duration of 7 days (TikTok recommends 7-14 days)
5. TikTok automatically calculates statistical significance at 90% confidence

### Reading TikTok Split Test Results

- Results are available after 24 hours of running
- TikTok declares a winner only when 90% confidence is reached
- If no winner after the test period, results are inconclusive
- Key metrics: CPA, CPM, CTR, conversion rate by variant

### TikTok-Specific Considerations

- Creative fatigue is faster on TikTok (7-14 day shelf life)
- Test native-style creative vs. polished production
- UGC-style content often outperforms studio content
- Sound-on vs. sound-optional designs can be tested via creative split

---

## Landing Page A/B Testing

### Tool Landscape (Post-Google Optimize)

Google Optimize was sunset September 30, 2023. Current recommended alternatives:

| Tool       | Best For                        | Pricing Tier        | GA4 Integration |
|------------|---------------------------------|---------------------|-----------------|
| VWO        | All-in-one optimization suite   | Mid to Enterprise   | Native          |
| Optimizely | Enterprise experimentation      | Enterprise          | Custom          |
| Convert    | Privacy-focused, mid-market     | Mid-market          | Native          |
| AB Tasty   | UX experimentation              | Mid to Enterprise   | Custom          |
| Crazy Egg  | SMB heatmaps + basic testing    | SMB                 | Limited         |

### Integration with Ad Tracking

When running landing page tests with paid traffic:

1. **Preserve UTM parameters** across all variants -- ensure test tool does not strip
   query parameters
2. **Use the same GTM container** on all variants for consistent event tracking
3. **Verify Stape.io server-side events** fire correctly on each variant
4. **Check conversion tracking** -- both GA4 events and platform pixels must fire
   on all variants
5. **Segment results by traffic source** -- a landing page that wins for Google Search
   traffic may not win for Meta social traffic

### Server-Side Considerations for OFM Stack

When using Stape.io server-side GTM with landing page tests:

- Ensure the test tool does not interfere with the Stape.io data layer
- Verify that server-side conversion events (purchase, add_to_cart) include the
  experiment variant as a custom parameter
- Pass variant information through to GA4 as a custom dimension for analysis

```javascript
// Example: Push experiment variant to dataLayer for GTM/Stape pickup
// ES5 compatible
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'experiment_impression',
  'experiment_id': 'lp_test_hero_image_mar2026',
  'experiment_variant': 'variant_b_lifestyle_photo',
  'traffic_source': (function() {
    var params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || 'direct';
  })()
});
```

---
