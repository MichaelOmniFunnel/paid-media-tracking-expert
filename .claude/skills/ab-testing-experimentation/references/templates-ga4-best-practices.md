# Test Templates, GA4 Integration & Best Practices

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
