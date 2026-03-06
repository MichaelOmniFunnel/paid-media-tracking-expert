# OFM Automated Reporting Pipeline Framework

## Reporting Philosophy

### Single Source of Truth
No individual ad platform tells the truth about revenue. Google Ads, Meta Ads, and TikTok Ads each use their own attribution models, windows, and conversion counting methods. The sum of platform reported conversions will always exceed actual orders because multiple platforms claim credit for the same conversion.

The single source of truth for revenue and orders is always the commerce platform: Shopify, WooCommerce, or NetSuite. Every report begins by anchoring to actual revenue from the commerce system, then works backward to understand how each ad platform contributed.

For lead generation clients, the single source of truth is the CRM or lead management system (including CallRail for phone leads), not the ad platforms.

### Blended Metrics as the Decision Layer
Individual platform ROAS is useful for understanding relative efficiency but never for making absolute budget decisions. All budget, scaling, and cut decisions use blended metrics that account for cross platform overlap and organic contribution.

### Platform Data as Directional Signal
Platform reported metrics (ROAS, CPA, conversions) are used for three purposes only:
1. Comparing performance within the same platform over time (apples to apples trends)
2. Identifying which campaigns, ad sets, or creatives are performing relatively better or worse
3. Feeding optimization algorithms with the signals they need to improve delivery

Platform data is never used to calculate total revenue, total ROI, or total business impact.

---

## Data Collection Methodology

### Google Ads
Pull the following at each reporting cadence:
- Account level: total spend, conversions, conversion value, all conversion actions count
- Campaign level: spend, impressions, clicks, conversions, conversion value, cost per conversion, conversion rate, impression share, search impression share (search campaigns), CTR, avg CPC
- Ad group level (for search): same metrics plus search terms report
- Asset performance (P MAX): asset group performance, listing group performance
- Audience segments: performance by audience segment where available
- Conversion action breakdown: conversions by action name to verify tracking health
- Change history: any automated or manual changes during the period

### Meta Ads
Pull the following at each reporting cadence:
- Account level: total spend, results, cost per result, ROAS, reach, frequency, impressions, CPM
- Campaign level: spend, results, cost per result, ROAS, reach, frequency, impressions, CPM, CTR (link), CPC (link)
- Ad set level: same metrics plus audience breakdown, placement breakdown
- Ad level: same metrics plus creative performance (thumb stop rate for video, CTR, hook rate)
- Attribution window breakdown: 1 day click, 7 day click, 1 day view (always report on 7 day click / 1 day view default)
- Events Manager: event match quality score, server events received, deduplication rate
- Estimated conversions vs observed conversions breakdown

### TikTok Ads
Pull the following at each reporting cadence:
- Account level: total spend, conversions, CPA, impressions, clicks, CTR, CPM
- Campaign level: spend, conversions, CPA, impressions, clicks, CTR, CPM, ROAS (if ecommerce)
- Ad group level: same metrics plus audience breakdown
- Ad level: same metrics plus video performance (average watch time, completion rate, engagement rate)
- Events Manager: event health, pixel fire counts, Events API status

### GA4
Pull the following as the neutral attribution layer:
- Sessions by source/medium
- Conversions by source/medium (default channel grouping)
- E commerce revenue by source/medium
- User acquisition vs traffic acquisition comparison
- Key events and conversion counts
- Engagement metrics: engaged sessions, engagement rate, average engagement time
- Audience overlap analysis between paid channels
- Landing page performance: sessions, bounce rate, conversions, revenue

### Shopify / WooCommerce / NetSuite
Pull as the single source of truth:
- Total orders and total revenue for the period
- Orders by source/channel where available (UTM based or native attribution)
- Average order value
- New customer orders vs returning customer orders
- Product category revenue breakdown
- Refunds and returns for net revenue calculation
- Discount code usage and impact on revenue
- Gross margin data where available (for POAS calculation)

### Klaviyo
Pull email and SMS performance:
- Revenue attributed to email/SMS flows and campaigns
- Email campaign performance: sends, opens, clicks, conversions, revenue
- Flow performance: flow name, recipients, conversions, revenue
- List growth: new subscribers, unsubscribes, net growth
- Attributed revenue as percentage of total (to understand owned channel contribution)

### CallRail
Pull call tracking data:
- Total calls by tracking number / source
- First time callers vs repeat callers
- Qualified calls (based on duration threshold or tag)
- Calls by Google Ads campaign (via dynamic number insertion)
- Call to conversion rate (calls that resulted in a sale or appointment)
- Missed call rate and after hours call volume

---

## Standard KPI Definitions and Formulas

### Blended Performance Metrics

**Blended ROAS** = Total Commerce Platform Revenue / Total Ad Spend Across All Platforms
- Use actual revenue from Shopify, WooCommerce, or NetSuite
- Total ad spend includes Google Ads + Meta Ads + TikTok Ads + any other paid channels
- Exclude email/SMS attributed revenue if the client wants to isolate paid media performance
- Target varies by vertical: ecommerce typically 3.0 to 5.0x, high margin products can sustain 2.0x

**POAS (Profit on Ad Spend)** = Gross Profit from Ad Attributed Sales / Total Ad Spend
- Gross profit = Revenue minus COGS minus fulfillment minus estimated returns
- Requires product level margin data from the client
- Superior to ROAS because it accounts for margin variation across products
- Target: typically 1.5x or higher depending on margin structure

**Blended CPA** = Total Ad Spend Across All Platforms / Total Conversions from Commerce Platform
- Conversions = actual orders, leads, or appointments from the source of truth system
- Not the sum of platform reported conversions (that would double count)

**Blended CPL** = Total Ad Spend / Total Qualified Leads (from CRM + CallRail)
- Only count unique leads, deduplicated across platforms
- Separate qualified leads from total leads for cost per qualified lead

### Platform Specific Metrics

**Platform ROAS** = Platform Reported Conversion Value / Platform Spend
- Useful for within platform trend analysis only

**CPA (Cost Per Acquisition)** = Platform Spend / Platform Reported Conversions
- Use for relative comparison within the platform, not absolute decision making

**CPM (Cost Per Thousand Impressions)** = (Platform Spend / Impressions) x 1000
- Key efficiency metric for awareness and reach campaigns
- Benchmark: Meta $8 to $15 for prospecting, Google Display $3 to $8, TikTok $6 to $12

**CPC (Cost Per Click)** = Platform Spend / Clicks
- Use link clicks for Meta (not all clicks)
- Google: actual CPC from the auction

**CTR (Click Through Rate)** = Clicks / Impressions x 100
- Google Search benchmark: 3% to 8%
- Meta feed benchmark: 0.8% to 2.0%
- TikTok benchmark: 0.5% to 1.5%

**CVR (Conversion Rate)** = Conversions / Clicks x 100
- Platform level CVR for optimization signals
- Landing page CVR = conversions / landing page sessions x 100

**Frequency** = Impressions / Reach
- Monitor for creative fatigue. Alert thresholds: >3.0 for cold audiences, >8.0 for remarketing

**AOV (Average Order Value)** = Total Revenue / Total Orders
- From commerce platform, not ad platform

### Ecommerce Metrics

**Revenue** = Gross revenue from commerce platform for the period (before refunds: gross; after refunds: net)

**Orders** = Total completed orders from the commerce platform

**New vs Returning Customer Rate** = New Customer Orders / Total Orders x 100
- Critical for understanding if paid media is driving growth or just recapturing existing customers
- New customer rate below 40% on prospecting campaigns is a red flag

**LTV (Lifetime Value)** = Average Revenue Per Customer Over Their Lifetime
- For reporting: use 12 month LTV as the standard window
- LTV = (AOV x Purchase Frequency x Customer Lifespan)
- LTV to CAC ratio target: 3:1 or higher

### Lead Gen Metrics

**CPL (Cost Per Lead)** = Total Spend / Total Leads
- Include form submissions + phone calls + chat leads

**Cost Per Qualified Lead** = Total Spend / Qualified Leads (after lead scoring or sales qualification)
- This is the metric that matters; raw CPL is directional only

**Call Conversion Rate** = Qualified Calls / Total Calls x 100
- Qualified = meets duration threshold (typically 60 to 120 seconds) or manually tagged

---

## Reporting Cadence

### Daily Checks (5 to 10 minutes)
**What to review:**
- Spend pacing: is each platform spending at or near its daily budget?
- Any campaigns paused, limited, or in error state
- Conversion volume: are conversions registering today? Any zeroes on active campaigns?
- CPM or CPC spikes that exceed 30% of trailing 7 day average

**Format:** Internal only. No document produced. Flag anomalies to Michael immediately via conversation.

### Weekly Summaries (produced every Monday for prior week)
**What to review:**
- Week over week performance comparison across all platforms
- Blended ROAS/CPA for the week vs prior week vs target
- Budget pacing against monthly budget
- Creative performance: any new winners or fatigued creative
- Audience performance shifts
- Tracking health: any event count anomalies or match quality changes

**Format:** Internal summary table. 1 page max. Highlight anything that deviates from expectations.

### Monthly Deep Dives (produced by 5th business day of following month)
**What to review:**
- Full month performance vs targets
- Month over month comparison
- Year over year comparison (if data available)
- Blended metrics calculated from commerce platform actuals
- Platform reconciliation (see methodology below)
- Budget utilization and efficiency
- Creative performance cycle (what launched, what worked, what fatigued)
- Audience insights and shifts
- Actionable recommendations for next month

**Format:** Full client facing report following the Monthly Performance Report recipe in deliverable-recipes.md

### Quarterly Reviews (produced within 10 business days of quarter end)
**What to review:**
- Quarter performance vs quarterly targets and annual goals
- Trend analysis: are KPIs improving, declining, or flat?
- Cohort analysis: customers acquired in each month and their subsequent behavior
- Channel mix effectiveness: is the portfolio allocation optimal?
- Competitive landscape changes
- Strategic recommendations for next quarter
- Budget recommendation for next quarter with projected impact
- Seasonality forecast for upcoming quarter

**Format:** Comprehensive review document with strategic recommendations. Suitable for executive stakeholder presentation.

---

## Cross Platform Data Reconciliation Methodology

### Step 1: Establish the Baseline
Pull actual revenue and order count from the commerce platform for the exact date range.

### Step 2: Sum Platform Reported Conversions
Add up conversions claimed by Google Ads + Meta Ads + TikTok Ads for the same date range.

### Step 3: Calculate the Overlap Factor
Overlap Factor = Sum of Platform Conversions / Actual Commerce Conversions
- Overlap Factor of 1.0 = platforms are perfectly aligned (rare)
- Overlap Factor of 1.3 = platforms are collectively overclaiming by 30% (normal)
- Overlap Factor above 2.0 = significant measurement issues need investigation

### Step 4: Calculate Platform Contribution Estimates
Use GA4 source/medium data as the neutral tiebreaker:
- GA4 paid search sessions that converted / total GA4 converting sessions = Google Ads estimated share
- GA4 paid social sessions that converted / total GA4 converting sessions = Meta/TikTok estimated share
- Apply these ratios to actual commerce revenue to estimate true platform contribution

### Step 5: Track the Reconciliation Over Time
The overlap factor should be relatively stable month to month. If it changes significantly (more than 20%), investigate:
- Tracking changes (new events, broken tags, pixel updates)
- Attribution window changes
- Significant campaign strategy shifts (new awareness spend changes the overlap pattern)
- Platform algorithm changes or reporting updates

---

## Anomaly Detection Rules

### Immediate Alerts (within hours)
- Any platform spend exceeding 150% of daily budget
- Zero conversions on a campaign that normally converts daily
- Tracking pixel or CAPI reporting zero events for more than 4 hours
- CPM spike above 50% of 7 day trailing average
- Campaign or ad set paused by the platform (policy violation, billing issue)
- Event Match Quality dropping below 5.0 (Meta)

### Daily Monitoring Alerts
- CPA exceeding target by more than 30% for 2 consecutive days
- ROAS falling below target by more than 25% for 2 consecutive days
- Click through rate dropping below 50% of 30 day average
- Impression share dropping below 50% on branded search campaigns
- Frequency exceeding 3.0 on prospecting campaigns
- Spend pacing falling below 80% of expected daily rate

### Weekly Review Alerts
- Week over week blended ROAS decline of more than 15%
- Any platform CPA increase of more than 20% WoW
- Creative fatigue signals: CTR decline plus frequency increase on same ad
- Budget pacing off track (less than 90% or more than 105% of expected monthly pace)
- Conversion volume decline of more than 20% WoW without corresponding spend decrease
- New customer acquisition rate declining WoW

### Monthly Deep Dive Alerts
- Blended metrics declining for 2 or more consecutive months
- Commerce platform revenue diverging from platform reported revenue by more than historical norms
- AOV shifting more than 10% without a known cause (pricing change, product mix shift)
- LTV to CAC ratio falling below 3:1
- Channel mix efficiency declining (same spend, less revenue)

---

## Budget Pacing Methodology

### Daily Pacing
Expected Daily Spend = Monthly Budget / Days in Month
Daily Pace = Actual Spend Today / Expected Daily Spend x 100
- Green: 85% to 115%
- Yellow: 70% to 84% or 116% to 130%
- Red: below 70% or above 130%

### Monthly Pacing (checked weekly)
Expected Spend to Date = (Monthly Budget / Days in Month) x Days Elapsed
Monthly Pace = Actual Spend to Date / Expected Spend to Date x 100
- On track: 95% to 105%
- Slightly off: 85% to 94% or 106% to 115%
- Significantly off: below 85% or above 115%

### Pacing Correction Actions
- Underpacing by more than 15%: Check for limited campaigns, exhausted audiences, bid caps too low, ad disapprovals
- Overpacing by more than 15%: Check for runaway broad match, audience expansion, or budget allocation errors
- Consistent underpacing: may indicate the budget exceeds demand; recommend reallocation to another platform or campaign type

---

## Cohort Analysis Approach

### Purpose
Measure the true cost of acquiring a customer and their value over time, rather than relying on single transaction metrics.

### Monthly Acquisition Cohorts
Group all new customers by the month they were first acquired. Track each cohort over subsequent months:

- Month 0: acquisition cost and first purchase revenue
- Month 1: repeat purchase rate, additional revenue, cumulative revenue
- Month 2 through 12: same tracking, building the LTV curve

### Calculation
- Cohort CAC = Total ad spend in acquisition month / New customers acquired that month
- Cohort Revenue at Month N = cumulative revenue from that cohort through month N
- Cohort ROAS at Month N = Cohort Revenue at Month N / Total ad spend for acquisition
- Payback Period = the month at which cumulative revenue exceeds cumulative cost

### Application
- Use cohort data to justify higher upfront CPAs if payback period is acceptable
- Compare cohort quality across platforms: do Google acquired customers have higher LTV than Meta acquired?
- Identify seasonal cohort quality differences (holiday shoppers may have lower repeat rates)

---

## MoM and YoY Comparison Methodology

### Month over Month
- Compare the same date range length (e.g., March 1 to 31 vs February 1 to 28)
- Always note the day count difference if months have different lengths
- Account for billing cycle differences (some platforms report on UTC, commerce platforms on local time)
- Note any external factors: holidays, promotions, pricing changes, competitive shifts

### Year over Year
- Compare the same month in the prior year
- Also compare the same week numbers if monthly comparison is misleading due to day of week distribution
- Always note known differences: new platforms added, budget changes, product catalog changes, website redesigns, tracking changes

### Seasonality Adjustments
- Build a seasonality index from at least 12 months of historical data
- Seasonality Index for Month X = Average Revenue in Month X / Average Monthly Revenue Across All Months
- Seasonality Adjusted Performance = Actual Performance / Seasonality Index
- This reveals whether performance changes are due to real improvement or just seasonal patterns
- For newer accounts without 12 months of data, use industry vertical benchmarks as a proxy for seasonality patterns
- Key seasons to account for: Q4 holiday (ecommerce), tax season (financial), back to school, summer slowdowns, Black Friday/Cyber Monday

### Reporting Presentation
- Always present both raw numbers and seasonality adjusted numbers
- Use MoM for tactical decisions (what changed recently)
- Use YoY for strategic decisions (are we actually growing)
- Highlight when seasonal factors explain apparent performance changes to prevent overreaction
