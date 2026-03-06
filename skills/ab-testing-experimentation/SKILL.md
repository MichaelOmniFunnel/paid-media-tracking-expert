---
name: A/B Testing and Experimentation
description: Platform experiments, incrementality testing, geo tests, statistical methodology, and creative testing frameworks for paid media
context: fork
---
# A/B Testing & Experimentation for Paid Media

## Overview

Experimentation is the backbone of data-driven paid media management. For OmniFunnel
Marketing (OFM), every optimization recommendation -- bid strategy change, new audience
segment, creative refresh, landing page redesign -- should be validated through structured
testing before full-scale rollout. This skill covers the complete experimentation lifecycle
across Google Ads, Meta Ads, TikTok Ads, and landing page platforms, with integration
points for GA4, Stape.io server-side GTM, and OFM's ecommerce stack.

### Why Experimentation Matters for Agencies

1. **Proving ROI of changes** -- Clients pay for expertise. Experiments turn "we think
   this will work" into "we proved this works, and here is the data."
2. **Reducing risk** -- A bad bid strategy change on a six-figure campaign can burn budget
   fast. Experiments contain the blast radius.
3. **Compounding gains** -- A 5% lift per month compounds to 80%+ annual improvement. But
   only if each lift is real, not noise.
4. **Client retention** -- Documented test-and-learn programs demonstrate ongoing value and
   justify management fees.

---

## Types of Tests in Paid Media

### Ad Copy / Creative Tests
- Headline variations in Responsive Search Ads (RSAs)
- Image and video creative on Meta and TikTok
- Ad format comparisons (carousel vs. single image vs. video)
- Call-to-action language (Shop Now vs. Learn More vs. Get Offer)

### Audience Tests
- Lookalike/similar audience percentages (1% vs. 3% vs. 5%)
- Interest-based vs. behavioral targeting
- First-party data audiences vs. platform-native audiences
- Broad targeting vs. narrow targeting with smart bidding

### Bidding Strategy Tests
- Manual CPC to Target CPA
- Target CPA to Target ROAS
- Maximize Conversions vs. Maximize Conversion Value
- Bid caps and cost controls on Meta

### Landing Page Tests
- Long-form vs. short-form pages
- Social proof placement and type
- Form length and field count
- Page speed optimizations (measuring conversion impact)

### Campaign Structure Tests
- Consolidated vs. segmented campaign structures
- Advantage+ Shopping vs. manual campaigns on Meta
- Performance Max vs. Standard Shopping on Google
- Single-keyword ad groups (SKAGs) vs. themed ad groups

---

## Statistical Foundations

### Key Concepts

**Statistical Significance** -- The probability that the observed difference between
test variants is not due to random chance. Industry standard is 95% confidence
(alpha = 0.05).

**Statistical Power** -- The probability of detecting a true effect when one exists.
Standard is 80% (beta = 0.20). Higher power requires larger sample sizes.

**Minimum Detectable Effect (MDE)** -- The smallest relative improvement you want to
be able to detect. Smaller MDE requires larger samples.

**Baseline Conversion Rate** -- Your current conversion rate, which determines how
much traffic you need for reliable results.

### Sample Size Formula (Simplified)

For a two-proportion z-test at 95% confidence and 80% power:

```
n = (Z_alpha/2 + Z_beta)^2 * (p1(1-p1) + p2(1-p2)) / (p2 - p1)^2

Where:
  Z_alpha/2 = 1.96 (for 95% confidence)
  Z_beta    = 0.84 (for 80% power)
  p1        = baseline conversion rate
  p2        = expected conversion rate after improvement
```

### Quick Reference: Required Conversions Per Variant

| Baseline CVR | MDE 5%  | MDE 10% | MDE 20% |
|-------------|---------|---------|---------|
| 1%          | 62,000  | 15,700  | 4,000   |
| 2%          | 30,500  | 7,700   | 2,000   |
| 5%          | 11,600  | 2,950   | 760     |
| 10%         | 5,200   | 1,350   | 355     |

**Practical Rule of Thumb:** Aim for at least 100-200 conversions per experiment arm
for reliable results. Accounts generating fewer than 30-50 conversions per week will
struggle to achieve significance within a reasonable time window.

### Minimum Budget Guidelines

Accounts spending at least USD 5,000-10,000 per month across tested campaigns generally
have adequate volume for effective experimentation. Below that threshold, consider
pre/post analysis or longer test windows.

### Test Duration Guidelines

- **Minimum:** 2 full business cycles (typically 2 weeks)
- **Recommended:** 3-4 weeks to capture weekly patterns and variance
- **Maximum:** 6-8 weeks; beyond this, external factors dominate
- **Always** include at least one full weekend in any test period

---

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

## Pre/Post Analysis

When true A/B testing is not possible (insufficient traffic, client constraints,
platform limitations), use pre/post analysis with controls.

### Methodology

1. **Define the change period** -- The exact date/time the change was implemented
2. **Select a comparison window** -- Equal duration before and after the change
3. **Account for seasonality** -- Compare to the same period in the prior year
4. **Use a control** -- An unchanged campaign or segment to isolate the effect

### Pre/Post Analysis Template

```
Change: Switched Campaign X from tCPA $40 to Maximize Conversions
Date Implemented: March 1, 2026

Pre-Period:  Feb 1 - Feb 28, 2026
Post-Period: Mar 1 - Mar 28, 2026
YoY Comparison: Mar 1 - Mar 28, 2025

Control Campaign: Campaign Y (no changes, same vertical)

Results:
                   | Pre-Period | Post-Period | Change  | Control Change |
  Conversions      |    320     |     385     | +20.3%  | +3.1%          |
  CPA              |   $38.50   |    $34.20   | -11.2%  | -1.4%          |
  Conv. Value      |  $48,000   |   $59,675   | +24.3%  | +2.8%          |
  ROAS             |    3.9x    |     4.7x    | +20.5%  | +0.2%          |

Adjusted Lift (subtracting control trend): ~+17% ROAS improvement
Confidence: Moderate (no randomization; external factors possible)
```

---

## Geo-Based Incrementality Testing

### Overview

Geo holdout tests split geographic regions into test and control groups. Ads run
normally in test regions while control regions receive no ads (or reduced spend).
Comparing outcomes isolates the true incremental impact of advertising.

### Geographic Granularity

| Level   | Pros                                    | Cons                                 |
|---------|-----------------------------------------|--------------------------------------|
| State   | High revenue per unit, lower noise      | Fewer units, less flexibility        |
| DMA     | Good balance of granularity and volume  | Requires higher budgets              |
| Metro   | Granular, many test units available     | More noise, longer test duration     |
| Zip     | Most granular                           | Very noisy, impractical for most     |

**Recommendation:** DMA-level for most paid media tests. State-level for smaller
accounts that need faster significance.

### Design Process

1. **Identify comparable markets** -- Match test and control markets on:
   - Historical revenue/conversion patterns
   - Population demographics
   - Seasonality patterns
   - Current ad spend levels

2. **Randomly assign** matched pairs to test vs. control

3. **Run the test** for 2-4 weeks minimum

4. **Measure** the difference in business outcomes (revenue, conversions, store visits)

5. **Calculate incremental ROAS (iROAS):**

```
iROAS = (Revenue_test - Revenue_control) / Ad_Spend_test

Example:
  Test markets revenue:    $500,000
  Control markets revenue: $420,000
  Test markets ad spend:   $50,000
  iROAS = ($500,000 - $420,000) / $50,000 = 1.60x
```

### Tools for Geo Testing

- **Meta GeoLift** -- Open-source R package for geo-based incrementality
- **Google Matched Markets** -- Built into Google Ads for YouTube/display
- **Haus** -- Third-party platform for cross-channel geo experiments
- **Internal analysis** -- BigQuery + GA4 export data segmented by geo

### Cost Considerations

- Geo holdout tests using existing campaigns have no extra media cost (you pause
  spend in control regions, potentially saving that budget)
- The "cost" is the opportunity cost of not advertising in control markets
- Full media mix modeling with external partners: USD 50,000-500,000 annually

---

## Measuring Incrementality

### Holdout Groups

Reserve a percentage of your audience that never sees ads:

- **Size:** 5-10% of total addressable audience
- **Duration:** Persistent (always on) for ongoing measurement
- **Measurement:** Compare conversion rate of holdout vs. exposed group
- **Refresh:** Rotate holdout members quarterly to prevent staleness

### Ghost Ads / Intent-to-Treat

A ghost ad study logs when a user *would have* seen an ad but was in the holdout.
This eliminates selection bias by comparing:

- Users who saw the ad (treatment)
- Users who would have seen the ad but did not (ghost exposure / control)

### Matched Market Tests

When user-level holdouts are not possible:

1. Select pairs of similar geographic markets
2. Show ads in one market of each pair, withhold in the other
3. Measure the difference in business outcomes
4. Swap test/control markets in a subsequent period to validate

---

## Test Documentation Template

Every test should be documented before launch and updated with results.

```
============================================================
TEST DOCUMENT
============================================================

Test Name:     [Descriptive name with date]
Test ID:       [Platform test ID or internal tracking ID]
Owner:         [Team member responsible]
Client:        [Client name]
Platform:      [Google Ads / Meta / TikTok / Landing Page]

------------------------------------------------------------
HYPOTHESIS
------------------------------------------------------------
If we [change], then [metric] will [improve/decrease] by
[expected magnitude] because [reasoning].

------------------------------------------------------------
DESIGN
------------------------------------------------------------
Type:          [A/B / A/B/C / Geo holdout / Pre-post]
Variable:      [Single variable being tested]
Control:       [Description of control condition]
Treatment:     [Description of treatment condition]
Split:         [50/50 / 70/30 / Geographic]
Audience:      [Target audience description]

------------------------------------------------------------
MEASUREMENT
------------------------------------------------------------
Primary KPI:   [The single metric that determines success]
Secondary KPIs:[Additional metrics to monitor]
MDE:           [Minimum detectable effect, e.g., 10% lift]
Sample Size:   [Required sample per variant]
Duration:      [Planned test duration]
Start Date:    [YYYY-MM-DD]
End Date:      [YYYY-MM-DD]

------------------------------------------------------------
RESULTS (completed after test)
------------------------------------------------------------
Status:        [Winner / No Winner / Inconclusive]
Primary KPI:
  Control:     [value]
  Treatment:   [value]
  Lift:        [percentage]
  Confidence:  [percentage]

Secondary KPIs:
  [metric]:    [control] vs [treatment] ([lift])

------------------------------------------------------------
DECISION
------------------------------------------------------------
Action:        [Roll out / Do not roll out / Iterate]
Rationale:     [Why this decision was made]
Next Steps:    [Follow-up actions]
Implemented:   [YYYY-MM-DD]
============================================================
```

---

## Integration with GA4 for Test Analysis

### Passing Experiment Data to GA4

Send experiment variant information as custom dimensions in GA4:

```javascript
// ES5 compatible -- push experiment data to GA4 via GTM dataLayer
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'experiment_view',
  'experiment_id': 'google_ads_bidding_test_mar2026',
  'experiment_variant': 'target_roas_400',
  'experiment_platform': 'google_ads'
});
```

### GA4 Custom Dimensions Setup

1. In GA4 Admin > Custom Definitions, create:
   - `experiment_id` (event-scoped)
   - `experiment_variant` (event-scoped)
   - `experiment_platform` (event-scoped)
2. Configure GTM tags to send these parameters with all events during the test
3. Build GA4 Explorations segmented by experiment variant

### BigQuery Analysis of Experiments

When GA4 data is exported to BigQuery, run cross-experiment analysis:

```sql
-- Analyze experiment performance from GA4 BigQuery export
SELECT
  (SELECT value.string_value
   FROM UNNEST(event_params) WHERE key = 'experiment_variant'
  ) AS variant,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNTIF(event_name = 'purchase') AS purchases,
  SUM(
    CASE WHEN event_name = 'purchase'
    THEN (SELECT value.double_value
          FROM UNNEST(event_params) WHERE key = 'value')
    ELSE 0 END
  ) AS revenue,
  SAFE_DIVIDE(
    COUNTIF(event_name = 'purchase'),
    COUNT(DISTINCT user_pseudo_id)
  ) AS conversion_rate
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX BETWEEN '20260301' AND '20260331'
  AND (SELECT value.string_value
       FROM UNNEST(event_params)
       WHERE key = 'experiment_id') = 'bidding_test_mar2026'
GROUP BY variant
ORDER BY conversion_rate DESC;
```

---

## Common Mistakes

### 1. Ending Tests Too Early (Peeking Problem)

Checking results daily and stopping when you see a "winner" inflates false positive
rates from 5% to 20-30%. Solutions:
- Set the test duration in advance and commit to it
- Use sequential testing methods if you must monitor continuously
- Ignore results until the planned end date

### 2. Testing Too Many Variables Simultaneously

Changing bid strategy, ad copy, AND audience simultaneously makes it impossible to
attribute results. Always test ONE variable at a time.

### 3. Ignoring External Factors

A "winning" test during Black Friday may just be capturing seasonal lift. Always:
- Run control groups that experience the same external conditions
- Check for competitor activity, PR events, and seasonal patterns
- Document known external factors in your test log

### 4. Using the Wrong Success Metric

- Do not optimize landing page tests for bounce rate (optimize for conversions)
- Do not judge ad copy tests on CTR alone (include CPA and conversion rate)
- Always tie success metrics to business outcomes (revenue, POAS, profit)

### 5. Insufficient Sample Size

Running tests on campaigns with 10 conversions/week guarantees inconclusive results.
Either:
- Aggregate multiple campaigns into a single test
- Accept a larger MDE (detect only large differences)
- Use pre/post analysis instead

### 6. Selection Bias in Audience Tests

Comparing a new audience to an existing one is not a fair test if the existing audience
has been optimized over months. Use Meta's split test feature to ensure non-overlapping,
randomly assigned groups.

### 7. Not Accounting for Learning Periods

Platform algorithms need time to stabilize after changes:
- Google Ads learning period: 1-2 weeks after bid strategy changes
- Meta Ads learning phase: approximately 50 conversions after changes
- Exclude the learning period from your analysis window

---

## Test Prioritization Framework

### Effort vs. Impact Matrix

Score each potential test on two dimensions (1-5 scale):

```
                    HIGH IMPACT
                        |
     Quick Wins         |      Major Projects
     (Do First)         |      (Plan & Schedule)
                        |
  LOW EFFORT -----------+------------ HIGH EFFORT
                        |
     Fill-Ins           |      Deprioritize
     (Do When Idle)     |      (Revisit Later)
                        |
                    LOW IMPACT
```

### Scoring Criteria

**Impact Score (1-5):**
- 5: Affects >50% of ad spend or revenue
- 4: Affects 25-50% of spend/revenue
- 3: Affects 10-25% of spend/revenue
- 2: Affects 5-10% of spend/revenue
- 1: Affects <5% of spend/revenue

**Effort Score (1-5):**
- 1: Can set up in <1 hour, no dev work needed
- 2: 1-4 hours setup, minor configuration
- 3: 4-8 hours setup, some dev or design work
- 4: 1-2 days setup, significant dev/design
- 5: >2 days setup, requires cross-team coordination

### Prioritization for OFM Clients

Recommended test priority order for new clients:

1. **Bid strategy tests** (High impact, low effort) -- Most accounts have suboptimal
   bid strategies. Test tCPA vs. tROAS vs. Max Conversions.
2. **Audience consolidation tests** (High impact, medium effort) -- Test broad vs.
   segmented audience structures.
3. **Creative format tests** (Medium impact, low effort) -- Video vs. static, carousel
   vs. single image.
4. **Landing page tests** (High impact, high effort) -- Require design/dev but can
   produce outsized gains.
5. **Campaign structure tests** (High impact, high effort) -- PMax vs. Standard
   Shopping, consolidated vs. segmented.

---

## Integration Points with OFM Stack

### Stape.io Server-Side GTM

- Pass experiment variant as a custom parameter in server-side events
- Ensure conversion events (purchase, lead) include variant data for accurate
  attribution to the correct test arm
- Verify server-side event deduplication does not interfere with experiment tracking

### Ecommerce Platforms

**Shopify:**
- Use Shopify Scripts or theme-level Liquid conditions for on-site experiments
- Ensure checkout tracking passes experiment data through to server-side GTM
- Verify that Shopify's own conversion tracking aligns with test variant assignment

**WooCommerce:**
- Implement experiment variant tracking via WooCommerce hooks
- Pass variant data in the WooCommerce dataLayer for GTM pickup
- Verify that server-side GTM receives variant data on order completion

**NetSuite:**
- For B2B / complex ecommerce, tie experiment variant data to order records
- Use NetSuite SuiteScript to capture UTM parameters including experiment IDs
- Reconcile experiment results with NetSuite revenue data for true POAS calculation

### POAS Optimization

When testing for Profit on Ad Spend:

1. Standard ROAS tests use revenue as the success metric
2. POAS tests require margin data, which may not be available in ad platforms
3. Use BigQuery to join GA4 experiment data with product margin data from
   Shopify/WooCommerce/NetSuite
4. Calculate true profit per experiment variant, not just revenue

---

## Experimentation Cadence

### Recommended Testing Calendar

```
Monthly:
- Week 1: Launch new test (based on prior month learnings)
- Week 2-3: Test runs, monitor for data quality issues only
- Week 4: Analyze results, document findings, plan next test

Quarterly:
- Review all test results from the quarter
- Update incrementality factors from lift studies
- Recalibrate POAS targets based on experiment findings
- Present test-and-learn report to client stakeholders

Annually:
- Conduct a full incrementality study (geo-based or conversion lift)
- Rebuild test prioritization framework based on current account state
- Archive completed tests and update the knowledge base
```

---

## Key Takeaways

1. Every optimization change should be tested, not just implemented on faith
2. Use platform-native experiment tools (Google Experiment Center, Meta A/B Test,
   TikTok Split Test) for maximum reliability
3. Ensure statistical rigor: adequate sample size, single-variable testing, full
   test duration before reading results
4. Measure incrementality at least quarterly with holdout or geo-based studies
5. Document every test with the standard template for institutional knowledge
6. Integrate experiment tracking with GA4 and BigQuery for deep analysis
7. Tie all test results back to POAS, not just top-line ROAS
8. Prioritize tests by impact and effort; start with bid strategy tests for new clients
9. Account for platform learning periods when analyzing results
10. Roll out winners quickly (3-5 days) to capture compounding gains
