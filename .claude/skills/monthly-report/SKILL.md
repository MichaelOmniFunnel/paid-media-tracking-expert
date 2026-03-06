---
name: monthly-report
description: Generate comprehensive monthly performance report pulling data from all platforms with blended metrics and anomaly detection. Use when someone mentions 'monthly report', 'performance report', 'client report', 'how did we do this month', or end of month reporting.
argument-hint: "[client-name] [month]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# Monthly Client Performance Report

Generate a comprehensive monthly performance report for a client by pulling data from all platforms, reconciling against actuals, calculating blended metrics, running anomaly detection, and producing a draft report for Michael's review.

## Context

This command orchestrates the full monthly reporting workflow for any OFM client. It follows the reporting pipeline framework defined in .claude/frameworks/reporting-pipeline.md and formats the output according to the Monthly Performance Report recipe in .claude/frameworks/deliverable-recipes.md.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Reporting month and year (required, e.g., "February 2026")
- Any specific notes or context for the period (optional, e.g., "launched new creative mid month" or "Black Friday included")

## Instructions

### Step 1: Pull Data from All Active Platforms

Read the client profile from clients/{client-name}/profile.md to identify which platforms are active.

For each active platform, pull the data specified in the reporting pipeline framework:

**Google Ads:** Navigate to the Google Ads UI via Chrome. Pull account level and campaign level metrics for the reporting month. Capture spend, conversions, conversion value, CPA, ROAS, impression share, CTR, CPC. Export or screenshot the campaign performance table. Check the change history for any significant changes made during the month.

**Meta Ads:** Navigate to Meta Ads Manager via Chrome. Pull account level and campaign level metrics for the reporting month. Capture spend, results, cost per result, ROAS, reach, frequency, CPM, CTR. Check Events Manager for event match quality score and any CAPI health issues. Note attribution window being used.

**TikTok Ads:** Navigate to TikTok Ads Manager via Chrome. Pull account level and campaign level metrics. Capture spend, conversions, CPA, CPM, CTR. Check Events Manager for pixel health.

**GA4:** Navigate to GA4 via Chrome. Pull traffic acquisition report by source/medium for the reporting month. Pull e commerce or conversion report by source/medium. Note total sessions, conversions, and revenue attributed to each paid channel.

**Klaviyo (if active):** Pull email/SMS revenue attribution, campaign performance, flow performance, and list growth for the month.

**CallRail (if active):** Pull call volume, qualified calls, and source attribution for the month.

Save all raw data screenshots and exports to clients/{client-name}/reports/{year-month}-raw-data/

### Step 2: Reconcile Platform Data Against Ecommerce Actuals

Navigate to the client's commerce platform (Shopify, WooCommerce, or NetSuite) via Chrome.

Pull actual revenue and order count for the exact reporting period.

Calculate the overlap factor following the reconciliation methodology:
- Sum of all platform reported conversions / Actual commerce conversions = Overlap Factor
- Compare this to the prior month's overlap factor
- If the overlap factor changed by more than 20%, flag for investigation

Calculate estimated platform contribution using GA4 source/medium data as the neutral layer.

Record reconciliation data:
- Actual Revenue: $X
- Actual Orders: X
- Sum of Platform Conversions: X
- Overlap Factor: X.Xx
- Prior Month Overlap Factor: X.Xx
- GA4 Estimated Google Contribution: X%
- GA4 Estimated Meta Contribution: X%
- GA4 Estimated TikTok Contribution: X%

### Step 3: Calculate Blended Metrics

Using the formulas from the reporting pipeline framework:

**Blended ROAS** = Actual Commerce Revenue / Total Ad Spend (all platforms combined)

**POAS** (if margin data available) = Gross Profit from Ad Attributed Sales / Total Ad Spend

**Blended CPA** = Total Ad Spend / Actual Commerce Conversions

**AOV** = Actual Revenue / Actual Orders

**New Customer Rate** = New Customer Orders / Total Orders (if data available from commerce platform)

Calculate the same metrics for the prior month and for the same month last year (if available) to enable MoM and YoY comparison.

Apply the seasonality adjustment if 12+ months of data exist:
- Seasonality Adjusted Blended ROAS = Raw Blended ROAS / Seasonality Index for this month

### Step 4: Run Anomaly Detection

Check all monthly deep dive alert thresholds from the reporting pipeline framework:

- Is blended ROAS declining for 2+ consecutive months?
- Did commerce revenue diverge from platform reported revenue more than historical norms?
- Did AOV shift more than 10% without a known cause?
- Is LTV to CAC ratio below 3:1?
- Is channel mix efficiency declining?

Also check:
- Did any platform's CPA increase more than 20% MoM?
- Did any platform's conversion volume decrease more than 20% MoM without a spend decrease?
- Did creative fatigue set in on any campaigns (rising frequency + declining CTR)?
- Did new customer acquisition rate decline?

Flag all anomalies with severity (critical, high, medium, low) and a brief explanation.

### Step 5: Generate Insights and Recommendations

Based on all data collected, synthesize:

**What Worked:** Identify the top 3 to 5 wins for the month. Be specific about which campaigns, creatives, or audiences drove results. Include data: "UGC testimonial creative launched March 3 drove 2.8x ROAS at $14.20 CPA, outperforming previous best by 35%."

**Challenges and Actions:** Identify underperforming areas. Explain the likely cause. Detail what actions were taken during the month and their results. If no action was taken, recommend what should be done.

**Next Month Plan:** Based on performance trends and anomalies detected, draft 3 to 5 specific recommendations for the upcoming month. Each should be tied to data and expected impact.

**Budget Recommendation:** If current allocation is suboptimal (based on platform efficiency differences and pacing data), recommend specific reallocation with projected impact.

### Step 6: Produce Draft Report for Michael's Review

Compile all findings into a report following the Monthly Performance Report recipe from deliverable-recipes.md:

1. **Performance Summary** with blended metrics scorecard (green/yellow/red status vs targets)
2. **Platform Breakdown** with one section per active platform
3. **What Worked** with specific wins and supporting data
4. **Challenges and Actions** with honest assessment and responses
5. **Next Month Plan** with specific, data driven recommendations

Save the draft report to: clients/{client-name}/reports/{year-month}-monthly-report-DRAFT.md

Update the client's open-items.md with any new action items identified.

Update the client's history.md with a session summary noting the report was generated.

Present the draft to Michael with a brief summary: "Monthly report for [Client Name] for [Month Year] is ready for review. Key highlights: [top 2 to 3 points]. Draft saved to [path]. Want me to walk through it or make any changes?"

## Output

The final deliverable is a draft monthly performance report saved to the client's reports directory, ready for Michael's review and approval before being finalized as a Word document for the client.

## Dependencies

- Requires Chrome browser access to navigate platform UIs
- Requires the reporting pipeline framework at .claude/frameworks/reporting-pipeline.md
- Requires the deliverable recipes at .claude/frameworks/deliverable-recipes.md
- Requires an existing client profile at clients/{client-name}/
