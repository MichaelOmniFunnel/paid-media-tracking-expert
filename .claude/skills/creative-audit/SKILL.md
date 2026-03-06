---
name: creative-audit
description: Cross-platform creative performance audit covering fatigue detection, format diversity, engagement decay, and production roadmap. Use when someone mentions 'creative audit', 'ad fatigue', 'creative refresh', 'which ads are working', 'creative performance', or stale ads.
argument-hint: "[client-name]"
allowed-tools: Read, Grep, Glob, Bash, Write, Agent
---
# Creative Performance Audit

Comprehensive audit of creative assets across all active ad platforms to identify fatigue, format gaps, top performers for scaling, and a production roadmap for the next 90 days.

## Context

The user wants a complete creative performance audit for a specific client. This workflow evaluates every active creative across Google Ads, Meta Ads, and TikTok Ads to surface fatigue signals, identify scaling opportunities, flag underperformers for retirement, and build a data driven creative roadmap. This is essential for clients where performance is plateauing or where creative refresh cadence has not been formalized.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Active ad platforms (required: Google Ads, Meta Ads, TikTok Ads, or a subset)
- Date range to evaluate (optional, defaults to last 90 days)
- Monthly creative production budget or capacity (optional, helps prioritize the roadmap)
- Any known creative constraints (e.g., brand guidelines, restricted formats, no UGC)
- Primary conversion goal (purchase, lead, signup)
- Current creative types in use (static, video, carousel, UGC, catalog/dynamic)

## Instructions

### Step 1: Load Client Context

Check `clients/{client-name}/` for existing profile, history, and previous findings. Read the full history file before doing anything else so you have complete context on past creative discussions, tests, and learnings.

If no client folder exists, create one following the standard structure.

### Step 2: Pull All Active Creatives Across Platforms

Gather creative data from each active platform simultaneously:

**Meta Ads:** Use the Meta Ads MCP tools to pull all active ad creatives. For each creative, capture: ad name, ad ID, creative format (image, video, carousel, collection), headline, primary text, call to action, date launched, ad set name, campaign name. Then pull performance metrics: spend, impressions, reach, frequency, CTR, CPC, conversions, CPA, ROAS, ThruPlay rate (for video), video average watch time, and cost per ThruPlay.

**Google Ads:** Navigate to the Google Ads UI via Chrome. Pull asset performance data from Performance Max campaigns (asset group level reporting), Responsive Search Ad asset ratings, Display/Discovery/Demand Gen creative performance, and YouTube video ad performance. For each creative asset, capture: asset type, asset text or image/video reference, performance rating (Best, Good, Low), impressions, clicks, conversions.

**TikTok Ads:** Navigate to TikTok Ads Manager via Chrome. Pull all active ad creatives with performance data: video views, CTR, conversion rate, CPA, average watch time, 2 second view rate, 6 second view rate, profile visits. Note creative format and hook style.

Save raw creative data to `clients/{client-name}/reports/{date}-creative-audit-raw/`

### Step 3: Launch Creative Analysis

Use the platform-strategist agent methodology for creative evaluation. Apply the following analysis to every active creative:

**Age and Decay Analysis:**
- Calculate the age of each creative (days since launch)
- Plot performance trend over time: is CPA rising, CTR declining, or frequency climbing?
- Flag any creative running longer than 21 days on cold audiences without refresh
- Identify the decay curve: when did each creative peak and how fast is it declining?

**Frequency and Fatigue Scoring:**
- For Meta: flag any ad with frequency above 2.5 on cold audiences or above 5.0 on warm audiences
- For TikTok: flag any creative with declining CTR over 3+ consecutive days
- For Google: flag any asset rated "Low" in Performance Max or any RSA asset with "Low" rating
- Score each creative on a fatigue scale: Fresh (0 to 7 days, performing above baseline), Active (8 to 21 days, performing at baseline), Fatiguing (21+ days, metrics declining), Exhausted (performance below acceptable CPA/ROAS thresholds)

**Format Diversity Assessment:**
- Inventory all creative formats currently in use per platform
- Identify format gaps: Is the client using static only on Meta when video drives 40% better CPA? Is there no carousel format despite having a catalog? Are there no UGC style creatives despite being in a vertical where UGC outperforms polished content?
- Compare format mix to vertical best practices from `.claude/skills/ab-testing-experimentation/SKILL.md`

### Step 4: Identify Top Performers and Bottom Performers

**Top Performers (candidates for scaling):**
- Identify the top 20% of creatives by primary KPI (CPA for lead gen, ROAS for ecommerce)
- For each top performer, note: what makes it work (hook, format, offer, audience alignment), how much headroom exists for increased spend, which audiences and placements it performs best on, whether it has been tested on other platforms
- Flag any top performer that is approaching fatigue so it can be iterated before it declines

**Bottom Performers (candidates for pause or refresh):**
- Identify the bottom 20% of creatives by primary KPI
- For each underperformer, note: total spend wasted below acceptable CPA/ROAS, how long it has been running below threshold, whether it was ever a top performer (indicating fatigue vs fundamental weakness), specific weaknesses (weak hook, wrong format, poor landing page match)
- Recommend pause, refresh, or complete replacement for each

**Middle Performers (optimization candidates):**
- Identify creatives performing at or near the acceptable threshold
- Flag those with high potential signals: strong CTR but poor conversion (landing page issue), strong conversion rate but low CTR (creative hook issue), good performance on one placement but poor on another (placement optimization needed)

### Step 5: Generate A/B Test Recommendations

Based on the performance gaps identified:

- For each top performer, recommend one to two variations to test (different hook, different CTA, different format, different length for video)
- For each performance gap identified in the format diversity assessment, recommend a test to fill the gap
- For any creative with high CTR but low conversion rate, recommend a landing page alignment test
- For any creative with low CTR but high conversion rate, recommend a hook or thumbnail test
- Prioritize tests by expected impact and ease of production
- Reference the testing methodology from `.claude/skills/ab-testing-experimentation/SKILL.md` for sample size requirements and statistical significance thresholds

Structure each test recommendation with:
- Hypothesis: "If we [change X], we expect [metric Y] to improve by [estimated Z%] because [rationale]"
- Control: the current creative
- Variant: the specific change to make
- Success metric: primary KPI to measure
- Minimum budget and duration to reach significance

### Step 6: Build 90 Day Creative Roadmap

Using all findings, build a production prioritized creative roadmap:

**Month 1 (Immediate Priorities):**
- Pause all exhausted creatives identified in Step 4
- Launch iterations of top performers (the lowest risk, highest return creative work)
- Fill the single most impactful format gap
- Begin A/B tests on highest priority recommendations

**Month 2 (Expansion):**
- Introduce new creative concepts based on competitor analysis and format gap findings
- Test winning concepts from Month 1 on additional platforms
- Launch second tier A/B tests
- Refresh any creatives that entered the "Fatiguing" status during Month 1

**Month 3 (Optimization and Scale):**
- Scale proven Month 1 and Month 2 winners
- Retire underperformers from Month 1 launches
- Introduce seasonal or promotional creative if applicable
- Establish ongoing creative refresh cadence based on observed decay rates

Include a production calendar with:
- Number of creative assets needed per month (broken down by format)
- Priority ranking for each asset
- Platform destination for each asset
- Whether it requires new production or can be iterated from existing assets

### Step 7: Produce Draft Audit Document

Compile all findings into a creative audit report following the structure from `templates/audit-report.md` and the deliverable recipes in `.claude/frameworks/deliverable-recipes.md`:

1. **Executive Summary** with top 3 creative opportunities and top 3 creative risks
2. **Creative Health Score** out of 100 with sub scores for: Format Diversity (out of 25), Freshness/Fatigue (out of 25), Performance Distribution (out of 25), Testing Velocity (out of 25)
3. **Creative Inventory** with full table of all active creatives, their fatigue status, and performance tier
4. **Top Performers Deep Dive** with scaling recommendations
5. **Underperformer Analysis** with pause/refresh/replace recommendations
6. **A/B Test Plan** with prioritized test recommendations
7. **90 Day Creative Roadmap** with production calendar
8. **Appendix** with raw performance data tables and screenshots

Save the draft report to: `clients/{client-name}/reports/{date}-creative-audit-DRAFT.md`

Update the client's open-items.md with any new action items identified.

Update the client's history.md with a session summary noting the creative audit was performed.

Present the draft to Michael with a brief summary: "Creative audit for [Client Name] is ready for review. Key findings: [top 2 to 3 points]. Draft saved to [path]. Want me to walk through it or make changes?"

## Output

The final deliverable is a draft creative performance audit report saved to the client's reports directory, ready for Michael's review and approval before being finalized as a Word document for the client. The report includes actionable recommendations for immediate pauses, scaling opportunities, A/B tests, and a 90 day creative production roadmap.

## Dependencies

- Requires Chrome browser access to navigate Google Ads and TikTok Ads UIs
- Requires Meta Ads MCP tools for pulling Meta creative data
- Requires the deliverable recipes framework at .claude/frameworks/deliverable-recipes.md
- Requires the A/B testing skill at .claude/skills/ab-testing-experimentation/SKILL.md
- Uses the platform-strategist agent (auto-discovered)
- Requires an existing client profile at clients/{client-name}/ (or will create one)
