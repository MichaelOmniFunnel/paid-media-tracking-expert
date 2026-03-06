# Audience Infrastructure Audit

Comprehensive audit of audience targeting, list health, remarketing coverage, overlap analysis, and exclusion strategy across all active ad platforms.

## Context

The user wants a complete assessment of the audience infrastructure for a specific client. This workflow evaluates the health and completeness of customer lists, the quality of lookalike and similar audience sources, the coverage of remarketing across funnel stages, overlap between campaigns, exclusion hygiene, and expansion opportunities. This is essential for accounts where audience fatigue is suspected, where scaling has stalled, or where there is no structured audience strategy in place.

## Arguments

$ARGUMENTS should include:
- Client name (required)
- Active ad platforms (required: Google Ads, Meta Ads, TikTok Ads, or a subset)
- Business model (ecommerce, lead gen, SaaS, local services)
- CRM or email platform (optional: Klaviyo, HubSpot, Salesforce, etc.)
- Known customer list sources (optional: email lists, phone lists, purchase history)
- Average customer lifetime value (optional, helps evaluate audience investment)
- Current remarketing setup description (optional, will be discovered from account)
- Any known audience concerns (optional, e.g., "audiences feel tapped out" or "not sure if exclusions are working")

## Instructions

### Step 1: Load Client Context

Check `clients/{client-name}/` for existing profile, history, and previous findings. Read the full history file before doing anything else so you have complete context on past audience discussions, list uploads, and targeting decisions.

If no client folder exists, create one following the standard structure. Read `.claude/agents/platform-strategist.md` for audience evaluation methodology.

### Step 2: Pull Audience Lists and Targeting Configurations

Gather audience data from each active platform simultaneously:

**Meta Ads:** Use the Meta Ads MCP tools or navigate via Chrome. Pull a complete inventory of: all Custom Audiences (type, size, date created, date last updated, source), all Lookalike Audiences (source audience, percentage, country, size), all Saved Audiences, all ad set level targeting configurations (for every active ad set, capture: audience targeting, age, gender, placements, detailed targeting, custom audiences included, custom audiences excluded). Check Audience Overlap tool for any audiences used in multiple active ad sets.

**Google Ads:** Navigate to the Google Ads UI via Chrome. Pull: all audience segments (customer lists, website visitors, app users, YouTube viewers, custom segments), audience segment sizes and match rates, audience exclusions applied at campaign or account level, Performance Max audience signals configured per asset group, Demand Gen audience configurations, remarketing list definitions and membership durations, observation vs targeting audience application per campaign.

**TikTok Ads:** Navigate to TikTok Ads Manager via Chrome. Pull: all Custom Audiences (type, size, status), all Lookalike Audiences (source, size, similarity level), ad group level targeting configurations, interest and behavior targeting selections.

Save raw audience data to `clients/{client-name}/reports/{date}-audience-audit-raw/`

### Step 3: Evaluate Customer List Health

For each customer list uploaded across platforms:

**Size Assessment:**
- Minimum viable list size for Meta Lookalikes: 1,000 (recommended 5,000+)
- Minimum viable list size for Google Customer Match: 1,000 (recommended 5,000+)
- Minimum viable list size for TikTok Custom Audiences: 1,000
- Flag any lists below minimum thresholds
- Compare list sizes across platforms (significant discrepancies may indicate upload issues or match rate problems)

**Match Rate Analysis:**
- Meta Custom Audience match rates should be above 60% for email lists and above 40% for phone lists
- Google Customer Match rates should be above 50% for email lists
- Flag any lists with match rates below these thresholds
- If match rates are low, check whether hashing is correct, whether data formatting follows platform requirements, and whether the data is stale

**Recency Assessment:**
- When was each list last updated?
- Flag any list not updated in the last 30 days (for active customer lists)
- Flag any list not updated in the last 90 days (for all lists)
- Check if there is an automated sync in place (Klaviyo integration, CRM connector, etc.) or if lists are being manually uploaded
- If manual uploads, recommend automation via `.claude/skills/klaviyo-integration/SKILL.md` or platform native integrations

**Segmentation Quality:**
- Evaluate whether customer lists are segmented meaningfully (all customers vs high value customers vs recent purchasers vs lapsed customers)
- Recommend segmentation improvements based on available data: high LTV customers (top 20% by revenue), recent purchasers (last 30 to 90 days), repeat purchasers (2+ orders), lapsed customers (no purchase in 180+ days), high AOV customers, specific product category purchasers

### Step 4: Assess Lookalike and Similar Audience Quality

**Meta Lookalike Assessment:**
- Evaluate the source audience for each Lookalike (is it the highest quality seed? Is the source audience large enough?)
- Check Lookalike percentages in use (1%, 2% to 5%, 5% to 10%) and whether they are appropriate for the client's budget and market size
- Flag any Lookalikes built from low quality sources (e.g., page likes instead of purchasers, or all website visitors instead of converters)
- Check if value based Lookalikes are being used when purchase value data is available
- Recommend Lookalike expansion or contraction based on current performance and budget

**Google Similar Audiences / Audience Expansion:**
- Note that Google has deprecated traditional Similar Audiences; check if the account has transitioned to optimized targeting and audience expansion
- Evaluate audience signals in Performance Max campaigns: are they strong enough to guide the algorithm?
- Check if custom segments are being used effectively (keyword based, URL based, app based)
- Evaluate whether in market and affinity audiences are layered appropriately

**TikTok Lookalike Assessment:**
- Evaluate source audience quality and size
- Check similarity level (Narrow, Balanced, Broad) and whether it matches campaign objectives
- Flag any Lookalikes built from audiences with fewer than 1,000 members

### Step 5: Map Remarketing Audience Coverage

Evaluate whether remarketing audiences cover every stage of the customer funnel:

**Top of Funnel (Awareness):**
- Video viewers (25%, 50%, 75%, 95% completion) on Meta and TikTok
- YouTube viewers and channel subscribers on Google
- Social media engagers (page/profile visitors, post interactions) on Meta and TikTok
- Website visitors (all pages, last 180 days) on all platforms

**Mid Funnel (Consideration):**
- Website visitors who viewed specific product or service pages (last 30 to 60 days)
- Blog or content page visitors (last 30 days)
- Visitors who spent significant time on site (if trackable)
- Add to cart without purchase (ecommerce) or form starters without completion (lead gen)
- Return visitors (2+ sessions) on all platforms

**Bottom of Funnel (Conversion):**
- Cart abandoners (last 7 to 14 days) on all platforms
- Form abandoners (last 14 to 30 days) on all platforms
- Pricing or quote page visitors (last 14 to 30 days)
- Checkout starters without completion (last 7 days)

**Post Conversion:**
- Recent purchasers for upsell/cross sell (7 to 30 days post purchase)
- Repeat purchase window audiences (based on average repurchase cycle)
- Lapsed customers for win back (90 to 180 days since last purchase)
- Review or referral request audiences

For each funnel stage, document:
- Whether a remarketing audience exists on each platform
- The audience size
- Whether it is actively being used in campaigns
- Membership duration settings (are they appropriate for the buying cycle?)

Flag any funnel stage with no remarketing audience coverage. This represents a missed opportunity to recapture engaged users.

### Step 6: Check for Audience Overlap

**Meta Audience Overlap:**
- Use the Audience Overlap tool (or navigate to it via Chrome) to check overlap between all active ad sets' audiences
- Flag any audience pairs with overlap above 20%
- For overlapping audiences, recommend consolidation, exclusion layering, or restructuring
- Check if Advantage+ Audience is causing unintended overlap with manual campaigns

**Google Ads Audience Overlap:**
- Check if multiple campaigns are targeting the same audience segments without exclusions
- Evaluate whether Performance Max is competing with standard Shopping or Search campaigns for the same users
- Check if remarketing campaigns are serving to users who would have converted through prospecting campaigns anyway (incrementality concern)

**Cross Platform Overlap:**
- Assess whether the same users are being hit by remarketing on all platforms simultaneously without frequency management
- Recommend cross platform frequency caps or sequential messaging strategies

### Step 7: Evaluate Exclusion Strategy

Check whether proper exclusions are in place:

**Customer Exclusions:**
- Are existing customers excluded from prospecting campaigns? (critical for new customer acquisition efficiency)
- Are recent converters excluded from conversion campaigns for an appropriate window? (7 to 30 days depending on purchase cycle)
- Are leads already in the pipeline excluded from lead gen campaigns?

**Internal Exclusions:**
- Are employees, agency staff, and internal IPs excluded?
- Are test accounts or internal users excluded from custom audiences?

**Negative Audience Exclusions:**
- Are irrelevant audiences excluded? (e.g., job seekers excluded from customer acquisition campaigns)
- On Google: are negative audience lists applied to relevant campaigns?
- On Meta: are custom audiences used as exclusions where appropriate?

**Placement and Geographic Exclusions:**
- Are irrelevant placements excluded? (especially on Meta: Audience Network, Messenger for certain verticals)
- Are geographic exclusions correct? (e.g., excluding non serviceable areas for local businesses)

Flag any missing exclusion that is causing wasted spend or audience contamination.

### Step 8: Identify Audience Gaps and Expansion Opportunities

Based on the full analysis, identify:

**Untapped Audience Sources:**
- First party data not yet uploaded (email lists, phone lists, offline purchase data)
- Website event audiences not yet created (specific page visitors, engagement based)
- CRM integration opportunities (Klaviyo, HubSpot, Salesforce audiences that could be synced)
- Offline conversion data that could feed audience building

**Expansion Opportunities:**
- High performing narrow audiences that could be expanded with broader Lookalikes
- Interest or behavior targeting combinations not yet tested
- New platform audiences (e.g., client is on Meta and Google but TikTok audience infrastructure has not been built)
- Custom intent or in market audiences on Google that align with the client's offering

**Advanced Audience Strategies:**
- Value based Lookalikes if not already in use
- Predictive audiences via GA4 (likely purchasers, likely churning users)
- Cross platform audience orchestration (sequential messaging: awareness on TikTok, consideration on Meta, conversion on Google)
- Suppression lists for incrementality (excluding users likely to convert organically)

### Step 9: Produce Draft Audit Document

Compile all findings into an audience infrastructure audit report following the structure from `templates/audit-report.md` and the deliverable recipes in `.claude/frameworks/deliverable-recipes.md`:

1. **Executive Summary** with top 3 audience opportunities and top 3 audience risks
2. **Audience Health Scorecard** out of 100 with sub scores for: Customer List Health (out of 20), Lookalike/Similar Quality (out of 20), Remarketing Coverage (out of 20), Overlap Management (out of 20), Exclusion Hygiene (out of 20)
3. **Customer List Inventory** with table of all lists, sizes, match rates, recency, and status
4. **Lookalike and Expansion Audience Assessment** with quality ratings and recommendations
5. **Remarketing Funnel Coverage Map** visual representation of which funnel stages are covered on which platforms
6. **Overlap Analysis** with specific overlap percentages and consolidation recommendations
7. **Exclusion Strategy Assessment** with gaps identified and fix recommendations
8. **Audience Expansion Roadmap** with prioritized opportunities for new audience creation and testing
9. **Appendix** with raw audience data, overlap screenshots, and platform specific details

Save the draft report to: `clients/{client-name}/reports/{date}-audience-audit-DRAFT.md`

Update the client's open-items.md with any new action items identified.

Update the client's history.md with a session summary noting the audience audit was performed.

Present the draft to Michael with a brief summary: "Audience infrastructure audit for [Client Name] is ready for review. Key findings: [top 2 to 3 points]. Draft saved to [path]. Want me to walk through it or make changes?"

## Output

The final deliverable is a draft audience infrastructure audit report saved to the client's reports directory, ready for Michael's review and approval before being finalized as a Word document. The report includes a complete audience health scorecard, funnel coverage map, overlap analysis, and a prioritized audience expansion roadmap.

## Dependencies

- Requires Chrome browser access to navigate Google Ads, Meta Ads, and TikTok Ads UIs
- Requires Meta Ads MCP tools for pulling audience and ad set data (optional, can use Chrome)
- Requires the deliverable recipes framework at .claude/frameworks/deliverable-recipes.md
- Requires the platform strategist agent at .claude/agents/platform-strategist.md
- Requires the Klaviyo integration skill at .claude/skills/klaviyo-integration/SKILL.md (if Klaviyo is active)
- Requires an existing client profile at clients/{client-name}/ (or will create one)
