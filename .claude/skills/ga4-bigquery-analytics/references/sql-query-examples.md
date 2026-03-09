# SQL Query Examples

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
