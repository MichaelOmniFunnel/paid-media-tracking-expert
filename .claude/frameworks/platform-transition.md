# OFM Platform Transition and Migration Framework

## Purpose

Platform transitions are among the highest risk operations in paid media management. Whether adding a new platform to the media mix, shifting significant budget between platforms, or sunsetting a platform entirely, the potential for performance disruption is substantial. This framework provides a structured methodology for managing transitions while minimizing performance loss, preserving data continuity, and setting realistic expectations with clients.

---

## Pre Transition Baseline Documentation

Before any budget is moved, added, or removed, a comprehensive baseline must be established. This baseline serves as the benchmark against which all transition performance is measured and provides the rollback reference if things go wrong.

### What to Document

**Platform Level Metrics (trailing 30 days and trailing 90 days)**
- Total spend per platform
- Total conversions per platform (platform reported)
- Blended ROAS and blended CPA (from the reporting pipeline reconciliation methodology)
- Platform ROAS and platform CPA (for trend comparison)
- CPM, CPC, CTR by platform
- Conversion rate by platform
- New customer acquisition rate by platform (if available)

**Campaign Level Metrics**
- Top performing campaigns by ROAS and by volume on each platform
- Budget allocation per campaign
- Audience definitions and sizes on each platform
- Creative inventory and performance metrics per platform
- Bid strategy settings and targets per campaign

**Commerce Platform Baseline**
- Total revenue for the trailing 30 and 90 day periods
- Revenue by source/channel (UTM based or native attribution)
- Average order value
- New vs returning customer split
- Conversion rate from the site overall

**Tracking Infrastructure**
- All active conversion actions per platform
- CAPI / Events API status and event match quality scores
- Server side event volume per platform
- Deduplication confirmation status

### Why This Matters
During a transition, performance will fluctuate. Without a documented baseline, it is impossible to distinguish between expected transition turbulence and a genuine problem that requires intervention. The baseline also protects the agency: if the client questions performance during the transition, the documented baseline provides objective context.

---

## Data Loss Mitigation Strategies

Every transition carries a risk of data loss. This includes loss of algorithmic learning, audience data, conversion history, and optimization signals that the existing platform has accumulated over months or years of running.

### Audience Data Preservation
- Export all custom audiences, lookalike seed audiences, and remarketing lists before any platform is sunset
- On Meta: download Custom Audience lists and note all Lookalike configurations (source audience, percentage, country)
- On Google: export all audience segments, customer match lists, and remarketing list definitions
- On TikTok: document all custom and lookalike audience configurations
- If moving budget between platforms, build equivalent audiences on the destination platform before shifting spend

### Conversion History
- Export conversion data from any platform being sunset at the most granular level available
- Store campaign, ad set, and ad level performance data for at least 12 months trailing
- This data is critical for year over year comparisons and for understanding what worked historically

### Pixel and Event Data
- If sunsetting a platform, do not immediately remove its pixel or tracking code. Leave it in place for at least 30 days after budget is fully removed so that attribution for any trailing conversions is captured.
- If adding a new platform, install tracking and pixels at least 14 days before launching any paid campaigns. This allows the pixel to accumulate baseline data and begin building retargeting audiences.

### Creative Assets
- Download all ad creative (images, videos, copy) from any platform being sunset
- Document creative performance metrics so that winning creative concepts can be adapted for the new platform
- Note platform specific creative specs and requirements for the destination platform

---

## Audience Building Timeline by Platform

Each platform requires different volumes of data and time to build effective audience signals. Launching campaigns before these thresholds are met results in inefficient spend and poor initial performance, which can create a negative feedback loop.

### Meta Ads
- **Learning Phase Requirement:** Each ad set needs approximately 50 conversion events per week to exit the learning phase. With fewer than 50 weekly conversions, the ad set will remain in "Learning Limited" and delivery will be unstable.
- **Pixel Warm Up Period:** Install the Meta Pixel at least 14 days before launching campaigns. This builds retargeting pools and gives the pixel enough event data for initial optimization.
- **Lookalike Audiences:** Require a minimum source audience of 1,000 people for reasonable quality. The ideal source audience is 1,000 to 50,000.
- **Advantage+ Audiences and Broad Targeting:** These work best when the pixel has at least 30 days of conversion history with a minimum of 100 total conversion events.
- **Expected Stabilization:** 2 to 4 weeks for ad sets to exit learning and reach stable performance. 4 to 6 weeks for the account to build enough signal for Advantage+ and broad targeting to function well.

### Google Ads
- **Smart Bidding Learning Period:** tROAS and tCPA strategies require approximately 2 to 4 weeks to learn after activation. During this period, performance may fluctuate significantly.
- **Minimum Conversion Volume:** Google recommends at least 15 conversions per campaign in the past 30 days for tROAS, and at least 30 conversions per campaign in the past 30 days for tCPA. Below these thresholds, Smart Bidding is unreliable.
- **P MAX Learning:** New P MAX campaigns typically require 4 to 6 weeks to fully ramp. Performance in the first 2 weeks is not indicative of long term results.
- **Audience Signals:** P MAX audience signals are suggestions, not restrictions. The algorithm needs time to discover which signals actually drive conversions. Allow 2 to 4 weeks before evaluating audience signal effectiveness.
- **Expected Stabilization:** 2 to 4 weeks for Search campaigns with Smart Bidding. 4 to 6 weeks for P MAX campaigns. 6 to 8 weeks for the full account to reach optimal performance.

### TikTok Ads
- **Algorithm Learning:** TikTok optimization algorithms are less mature than Meta and Google. They require more time and more data to stabilize.
- **Minimum Conversion Volume:** TikTok recommends at least 50 conversions per ad group per week for stable optimization. This is a high bar and often requires starting with upper funnel objectives (traffic, video views) before shifting to conversion optimization.
- **Pixel Warm Up Period:** Install the TikTok Pixel and Events API at least 21 days before launching conversion campaigns. TikTok signal building is still maturing compared to Meta.
- **Creative Dependency:** TikTok performance is more dependent on creative quality and freshness than any other platform. Budget will not fix bad creative on TikTok.
- **Expected Stabilization:** 3 to 4 weeks for traffic and engagement campaigns. 6 to 8 weeks for conversion campaigns to reach stable performance. Ongoing creative refresh is required every 2 to 3 weeks to maintain performance.

---

## Performance Cliff Management

### What to Expect
During any significant platform transition, expect a performance dip. This is normal and unavoidable. The magnitude and duration depend on the type of transition:

- **Adding a new platform (incremental budget):** Expect a 10% to 20% blended efficiency drop during the first 4 to 6 weeks as the new platform ramps. The existing platforms should maintain their performance, so the impact is limited to the new spend being less efficient initially.
- **Shifting budget between platforms:** Expect a 20% to 30% blended efficiency drop during the transition. The platform receiving budget needs time to learn, while the platform losing budget may see short term instability from reduced volume.
- **Sunsetting a platform entirely:** Expect a 20% to 40% blended efficiency drop if the sunsetted platform was contributing meaningfully. Some of its attributed conversions were incremental, and those will not immediately transfer to the remaining platforms.

### Why the Cliff Happens
1. **Loss of algorithmic learning:** Every dollar spent on the existing platform has been optimized by its algorithm over time. Starting fresh on a new platform means starting from zero learning.
2. **Audience building from scratch:** The new platform has no pixel data, no conversion history, and no retargeting pools. It is guessing until it builds signal.
3. **Creative adaptation:** Creative that works on one platform rarely works on another without modification. The creative learning curve compounds the performance dip.
4. **Attribution disruption:** Cross platform attribution patterns change during transitions. The overlap factor will shift and may take 4 to 6 weeks to stabilize into a new pattern.

### Managing the Cliff
- Set client expectations explicitly before the transition begins (see client communication section below)
- Monitor blended metrics daily during the transition period
- Do not panic optimize during the first 2 to 3 weeks unless there are critical issues (tracking failures, massive overspend, policy violations)
- Allow algorithms time to learn before making bid or budget adjustments
- Have sufficient creative ready for the new platform before launching (minimum 3 to 5 ad variations per ad set)

---

## Phased Rollout Approach

Never transition all budget at once. Use a phased approach that limits exposure while validating performance on the new platform.

### Phase 1: Test (10% of transition budget)
**Duration:** 2 to 4 weeks
**Objective:** Validate that the new platform can deliver conversions at any cost

- Allocate 10% of the budget intended for the new platform
- Focus on the highest intent audiences (remarketing, customer match, bottom funnel)
- Use the strongest proven creative adapted for the new platform
- Primary metric: are conversions happening at all? Is tracking working correctly?
- Do not evaluate efficiency during this phase. The goal is proof of concept.

**Exit Criteria for Phase 2:**
- Conversions are registering correctly in the platform and in the commerce system
- Tracking is verified as working end to end (pixel, CAPI/Events API, deduplication)
- There is no technical blocker preventing campaign delivery
- At least 7 days of data have been collected

### Phase 2: Scale (25% of transition budget)
**Duration:** 3 to 4 weeks
**Objective:** Validate that the platform can deliver conversions at an acceptable cost

- Increase to 25% of the intended budget (follow the 20% scaling rule for the increase)
- Expand audiences beyond remarketing to include prospecting segments
- Introduce additional creative variations
- Begin optimizing toward efficiency targets (CPA, ROAS)
- Allow the algorithm to complete its learning phase before judging results

**Exit Criteria for Phase 3:**
- CPA or ROAS is within 30% of the eventual target (allowing for the performance cliff)
- The platform has exited learning phase on primary ad sets
- Conversion volume is trending in the right direction
- There are no structural concerns about audience quality, creative performance, or tracking

### Phase 3: Full Migration (100% of transition budget)
**Duration:** 4 to 6 weeks to stabilize
**Objective:** Reach full budget deployment at target efficiency

- Scale to the full intended budget using the 20% rule over multiple increments
- Expand creative testing across multiple concepts and formats
- Build out full audience architecture (prospecting, retargeting, customer match, lookalike)
- Optimize toward final CPA or ROAS targets
- Monitor the blended portfolio metrics to confirm the transition is net positive

**Stabilization Criteria:**
- Performance within 15% of the pre transition blended baseline for 14 consecutive days
- The new platform has been running at full budget for at least 21 days
- All algorithmic learning phases are complete
- Blended overlap factor has stabilized into a predictable new range

---

## Cross Platform Attribution During Transition

Attribution becomes especially unreliable during platform transitions because the historical overlap patterns are disrupted. Follow these guidelines:

### During the Transition
- Increase the frequency of cross platform reconciliation from monthly to weekly
- Use the commerce platform as the single source of truth more heavily than usual
- Expect the overlap factor to fluctuate. Do not anchor decisions to platform reported numbers.
- Monitor GA4 source/medium data as the neutral tiebreaker for understanding where conversions are actually coming from
- Track the new platform separately in blended reporting. Do not blend its metrics with established platforms until it has reached Phase 3 stabilization.

### Post Transition
- Allow 4 to 6 weeks after full migration before recalculating the standard overlap factor
- Establish a new baseline that reflects the updated platform mix
- Document the new attribution patterns so future reporting reflects the correct cross platform dynamics

---

## Rollback Criteria and Decision Points

Not every transition succeeds. Having clear rollback criteria prevents the sunk cost fallacy from driving continued investment in a failing transition.

### Phase 1 Rollback Triggers
- Zero conversions after 14 days of running with working tracking
- Tracking cannot be verified as working correctly after 7 days of troubleshooting
- Platform policy violations that cannot be resolved prevent the core campaign structure from running
- CPA is more than 5x the target with no improvement trend

### Phase 2 Rollback Triggers
- CPA or ROAS is more than 3x worse than the target after the learning phase has completed
- The platform has remained in "Learning Limited" for more than 3 consecutive weeks despite sufficient budget
- Conversion quality is substantially lower than other platforms (higher return rate, lower close rate, lower AOV)
- The blended portfolio performance has declined by more than 25% with no recovery trend after 4 weeks

### Phase 3 Rollback Triggers
- After 6 weeks at full budget, blended performance is still more than 20% below the pre transition baseline
- The platform shows no improvement trend over 3 consecutive weeks of optimization
- The cost of maintaining the platform (creative production, management time, tracking overhead) exceeds the incremental value it provides

### How to Roll Back
1. Reduce budget on the new platform using the reverse of the scaling approach (20% reductions per week)
2. Simultaneously increase budget on the proven platforms to absorb the returning spend
3. Do not remove the pixel or tracking code immediately. Allow 30 days for attribution to complete.
4. Document what was learned: what worked, what did not, what would need to change for a future attempt
5. Communicate the rollback to the client transparently, focusing on what was learned and the strategic rationale

---

## Client Communication Templates

### Pre Transition Communication

Setting expectations before the transition begins is critical. Clients who understand the expected performance dip and timeline are far less likely to lose confidence during the transition period.

**Key points to communicate:**
- Why the transition is strategically valuable (new audience reach, diversification, better alignment with customer behavior)
- The phased approach being used and the timeline for each phase
- The expected performance dip: 20% to 40% efficiency drop during the transition period is normal
- The expected recovery timeline: 4 to 8 weeks depending on the platform and transition type
- The rollback criteria: clear, objective triggers that would cause us to reverse course
- The monitoring cadence: we will report weekly during the transition instead of monthly

### During Transition Updates

**Weekly update structure:**
- Current phase and how far through it we are
- Performance vs the pre transition baseline (blended metrics)
- Performance on the new platform specifically (what is working, what is being optimized)
- Any issues encountered and how they are being addressed
- Whether we are on track to proceed to the next phase or if adjustments are needed
- Specific next steps for the coming week

### Post Transition Communication

**Key points to communicate:**
- Summary of the transition timeline and what happened at each phase
- Current performance vs the pre transition baseline
- New steady state metrics and updated targets going forward
- What was learned during the transition that informs future strategy
- Any ongoing optimization opportunities on the new platform

---

## Historical Data Validation Methodology

When evaluating a transition after the fact, use this methodology to determine whether it was actually successful or whether the numbers are misleading.

### Same Period Comparison
Compare the 30 day period immediately after full migration (Phase 3 stabilization) against the 30 day period immediately before the transition began. Use blended metrics from the commerce platform, not platform reported numbers.

### Year Over Year Comparison
If seasonal factors are present, compare the transition period to the same period in the prior year. Apply the seasonality index to normalize for seasonal variation.

### Incrementality Assessment
The ultimate question is whether the new platform is generating incremental revenue or just claiming credit for conversions that would have happened anyway. If total commerce revenue did not increase proportionally to the additional spend, the new platform may be cannibalizing rather than adding value. Monitor total blended ROAS: if adding a platform increases total spend but blended ROAS declines and total revenue does not increase proportionally, the new platform is not truly incremental.

### LTV Comparison
Track the lifetime value of customers acquired through the new platform vs existing platforms. A platform that generates lower LTV customers may appear efficient on a CPA basis but underperform on a long term value basis. This comparison requires at least 90 days of cohort data post transition.
