# OFM Performance Degradation Triage Framework

## Purpose

When performance declines, the instinct is to react immediately by changing bids, budgets, audiences, or creative. Most of those reactions make things worse because they address symptoms instead of root causes. This framework provides a systematic, sequential diagnostic process that identifies the actual cause of performance degradation before any corrective action is taken.

The steps are ordered deliberately. Each step must be evaluated before moving to the next because an issue at an earlier step invalidates any conclusions drawn from a later step. If tracking is broken, every performance metric is unreliable and no campaign level analysis is meaningful.

---

## Step 1: Check Tracking

**The question: Did something break in the measurement layer?**

Before assuming performance actually declined, verify that the data you are looking at is accurate. A significant percentage of apparent performance drops are actually tracking failures disguised as delivery problems.

### Diagnostic Questions
- Did conversion volume drop suddenly (cliff drop rather than gradual decline)?
- Did the drop coincide with a website deployment, plugin update, or GTM container publish?
- Are all conversion actions still receiving data in the platform diagnostics?
- Is the Meta Events Manager showing normal event volume and match quality?
- Is the TikTok Events Manager showing events arriving with deduplication working?
- Did Google Ads conversion actions show any warnings, errors, or "no recent conversions" flags?
- Are server side events still flowing through Stape.io?
- Did the client or their developer make any website changes in the past 7 days?

### Metrics to Check
- Event counts in Meta Events Manager (compare last 3 days to prior 3 days)
- Event counts in TikTok Events Manager (same comparison)
- Google Ads conversion action status page (look for any action with zero recent conversions)
- GTM Preview mode on the live site (confirm all tags fire on expected triggers)
- Stape.io server container logs (confirm requests are arriving and being processed)
- GA4 real time report (confirm events are still flowing)
- Compare client side event count to server side event count (sudden divergence indicates a problem)

### Tools to Use
- Google Ads MCP: `mcp__google-ads__run_gaql` to query conversion action status and recent conversion counts
- GA4 MCP: `mcp__google-analytics__run_report` to verify event volumes and compare periods
- Chrome DevTools Network tab filtered to tracking endpoints (facebook.com/tr, analytics.google.com, analytics.tiktok.com)
- GTM Preview and Debug mode
- Meta Events Manager Test Events tool
- Google Ads Conversion Diagnostics (Chrome for visual inspection)
- Stape.io container logs dashboard (Chrome)
- The extract-pixels.js and capture-network-events.js Chrome scripts from the project toolkit

### Resolution Actions
- If tracking broke: fix the tracking issue first. Do not make any campaign changes until tracking is confirmed working. Recalculate performance metrics for the affected period after the fix to establish a true baseline.
- If a website deployment caused the break: document what changed and work with the developer to prevent recurrence. Consider implementing a post deployment tracking verification checklist.
- If a GTM publish caused the break: revert to the previous container version, identify the breaking change, fix it, and republish.

### If Tracking Is Confirmed Healthy
Proceed to Step 2.

---

## Step 2: Check External Factors

**The question: Did something outside of our control change?**

Performance does not exist in a vacuum. Macro factors affect every advertiser in the market simultaneously. Before looking at account level causes, rule out external drivers.

### Diagnostic Questions
- Is this a known seasonal period (post holiday drop, summer slowdown, back to school shift)?
- Did a major competitor launch a promotion, price drop, or aggressive campaign?
- Was there a significant news event, weather event, or cultural moment that shifted consumer behavior?
- Did the client change pricing, promotions, product availability, or shipping terms?
- Are industry wide CPMs elevated (check across all platforms, not just one)?
- Did the economy or consumer confidence shift meaningfully (relevant for high consideration purchases)?

### Metrics to Check
- Google Trends data for the client core keywords (is search interest declining?)
- Auction Insights in Google Ads (are new competitors appearing or existing competitors increasing impression share?)
- CPM trends across all platforms (a simultaneous CPM increase across platforms suggests market wide pressure)
- The client site traffic from organic and direct sources (if all traffic is down, the issue is not ad specific)
- Industry reports or vertical benchmark data for the same period

### Tools to Use
- Google Ads MCP: `mcp__google-ads__run_gaql` against auction_insights for competitor impression share changes
- Google Ads MCP: `mcp__google-ads__get_campaign_performance` for CPM, CPC, and CTR trend data
- GA4 MCP: `mcp__google-analytics__run_report` for source/medium comparison (paid vs organic vs direct trends)
- Google Trends comparison for primary keywords (trailing 30 day view, Chrome)
- Meta Ads CPM trend chart at account level (Chrome or mcp__meta-ads__get_insights)
- Competitor monitoring tools or manual competitor ad review via Meta Ad Library and Google Ads Transparency Center (Chrome)

### Resolution Actions
- If seasonal: adjust expectations to match the seasonality index from the budget pacing framework. Reduce budgets proportionally if the season does not justify current spend levels. Do not try to fight seasonal trends with higher bids.
- If competitive: evaluate whether the competitive shift is temporary (a promotion) or structural (a new permanent competitor). Temporary shifts may not require a response. Structural shifts require strategy adjustment.
- If client driven (pricing change, product issue, stockout): work with the client to resolve the underlying business issue. Ad performance cannot fix a product or pricing problem.
- If macro economic: document the factor and set appropriate expectations. Consider shifting budget toward lower funnel, higher intent campaigns that convert even in soft markets.

### If No External Factors Identified
Proceed to Step 3.

---

## Step 3: Check Platform Changes

**The question: Did the ad platform itself change something?**

Ad platforms make continuous changes to their algorithms, auction mechanics, targeting options, and reporting methodologies. These changes are often unannounced or buried in blog posts and can materially impact performance.

### Diagnostic Questions
- Has Google, Meta, or TikTok announced any algorithm updates, policy changes, or feature deprecations?
- Did the platform force any automatic migrations (such as automated extensions, broad match expansion, or Advantage+ audience defaults)?
- Are there known platform outages or reporting delays?
- Did the platform change how it counts or attributes conversions?
- Are automated recommendations being auto applied by the platform?

### Metrics to Check
- Google Ads Recommendations page (check if any auto applied changes were made)
- Google Ads Change History filtered to "automatic changes"
- Meta Ads platform status page for known issues
- Auction dynamics: are CPMs, CPCs, or conversion rates shifting in ways that affect all campaigns equally?
- Compare performance across campaign types. If every campaign declined equally, a platform level change is more likely than a campaign level issue.

### Tools to Use
- Google Ads Change History with filter for automated and system changes
- Google Ads Recommendations tab (check auto apply settings)
- Meta Business Help Center status page
- Industry forums and communities for reports of similar issues from other advertisers
- Platform specific release notes and update blogs

### Resolution Actions
- If auto applied changes caused the issue: revert the changes immediately and disable auto apply for that recommendation type
- If a platform algorithm update is the cause: document it, allow 7 to 14 days for stabilization before making changes. Reacting to an algorithm shift with additional account changes compounds volatility.
- If a reporting change altered how conversions are counted: recalculate baselines using the new methodology. The actual performance may not have changed.
- If platform outages affected delivery: request credits from the platform rep if applicable. Document the impact period for client reporting.

### If No Platform Changes Identified
Proceed to Step 4.

---

## Step 4: Check Account Changes

**The question: Did we (or someone else with account access) change something?**

The most common cause of performance degradation is a recent account change. This is also the most controllable cause, which makes diagnosis and resolution straightforward.

### Diagnostic Questions
- Were any bid strategies changed in the past 14 days?
- Were any budgets adjusted (especially increases above 20%)?
- Were audiences added, removed, or modified?
- Were campaigns restructured, ad groups reorganized, or ad sets consolidated?
- Were negative keywords added that might be blocking converting traffic?
- Were any ads paused, especially high performing ones?
- Did anyone edit an ad set on Meta that triggered re entry into learning phase?
- Were conversion actions changed, added, or removed?
- Were any bid adjustments modified (device, location, audience, schedule)?

### Metrics to Check
- Google Ads Change History for the past 14 days (every change, regardless of who made it)
- Meta Ads activity log for the past 14 days
- TikTok Ads change log
- Campaign and ad set status: are any showing "Learning" or "Limited" that were previously stable?
- Compare current bid strategy settings to what they were before the performance drop
- Compare current audience definitions to what they were before

### Tools to Use
- Google Ads Change History (filtered by date range starting 3 to 5 days before the performance decline began)
- Meta Ads Account Activity Log
- Platform level segment comparison (this period vs prior period, filtered to changed campaigns)
- Internal client history file to cross reference documented changes

### Resolution Actions
- If a bid strategy change caused the issue: consider reverting to the previous strategy and allowing 14 days to re stabilize. If the change was directionally correct but too aggressive, adjust the target incrementally instead.
- If a budget increase triggered learning phase: wait for learning to complete before making further changes. If the increase was too large, reduce to a more moderate increase (20% rule).
- If audience changes caused the issue: compare the new audience performance to the old. If the new audience is clearly underperforming, revert. If performance is mixed, allow more data before deciding.
- If negative keywords are blocking good traffic: remove the overly aggressive negatives immediately.
- If an ad edit triggered Meta learning phase: do not make additional edits. Wait for learning to complete.

### If No Account Changes Explain the Decline
Proceed to Step 5.

---

## Step 5: Check Creative

**The question: Has the creative stopped resonating with the audience?**

Creative fatigue is one of the most common and most overlooked causes of gradual performance decline. Unlike tracking breaks or account changes, creative fatigue happens slowly and then accelerates, making it easy to miss the inflection point.

### Diagnostic Questions
- How long have the current ads been running without refresh? (More than 4 to 6 weeks on Meta and TikTok is a red flag)
- Has frequency been increasing while CTR has been declining?
- Are CPMs rising on the same audiences?
- Is the decline concentrated in specific ads or ad sets rather than being account wide?
- Has the competitive landscape shifted with new creative approaches appearing?
- Are video completion rates declining (for video creative)?
- Has the thumb stop rate (Meta) or hook rate (TikTok) declined in the past 2 weeks?

### Metrics to Check
- Ad level CTR trend over the past 30 to 60 days
- Frequency per ad and per ad set
- CPM trend at ad set and ad level
- Video metrics: average watch time, 25%/50%/75%/100% completion rates, thumb stop rate
- Relevance diagnostics (Meta): Quality Ranking, Engagement Rate Ranking, Conversion Rate Ranking
- Ad strength and asset performance ratings (Google P MAX and Responsive Search Ads)

### Tools to Use
- Meta Ads Manager with breakdown by time (daily or weekly) at the ad level
- TikTok Ads creative analysis report
- Google Ads asset report for P MAX campaigns
- Google Ads ad variations report for search campaigns
- Meta Ad Library to review competitor creative evolution

### Resolution Actions
- If creative fatigue is confirmed: introduce new creative immediately. Do not pause all existing creative at once. Add new creative to existing ad sets and let the algorithm shift delivery toward the new assets.
- For Meta: introduce 2 to 3 new creative variations per ad set. Test new hooks, new formats (static vs video vs carousel), new messaging angles.
- For TikTok: new creative is critical and should be refreshed every 2 to 3 weeks. TikTok audiences fatigue on creative faster than any other platform.
- For Google Search: test new responsive search ad variations with different headline and description combinations.
- For Google P MAX: replace low performing assets with new ones. Focus on image and video assets first.
- If the decline is ad specific (not all ads declining equally): pause the worst performers and reallocate budget to the still performing creative while new creative is developed.

### If Creative Is Not the Cause
Proceed to Step 6.

---

## Step 6: Check Landing Page

**The question: Has the post click experience deteriorated?**

A decline in conversion rate with stable traffic quality and volume points to a landing page or website issue. This is often the last place people look but can be the most impactful problem.

### Diagnostic Questions
- Has page load speed increased? (Check Core Web Vitals, especially LCP and CLS)
- Did the client make any website changes, even seemingly minor ones?
- Is the conversion path (form, checkout, phone number, chat) still functioning correctly?
- Has the page been tested on mobile recently? (More than 60% of traffic is typically mobile)
- Are there any new pop ups, interstitials, or consent banners interfering with the user experience?
- Has the offer, pricing, or value proposition changed?
- Are there any broken elements: images not loading, buttons not working, forms throwing errors?

### Metrics to Check
- Conversion rate trend at the landing page level (Google Ads landing page report, GA4 landing page report)
- Page speed metrics from Google PageSpeed Insights or CrUX data
- Bounce rate trend for paid traffic landing pages
- Form submission rate (if tracked as a micro conversion)
- Mobile vs desktop conversion rate comparison (a mobile specific drop indicates a mobile UX issue)
- Add to cart rate and checkout completion rate (for ecommerce)
- Session recordings if available (Hotjar, Microsoft Clarity, FullStory)

### Tools to Use
- Google PageSpeed Insights for current LCP, CLS, FID/INP scores
- The audit-page-speed.js Chrome script from the project toolkit
- The check-forms.js Chrome script for form and conversion path analysis
- GA4 Landing Page report filtered to paid traffic
- Google Ads Landing Pages report for landing page experience quality scores
- Manual walkthrough of the conversion path on both mobile and desktop

### Resolution Actions
- If page speed degraded: identify the cause (new scripts, unoptimized images, third party tags) and fix immediately. A 1 second increase in load time can reduce conversion rate by 7% or more.
- If the conversion path is broken: this is critical priority. Fix immediately and calculate the estimated lost conversions for the affected period.
- If mobile UX is the issue: address mobile specific problems (tap targets too small, form fields difficult to complete, content shifting during load).
- If the offer or value proposition changed: this may be intentional. Evaluate whether the new offer is being properly communicated in the ad creative and whether landing page messaging matches ad copy.
- If new pop ups or interstitials are interfering: remove or defer them, especially on mobile. Aggressive pop ups within 5 seconds of page load are a known conversion killer.

---

## Rollback Strategy

When a corrective action is taken at any step and performance worsens further or does not improve within the expected timeframe, a rollback protocol is needed.

### Rollback Decision Criteria
- If a campaign level change (bid, budget, audience, creative) was made as a fix and performance worsened by more than 15% in the 7 days following the change, roll it back.
- If a tracking fix was deployed and conversion counts do not normalize within 48 hours, investigate further rather than assuming the fix worked.
- If a landing page change was deployed and conversion rate does not improve within 7 to 14 days (accounting for statistical significance), revert the page.

### Rollback Process
1. Document what the change was, when it was made, and what the expected outcome was
2. Document the actual outcome with specific metrics
3. Revert the change to the previous state
4. Allow 7 days for performance to restabilize
5. Analyze why the fix did not work and reassess the diagnosis
6. Consider whether the root cause was misidentified and restart the triage at Step 1

### The Golden Rule of Performance Triage
Never make more than one significant change at a time. If multiple issues are identified across different steps, prioritize them and address them sequentially with enough time between each to measure impact. Making simultaneous changes across tracking, bids, audiences, and creative makes it impossible to determine what worked and what did not.

---

## Triage Documentation Template

For every performance triage, document the following in the client history file:

**Date of investigation:**
**Performance decline observed:** (metric, magnitude, timeframe)
**Step 1 (Tracking):** Finding and conclusion
**Step 2 (External):** Finding and conclusion
**Step 3 (Platform):** Finding and conclusion
**Step 4 (Account Changes):** Finding and conclusion
**Step 5 (Creative):** Finding and conclusion
**Step 6 (Landing Page):** Finding and conclusion
**Root cause identified:** (which step, what specifically)
**Corrective action taken:** (what was done, when)
**Expected recovery timeline:** (how long before we expect improvement)
**Actual outcome:** (to be filled in after the recovery period)
