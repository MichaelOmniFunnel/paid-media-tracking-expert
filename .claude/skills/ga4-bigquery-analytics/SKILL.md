---
name: ga4-bigquery-analytics
description: BigQuery export, SQL queries for paid media analysis, POAS calculations, audience building, and Looker Studio integration. Use when someone mentions BigQuery, GA4 export, SQL analytics, custom audiences from GA4 data, Looker Studio, or advanced analytics queries.
context: fork
allowed-tools: Read, Grep, Glob, mcp__google-analytics__run_report, mcp__google-analytics__get_account_summaries, mcp__google-analytics__get_property_details, mcp__google-analytics__get_custom_dimensions_and_metrics, mcp__google-analytics__list_google_ads_links
agent: Explore
---

## Overview

The GA4 BigQuery export unlocks raw, unsampled event-level data for analysis that goes
far beyond what the GA4 user interface can deliver. For OmniFunnel Marketing (OFM), this
means building custom attribution models, calculating true POAS with margin data, running
cross-platform spend analysis, and creating advanced audience segments -- all with SQL
queries against the complete dataset.

### Why BigQuery Export Matters

1. **No sampling** -- GA4 UI applies sampling when data exceeds thresholds. BigQuery
   export contains every single event, unsampled.
2. **Raw event data** -- Access individual event records with full parameter detail,
   not pre-aggregated summaries.
3. **Custom analysis** -- Build any analysis you can imagine: multi-touch attribution,
   cohort analysis, product affinity, customer lifetime value by acquisition source.
4. **Cross-platform joins** -- Combine GA4 data with Google Ads, Meta, TikTok spend
   data, and product margin data from Shopify/WooCommerce/NetSuite.
5. **Historical retention** -- BigQuery retains data indefinitely (subject to your
   retention policy), unlike GA4 UI which limits exploration data to 14 months.
6. **Automated reporting** -- Schedule queries to power Looker Studio dashboards
   with fresh data daily.

---

## Setting Up GA4 BigQuery Export

### Prerequisites

- Google Analytics 4 property (any tier -- BigQuery export is free for all GA4 properties)
- Google Cloud project with BigQuery enabled
- Billing enabled on the Google Cloud project (BigQuery charges for storage and queries)
- Admin access to both GA4 and the Google Cloud project

### Configuration Steps

1. In GA4, go to **Admin > Product Links > BigQuery Links**
2. Click **Link** and select your Google Cloud project
3. Choose your BigQuery dataset location (select the region closest to your operations)
4. Configure export options:
   - **Daily export** (recommended): Previous day's data available within 24 hours
   - **Streaming export** (optional): Near real-time data in `events_intraday_*` tables,
     available within minutes. Higher BigQuery cost.
   - **User data export**: Exports user-level data to `users_*` and
     `pseudonymous_users_*` tables
5. Click **Submit**

### Export Timing

- **Daily tables** (`events_YYYYMMDD`): Available by ~5:00 AM in the property timezone,
  covering the previous calendar day
- **Intraday tables** (`events_intraday_YYYYMMDD`): Updated continuously throughout
  the day; replaced by the daily table once processing completes
- **User tables** (`users_YYYYMMDD`, `pseudonymous_users_YYYYMMDD`): Updated daily

---


## BigQuery Table Schema

The GA4 BigQuery export uses a nested, event-level schema. Each row in `events_YYYYMMDD` represents a single GA4 event.

Key fields: `event_date`, `event_timestamp`, `event_name`, `event_params` (REPEATED), `user_pseudo_id`, `user_id`, `traffic_source`, `collected_traffic_source`, `device`, `geo`, `ecommerce`, `items` (REPEATED), `privacy_info`.

Event parameters accessed via UNNEST:
```sql
(SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location
(SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id
```

Session-level attribution: `collected_traffic_source` (2023+) > `traffic_source` (first-touch only).

For detailed schema tables, read references/bigquery-schema.md

---

## SQL Queries for Paid Media

### Available Queries

1. **Paid Media Performance by Campaign** -- Revenue, transactions, ROAS
2. **Conversion Funnel by Source/Medium** -- Full-funnel with drop-off rates
3. **New vs. Returning Customer Revenue** -- First vs. repeat by source
4. **Product Performance by Campaign** -- Item-level revenue
5. **User Lifetime Value by Source** -- LTV, AOV by acquisition channel
6. **Session-Level Analysis** -- Engagement and conversion by source
7. **Custom Channel Grouping** -- OFM standard mapping

For complete SQL code, read references/sql-query-examples.md

---

## POAS Analysis

Join GA4 purchase data with product margin data for true POAS.

For POAS query, read references/poas-attribution-reporting.md

---

## Cross-Platform Attribution

GA4 last-click vs platform models. GA4 typically attributes 60-80% of platform claims.

For comparison query, read references/poas-attribution-reporting.md

---

## Audience Building

High-Value Customers, Cart Abandoners, Lapsed Customers. Push via GA4 Audience Import, Customer Match, native audiences.

For audience SQL, read references/poas-attribution-reporting.md

---

## Cost Data Import

Google: BigQuery Data Transfer. Meta/TikTok: GA4 Cost Import or API connectors.

For unified ROAS query, read references/poas-attribution-reporting.md

---

## Scheduled Queries and Looker Studio

Scheduled queries > summary tables > Looker Studio (never connect to raw events).

For examples, read references/poas-attribution-reporting.md

---

## Data Retention and Cost

| Monthly Events | Storage | Query Cost |
|---|---|---|
| 1M | < $1 | $5-15 |
| 10M | $2-5 | $20-60 |
| 100M | $15-40 | $50-200 |

---

## Common Issues

1. **UNNEST Complexity** -- Create flattened view
2. **Consent Mode** -- Apply adjustment multipliers
3. **Timezone** -- event_timestamp UTC; event_date property TZ
4. **Session Stitching** -- Composite key: user_pseudo_id + ga_session_id
5. **Duplicates** -- Deduplicate by transaction_id
6. **Missing Source** -- COALESCE across source fields

For SQL solutions, read references/poas-attribution-reporting.md

---

## Key Takeaways

1. Enable both daily and streaming BigQuery export for all GA4 properties
2. Create a flattened events view to simplify downstream queries
3. Always filter on `_TABLE_SUFFIX` to control query costs
4. Use `user_pseudo_id` + `ga_session_id` as the unique session identifier
5. Build custom channel groupings that match your paid media taxonomy
6. Join product margin data for true POAS analysis
7. Import cost data from all platforms for unified ROAS reporting
8. Use scheduled queries to populate summary tables for Looker Studio
9. Monitor consent rates and apply adjustment multipliers as needed
10. Deduplicate purchases by `transaction_id` to avoid over-counting revenue
