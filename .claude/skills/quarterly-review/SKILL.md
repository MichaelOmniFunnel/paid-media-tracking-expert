---
name: quarterly-review
description: Comprehensive quarterly strategy review with cross-platform analysis, benchmark comparison, trend identification, and strategic planning. Use when someone mentions 'quarterly review', 'QBR', 'quarterly strategy', 'Q1 review', 'Q2 review', 'Q3 review', 'Q4 review', or strategic planning.
argument-hint: "[client-name] [quarter]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# Quarterly Strategy Review

Comprehensive quarterly performance review with cross platform analysis, benchmark comparison, trend identification, and strategic planning for the upcoming quarter.

## Context

The user wants a full quarterly strategy review for a specific client. This is the most strategic deliverable OFM produces, combining 90 days of performance data with competitive positioning, benchmark analysis, and forward looking recommendations. This workflow orchestrates multiple specialist agents in parallel to produce a client facing quarterly review document with an executive summary, performance dashboard, strategic assessment, and a detailed plan for the next quarter.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Quarter being reviewed (required, e.g., "Q1 2026" or "January through March 2026")
- Active ad platforms (required: Google Ads, Meta Ads, TikTok Ads, or a subset)
- Client's industry/vertical (required for benchmark comparison)
- Business model (ecommerce, lead gen, SaaS, local services)
- Quarterly revenue or lead targets (optional, will use prior period as baseline)
- Any significant events during the quarter (optional, e.g., "site redesign in February," "launched TikTok in March," "pricing change mid quarter")
- Budget for the upcoming quarter (optional, helps with allocation recommendations)

## Instructions

### Step 1: Load Client Context

Check `clients/{client-name}/` for existing profile, history, and previous findings. Read the full history file to understand everything that has happened with this client. Read any prior quarterly review reports. Read monthly reports from the quarter if they exist.

If no client folder exists, create one following the standard structure.

### Step 2: Pull 90 Day Performance Data Across All Platforms

Gather comprehensive performance data for the full quarter from each active platform:

**Google Ads:** Navigate to the Google Ads UI via Chrome. Pull account level and campaign level metrics for the full quarter. Capture: total spend, total conversions, total conversion value, CPA, ROAS, impression share (Search), CTR, CPC, Quality Score distribution. Break down by campaign type (Search, Shopping, Performance Max, Display, Demand Gen, Video). Pull month over month data within the quarter to identify trends. Pull change history for the quarter to document all significant changes made.

**Meta Ads:** Navigate to Meta Ads Manager via Chrome or use the Meta Ads MCP tools. Pull account level and campaign level metrics for the full quarter. Capture: total spend, total results, cost per result, ROAS, reach, frequency, CPM, CTR, unique link clicks. Break down by campaign objective and funnel stage. Pull month over month data within the quarter. Check Events Manager for CAPI health and event match quality trends over the quarter.

**TikTok Ads:** Navigate to TikTok Ads Manager via Chrome. Pull account level and campaign level metrics. Capture: total spend, conversions, CPA, CPM, CTR, video views, average watch time, engagement rate. Pull month over month data within the quarter.

**GA4:** Navigate to GA4 via Chrome. Pull traffic acquisition by source/medium for the full quarter. Pull ecommerce or conversion reports by source/medium. Pull user acquisition data. Note total sessions, conversions, and revenue attributed to each paid channel. Compare to the prior quarter and the same quarter last year if data is available.

**Ecommerce Platform (Shopify, WooCommerce, NetSuite):** Navigate via Chrome. Pull actual revenue, order count, AOV, new vs returning customer split for the full quarter. This is the source of truth for reconciliation.

**Klaviyo (if active):** Pull quarterly email/SMS revenue attribution, list growth, campaign and flow performance.

**CallRail (if active):** Pull quarterly call volume, qualified calls, and source attribution.

Save all raw data to `clients/{client-name}/reports/{year}-Q{quarter}-raw-data/`

### Step 3: Launch Parallel Agent Analysis

Deploy the following analyses simultaneously using subagents:

**Agent 1: Platform Strategist**
- Delegate to the platform-strategist agent
- Evaluate campaign structure evolution over the quarter
- Assess whether the current structure supports the client's growth trajectory
- Identify structural changes needed for the next quarter
- Evaluate catalog/feed health for ecommerce clients
- Assess audience infrastructure readiness for scaling

**Agent 2: Attribution Analyst**
- Delegate to the attribution-analyst agent
- Apply the attribution philosophy from `.claude/frameworks/attribution-philosophy.md`
- Reconcile platform reported conversions against actual ecommerce/CRM data
- Calculate overlap factor and compare to prior quarters
- Assess cross platform attribution accuracy
- Evaluate whether the current measurement approach is reliable enough for the budget being spent
- Identify any attribution blind spots that developed during the quarter

**Agent 3: Budget and Allocation Analysis (performed by lead agent)**
- Calculate blended ROAS and POAS following `.claude/frameworks/poas-methodology.md`
- Analyze spend efficiency by platform, campaign type, and funnel stage
- Identify over invested and under invested areas
- Model optimal allocation scenarios for the upcoming quarter
- Calculate marginal CPA/ROAS by platform to determine where the next dollar should go

### Step 4: Compare Performance Against Vertical Benchmarks

Load the client's vertical benchmarks from `.claude/frameworks/vertical-benchmarks.md`.

For each platform, compare actual quarterly performance to vertical benchmarks:
- Map each key metric to its benchmark range (low end to top quartile)
- Identify metrics performing above top quartile (celebrate and protect)
- Identify metrics performing below low end (investigate and fix)
- Identify metrics within range but trending downward (monitor closely)
- Apply account maturity adjustments per the benchmark interpretation guidelines
- Apply seasonal adjustment notes for the specific quarter being reviewed

Create a benchmark comparison table:
| Metric | Client Actual | Vertical Low End | Vertical Top Quartile | Status |
Where Status is: Above Benchmark, Within Benchmark, Below Benchmark, or Critical

### Step 5: Evaluate Competitive Positioning Changes

Apply the competitive analysis framework from `.claude/frameworks/competitive-analysis.md`:

- Check Google Ads Auction Insights for the quarter: impression share trends, overlap rate, position above rate, outranking share for top competitors
- Note any new competitors that appeared during the quarter
- Note any competitors that increased or decreased their presence
- If Chrome browser tools are available, perform a quick competitive creative review: are competitors running new ad formats, messaging angles, or offers that could be impacting the client's performance?
- Assess whether any competitive shifts require strategic response in the next quarter

### Step 6: Identify Trends and Patterns

Analyze the quarter's data for meaningful trends:

**Improving Metrics:**
- Which KPIs improved each month of the quarter?
- What drove the improvement? (specific campaigns, audiences, creatives, bid changes, or external factors)
- Are these improvements sustainable or one time?
- What should be done to protect and accelerate these gains?

**Declining Metrics:**
- Which KPIs declined each month of the quarter?
- What caused the decline? (creative fatigue, audience saturation, competitive pressure, tracking changes, seasonal factors, or strategic missteps)
- Was the decline addressed during the quarter? If so, what was the result?
- What needs to happen next quarter to reverse the decline?

**Emerging Patterns:**
- Are there day of week or time of day performance patterns worth exploiting?
- Are certain product categories or service types outperforming others?
- Is there a device performance shift (mobile vs desktop) that needs attention?
- Are there geographic performance differences that suggest market expansion or contraction?
- Is new customer acquisition rate changing? Is AOV shifting?

**External Factor Assessment:**
- Seasonality impact during this quarter (reference the seasonal adjustment notes in vertical-benchmarks.md)
- Platform algorithm or policy changes that affected performance
- Industry or market changes (economic conditions, regulatory changes, competitor actions)
- Client side changes (website updates, pricing changes, inventory issues, staffing changes)

### Step 7: Generate Q+1 Strategic Recommendations

Based on all findings from Steps 2 through 6, develop a comprehensive strategy for the upcoming quarter:

**Budget Allocation Recommendations:**
- Recommended total spend for the upcoming quarter with rationale
- Platform level allocation with percentage and dollar amounts
- Campaign type allocation within each platform
- Funnel stage allocation (prospecting vs remarketing vs retention)
- Ramp up or ramp down schedule if significant reallocation is recommended
- Reference the Budget Recommendation recipe from `.claude/frameworks/deliverable-recipes.md`

**Campaign Strategy Recommendations:**
- New campaign types to launch (with rationale and expected impact)
- Existing campaigns to restructure (with specific changes)
- Campaigns to sunset (with justification)
- Bidding strategy changes (informed by current performance vs targets)
- Budget reallocation within existing campaigns

**Audience Strategy Recommendations:**
- New audiences to build and test
- Audience expansion or contraction recommendations
- Customer list refresh and segmentation improvements
- Cross platform audience orchestration opportunities

**Creative Strategy Recommendations:**
- Creative themes and formats to prioritize next quarter
- Testing calendar with specific experiments to run
- Creative refresh schedule based on observed fatigue patterns
- New creative concepts to develop based on competitive analysis

**Tracking and Measurement Recommendations:**
- Any tracking improvements needed for better measurement
- Attribution methodology adjustments if warranted
- New conversion events to add or existing ones to refine
- Reporting improvements for the next quarter

**Platform Expansion or Contraction:**
- Should any new platforms be added? (e.g., adding TikTok, adding YouTube, launching Demand Gen)
- Should any platforms be reduced or paused? (only if data clearly supports this)
- What would be needed to launch a new platform successfully?

### Step 8: Produce Client Facing Quarterly Review Document

Compile all findings into a quarterly review document following the deliverable recipes in `.claude/frameworks/deliverable-recipes.md`. This is a client facing document and must be polished, clear, and actionable:

1. **Executive Summary (1 page):** Overall quarter assessment in plain language. Lead with results vs targets. Highlight top 3 wins and top 3 areas of focus for next quarter. State the strategic direction for Q+1 in one to two sentences.

2. **Performance Dashboard:** Blended metrics scorecard with green/yellow/red status vs targets. Quarter over quarter comparison. Year over year comparison if available. Month by month trend within the quarter. Include: Total Spend, Total Revenue (actual), Blended ROAS, Blended CPA, POAS (if available), New Customer Rate, AOV.

3. **Platform Performance Breakdown:** One section per platform with key metrics, notable changes, actions taken and their results. Keep each to one page.

4. **Benchmark Comparison:** Client performance vs vertical benchmarks table. Highlight areas of competitive advantage and areas needing improvement.

5. **What Worked This Quarter:** Specific wins with data. Tie each win to the action that created it. Include: best performing campaigns, best performing creatives, best performing audiences, strategic decisions that paid off.

6. **Challenges and How We Responded:** Honest assessment of what did not go as planned. What was done about it. What the current status is.

7. **Competitive Landscape Update:** Key competitive shifts observed. How they affected performance. How we plan to respond.

8. **Q+1 Strategic Plan:** Budget allocation recommendations. Campaign strategy changes. Audience and creative priorities. Testing calendar. Key milestones and targets for the upcoming quarter.

9. **Appendix:** Raw data tables, benchmark reference data, change history, attribution reconciliation data.

Save the draft report to: `clients/{client-name}/reports/{year}-Q{quarter}-quarterly-review-DRAFT.md`

Update the client's open-items.md with all action items for the upcoming quarter.

Update the client's history.md with a session summary noting the quarterly review was completed.

Present the draft to Michael with a brief summary: "Quarterly review for [Client Name] for [Quarter Year] is ready for review. Key highlights: [top 3 points]. Draft saved to [path]. Want me to walk through it or convert to Word format?"

## Output

The final deliverable is a comprehensive client facing quarterly strategy review document saved to the client's reports directory, ready for Michael's review and approval before being finalized as a Word document. The document includes an executive summary, performance dashboard, benchmark comparison, strategic assessment, and a complete Q+1 plan with budget allocation, campaign strategy, audience priorities, creative roadmap, and testing calendar.

## Dependencies

- Requires Chrome browser access to navigate all platform UIs
- Requires Meta Ads MCP tools for pulling Meta data (optional, can use Chrome)
- Uses the platform-strategist agent (auto-discovered)
- Uses the attribution-analyst agent (auto-discovered)
- Requires the deliverable recipes framework at .claude/frameworks/deliverable-recipes.md
- Requires the vertical benchmarks framework at .claude/frameworks/vertical-benchmarks.md
- Requires the attribution philosophy framework at .claude/frameworks/attribution-philosophy.md
- Requires the POAS methodology framework at .claude/frameworks/poas-methodology.md
- Requires the competitive analysis framework at .claude/frameworks/competitive-analysis.md
- Requires an existing client profile at clients/{client-name}/ with sufficient history
