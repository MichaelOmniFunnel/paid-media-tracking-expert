# Bidding Strategy Audit

Comprehensive evaluation of bidding strategies, target alignment, learning phase health, and budget efficiency across all active ad platforms.

## Context

The user wants a thorough assessment of how bidding strategies are configured and performing across a client's advertising accounts. This workflow evaluates whether the right bidding strategy is selected for each campaign given available data volume, whether targets are aligned with actual performance, whether campaigns are stuck in or repeatedly entering learning phase, and whether historical bid changes have helped or hurt. This is critical for accounts where CPA or ROAS has plateaued, where campaigns frequently re-enter learning, or where there is uncertainty about whether the current bidding approach is optimal.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Active ad platforms (required: Google Ads, Meta Ads, TikTok Ads, or a subset)
- Date range to evaluate (optional, defaults to last 90 days)
- Current ROAS or CPA targets per platform (optional, will be discovered from account)
- Known bidding concerns (optional, e.g., "campaigns keep entering learning phase" or "ROAS targets feel too aggressive")
- Business model (ecommerce, lead gen, SaaS, local services)
- Monthly budget per platform (optional, helps evaluate data volume sufficiency)

## Instructions

### Step 1: Load Client Context

Check `clients/{client-name}/` for existing profile, history, and previous findings. Read the full history file before doing anything else so you have complete context on past bidding discussions, strategy changes, and their outcomes.

If no client folder exists, create one following the standard structure.

### Step 2: Pull Current Bidding Configuration Across Platforms

Gather bidding data from each active platform simultaneously:

**Google Ads:** Navigate to the Google Ads UI via Chrome. For every campaign, capture: campaign name, campaign type (Search, Shopping, Performance Max, Display, Demand Gen, Video), current bidding strategy (Manual CPC, Enhanced CPC, Maximize Conversions, Maximize Conversion Value, Target CPA, Target ROAS), current target value (tCPA amount or tROAS percentage), portfolio bid strategy name (if applicable), bid strategy status (Learning, Limited, Eligible, Target exceeded), daily budget, and the date the current bidding strategy was set. Also pull the bid strategy report if available, showing historical target changes and their dates.

**Meta Ads:** Use the Meta Ads MCP tools or navigate via Chrome. For every campaign, capture: campaign name, campaign objective, optimization goal (conversions, value, landing page views, link clicks), bid strategy (Lowest Cost, Cost Cap, Bid Cap, ROAS Goal, Highest Value), bid/cost cap value (if set), campaign budget optimization status (on or off), daily or lifetime budget, delivery status (Active, Learning, Learning Limited), and the date the campaign was last significantly edited.

**TikTok Ads:** Navigate to TikTok Ads Manager via Chrome. For every ad group, capture: ad group name, optimization goal, bid strategy (Lowest Cost, Cost Cap, Maximum Delivery), bid cap value (if set), budget type and amount, delivery status, and optimization event.

Save raw bidding configuration data to `clients/{client-name}/reports/{date}-bidding-audit-raw/`

### Step 3: Launch Bidding Strategy Evaluation

Read `.claude/agents/platform-strategist.md` for campaign structure and bidding methodology. Apply the following analysis:

**Strategy Selection vs Data Volume:**

For each campaign, evaluate whether the selected bidding strategy is appropriate given the campaign's conversion volume:

Google Ads thresholds:
- Target ROAS requires 15+ conversions per month minimum; 50+ conversions per month recommended
- Target CPA requires 15+ conversions per month minimum; 30+ conversions per month recommended
- Maximize Conversions or Maximize Conversion Value (without targets) requires sufficient budget to generate at least 10 conversions per month
- Manual CPC should only be used when conversion data is insufficient for automated bidding or during initial data gathering phases
- Performance Max requires at least 30 conversions in the last 30 days for optimal performance

Meta Ads thresholds:
- Each ad set needs approximately 50 optimization events per week to exit learning phase
- Cost Cap and Bid Cap require strong historical performance data to set appropriate caps
- ROAS Goal requires sufficient purchase volume and accurate value tracking
- Campaigns with fewer than 10 optimization events per week are likely to remain in Learning Limited

TikTok Ads thresholds:
- Each ad group needs approximately 50 conversions per week for stable optimization
- Cost Cap should only be used when there is at least 2 weeks of stable performance data to inform the cap
- Lowest Cost is appropriate for new campaigns and testing phases

Flag any mismatch where a campaign is using an advanced bidding strategy without sufficient conversion data to support it. Also flag campaigns using overly conservative strategies (like Manual CPC) when they have more than enough data for automated bidding.

### Step 4: Assess Target Alignment with Actual Performance

For each campaign with a target (tCPA, tROAS, Cost Cap, Bid Cap, ROAS Goal):

- Compare the target to actual trailing 30 day performance
- Compare the target to actual trailing 90 day performance
- Calculate the gap between target and actual as a percentage
- Flag targets that are more than 20% more aggressive than trailing 30 day actuals (these are likely constraining delivery)
- Flag targets that are more than 30% more conservative than trailing 30 day actuals (these are likely leaving performance on the table)
- Check whether the target has been changed in the last 14 days (recent changes may still be in learning)
- Compare targets to vertical benchmarks from `.claude/frameworks/vertical-benchmarks.md`

For Google Ads specifically:
- Check if tROAS targets are set at the portfolio level or campaign level and whether that is appropriate
- Evaluate whether Maximize Conversion Value without a tROAS target is leaving money on the table or overspending
- Check if campaigns share a portfolio bid strategy that should be split (different campaign types or different performance profiles in the same portfolio)

For Meta Ads specifically:
- Evaluate whether Cost Cap is set too low (causing severe delivery throttling) or not set at all (allowing CPA to drift upward)
- Check if campaign budget optimization is appropriate given the number and diversity of ad sets
- Assess whether Advantage+ campaigns are cannibalizing manual campaigns

### Step 5: Check Learning Phase Status

**Google Ads:**
- Identify all campaigns currently in "Learning" or "Limited" bid strategy status
- For campaigns in "Limited," identify the specific limitation (budget, bid, targeting, or other)
- Check how long each campaign has been in its current status
- Flag campaigns that have been in "Learning" for more than 14 days
- Identify campaigns that recently exited learning and whether performance stabilized or degraded

**Meta Ads:**
- Identify all ad sets currently in "Learning" or "Learning Limited" delivery status
- For "Learning Limited" ad sets, identify the constraint (budget too low, audience too narrow, too many edits)
- Count the number of significant edits made to each campaign in the last 7 days that may have reset learning
- Flag ad sets with fewer than 50 optimization events in the last 7 days
- Check whether the optimization event itself is appropriate (e.g., optimizing for Purchase when there are only 5 purchases per week, when optimizing for Add to Cart and using value optimization might be more effective)

**TikTok Ads:**
- Identify ad groups not reaching 50 conversions per week
- Flag any ad groups with zero conversions in the last 7 days despite active delivery
- Check whether optimization events are firing correctly by cross referencing with Events Manager

### Step 6: Analyze Historical Bid Changes and Impact

Pull change history for the last 90 days across all platforms:

**Google Ads:** Pull change history filtered to bid strategy changes and target adjustments. For each change, document: date of change, what was changed (strategy type, target value), performance in the 14 days before the change, performance in the 14 days after the change, net impact on CPA/ROAS.

**Meta Ads:** Review campaign edit history for bid strategy, optimization goal, cost cap, and budget changes. For each significant change, document the same before/after performance analysis.

**TikTok Ads:** Review bid and optimization changes with the same before/after methodology.

Synthesize the historical analysis to identify patterns:
- Are targets being changed too frequently (causing repeated learning phase resets)?
- Were changes made based on data or reactively based on short term fluctuations?
- Did past strategy changes improve or worsen performance?
- Is there evidence of a "bidding spiral" where targets are continuously tightened without delivery improving?

### Step 7: Recommend Bidding Strategy Changes

Based on all findings, produce specific recommendations for each campaign:

For each recommendation, include:
- Campaign name and current configuration
- Recommended change (strategy type, target value, or structural change)
- Rationale tied to the data from Steps 3 through 6
- Expected impact on CPA, ROAS, or delivery volume
- Risk assessment (low, medium, high) and what could go wrong
- Implementation timing (immediate, after current learning phase completes, after 2 weeks of data collection)
- How to monitor the change and when to evaluate success or failure

Group recommendations by priority:
- **Critical:** Changes that should be made immediately because current configuration is actively wasting budget or preventing delivery (e.g., a tROAS target 50% above actual performance causing near zero delivery)
- **High:** Changes that will meaningfully improve efficiency or volume within 2 to 4 weeks
- **Medium:** Optimization opportunities that are worth testing but carry some risk
- **Low:** Best practice improvements that should be scheduled when there is capacity

### Step 8: Produce Draft Audit Document

Compile all findings into a bidding strategy audit report following the structure from `templates/audit-report.md` and the deliverable recipes in `.claude/frameworks/deliverable-recipes.md`:

1. **Executive Summary** with the overall bidding health assessment and top 3 to 5 recommended changes
2. **Bidding Configuration Inventory** with a table of every campaign, its current strategy, target, status, and data volume
3. **Strategy Selection Assessment** with findings on whether each campaign is using the right strategy for its data volume
4. **Target Alignment Analysis** with gap analysis between targets and actuals
5. **Learning Phase Health Check** with status of all campaigns and any learning phase concerns
6. **Historical Change Impact Analysis** with before/after performance data for recent changes
7. **Recommendations** with specific changes per campaign, grouped by priority
8. **Appendix** with raw data tables, change history, and benchmark comparisons

Save the draft report to: `clients/{client-name}/reports/{date}-bidding-strategy-audit-DRAFT.md`

Update the client's open-items.md with any new action items identified.

Update the client's history.md with a session summary noting the bidding strategy audit was performed.

Present the draft to Michael with a brief summary: "Bidding strategy audit for [Client Name] is ready for review. Key findings: [top 2 to 3 points]. Draft saved to [path]. Want me to walk through it or make changes?"

## Output

The final deliverable is a draft bidding strategy audit report saved to the client's reports directory, ready for Michael's review and approval before being finalized as a Word document. The report includes specific target recommendations per campaign with projected impact and implementation timing.

## Dependencies

- Requires Chrome browser access to navigate Google Ads, Meta Ads, and TikTok Ads UIs
- Requires Meta Ads MCP tools for pulling Meta campaign data (optional, can use Chrome)
- Requires the deliverable recipes framework at .claude/frameworks/deliverable-recipes.md
- Requires the vertical benchmarks framework at .claude/frameworks/vertical-benchmarks.md
- Requires the platform strategist agent at .claude/agents/platform-strategist.md
- Requires an existing client profile at clients/{client-name}/ (or will create one)
