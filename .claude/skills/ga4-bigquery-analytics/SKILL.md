---
name: GA4 BigQuery Analytics
description: BigQuery export, SQL queries for paid media analysis, POAS calculations, audience building, and Looker Studio integration
context: fork
---
# GA4 BigQuery Analytics for Paid Media

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

### Events Table: `events_YYYYMMDD`

Each row represents a single GA4 event. Key fields:

| Field                        | Type    | Description                                      |
|------------------------------|---------|--------------------------------------------------|
| event_date                   | STRING  | Date in YYYYMMDD format                          |
| event_timestamp              | INTEGER | Microseconds since Unix epoch                    |
| event_name                   | STRING  | Event name (page_view, purchase, etc.)           |
| event_params                 | RECORD  | REPEATED -- array of key-value parameter pairs   |
| event_value_in_usd           | FLOAT   | Monetized event value in USD                     |
| user_id                      | STRING  | User ID set via setUserId (if implemented)       |
| user_pseudo_id               | STRING  | GA4 client ID (cookie-based pseudonymous ID)     |
| user_properties              | RECORD  | REPEATED -- user-scoped custom dimensions        |
| user_first_touch_timestamp   | INTEGER | Timestamp of user's first visit                  |
| traffic_source.source        | STRING  | First-touch traffic source                       |
| traffic_source.medium        | STRING  | First-touch traffic medium                       |
| traffic_source.name          | STRING  | First-touch campaign name                        |
| device.category              | STRING  | desktop, mobile, tablet                          |
| device.operating_system      | STRING  | OS name                                          |
| device.web_info.browser      | STRING  | Browser name                                     |
| geo.country                  | STRING  | User country                                     |
| geo.region                   | STRING  | User state/region                                |
| geo.city                     | STRING  | User city                                        |
| ecommerce.transaction_id     | STRING  | Purchase transaction ID                          |
| ecommerce.purchase_revenue   | FLOAT   | Purchase revenue                                 |
| items                        | RECORD  | REPEATED -- array of item/product records        |
| collected_traffic_source     | RECORD  | Session-level traffic source from collected data |
| privacy_info                 | RECORD  | Consent status and privacy settings              |
| session_traffic_source_last_click | RECORD | Last-click session traffic source           |

### Event Parameters (`event_params`)

Event parameters are stored as a repeated nested structure:

```
event_params[].key          -- Parameter name (STRING)
event_params[].value        -- Nested record with typed values:
  .string_value             -- STRING
  .int_value                -- INTEGER
  .float_value              -- FLOAT
  .double_value             -- FLOAT
```

Common event parameters:
- `page_location` -- Full URL of the page
- `page_title` -- Page title
- `page_referrer` -- Referring URL
- `source` -- Traffic source for the session
- `medium` -- Traffic medium for the session
- `campaign` -- Campaign name (UTM)
- `ga_session_id` -- Session identifier
- `ga_session_number` -- Session count for the user
- `engagement_time_msec` -- Engagement time in milliseconds
- `value` -- Monetary value of the event

### Items Array (`items`)

For ecommerce events, each item in the transaction:

```
items[].item_id             -- Product/SKU ID
items[].item_name           -- Product name
items[].item_brand          -- Brand
items[].item_category       -- Primary category
items[].item_category2-5    -- Sub-categories
items[].price               -- Item price
items[].quantity            -- Quantity purchased
items[].item_revenue        -- Revenue for this item
items[].coupon              -- Coupon code applied
items[].affiliation         -- Store or affiliation
```

### Intraday Table: `events_intraday_YYYYMMDD`

Same schema as `events_YYYYMMDD` but contains today's data (streaming export).
This table is replaced by the daily table once processing completes.

### User Tables: `users_YYYYMMDD` and `pseudonymous_users_YYYYMMDD`

User-level export tables containing:
- User properties and their history
- Audiences the user belongs to
- User lifetime metrics (LTV, session count, etc.)
- Predictive metrics (purchase probability, churn probability)

---

## Essential SQL Patterns

### UNNEST Pattern (Critical)

GA4's nested schema requires UNNEST to extract event parameters. This is the most
important pattern to master:

```sql
-- Extract a string event parameter
SELECT
  event_timestamp,
  (SELECT value.string_value
   FROM UNNEST(event_params)
   WHERE key = 'page_location') AS page_location
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX = '20260305'
  AND event_name = 'page_view';
```

```sql
-- Extract a numeric event parameter
SELECT
  event_timestamp,
  (SELECT value.int_value
   FROM UNNEST(event_params)
   WHERE key = 'ga_session_id') AS session_id,
  (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
   FROM UNNEST(event_params)
   WHERE key = 'value') AS event_value
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX = '20260305'
  AND event_name = 'purchase';
```

### Multiple Parameters in One Query

```sql
-- Extract multiple event parameters using correlated subqueries
SELECT
  user_pseudo_id,
  event_timestamp,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') AS source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium') AS medium,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS campaign,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX BETWEEN '20260301' AND '20260305';
```

---

## Key SQL Queries for Paid Media Analysis

### 1. Revenue by Traffic Source with Full Path Analysis

```sql
-- Revenue and ROAS by source/medium using session-level attribution
WITH sessions AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    COALESCE(
      collected_traffic_source.manual_medium,
      traffic_source.medium,
      '(none)'
    ) AS medium,
    COALESCE(
      collected_traffic_source.manual_campaign_name,
      traffic_source.name,
      '(not set)'
    ) AS campaign,
    event_name,
    CASE WHEN event_name = 'purchase'
      THEN ecommerce.purchase_revenue
      ELSE 0
    END AS revenue
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
)
SELECT
  source,
  medium,
  campaign,
  COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) AS sessions,
  COUNTIF(event_name = 'purchase') AS transactions,
  SUM(revenue) AS total_revenue,
  SAFE_DIVIDE(COUNTIF(event_name = 'purchase'),
    COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))) AS conv_rate,
  SAFE_DIVIDE(SUM(revenue),
    COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING)))) AS rev_per_session
FROM sessions
GROUP BY source, medium, campaign
HAVING total_revenue > 0
ORDER BY total_revenue DESC;
```

### 2. Conversion Path Analysis (Multi-Touch)

```sql
-- Build conversion paths showing all touchpoints before purchase
WITH touchpoints AS (
  SELECT
    user_pseudo_id,
    event_timestamp,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    COALESCE(
      collected_traffic_source.manual_medium,
      traffic_source.medium,
      '(none)'
    ) AS medium
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'session_start'
),
conversions AS (
  SELECT
    user_pseudo_id,
    event_timestamp AS conversion_timestamp,
    ecommerce.purchase_revenue AS revenue,
    ecommerce.transaction_id
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'purchase'
),
paths AS (
  SELECT
    c.user_pseudo_id,
    c.transaction_id,
    c.revenue,
    STRING_AGG(
      CONCAT(t.source, ' / ', t.medium),
      ' > '
      ORDER BY t.event_timestamp
    ) AS conversion_path,
    COUNT(DISTINCT t.session_id) AS path_length
  FROM conversions c
  JOIN touchpoints t
    ON c.user_pseudo_id = t.user_pseudo_id
    AND t.event_timestamp <= c.conversion_timestamp
  GROUP BY c.user_pseudo_id, c.transaction_id, c.revenue
)
SELECT
  conversion_path,
  COUNT(*) AS conversions,
  SUM(revenue) AS total_revenue,
  AVG(path_length) AS avg_path_length
FROM paths
GROUP BY conversion_path
ORDER BY conversions DESC
LIMIT 50;
```

### 3. Landing Page Performance by Ad Source

```sql
-- Landing page analysis segmented by paid traffic source
WITH landing_pages AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS landing_page,
    COALESCE(
      collected_traffic_source.manual_source,
      '(direct)'
    ) AS source,
    COALESCE(
      collected_traffic_source.manual_medium,
      '(none)'
    ) AS medium,
    event_timestamp
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'session_start'
),
session_outcomes AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) AS converted,
    SUM(CASE WHEN event_name = 'purchase'
        THEN ecommerce.purchase_revenue ELSE 0 END) AS revenue,
    SUM(CASE WHEN event_name IN ('add_to_cart')
        THEN 1 ELSE 0 END) AS add_to_carts
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
  GROUP BY user_pseudo_id, session_id
)
SELECT
  -- Extract just the path from the full URL
  REGEXP_EXTRACT(lp.landing_page, r'https?://[^/]+(/.*)') AS page_path,
  lp.source,
  lp.medium,
  COUNT(DISTINCT CONCAT(lp.user_pseudo_id, CAST(lp.session_id AS STRING))) AS sessions,
  SUM(so.converted) AS conversions,
  SAFE_DIVIDE(SUM(so.converted),
    COUNT(DISTINCT CONCAT(lp.user_pseudo_id, CAST(lp.session_id AS STRING)))) AS conv_rate,
  SUM(so.revenue) AS revenue,
  SUM(so.add_to_carts) AS add_to_carts
FROM landing_pages lp
LEFT JOIN session_outcomes so
  ON lp.user_pseudo_id = so.user_pseudo_id
  AND lp.session_id = so.session_id
WHERE lp.medium IN ('cpc', 'paid_social', 'paidsocial', 'ppc', 'cpm')
GROUP BY page_path, lp.source, lp.medium
HAVING sessions >= 10
ORDER BY sessions DESC;
```

### 4. Product Performance by Campaign

```sql
-- Product-level performance broken down by campaign
WITH purchase_items AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    COALESCE(
      collected_traffic_source.manual_campaign_name,
      traffic_source.name,
      '(not set)'
    ) AS campaign,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    item.item_id,
    item.item_name,
    item.item_category,
    item.price,
    item.quantity,
    (item.price * item.quantity) AS item_revenue
  FROM
    \`project.dataset.events_*\`,
    UNNEST(items) AS item
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'purchase'
)
SELECT
  campaign,
  source,
  item_name,
  item_category,
  SUM(quantity) AS units_sold,
  SUM(item_revenue) AS revenue,
  COUNT(DISTINCT user_pseudo_id) AS unique_buyers,
  SAFE_DIVIDE(SUM(item_revenue), SUM(quantity)) AS avg_selling_price
FROM purchase_items
WHERE campaign != '(not set)'
GROUP BY campaign, source, item_name, item_category
ORDER BY revenue DESC
LIMIT 100;
```

### 5. User Lifetime Value by Acquisition Source

```sql
-- Calculate LTV by the source that originally acquired the user
WITH user_acquisition AS (
  SELECT
    user_pseudo_id,
    traffic_source.source AS acquisition_source,
    traffic_source.medium AS acquisition_medium,
    traffic_source.name AS acquisition_campaign,
    TIMESTAMP_MICROS(user_first_touch_timestamp) AS first_touch_date
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20250301' AND '20260305'
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY user_pseudo_id
    ORDER BY event_timestamp ASC
  ) = 1
),
user_revenue AS (
  SELECT
    user_pseudo_id,
    COUNT(DISTINCT ecommerce.transaction_id) AS total_transactions,
    SUM(ecommerce.purchase_revenue) AS total_revenue,
    MIN(event_timestamp) AS first_purchase_ts,
    MAX(event_timestamp) AS last_purchase_ts,
    COUNT(DISTINCT event_date) AS active_days
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20250301' AND '20260305'
    AND event_name = 'purchase'
  GROUP BY user_pseudo_id
)
SELECT
  COALESCE(ua.acquisition_source, '(direct)') AS acquisition_source,
  COALESCE(ua.acquisition_medium, '(none)') AS acquisition_medium,
  COUNT(DISTINCT ua.user_pseudo_id) AS total_users,
  COUNT(DISTINCT ur.user_pseudo_id) AS purchasing_users,
  SAFE_DIVIDE(COUNT(DISTINCT ur.user_pseudo_id),
    COUNT(DISTINCT ua.user_pseudo_id)) AS purchase_rate,
  SUM(ur.total_revenue) AS total_ltv,
  SAFE_DIVIDE(SUM(ur.total_revenue),
    COUNT(DISTINCT ur.user_pseudo_id)) AS avg_ltv_per_buyer,
  SAFE_DIVIDE(SUM(ur.total_revenue),
    COUNT(DISTINCT ua.user_pseudo_id)) AS avg_ltv_per_user,
  AVG(ur.total_transactions) AS avg_transactions_per_buyer,
  SAFE_DIVIDE(SUM(ur.total_revenue),
    SUM(ur.total_transactions)) AS avg_order_value
FROM user_acquisition ua
LEFT JOIN user_revenue ur ON ua.user_pseudo_id = ur.user_pseudo_id
GROUP BY acquisition_source, acquisition_medium
HAVING total_users >= 10
ORDER BY total_ltv DESC;
```

### 6. Session-Level vs. User-Level Analysis

```sql
-- Session-level aggregation (for session-scoped analysis)
WITH session_data AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    MIN(event_timestamp) AS session_start,
    MAX(event_timestamp) AS session_end,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    COALESCE(
      collected_traffic_source.manual_medium,
      traffic_source.medium,
      '(none)'
    ) AS medium,
    COUNTIF(event_name = 'page_view') AS pageviews,
    MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) AS had_purchase,
    SUM(CASE WHEN event_name = 'purchase'
        THEN ecommerce.purchase_revenue ELSE 0 END) AS session_revenue,
    SUM(
      (SELECT value.int_value FROM UNNEST(event_params)
       WHERE key = 'engagement_time_msec')
    ) AS total_engagement_ms
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
  GROUP BY user_pseudo_id, session_id, source, medium
)
SELECT
  source,
  medium,
  COUNT(*) AS total_sessions,
  AVG(pageviews) AS avg_pageviews,
  AVG(total_engagement_ms / 1000.0) AS avg_engagement_seconds,
  SUM(had_purchase) AS converting_sessions,
  SAFE_DIVIDE(SUM(had_purchase), COUNT(*)) AS session_conv_rate,
  SUM(session_revenue) AS total_revenue
FROM session_data
GROUP BY source, medium
ORDER BY total_sessions DESC;
```

### 7. Custom Channel Grouping

```sql
-- Create custom channel groupings matching your paid media taxonomy
WITH events_with_channels AS (
  SELECT
    *,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    COALESCE(
      collected_traffic_source.manual_medium,
      traffic_source.medium,
      '(none)'
    ) AS medium,
    COALESCE(
      collected_traffic_source.manual_campaign_name,
      traffic_source.name,
      '(not set)'
    ) AS campaign,
    -- Custom channel grouping logic for OFM
    CASE
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)google'
      ) AND REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
        r'(?i)(cpc|ppc)'
      ) THEN 'Google Ads - Search'

      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)google'
      ) AND REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
        r'(?i)(display|banner|cpm)'
      ) THEN 'Google Ads - Display'

      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)google'
      ) AND REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_campaign_name, traffic_source.name, ''),
        r'(?i)(pmax|performance.max|shopping)'
      ) THEN 'Google Ads - Shopping/PMax'

      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(facebook|fb|instagram|ig|meta)'
      ) AND REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
        r'(?i)(cpc|paid|paidsocial|paid_social|cpm)'
      ) THEN 'Meta Ads'

      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(tiktok|tt)'
      ) AND REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
        r'(?i)(cpc|paid|paidsocial|paid_social|cpm)'
      ) THEN 'TikTok Ads'

      WHEN COALESCE(
        collected_traffic_source.manual_medium, traffic_source.medium, '(none)'
      ) = 'organic' THEN 'Organic Search'

      WHEN COALESCE(
        collected_traffic_source.manual_medium, traffic_source.medium, '(none)'
      ) = 'email' THEN 'Email'

      WHEN COALESCE(
        collected_traffic_source.manual_medium, traffic_source.medium, '(none)'
      ) = 'referral' THEN 'Referral'

      WHEN COALESCE(
        collected_traffic_source.manual_source, traffic_source.source, '(direct)'
      ) = '(direct)' THEN 'Direct'

      ELSE 'Other'
    END AS custom_channel
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
)
SELECT
  custom_channel,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNT(DISTINCT CONCAT(
    user_pseudo_id,
    CAST((SELECT value.int_value FROM UNNEST(event_params)
          WHERE key = 'ga_session_id') AS STRING)
  )) AS sessions,
  COUNTIF(event_name = 'purchase') AS transactions,
  SUM(CASE WHEN event_name = 'purchase'
      THEN ecommerce.purchase_revenue ELSE 0 END) AS revenue,
  SAFE_DIVIDE(
    COUNTIF(event_name = 'purchase'),
    COUNT(DISTINCT CONCAT(
      user_pseudo_id,
      CAST((SELECT value.int_value FROM UNNEST(event_params)
            WHERE key = 'ga_session_id') AS STRING)
    ))
  ) AS session_conv_rate
FROM events_with_channels
GROUP BY custom_channel
ORDER BY revenue DESC;
```

---

## POAS Analysis in BigQuery

### Joining Product Margin Data

True Profit on Ad Spend (POAS) requires margin data that ad platforms do not have.
The approach: join GA4 purchase data with product cost/margin data from your ecommerce
platform.

```sql
-- POAS calculation by campaign using external margin data
-- Assumes a margin lookup table has been loaded into BigQuery
-- Table: project.dataset.product_margins (item_id STRING, cost FLOAT64, margin_pct FLOAT64)

WITH purchase_items AS (
  SELECT
    COALESCE(
      collected_traffic_source.manual_campaign_name,
      traffic_source.name,
      '(not set)'
    ) AS campaign,
    COALESCE(
      collected_traffic_source.manual_source,
      traffic_source.source,
      '(direct)'
    ) AS source,
    item.item_id,
    item.item_name,
    item.price AS selling_price,
    item.quantity
  FROM
    \`project.dataset.events_*\`,
    UNNEST(items) AS item
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'purchase'
),
with_margins AS (
  SELECT
    pi.campaign,
    pi.source,
    pi.item_id,
    pi.item_name,
    pi.selling_price,
    pi.quantity,
    (pi.selling_price * pi.quantity) AS revenue,
    COALESCE(pm.cost, pi.selling_price * 0.5) AS unit_cost, -- default 50% cost if no data
    (pi.selling_price * pi.quantity) -
      (COALESCE(pm.cost, pi.selling_price * 0.5) * pi.quantity) AS gross_profit
  FROM purchase_items pi
  LEFT JOIN \`project.dataset.product_margins\` pm
    ON pi.item_id = pm.item_id
)
SELECT
  campaign,
  source,
  SUM(revenue) AS total_revenue,
  SUM(gross_profit) AS total_gross_profit,
  SAFE_DIVIDE(SUM(gross_profit), SUM(revenue)) AS overall_margin_pct,
  -- To calculate POAS, divide gross_profit by ad spend (from cost data table)
  SUM(gross_profit) AS profit_for_poas_calc
FROM with_margins
WHERE campaign != '(not set)'
GROUP BY campaign, source
ORDER BY total_gross_profit DESC;
```

### Loading Margin Data

Options for getting product margin data into BigQuery:

1. **Shopify:** Use Shopify's cost_per_item field, export via the Admin API or a
   connector tool (Fivetran, Stitch, Airbyte) to BigQuery
2. **WooCommerce:** Export product cost from the WooCommerce Cost of Goods plugin
   or custom meta fields
3. **NetSuite:** Use SuiteAnalytics Connect or a scheduled saved search exported
   to BigQuery via a connector
4. **Manual upload:** For smaller catalogs, maintain a Google Sheet with item_id,
   cost, and margin_pct; use a scheduled BigQuery data transfer from Sheets

---

## Cross-Platform Attribution Queries

### Comparing GA4 vs. Platform-Reported Data

```sql
-- GA4-reported revenue vs. what Google Ads / Meta report
-- This query extracts GA4's view; compare with platform exports

WITH ga4_by_platform AS (
  SELECT
    CASE
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)google'
      ) THEN 'Google Ads'
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(facebook|fb|instagram|ig|meta)'
      ) THEN 'Meta Ads'
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(tiktok|tt)'
      ) THEN 'TikTok Ads'
      ELSE 'Other'
    END AS platform,
    event_date,
    COUNT(DISTINCT ecommerce.transaction_id) AS ga4_transactions,
    SUM(ecommerce.purchase_revenue) AS ga4_revenue
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'purchase'
    AND REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
      r'(?i)(cpc|paid|paidsocial|paid_social|ppc|cpm)'
    )
  GROUP BY platform, event_date
)
SELECT
  platform,
  SUM(ga4_transactions) AS ga4_total_transactions,
  SUM(ga4_revenue) AS ga4_total_revenue,
  -- Compare these totals with platform-reported numbers
  -- to calculate the discrepancy ratio
  -- e.g., if Meta reports $100K and GA4 reports $70K for Meta,
  -- the GA4/platform ratio is 0.70
  ROUND(SUM(ga4_revenue), 2) AS ga4_revenue_for_comparison
FROM ga4_by_platform
GROUP BY platform
ORDER BY ga4_total_revenue DESC;
```

---

## Audience Building with BigQuery

### Creating Audiences in BigQuery for GA4

You can build sophisticated audience segments in BigQuery and push them back to GA4
for use in Google Ads remarketing, DV360, and other destinations.

### High-Value Customer Audience

```sql
-- Identify high-value customers for remarketing
-- Export this list and import as a GA4 audience or upload to Google Ads
SELECT
  user_pseudo_id,
  COUNT(DISTINCT ecommerce.transaction_id) AS purchase_count,
  SUM(ecommerce.purchase_revenue) AS total_spend,
  MAX(event_date) AS last_purchase_date,
  DATE_DIFF(
    CURRENT_DATE(),
    PARSE_DATE('%Y%m%d', MAX(event_date)),
    DAY
  ) AS days_since_last_purchase
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX BETWEEN '20250301' AND '20260305'
  AND event_name = 'purchase'
GROUP BY user_pseudo_id
HAVING
  total_spend >= 500
  AND purchase_count >= 2
  AND days_since_last_purchase <= 180;
```

### Cart Abandoners Audience

```sql
-- Users who added to cart but did not purchase in the last 30 days
WITH cart_adders AS (
  SELECT DISTINCT user_pseudo_id
  FROM \`project.dataset.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name = 'add_to_cart'
),
purchasers AS (
  SELECT DISTINCT user_pseudo_id
  FROM \`project.dataset.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name = 'purchase'
)
SELECT ca.user_pseudo_id
FROM cart_adders ca
LEFT JOIN purchasers p ON ca.user_pseudo_id = p.user_pseudo_id
WHERE p.user_pseudo_id IS NULL;
```

### Pushing Audiences to GA4 / Google Ads

1. **GA4 Audience Import:** Use the GA4 Measurement Protocol or the GA4 Admin API to
   create audiences based on BigQuery segments
2. **Google Ads Customer Match:** Export user identifiers (emails, phone numbers if
   available via user_id mapping) and upload via Google Ads Customer Match
3. **GA4 Native Audiences:** Create the audience definition in GA4 using the same logic
   as your BigQuery query; GA4 will evaluate it in real-time and automatically share
   with linked Google Ads accounts

---

## Cost Data Import for Unified Analysis

### Google Ads Cost Data

Google Ads data transfers to BigQuery natively via the BigQuery Data Transfer Service:

1. In BigQuery, go to **Data Transfers > Create Transfer**
2. Select **Google Ads** as the source
3. Authorize with your Google Ads MCC or account credentials
4. Data includes: campaign spend, impressions, clicks, conversions, by day

### Meta and TikTok Cost Data

As of 2025-2026, GA4 supports native cost data import from Meta and TikTok. For
BigQuery-level analysis:

**Option A: GA4 Cost Data Import (simplest)**
- Configure in GA4 Admin > Data Import > Cost Data
- GA4 ingests spend, impressions, clicks from Meta and TikTok
- This data flows through to the BigQuery export

**Option B: Direct API connectors to BigQuery**
- Use connectors (Fivetran, Supermetrics, Funnel.io, OWOX) to pull Meta Marketing API
  and TikTok Marketing API data directly into BigQuery tables
- Gives you full granularity: ad-level spend, impressions, clicks, platform conversions

**Option C: Manual/CSV upload**
- Export platform reports as CSV
- Upload to BigQuery via the console or `bq load` command
- Suitable for small-scale or infrequent analysis

### Unified ROAS Query

```sql
-- Unified cross-platform ROAS using GA4 revenue + platform spend data
-- Assumes cost data tables exist in BigQuery

WITH ga4_revenue AS (
  SELECT
    CASE
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)google'
      ) THEN 'Google Ads'
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(facebook|fb|instagram|ig|meta)'
      ) THEN 'Meta Ads'
      WHEN REGEXP_CONTAINS(
        COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
        r'(?i)(tiktok|tt)'
      ) THEN 'TikTok Ads'
    END AS platform,
    SUM(ecommerce.purchase_revenue) AS ga4_revenue
  FROM
    \`project.dataset.events_*\`
  WHERE
    _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
    AND event_name = 'purchase'
    AND REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
      r'(?i)(cpc|paid|paidsocial|paid_social|ppc|cpm)'
    )
  GROUP BY platform
),
platform_spend AS (
  -- Google Ads spend from BigQuery Data Transfer
  SELECT 'Google Ads' AS platform, SUM(cost_micros / 1e6) AS spend
  FROM \`project.google_ads_dataset.campaign_stats_*\`
  WHERE _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
  UNION ALL
  -- Meta spend from connector table
  SELECT 'Meta Ads' AS platform, SUM(spend) AS spend
  FROM \`project.meta_ads_dataset.ad_insights\`
  WHERE date_start BETWEEN '2026-02-01' AND '2026-02-28'
  UNION ALL
  -- TikTok spend from connector table
  SELECT 'TikTok Ads' AS platform, SUM(spend) AS spend
  FROM \`project.tiktok_ads_dataset.campaign_stats\`
  WHERE stat_datetime BETWEEN '2026-02-01' AND '2026-02-28'
)
SELECT
  COALESCE(r.platform, s.platform) AS platform,
  s.spend AS total_spend,
  r.ga4_revenue AS ga4_attributed_revenue,
  SAFE_DIVIDE(r.ga4_revenue, s.spend) AS blended_roas,
  -- Platform-reported data would come from the platform tables directly
  -- This gives GA4-measured ROAS which is typically lower than platform-reported
  ROUND(SAFE_DIVIDE(r.ga4_revenue, s.spend), 2) AS ga4_roas
FROM ga4_revenue r
FULL OUTER JOIN platform_spend s ON r.platform = s.platform
ORDER BY total_spend DESC;
```

---

## Scheduled Queries for Automated Reporting

### Setting Up Scheduled Queries

1. In BigQuery Console, write your query
2. Click **Schedule** > **Create new scheduled query**
3. Configure:
   - Name: e.g., "Daily Paid Media Performance Summary"
   - Schedule: Daily at 8:00 AM (after GA4 daily export completes)
   - Destination table: `project.reporting.daily_paid_media_summary`
   - Write preference: APPEND (for historical tracking) or WRITE_TRUNCATE (for latest)

### Example: Daily Performance Summary Table

```sql
-- Scheduled daily: populates a summary table for Looker Studio
SELECT
  PARSE_DATE('%Y%m%d', event_date) AS report_date,
  CASE
    WHEN REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
      r'(?i)google'
    ) AND REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
      r'(?i)(cpc|ppc)'
    ) THEN 'Google Ads'
    WHEN REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
      r'(?i)(facebook|fb|instagram|ig|meta)'
    ) THEN 'Meta Ads'
    WHEN REGEXP_CONTAINS(
      COALESCE(collected_traffic_source.manual_source, traffic_source.source, ''),
      r'(?i)(tiktok|tt)'
    ) THEN 'TikTok Ads'
    ELSE 'Other Paid'
  END AS channel,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNT(DISTINCT CONCAT(
    user_pseudo_id,
    CAST((SELECT value.int_value FROM UNNEST(event_params)
          WHERE key = 'ga_session_id') AS STRING)
  )) AS sessions,
  COUNTIF(event_name = 'purchase') AS transactions,
  SUM(CASE WHEN event_name = 'purchase'
      THEN ecommerce.purchase_revenue ELSE 0 END) AS revenue,
  COUNTIF(event_name = 'add_to_cart') AS add_to_carts,
  COUNTIF(event_name = 'begin_checkout') AS checkouts_started
FROM
  \`project.dataset.events_*\`
WHERE
  -- Use yesterday's date for daily scheduling
  _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  AND REGEXP_CONTAINS(
    COALESCE(collected_traffic_source.manual_medium, traffic_source.medium, ''),
    r'(?i)(cpc|paid|paidsocial|paid_social|ppc|cpm)'
  )
GROUP BY report_date, channel;
```

---

## Connecting BigQuery to Looker Studio

### Setup Steps

1. Open Looker Studio and create a new report (or data source)
2. Select **BigQuery** as the connector
3. Choose your project, dataset, and either:
   - A specific table (for pre-aggregated reporting tables)
   - A custom query (for ad-hoc analysis)
4. Configure date range parameters if using wildcard table queries

### Best Practices for Looker Studio + BigQuery

- **Use pre-aggregated tables** rather than querying raw events directly. Querying
  raw GA4 event tables from Looker Studio is slow and expensive.
- **Create scheduled queries** that populate summary tables (as shown above)
- **Use date parameters** to limit data scanned:

```sql
-- Parameterized query for Looker Studio
SELECT *
FROM \`project.reporting.daily_paid_media_summary\`
WHERE report_date BETWEEN
  PARSE_DATE('%Y%m%d', @DS_START_DATE)
  AND PARSE_DATE('%Y%m%d', @DS_END_DATE);
```

- **Cache results** in Looker Studio (Data > Data Freshness) to reduce query costs
- **Partition tables** by date for faster queries and lower costs

---

## Data Retention and Cost Management

### BigQuery Pricing Model

- **Storage:** ~USD 0.02/GB/month (active), ~USD 0.01/GB/month (long-term after 90 days)
- **Queries:** ~USD 6.25/TB scanned (on-demand pricing)
- **Streaming inserts:** ~USD 0.05/GB (for intraday/streaming export)

### Cost Optimization Strategies

1. **Use table partitioning** -- GA4 export tables are date-sharded by default;
   always filter on `_TABLE_SUFFIX` to limit data scanned
2. **Use column selection** -- Only SELECT the columns you need; avoid `SELECT *`
3. **Create materialized views** or summary tables for frequently-run queries
4. **Set up BigQuery reservations** (flat-rate pricing) if monthly query costs
   exceed USD 2,000-3,000
5. **Monitor with BigQuery audit logs** -- Track which queries are most expensive
6. **Archive old data** -- Move data older than needed analysis window to cold storage

### Typical Costs for OFM Clients

| Monthly GA4 Events | Approx. Storage/Month | Approx. Query Cost/Month |
|--------------------|-----------------------|--------------------------|
| 1 million          | < $1                  | $5-15                    |
| 10 million         | $2-5                  | $20-60                   |
| 100 million        | $15-40                | $50-200                  |
| 1 billion          | $100-300              | $200-800                 |

Streaming export roughly doubles storage costs. For most OFM ecommerce clients, total
BigQuery costs are USD 20-100/month -- far less than the value of the insights gained.

---

## Common Issues and Solutions

### 1. Event Parameter UNNEST Complexity

**Problem:** GA4's nested schema makes even simple queries verbose.

**Solution:** Create a view or staging table that flattens common parameters:

```sql
-- Create a flattened events view for simpler downstream queries
CREATE OR REPLACE VIEW \`project.dataset.events_flat\` AS
SELECT
  event_date,
  TIMESTAMP_MICROS(event_timestamp) AS event_timestamp,
  event_name,
  user_pseudo_id,
  user_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_number') AS ga_session_number,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer') AS page_referrer,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') AS session_source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium') AS session_medium,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS session_campaign,
  (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
   FROM UNNEST(event_params) WHERE key = 'value') AS event_value,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') AS engagement_time_msec,
  traffic_source.source AS first_touch_source,
  traffic_source.medium AS first_touch_medium,
  traffic_source.name AS first_touch_campaign,
  collected_traffic_source.manual_source AS collected_source,
  collected_traffic_source.manual_medium AS collected_medium,
  collected_traffic_source.manual_campaign_name AS collected_campaign,
  device.category AS device_category,
  device.operating_system AS device_os,
  geo.country AS geo_country,
  geo.region AS geo_region,
  geo.city AS geo_city,
  ecommerce.transaction_id,
  ecommerce.purchase_revenue,
  privacy_info.analytics_storage AS consent_analytics,
  privacy_info.ads_storage AS consent_ads
FROM
  \`project.dataset.events_*\`;
```

### 2. Consent Mode Impact on Data Completeness

**Problem:** Users who decline analytics cookies may not be fully tracked. Consent Mode
v2 models conversions for unconsented users, but BigQuery export only contains observed
(consented) data.

**Solution:**
- Use the `privacy_info` fields to understand consent rates
- Apply a consent adjustment multiplier to BigQuery totals:

```sql
-- Calculate consent rate to adjust BigQuery totals
SELECT
  event_date,
  COUNT(*) AS total_events,
  COUNTIF(privacy_info.analytics_storage = 'Yes') AS consented_events,
  SAFE_DIVIDE(
    COUNTIF(privacy_info.analytics_storage = 'Yes'),
    COUNT(*)
  ) AS consent_rate
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
GROUP BY event_date
ORDER BY event_date;
```

### 3. Timezone Handling

**Problem:** `event_timestamp` is in UTC microseconds. GA4 UI reports in the property
timezone. BigQuery queries may show different numbers than the GA4 interface.

**Solution:** Convert timestamps to the property timezone:

```sql
-- Convert UTC timestamp to property timezone (e.g., US/Eastern)
SELECT
  DATETIME(TIMESTAMP_MICROS(event_timestamp), 'US/Eastern') AS event_datetime_et,
  event_name
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX = '20260305';
```

Note: The `event_date` field is already in the property timezone, but `event_timestamp`
is always UTC. When filtering by date, use `_TABLE_SUFFIX` (which matches `event_date`)
rather than converting `event_timestamp`.

### 4. Session Stitching

**Problem:** GA4 does not have a single "session" entity in the export. Sessions must
be reconstructed from `ga_session_id` in event parameters.

**Solution:** Always use the combination of `user_pseudo_id` + `ga_session_id` to
identify unique sessions:

```sql
-- Correct session identification
SELECT
  user_pseudo_id,
  (SELECT value.int_value FROM UNNEST(event_params)
   WHERE key = 'ga_session_id') AS session_id,
  -- This composite key is needed because ga_session_id alone
  -- is NOT globally unique; it can repeat across users
  CONCAT(
    user_pseudo_id, '_',
    CAST((SELECT value.int_value FROM UNNEST(event_params)
          WHERE key = 'ga_session_id') AS STRING)
  ) AS unique_session_id
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX = '20260305'
  AND event_name = 'session_start';
```

### 5. Duplicate Events

**Problem:** Streaming export and daily export can overlap, causing duplicate events
if both are queried. Also, network retries can cause duplicate purchase events.

**Solution:**
- Never query `events_intraday_*` and `events_*` for the same date
- Deduplicate purchase events by transaction_id:

```sql
-- Deduplicate purchases by transaction_id
SELECT
  ecommerce.transaction_id,
  MIN(event_timestamp) AS first_event_timestamp,
  ANY_VALUE(ecommerce.purchase_revenue) AS revenue,
  ANY_VALUE(user_pseudo_id) AS user_pseudo_id
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX BETWEEN '20260201' AND '20260228'
  AND event_name = 'purchase'
  AND ecommerce.transaction_id IS NOT NULL
GROUP BY ecommerce.transaction_id;
```

### 6. Missing or Null Traffic Source Data

**Problem:** Direct traffic and some cross-domain scenarios result in null source/medium.
The `traffic_source` field is first-touch only; `collected_traffic_source` is session-level
but may be null for returning visitors.

**Solution:** Use COALESCE across multiple source fields:

```sql
-- Robust traffic source extraction
SELECT
  COALESCE(
    collected_traffic_source.manual_source,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source'),
    traffic_source.source,
    '(direct)'
  ) AS best_source,
  COALESCE(
    collected_traffic_source.manual_medium,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium'),
    traffic_source.medium,
    '(none)'
  ) AS best_medium
FROM
  \`project.dataset.events_*\`
WHERE
  _TABLE_SUFFIX = '20260305'
  AND event_name = 'session_start';
```

---

## Integration with OFM Stack

### Stape.io Server-Side GTM

Server-side GTM via Stape.io sends events that may include additional parameters not
present in client-side GA4. These server-enriched parameters appear in the BigQuery
export under `event_params`:

- Custom server-side parameters (e.g., `server_enriched_revenue`, `margin_data`)
- Enhanced conversion data passed through server-side tags
- Consent-adjusted event data

When querying, check for both client-side and server-side parameter names.

### Ecommerce Platform Integration

**Shopify to BigQuery:**
- Use Shopify's native BigQuery connector or Fivetran/Airbyte
- Join `orders` table with GA4 purchase events on `transaction_id`
- Access cost_per_item, fulfillment status, and customer data

**WooCommerce to BigQuery:**
- Export order data via WooCommerce REST API to BigQuery
- Use WP-BigQuery plugins or custom ETL scripts
- Join on `order_id` = GA4 `transaction_id`

**NetSuite to BigQuery:**
- Use NetSuite SuiteAnalytics Connect or third-party connectors
- Export sales orders, item costs, customer records
- Join on sales order number = GA4 `transaction_id`

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
