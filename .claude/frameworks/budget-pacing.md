# OFM Budget Pacing and Allocation Framework

## Core Philosophy

Budget allocation is a portfolio decision, never a per platform decision. Every dollar should be deployed where it generates the highest marginal return across the entire media mix. This framework governs how OFM manages pacing, scales spend, kills underperformers, and rebalances across platforms to maximize blended ROAS or POAS.

---

## Daily vs Lifetime Budget Selection

### When to Use Daily Budgets
Daily budgets are the default for most campaigns. They provide predictable spend, easier pacing oversight, and clearer performance signals. Use daily budgets when:
- The campaign is in active optimization and performance needs to be monitored closely
- The client has strict monthly spend caps that must not be exceeded
- The platform is Google Ads (daily budgets are the standard; Google may spend up to 2x the daily budget on any given day but will average out over the month)
- The campaign serves an always on purpose such as branded search, evergreen remarketing, or ongoing prospecting

### When to Use Lifetime Budgets
Lifetime budgets are appropriate in limited scenarios where the platform pacing algorithm can add value:
- Meta Ads campaigns with a defined start and end date (promotions, product launches, seasonal pushes) where Meta delivery algorithm can optimize spend across days with varying auction conditions
- TikTok Ads campaigns during short burst promotional periods
- Any campaign where the goal is maximum delivery within a fixed window and day to day fluctuation is acceptable

### The Rule
If there is no compelling reason to use lifetime, default to daily. Lifetime budgets surrender pacing control to the platform, which can result in front loaded spend on low quality inventory early in the flight.

---

## The 70/20/10 Allocation Rule

This is the standard budget allocation framework across every client portfolio.

### 70% to Proven Performers
The majority of spend goes to campaigns with demonstrated, consistent performance. These are campaigns that have cleared the scaling readiness criteria (see below) and are generating returns at or above target. Proven performers include:
- Search campaigns with stable ROAS or CPA at scale
- Shopping and P MAX campaigns with consistent conversion volume
- Meta prospecting campaigns that have exited learning phase and are delivering at target
- Any campaign with 14 or more consecutive days of performance within acceptable range

### 20% to Scaling Candidates
This allocation funds campaigns that show strong early signals but have not yet been validated at higher spend. These are campaigns in the transition zone between testing and proven. Criteria for scaling candidate status:
- At least 7 days of performance data trending toward target
- Exited learning phase (Meta) or cleared initial learning period (Google Smart Bidding, typically 2 to 4 weeks)
- Conversion volume sufficient for the algorithm to optimize (minimum 15 conversions in the trailing 30 days for Google tROAS, minimum 50 conversion events per week for Meta)
- No signs of audience saturation or creative fatigue

### 10% to Testing
Every portfolio must maintain a testing budget. This is non negotiable. Without testing, the portfolio stagnates and becomes vulnerable to performance decay as audiences fatigue and market conditions shift. Testing budget covers:
- New audience segments and targeting approaches
- New creative concepts and formats
- New campaign types or structures
- New platforms or placements
- Landing page experiments

Testing budget is expected to underperform. A test that consistently hits target is not a test; it is a scaling candidate and should be promoted. The purpose of the testing budget is learning velocity, not immediate return.

---

## Data Sources for Pacing Monitoring
Use Google Ads MCP (`mcp__google-ads__get_campaign_performance`, `mcp__google-ads__run_gaql`) for programmatic spend and conversion monitoring across Google campaigns. Use Meta Ads MCP (`mcp__meta-ads__get_insights`) for Meta spend data. Chrome browser for TikTok pacing and visual dashboards.

## Scaling Readiness Criteria

Before increasing budget on any campaign, all of the following must be true:

### Performance Consistency
The campaign must have delivered ROAS or CPA within 15% of target for at least 14 consecutive days. A single good week is not sufficient. Performance must be stable, not just occasionally strong.

### Sufficient Conversion Volume
Google Ads tROAS bidding requires a minimum of 15 conversions in the trailing 30 days to optimize effectively. Meta requires approximately 50 conversion events per ad set per week to exit and stay out of learning phase. TikTok requires consistent daily conversion volume for its algorithm to learn. If the campaign is not generating enough conversion data, increasing budget will not improve it and may actually destabilize performance.

### Not in Learning Phase
Never scale a campaign that is currently in a learning phase or limited learning state. Wait until the algorithm has stabilized before increasing spend. On Meta, this means waiting until the ad set shows "Active" rather than "Learning" or "Learning Limited." On Google, this means the bid strategy status shows "Eligible" rather than "Learning."

### No Saturation Signals
If the campaign is showing signs of audience saturation (rising frequency above 3.0 on prospecting, declining CTR week over week, rising CPM without corresponding improvement in conversion rate), scaling will accelerate the problem, not solve it. Address saturation first through audience expansion or creative refresh before adding budget.

### Healthy Tracking
Conversion tracking must be verified as working correctly and completely. Never scale into a campaign where there is any question about tracking accuracy. Check platform diagnostics, event counts, and deduplication status before approving a budget increase.

---

## The 20% Scaling Rule

Never increase a campaign budget by more than 20% in a single adjustment. This is one of the most important operational rules in paid media management.

### Why 20%
Both Google and Meta use machine learning algorithms that optimize delivery based on the signals they have collected within the current budget envelope. A large budget increase forces the algorithm to explore new auction segments, new users, and new placements it has not previously evaluated. This often causes a temporary performance drop as the algorithm re enters a learning state.

A 20% increase is large enough to meaningfully expand reach without destabilizing the algorithm. The campaign can absorb the incremental volume within its existing optimization framework.

### The Compounding Effect
20% increases compound rapidly. Starting from a $100 daily budget:
- Week 1: $100 to $120
- Week 2: $120 to $144
- Week 3: $144 to $173
- Week 4: $173 to $207

That is a 107% increase in four weeks through disciplined 20% steps. Patience in scaling produces better outcomes than aggressive jumps.

### Exceptions
The only exception to the 20% rule is when a campaign is dramatically underspending relative to its potential and performance is exceptionally strong (ROAS more than 2x target with stable conversion volume). In this case, a 30% to 40% increase may be justified, but Michael must explicitly approve any increase above 20%.

---

## The 3x Kill Rule

If a campaign has spent 3x its target CPA and has produced zero conversions, kill it. Do not wait for more data. Do not make excuses about learning phase. The campaign is not working.

### The Math
If the target CPA is $50, the campaign gets $150 of runway to prove itself. If $150 is spent with zero conversions, the campaign is paused and evaluated. This applies to:
- New campaign launches during testing phase
- New ad sets or ad groups within existing campaigns
- New creative tests

### What Happens After a Kill
Killing a campaign is not the end of the analysis. After pausing:
1. Review the search terms, audience data, and placement reports to understand where the spend went
2. Check the landing page to confirm conversions are technically possible and tracking is working
3. Evaluate whether the targeting was fundamentally flawed or just needs refinement
4. Document the learning for future reference

A killed campaign can be relaunched with modifications, but it does not get additional budget in its current form.

### Graduated Kill Thresholds
For campaigns with some conversions but poor performance:
- Spending at 2x target CPA with conversions: warning state, reduce budget and optimize
- Spending at 2.5x target CPA with conversions: final warning, make structural changes or kill
- Spending at 3x target CPA with conversions: kill unless there is a clear, documented reason performance will improve (such as a known tracking lag or a landing page fix deployed but not yet reflected in data)

---

## Seasonal Adjustment Methodology

### Building the Seasonality Index
Use at least 12 months of historical revenue data to calculate a seasonality index for each month:

Seasonality Index for Month X = Average Revenue in Month X / Average Monthly Revenue Across All 12 Months

A Seasonality Index of 1.0 means the month performs at average. An index of 1.5 means the month historically produces 50% more revenue than average. An index of 0.7 means the month historically underperforms by 30%.

### Applying Seasonality to Budgets
Adjust monthly budgets proportionally to the seasonality index. If the annual budget is $120,000 ($10,000 per month average):
- A month with index 1.5 gets $15,000
- A month with index 0.7 gets $7,000

This ensures spend is concentrated in periods of highest demand and return potential.

### Intra Month Adjustments
Within peak months, spend should be front loaded slightly to capture demand early. Within slow months, spend can be distributed evenly or even back loaded if there is a known uptick toward month end (such as end of month purchase behavior in B2B).

### Holiday and Promotional Surges
For known promotional periods (Black Friday/Cyber Monday, Prime Day, back to school, tax season), create dedicated budget reserves allocated separately from the standard monthly budget. These reserves should be:
- Determined 30 to 60 days in advance
- Allocated to proven campaigns that can absorb the spend increase
- Deployed using daily budgets with manual pacing oversight
- Accompanied by increased creative volume to prevent fatigue at higher frequency

### New Clients Without Historical Data
For clients with less than 12 months of data, use vertical benchmarks as a seasonality proxy. The reporting pipeline framework includes vertical seasonality patterns. As real data accumulates, replace the benchmark index with the client actual performance patterns.

---

## Campaign Saturation Detection

### The Diminishing Returns Curve
Every campaign has a point at which additional spend produces less and less incremental return. Detecting this point early prevents wasted spend and preserves overall portfolio efficiency.

### Saturation Signals
Monitor these metrics weekly for each campaign:

**Frequency and Reach**
- Meta: frequency above 3.0 on prospecting audiences signals saturation. Above 5.0 is critical.
- TikTok: frequency above 4.0 on broad audiences is a concern
- If reach is plateauing while spend is increasing, the campaign is recycling impressions to the same users

**Incremental CPA or ROAS Degradation**
- Track the marginal CPA or ROAS of the last 20% of spend added. If the last increment of budget produces conversions at 30% or more above the blended CPA, the campaign is entering diminishing returns.
- Compare trailing 7 day performance to trailing 30 day performance. If the 7 day metrics are significantly worse and spend has been increasing, saturation is likely.

**Impression Share (Google)**
- Search impression share above 90% with declining conversion rate suggests the campaign has captured most available demand and incremental impressions are lower quality
- If the campaign is losing impression share to budget but ROAS is declining, the remaining impressions may not be worth capturing

**Audience Exhaustion (Meta and TikTok)**
- Audience size shrinking relative to daily reach
- Learning Limited status appearing after a budget increase
- CPM rising while CTR is declining simultaneously

### Response to Saturation
1. Do not increase budget further on a saturated campaign
2. Reallocate the marginal budget to campaigns with more headroom
3. Expand the audience (broader targeting, new interest segments, lookalike expansion)
4. Refresh creative to re engage the existing audience
5. Consider shifting budget to a different platform where the same audience can be reached with fresh inventory

---

## Cross Platform Portfolio Rebalancing

### When to Rebalance
Rebalancing is triggered by any of the following:
- One platform blended contribution has declined for 3 or more consecutive weeks without an identifiable temporary cause
- A new platform has proven itself through the testing phase and is ready to absorb meaningful budget
- Seasonal shifts create different demand patterns across platforms (for example, search demand surges during high intent seasons while social remains flat)
- A platform undergoes significant algorithm changes, policy changes, or auction dynamic shifts that materially impact performance
- The client business model shifts (new product categories, new markets, new customer segments) in ways that favor different platforms

### How to Rebalance
1. Calculate the blended ROAS contribution of each platform using the cross platform reconciliation methodology from the reporting pipeline framework
2. Rank platforms by marginal efficiency: which platform would generate the most incremental return from the next dollar of spend?
3. Shift budget in 10% increments from the lowest marginal efficiency platform to the highest
4. Monitor for 7 to 14 days before making additional adjustments
5. Never move more than 25% of a platform budget in a single rebalancing cycle

### Rebalancing Constraints
- Never reduce a platform budget below the minimum required for its algorithms to function. Google Smart Bidding needs enough daily budget to generate its minimum conversion targets. Meta ad sets need enough budget to exit learning phase.
- Account for attribution lag. Meta and TikTok view through conversions may take 24 to 48 hours to appear in reporting. Do not rebalance based on incomplete data.
- Consider the portfolio effect. Some platforms serve awareness and discovery roles that do not show direct conversions but support conversion performance on other platforms. Cutting these channels may cause a delayed drop in overall performance.

---

## Pacing Alert Thresholds

### Daily Pacing
Expected Daily Spend = Monthly Budget / Days in Month

| Status | Range | Action |
|--------|-------|--------|
| On Track | 85% to 115% of expected daily | No action needed |
| Underpacing | 70% to 84% of expected daily | Investigate within 24 hours |
| Severely Underpacing | Below 70% of expected daily | Investigate immediately |
| Overpacing | 116% to 130% of expected daily | Monitor for 48 hours, adjust if persistent |
| Severely Overpacing | Above 130% of expected daily | Investigate immediately, cap if needed |

### Monthly Pacing (Checked Weekly)
Expected Spend to Date = (Monthly Budget / Days in Month) x Days Elapsed

| Status | Range | Action |
|--------|-------|--------|
| On Track | 95% to 105% of expected pace | No action needed |
| Slightly Off | 85% to 94% or 106% to 115% | Note in weekly summary, monitor |
| Significantly Off | Below 85% or above 115% | Diagnose cause, adjust within 48 hours |

### Common Underpacing Causes and Fixes
- Campaign limited by budget with high performance: increase budget (follow 20% rule)
- Ad disapprovals reducing available inventory: fix disapprovals immediately
- Audience too narrow: expand targeting or add new ad sets
- Bid caps set too low: raise bid caps or switch to uncapped strategy if performance supports it
- Seasonal demand drop: confirm with historical data, reduce monthly target if warranted

### Common Overpacing Causes and Fixes
- Broad match keywords capturing excessive volume: review search terms, add negatives
- Audience expansion enabled without intent: disable audience expansion or narrow targeting
- Budget recently increased and algorithm is front loading delivery: monitor for 48 hours before acting
- Competitive withdrawal from the auction creating cheaper inventory: allow overpacing if performance is strong

---

## Budget Utilization Reporting

At the end of each month, report the following for each platform and in aggregate:
- Total budget allocated vs total budget spent
- Utilization rate (spent / allocated x 100)
- Performance per dollar (blended ROAS per platform, blended CPA per platform)
- Efficiency ranking: which platform delivered the best marginal return?
- Recommended allocation adjustments for the following month with projected impact

Target utilization rate is 95% to 100%. Consistent underutilization below 90% indicates the budget exceeds available demand at acceptable performance levels. Consistent overutilization above 100% (possible on Google Ads due to daily overspend allowance) should be monitored for quality.
