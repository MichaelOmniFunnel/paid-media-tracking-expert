# Pre/Post, Geo Testing & Incrementality

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
