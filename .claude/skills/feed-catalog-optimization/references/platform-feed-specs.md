# Platform Feed Specifications

## Google Merchant Center Required Attributes

| Attribute | Description | Notes |
|-----------|-------------|-------|
| id | Unique product identifier | Max 50 chars, stable over time |
| title | Product name | Max 150 chars, front-load keywords |
| description | Product description | Max 5000 chars, no HTML tags |
| link | Product landing page URL | Must match canonical URL |
| image_link | Main product image URL | Min 100x100, no watermarks |
| availability | In stock / out of stock / preorder | Must match landing page |
| price | Product price with currency | Must match landing page price |
| brand | Product brand name | Required for all non-custom goods |
| gtin | Global Trade Item Number | Required when available (UPC/EAN/ISBN) |
| condition | new / refurbished / used | Required for all products |

### Title Optimization by Vertical

- **Apparel:** Brand + Gender + Product Type + Attributes (Color, Size, Material)
- **Electronics:** Brand + Product + Key Specs + Model Number
- **Home/Garden:** Brand + Product Type + Material + Key Feature + Size
- **Auto Parts:** Brand + Part Type + Compatibility + Part Number

### Title Best Practices

- Front-load the most important keywords (first 70 chars show in ads)
- Include brand name near the beginning
- Add color, size, material, and gender where relevant
- Avoid promotional text ("Free Shipping", "Best Price")
- Do not use ALL CAPS

### Description Best Practices

- Include relevant keywords naturally
- Lead with the most important product details
- Avoid HTML tags (they render as raw text and cause disapprovals)
- Max 5000 characters but aim for 500-1000

### GTIN Requirements

- Products with GTINs get up to 40% more impressions in Shopping
- Required for all products that have a manufacturer-assigned GTIN
- If no GTIN exists, set identifier_exists to "no"
- Incorrect GTINs cause disapprovals -- verify against GS1 database
- Each variant needs its own unique GTIN

### Google Product Category and Product Type

- google_product_category: Use Google taxonomy, be as specific as possible
- product_type: Your own category hierarchy (free-form text), used for segmentation

## Meta Commerce Manager Required Attributes

| Attribute | Description | Notes |
|-----------|-------------|-------|
| id | Unique product ID | Must match pixel/CAPI content_ids |
| title | Product name | Max 200 chars |
| description | Product description | Max 9999 chars, no HTML tags |
| availability | in stock / out of stock | Must be current |
| condition | new / refurbished / used | Required |
| price | Price with currency code | Format: "29.99 USD" |
| link | Product URL | Must be a working URL |
| image_link | Main image URL | Min 500x500 for carousel ads |
| brand | Brand name | Required for most categories |

### Meta-Specific Notes

- Meta shows products based on interest/behavior, not search queries. Titles should be descriptive but do not need keyword stuffing.
- Image quality matters more on Meta. Use lifestyle images when possible.
- Min image size 500x500; recommended 1024x1024.
- No HTML tags in descriptions (most common feed rejection reason).
- Ensure UTF-8 character encoding.
- Use product sets within catalog to segment for different ad sets.

### Feed Upload Methods

- Direct Upload: CSV, TSV, or XML via Commerce Manager
- Scheduled Feed: URL that Meta fetches on a schedule
- Facebook Pixel / CAPI: Products auto-created from website events
- Partner Platform: Direct integration with Shopify, WooCommerce, BigCommerce

## TikTok Catalog Required Attributes

| Attribute | Description | Notes |
|-----------|-------------|-------|
| sku_id | Unique identifier | Matches pixel content_id |
| title | Product name | Max 255 chars |
| description | Product description | Max 2000 chars |
| availability | in stock / out of stock | Must be current |
| condition | new / refurbished / used | Required |
| price | Price with currency | Format: "29.99 USD" |
| link | Product URL | Working URL required |
| image_link | Main image URL | Min 500x500, recommended 1200x1200 |
| brand | Brand name | Required |

### TikTok-Specific Notes

- Supports CSV, XML (RSS/ATOM), and JSON
- Daily sync recommended
- Video content: consider adding video_link attribute
- Shopify and WooCommerce have native TikTok integrations

## Cross-Platform Comparison

| Requirement | Google | Meta | TikTok |
|-------------|--------|------|--------|
| Product ID match | id matches remarketing tag | content_ids match pixel/CAPI | content_id matches pixel |
| Image size | Min 100x100 | Min 500x500 | Min 500x500 |
| Price format | Numeric + currency code | "29.99 USD" | "29.99 USD" |
| Feed format | XML, CSV, TSV, API | CSV, TSV, XML, API | CSV, XML, JSON |
| Update frequency | Min daily | Min daily | Min daily |
| Variant handling | Each variant = separate item | Each variant = separate item | Each variant = separate item |
| Item group | item_group_id for variants | item_group_id for variants | item_group_id for variants |
