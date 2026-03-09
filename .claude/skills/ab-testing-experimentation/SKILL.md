---
name: ab-testing-experimentation
description: Platform experiments, incrementality testing, geo tests, statistical methodology, and creative testing frameworks for paid media. Use whenever someone mentions A/B testing, experiments, incrementality, statistical significance, holdout groups, geo tests, creative testing, or wants to know if something actually works versus correlation.
context: fork
allowed-tools: Read, Grep, Glob
agent: Explore
---

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

Google consolidated testing into the Experiment Center (Jan 2026): custom experiments, ad variations, video experiments, PMax experiments, lift studies.

**Setup:** Experiments > Custom Experiment > select base campaign > 50/50 cookie-based split > single variable > 2+ weeks.

**Cookie-based (recommended):** Each user consistently sees same variant. **Search-based:** Random per query, user may see both.

**Reading results:** Primary KPI with confidence intervals. Blue = experiment winning. Watch secondary metrics for trade-offs.

**Critical:** Roll out winners within 3-5 days of significance. Delayed rollouts destroy compounding gains.

For experiment templates, common test configs, and result interpretation, read references/platform-testing-guides.md

---

## Meta Ads A/B Testing

**Split Testing:** Variables: creative, audience, placement, delivery optimization. Always 50/50 even split, min 7 days.

**Conversion Lift Studies:** Randomized controlled trial. Test group sees ads, holdout does not. Measures true incrementality.
- Incrementality factor example: platform ROAS 4.2x, factor 0.70, true iROAS = 2.94x

**Holdout Studies:** Reserve 5-10% as persistent control. Recalibrate incrementality factor quarterly.

For setup process, result interpretation, lift study requirements, and holdout design, read references/platform-testing-guides.md

---

## TikTok Ads Split Testing

Variables: targeting, creative, bidding, placement. Min 7 days, 90% confidence threshold. Creative fatigue is faster (7-14 day shelf life). Test UGC vs. polished, sound-on vs. optional.

For setup details and TikTok-specific best practices, read references/platform-testing-guides.md

---

## Landing Page A/B Testing

Post-Google Optimize alternatives: VWO, Optimizely, Convert, AB Tasty, Crazy Egg.

With paid traffic: preserve UTMs across variants, same GTM container, verify Stape events fire on all variants, segment results by traffic source.

For tool comparison table and server-side GTM considerations, read references/platform-testing-guides.md

---

## Pre/Post Analysis & Geo-Based Incrementality

**Pre/Post:** When A/B testing is not possible. Define change period, equal comparison window, YoY seasonal control, unchanged campaign as control. Adjusted lift = observed minus control trend.

**Geo holdout:** Split geographic regions into test/control. Ads run in test regions, paused in control. DMA-level recommended for most tests.

**iROAS = (Revenue_test - Revenue_control) / Ad_Spend_test**

Tools: Meta GeoLift (R package), Google Matched Markets, Haus (third-party).

For pre/post template, geo design process, and incrementality measurement methods, read references/incrementality-methods.md

---

## Test Documentation & Best Practices

Every test documented before launch: hypothesis, design (type, variable, control, split), measurement (primary KPI, MDE, sample size, duration), results, decision.

**Common mistakes:** Ending tests too early (peeking inflates false positives to 20-30%), testing multiple variables, ignoring external factors, wrong success metric, insufficient sample, selection bias, not accounting for learning periods.

**Priority order for new clients:** (1) Bid strategy tests, (2) Audience consolidation, (3) Creative format, (4) Landing page, (5) Campaign structure.

**Cadence:** Monthly test cycle (launch week 1, measure weeks 2-3, analyze week 4). Quarterly incrementality recalibration. Annual full study.

For test template, GA4 custom dimensions, BigQuery analysis SQL, integration points, and cadence calendar, read references/templates-ga4-best-practices.md

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
