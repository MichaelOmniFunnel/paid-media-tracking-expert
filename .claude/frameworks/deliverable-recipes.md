# OFM Deliverable Recipes

Internal recipes for producing each type of deliverable at OFM quality standards. These define the structure, tone, and content expectations.

---

## General Rules for All Deliverables

- Never use hyphens or dashes (including em dashes and en dashes) in any output
- Write in natural, conversational business prose
- Match Michael's expertise level; never over explain basics
- Be direct about problems; do not soften findings into uselessness
- All deliverables are drafts until Michael approves
- Default format is Word (.docx) unless Michael specifies otherwise
- Use "to" instead of a dash for ranges (e.g., "3 to 5" not "3-5")
- Use "through" for date ranges (e.g., "January through March" not "January-March")
- When referencing monetary values, always use the dollar sign and two decimal places for CPCs and CPAs; use no decimal for round numbers in budgets
- Tables should be clean and scannable; avoid cramming too much into one table
- When a section is not applicable to a specific client, note it as "Not applicable" with a brief reason rather than omitting it silently

---

## Recipe: Full Platform Audit Report

**Purpose:** Comprehensive audit of a client's paid media and tracking infrastructure.

### Structure

#### 1. Executive Summary (1 page max)
State of the account in plain language. Biggest wins available. Most urgent fixes needed. No jargon.

Write this last, after all findings are documented. It should stand alone; a busy executive should be able to read just this page and understand the situation.

Include:
- One sentence overall assessment
- Top 3 opportunities with estimated impact
- Top 3 risks if nothing changes
- Recommended priority for the next 30 days

#### 2. Score Snapshot
Overall health score out of 100. Sub scores for:
- Tracking (out of 25)
- Campaign Structure (out of 25)
- Creative & Audiences (out of 25)
- Measurement & Attribution (out of 25)

Brief justification for each score. One to two sentences per sub score explaining why the score is what it is.

**Scoring guidance:**
- 20 to 25: Excellent. Best practices followed, minor improvements only.
- 15 to 19: Good. Fundamentals solid, some optimization opportunities.
- 10 to 14: Needs work. Meaningful issues impacting performance.
- 5 to 9: Poor. Significant problems requiring immediate attention.
- 0 to 4: Critical. Fundamental issues that prevent effective advertising.

#### 3. Issue Inventory

Table format with columns:
| Issue | Severity | Platform | Estimated Impact | Effort to Fix |
|-------|----------|----------|-----------------|---------------|

**Severity levels:**
- **Critical:** Tracking is broken, money is being wasted with no measurement, or there is a compliance risk. Fix immediately.
- **High:** Significantly impacting performance or data quality. Fix within one week.
- **Medium:** Causing suboptimal performance. Fix within two to four weeks.
- **Low:** Best practice improvement. Schedule when convenient.

Sort by severity first, then by estimated impact within each severity level. Critical issues always appear first.

**Estimated Impact options:** Revenue at risk, Wasted spend amount, Data quality %, Performance improvement potential (e.g., "Estimated 15 to 20% CPA reduction").

**Effort to Fix options:** Quick fix (under 1 hour), Half day, Full day, Multi day, Requires developer, Requires platform support.

#### 4. Detailed Findings

Group by the OFM audit order:
1. Tracking and pixel health
2. Conversion setup and attribution
3. Campaign structure
4. Bidding and budget
5. Audience targeting
6. Creative and ad copy
7. Landing page experience
8. Measurement and reporting
9. Wasted spend and inefficiencies

Each finding gets three components:
- **What was found:** State the fact. Include screenshots or data references where possible.
- **Why it matters:** Explain the performance impact in business terms, not platform jargon.
- **What to do about it:** Specific enough that someone could implement it without asking follow up questions. Include the exact setting to change, the code to add, or the campaign structure to build.

#### 5. Recommended Action Plan

Phased roadmap:
- **Phase 1 (Week 1 to 2):** Critical tracking and structural fixes. These must happen before any optimization makes sense. If tracking is broken, nothing else matters.
- **Phase 2 (Week 3 to 4):** Optimization opportunities. Campaign restructuring, bid strategy changes, audience refinements.
- **Phase 3 (Month 2 to 3):** Advanced improvements. Testing frameworks, creative expansion, landing page optimization, advanced measurement.
- **Phase 4 (Ongoing):** Maintenance and iteration. Regular review cadence, testing calendar, reporting rhythm.

Each phase item should reference back to the Issue Inventory by issue name so Michael can cross reference.

#### 6. Appendix

- Tracking ID inventory (all pixel IDs, conversion action IDs, GTM container IDs, GA4 measurement IDs)
- Pages audited (URLs checked for tracking)
- Screenshots of key findings
- Raw data tables if referenced in findings
- Tools used during the audit

---

## Recipe: Tracking Implementation Document (Developer Handoff)

**Purpose:** Give a developer everything they need to implement or fix tracking with zero ambiguity.

### Structure

#### 1. Overview
What needs to happen and why. Two to three sentences maximum. The developer needs context but not a marketing lesson.

Example: "We need to add server side conversion tracking for the purchase event via Meta Conversions API. This will improve event match quality from the current 4.2 to a target of 7.0+, which directly impacts Meta's ability to optimize ad delivery."

#### 2. Current State
What exists now:
- All relevant tracking IDs (pixel IDs, conversion IDs, GTM container IDs)
- Current code or tag setup (reference specific GTM tags by name, or include current code snippets)
- Current behavior (what fires now, what data is sent, what is missing)
- Any errors or issues in the current implementation

#### 3. Required Changes

Numbered steps with exact code. Every code block must be copy paste ready.

For each step:
- Specify exactly where the code goes (which file, which GTM tag, which trigger, what position in the page)
- Include the complete code block, not just the changed lines
- Mark any values that need to be replaced with clear placeholder notation (e.g., `REPLACE_WITH_PIXEL_ID`)
- Include before and after comparisons where helpful
- Note any dependencies (e.g., "This step must be completed before Step 4")

**All GTM Custom HTML code must be ES5 only.** Call this out explicitly every time a Custom HTML tag is involved. No arrow functions, no let/const, no template literals, no destructuring, no default parameters, no spread operators.

#### 4. Verification Steps

How to confirm the implementation works:
- Which tools to use (GTM Preview mode, Meta Events Manager Test Events, Google Ads Tag Diagnostics, TikTok Events Manager, browser developer console, GA4 DebugView)
- Step by step verification process (e.g., "Open GTM Preview > navigate to checkout page > complete a test purchase > verify the 'purchase' tag fired in the Preview panel")
- What the correct output looks like (include example payloads, expected event names, expected parameter values)
- What common errors look like and how to troubleshoot them

#### 5. Rollback Plan

How to undo the implementation if something goes wrong:
- For GTM changes: "Publish the previous GTM version (Version X) to revert all changes"
- For code changes: Specify exactly what to remove or revert
- Emergency contact or escalation path

---

## Recipe: Monthly Performance Report

**Purpose:** Regular performance communication to clients.

### Structure

#### 1. Performance Summary

Overall performance vs targets. Lead with the bottom line.

Include:
- Blended ROAS or POAS (depending on client setup)
- Total spend across all platforms
- Total revenue or total leads (depending on business type)
- Overall CPA or overall ROAS
- Comparison to prior period (month over month)
- Comparison to same period prior year (if available)
- Comparison to targets/KPIs set during onboarding

Use a simple table or scorecard format. Green/yellow/red status indicators are helpful.

#### 2. Platform Breakdown

One section per active platform (Google Ads, Meta, TikTok, etc.).

For each platform:
- Key metrics (spend, impressions, clicks, conversions, CPA or ROAS)
- Notable changes from prior period (up or down, with percentage change)
- Actions taken during the period (bid changes, new campaigns launched, audiences adjusted, creative refreshed)
- Results of those actions (did the changes work? what was the impact?)

Keep each platform section to one page or less. If a platform needs more space, it probably needs its own deep dive document.

#### 3. What Worked

Specific wins with context. Not "Meta did well" but "The UGC testimonial creative launched on March 3rd drove a 2.8x ROAS at $14.20 CPA, outperforming the previous best creative by 35%."

Include:
- Which campaigns, ad sets, or ad groups drove results
- Which audiences performed best
- Which creative performed best
- Any external factors that helped (seasonality, PR, organic trends)

#### 4. Challenges and Actions

What underperformed and what was done about it. Be honest and specific.

Not "Some campaigns underperformed" but "The branded search campaign CPA increased 28% due to competitor conquest activity from [Competitor Name]. We responded by adding negative keywords, tightening match types, and launching a competitor counter campaign on March 10th. Early results show CPA stabilizing."

Include:
- What the problem was
- What caused it (as best as we can determine)
- What action was taken
- What results we are seeing from the action (or when we expect to see results)

#### 5. Next Month Plan

What will be tested, changed, or launched. Tie each item back to the overall strategy.

Include:
- Planned tests (creative, audience, bidding, landing page)
- Budget allocation changes
- New campaign launches
- Seasonal adjustments
- Tracking or measurement improvements planned

Keep it concise. Clients do not want 20 pages of charts. They want to know: are we winning, where, and what is next.

---

## Recipe: New Client Onboarding Report

**Purpose:** First deliverable after signing a new client. Sets expectations and establishes the baseline.

### Structure

#### 1. Account Overview

What was found across all platforms. Current state of tracking, campaigns, and measurement.

Write this as a narrative, not a list. Tell the story of the account. What has been built, what is working, what is broken, and what is missing entirely.

Touch on:
- How long the account has been running
- Who managed it previously (agency, in house, self managed)
- Overall sophistication level (basic, intermediate, advanced)
- Total monthly spend and distribution across platforms

#### 2. Quick Wins

Things that can be fixed immediately for fast impact. These build trust and demonstrate value in the first week.

Requirements for a "quick win":
- Can be implemented in under 4 hours
- Expected to produce measurable improvement within 1 to 2 weeks
- Low risk (will not disrupt anything currently working)

Present as a numbered list with expected impact for each.

#### 3. Strategic Roadmap

90 day plan organized by phase:
- **Days 1 to 14:** Foundation (tracking fixes, structural issues, quick wins)
- **Days 15 to 30:** Optimization (bid strategies, audience refinement, creative testing framework)
- **Days 31 to 60:** Expansion (new campaigns, new audiences, landing page improvements)
- **Days 61 to 90:** Scaling (increase budgets on winners, advanced measurement, attribution improvements)

Each phase item should have a clear deliverable or outcome.

#### 4. Tracking Audit Summary

Current pixel/tag inventory:
- All tracking pixels and their status (active, inactive, erroring)
- GTM container status (version, last published, tags count)
- CAPI status per platform (connected, not connected, partially connected)
- Consent mode status (implemented, not implemented, partially implemented)
- Enhanced conversions status (Google)
- Event Match Quality scores (Meta)
- Data quality issues identified

#### 5. Competitive Landscape

Brief overview of what competitors are doing (if competitive research was conducted during onboarding).

Reference the competitive analysis framework for methodology. Keep this section to one page. The full competitive analysis can be a separate deliverable if needed.

#### 6. KPIs and Targets

Proposed success metrics and realistic targets for the first 90 days.

Include:
- Primary KPI (usually CPA or ROAS)
- Secondary KPIs (CTR, conversion rate, impression share, etc.)
- Baseline for each KPI (current performance)
- 30 day target
- 60 day target
- 90 day target

Be realistic. Overpromising in the onboarding report destroys credibility. It is better to set conservative targets and exceed them than to set aggressive targets and explain why you missed.

---

## Recipe: Competitive Analysis Report

**Purpose:** Inform strategy with competitor intelligence.

Follow the structure defined in the competitive analysis framework (competitive-analysis.md). Use the deliverable template section as the report structure.

**Key principles:**
- Keep it actionable. The point is not to document everything competitors do; the point is to identify opportunities and threats that should influence our strategy.
- Every observation should lead to a "so what" and a "now what."
- Do not just describe what competitors are doing; evaluate whether it is working and whether we should respond.
- Prioritize findings by impact. Not everything a competitor does matters.
- Update competitive analysis quarterly at minimum, or whenever a significant competitive shift is observed.

---

## Recipe: Tracking Specification Document

**Purpose:** Detailed specification of what should be tracked across all platforms, used as a planning document before implementation.

### Structure

#### 1. Event Taxonomy

Table of all events to be tracked:
| Event Name | Platform(s) | Trigger Condition | Required Parameters | Priority |
|------------|-------------|-------------------|--------------------| ---------|

#### 2. Parameter Mapping

For each event, specify:
- Required parameters and where each value comes from (dataLayer, URL, DOM element, cookie, etc.)
- Parameter format requirements (string, number, currency code, etc.)
- Example payloads

#### 3. Platform Specific Requirements

Any platform specific nuances:
- Meta: event deduplication via event_id, user data parameters for advanced matching
- Google: enhanced conversions data requirements, consent mode behavior
- TikTok: content parameters for catalog events
- GA4: recommended vs custom events, parameter limits

#### 4. Consent Handling

How each event should behave under different consent states:
- Full consent granted
- Analytics only consent
- No consent (rejected)
- Consent not yet determined (default state)

#### 5. QA Checklist

Checklist for verifying the complete implementation across all platforms.

---

## Recipe: Budget Recommendation Document

**Purpose:** Recommend budget allocation and changes based on performance data.

### Structure

#### 1. Current Allocation
Table showing current spend by platform, campaign type, and funnel stage.

#### 2. Performance by Allocation
How each segment is performing relative to its budget share. Identify over invested and under invested areas.

#### 3. Recommended Allocation
Proposed new allocation with rationale for each change. Tie recommendations to performance data and strategic goals.

#### 4. Expected Impact
Projected impact of budget changes on key metrics. Be conservative in projections and state assumptions clearly.

#### 5. Implementation Plan
How and when to make the budget changes. Include ramp up/ramp down schedules to avoid disrupting algorithm learning.
