# POAS, Attribution, Reporting, Troubleshooting

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
