# BigQuery Table Schema Reference

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
