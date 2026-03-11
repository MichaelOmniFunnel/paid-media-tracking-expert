---
name: poas-optimization
description: POAS (Profit on Ad Spend) optimization strategy, implementation, and monitoring. Covers margin data integration, platform bidding configuration, custom conversion setup, and ongoing POAS performance analysis. Use when someone mentions POAS, profit optimization, margin-based bidding, value-based bidding with margins, or 'optimize for profit not revenue'.
model: sonnet
allowed-tools: Read, Grep, Glob, Agent
---
# POAS Optimization

## What is POAS

Profit on Ad Spend. Gross profit generated per dollar of ad spend. The only metric that tells you whether ad spend is actually profitable, not just generating revenue.

Formula: POAS = (Revenue from Ads minus COGS from those sales) / Ad Spend

Platform ROAS tells you revenue per dollar spent. POAS tells you profit per dollar spent. A campaign with 4x ROAS selling low-margin products can be less profitable than a 2x ROAS campaign selling high-margin products.

## Why Platform ROAS Fails

1. **Margin blindness**: Platform algorithms optimize for revenue, not profit. They will spend budget on high-AOV low-margin products over low-AOV high-margin ones.
2. **Attribution inflation**: View-through conversions, cross-platform double-counting, and organic cannibalization inflate reported ROAS.
3. **Revenue is vanity**: A $100K revenue month with 20% margins and $30K ad spend = $10K loss. ROAS looks great. Profit is negative.

## When to Use POAS vs Blended ROAS

| Scenario | Use POAS | Use Blended ROAS |
|---|---|---|
| Product margins vary by 10%+ across catalog | Yes | No |
| Client can provide item-level cost data | Yes | Fallback |
| Single product or uniform margin business | Optional | Yes |
| Lead gen (no product margin) | No | Yes, or CPA |
| Client has BigQuery + margin data pipeline | Yes | Supplement |

## Implementation Roadmap

### Phase 1: Get Margin Data (Week 1)

**From client's ecommerce platform:**

| Platform | Where to Find COGS | Method |
|---|---|---|
| Shopify | Products > Cost per item field | Shopify Admin API or CSV export |
| WooCommerce | Cost of Goods plugin or custom meta | REST API export or database query |
| NetSuite | Item records > cost fields | SuiteAnalytics Connect or saved search |
| Manual | Spreadsheet from client | Google Sheets with item_id, cost, margin_pct |

**Minimum viable data:** item_id (matching GA4/platform item_id), unit_cost or margin_percentage. If the client can't provide per-item costs, use category-level average margins as a starting point.

### Phase 2: Pass Margin Data to Platforms (Week 2)

**Option A: DataLayer at Checkout (Recommended)**

Push gross profit as a custom parameter in the purchase event dataLayer. ES5 compliant for GTM:

```javascript
// In the checkout confirmation page dataLayer push
// Calculate gross profit server-side or from known margins
dataLayer.push({
  'event': 'purchase',
  'ecommerce': {
    'transaction_id': orderData.orderId,
    'value': orderData.revenue,
    'gross_profit': orderData.grossProfit,  // Revenue minus COGS
    'items': orderData.items
  }
});
```

**Option B: Conversion Value Rules (Google Ads)**

Google Ads Conversion Value Rules allow adjusting reported conversion value by audience, location, or device. Less granular than item-level POAS but requires zero code changes.

Settings > Conversions > Value Rules > Create rule:
- Adjust value for specific audiences (high-margin product buyers)
- Apply percentage adjustments by category

**Option C: Custom Conversions with Profit Value (Meta)**

In Meta Events Manager, create a custom conversion where the value parameter sends gross profit instead of revenue. Requires the dataLayer to include profit data.

**Option D: BigQuery Pipeline (Most Accurate)**

Join GA4 purchase events with margin data in BigQuery. Calculate true POAS. Import back as offline conversions or use for reporting. See .claude/skills/ga4-bigquery-analytics/references/poas-attribution-reporting.md for SQL queries.

### Phase 3: Configure Platform Bidding (Week 3)

**Google Ads:**
- Set conversion action value to use gross_profit (from dataLayer) instead of revenue
- Switch to tROAS bidding with POAS-based target
- A POAS target of 1.5 means $1.50 profit per $1 spent (equivalent to 150% POAS)
- Start target 20% below actual performance, let Smart Bidding calibrate over 2 weeks

**Meta Ads:**
- If using custom conversion with profit value: set campaign optimization for "Maximize Value" (this now optimizes for profit)
- If not: use value optimization with revenue, then adjust ROAS targets to account for average margin
- For example: if average margin is 40%, and you need 2x POAS, set tROAS to 5x (because 5x revenue * 40% margin = 2x profit)

**TikTok Ads:**
- TikTok value optimization is newer and less mature
- Start with CPA optimization on purchase events
- Graduate to value optimization once sufficient data (50+ conversions/week)
- TikTok's algorithm needs more volume than Google or Meta to optimize effectively

### Phase 4: Monitor and Refine (Ongoing)

**Weekly check:**
- Pull POAS by campaign from BigQuery or cross-reference platform data with margin spreadsheet
- Compare platform-reported ROAS to actual POAS
- Flag campaigns where ROAS looks good but POAS is below target

**Monthly analysis:**
- Product mix shift: are ads driving more low-margin products over time?
- Margin accuracy: have COGs changed since initial setup?
- POAS by channel: which platform delivers highest profit per dollar?
- Blended POAS across all channels (the true north star)

**Quarterly refresh:**
- Update margin data from client's financial records
- Recalibrate bidding targets based on actual POAS performance
- Evaluate category-level POAS for budget reallocation signals

## POAS Benchmarks

| Vertical | Good POAS | Great POAS | Notes |
|---|---|---|---|
| General ecommerce | 1.5x | 2.5x+ | Varies massively by margin structure |
| Fashion/apparel | 1.2x | 2.0x+ | Typically 50-60% margins |
| Electronics | 0.8x | 1.5x+ | Low margins (10-25%), need volume |
| Health/beauty | 2.0x | 3.5x+ | High margins (60-80%) |
| Home goods | 1.3x | 2.0x+ | Mixed margins |

These are directional. Every client has different margins, overhead, and break-even points.

## Break-Even POAS Calculation

Minimum POAS = 1.0 (recovering ad spend from gross profit)

But clients also have operational overhead. The real break-even accounts for:

True Break-Even POAS = (Ad Spend + Allocated Overhead) / Gross Profit from Ads

If a client spends $10K/month on ads, has $5K in allocated overhead (staff, tools, agency fees), and generates $20K in gross profit from ads:
- POAS = $20K / $10K = 2.0x (looks profitable)
- True POAS = ($10K + $5K) / $20K = 0.75 (overhead adjusted, still profitable since overhead POAS < gross POAS)

Discuss overhead allocation with the client during quarterly reviews.

## Common Pitfalls

1. **Stale margin data**: COGs change. If margins were set 6 months ago and supplier costs increased 15%, POAS calculations are wrong. Build a quarterly refresh into the workflow.

2. **Ignoring returns**: POAS should account for return rate. A product with 40% margins but 30% return rate has effective ~10% margins. Work with client to get return rate data by category.

3. **Over-optimizing for POAS**: Extremely high POAS targets shrink volume. A 5x POAS target might mean the algorithm only bids on sure-thing converters, missing the growth audience. Balance POAS targets with volume goals.

4. **Using POAS for lead gen**: POAS is a product margin metric. For lead gen, use cost per qualified lead or customer lifetime value instead.

5. **Single-channel POAS**: One channel's POAS does not exist in isolation. Meta prospecting drives awareness that converts on Google branded search. Always look at blended POAS across all channels.

## References

- Framework: .claude/frameworks/poas-methodology.md (definitions and formulas)
- BigQuery implementation: .claude/skills/ga4-bigquery-analytics/references/poas-attribution-reporting.md (SQL queries)
- Attribution context: .claude/skills/attribution-measurement/SKILL.md (cross-platform measurement)
- Feed optimization: .claude/skills/feed-catalog-optimization/SKILL.md (custom labels by margin tier)
