---
name: feed-catalog-optimization
description: Google Merchant Center, Meta Catalog, TikTok Catalog, custom labels, supplemental feeds, and POAS feed strategies. Use when someone mentions product feeds, shopping campaigns, catalog issues, custom labels, feed optimization, disapproved products, or products not showing.
context: fork
---
# Feed & Catalog Optimization

## Overview

Product feeds are the backbone of ecommerce advertising. Every Shopping ad, Dynamic
Remarketing ad, and catalog-based campaign pulls creative, pricing, and availability
directly from a structured data feed. Poor feed quality means disapproved products,
wasted spend, and missed revenue. This skill covers feed setup, optimization, and
management across Google, Meta, and TikTok -- plus strategies for using custom labels
and supplemental feeds to bid on profit rather than just revenue.

### When to Use This Skill

- Setting up or auditing a Google Merchant Center product feed
- Creating Meta Commerce Manager or TikTok catalogs
- Building custom label strategies for Performance Max segmentation
- Implementing POAS (Profit on Ad Spend) through feed-level margin data
- Debugging disapproved products or policy violations
- Evaluating feed management tools (Feedonomics, DataFeedWatch, native plugins)
- Connecting Shopify, WooCommerce, or NetSuite to advertising platforms

---

## Google Merchant Center Feed Requirements

### Required Attributes

Every product in Google Merchant Center needs these attributes at minimum:

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

### Title Optimization

Titles are the single most impactful feed attribute for Shopping ad performance.
Google matches search queries against titles, so keyword placement matters.

Recommended title structures by vertical:

- Apparel: Brand + Gender + Product Type + Attributes (Color, Size, Material)
  Example: "Nike Mens Running Shoes Air Max 270 Black Size 10"
- Electronics: Brand + Product + Key Specs + Model Number
  Example: "Samsung 65-Inch 4K QLED Smart TV QN65Q80C"
- Home/Garden: Brand + Product Type + Material + Key Feature + Size
  Example: "KitchenAid Stand Mixer 5-Quart Artisan Series Empire Red"
- Auto Parts: Brand + Part Type + Compatibility + Part Number
  Example: "Brembo Front Brake Pads Ceramic 2019-2023 Toyota Camry P28067N"

Best practices:
- Front-load the most important keywords (first 70 chars show in ads)
- Include brand name near the beginning
- Add color, size, material, and gender where relevant
- Avoid promotional text ("Free Shipping", "Best Price")
- Do not use ALL CAPS
- Use feed rules or supplemental feeds to restructure titles at scale

### Description Optimization

- Include relevant keywords naturally (Google uses descriptions for matching)
- Lead with the most important product details
- Avoid HTML tags -- they render as raw text and cause disapprovals
- Include specifications that shoppers search for
- Max 5000 characters but aim for 500-1000 for best results

### GTIN Requirements

Google strongly prefers GTIN (UPC/EAN/ISBN) for product identification:

- Products with GTINs get up to 40% more impressions in Shopping
- Required for all products that have a manufacturer-assigned GTIN
- If no GTIN exists, set identifier_exists to "no"
- Incorrect GTINs cause disapprovals -- verify against GS1 database
- For variant products, each variant needs its own unique GTIN

### Google Product Category and Product Type

- google_product_category: Use the Google taxonomy (predefined list)
  Be as specific as possible. "Vehicles & Parts > Vehicle Parts > Motor Vehicle
  Parts > Motor Vehicle Braking" is better than "Vehicles & Parts"
- product_type: Your own category hierarchy (free-form text)
  Example: "Auto Parts > Brakes > Brake Pads > Ceramic > Front"
  Used for campaign segmentation and reporting -- include it even if you set GMC category

---

## Custom Label Strategy

### What Custom Labels Do

Custom labels (custom_label_0 through custom_label_4) let you tag products with
your own business logic. Google does not use them for ad matching -- they exist
solely for campaign segmentation and bid management.

You get five slots. Each accepts one value per product (max 100 characters).

### Recommended Custom Label Framework

This framework is designed for ecommerce advertisers running Performance Max
or Standard Shopping campaigns who want to optimize for profitability:

| Label | Purpose | Example Values |
|-------|---------|----------------|
| custom_label_0 | Margin Tier | high_margin, medium_margin, low_margin |
| custom_label_1 | Performance Tier | bestseller, average, underperformer, new |
| custom_label_2 | Seasonality | evergreen, spring, summer, fall, winter, holiday |
| custom_label_3 | Price Band | under_25, 25_to_50, 50_to_100, over_100 |
| custom_label_4 | Promo Status | full_price, on_sale, clearance, new_arrival |

### Margin Tier Classification

Margin tiers are the foundation of profit-based bidding. Assign tiers based on
gross margin percentage:

- high_margin: Gross margin above 60%
- medium_margin: Gross margin 30-60%
- low_margin: Gross margin below 30%

How to calculate: (Selling Price - COGS) / Selling Price * 100

For Shopify stores: Export product cost data from Shopify admin, calculate margin,
and add to a supplemental feed (see Supplemental Feeds section below).

For WooCommerce: Use the cost price field or a custom meta field, then export
via CTX Feed or WooCommerce Product Feed plugin with calculated custom labels.

For NetSuite: Pull item cost from the Item record, calculate margin, and include
in the feed export or supplemental feed.

### Performance Tier Classification

Use historical conversion data to classify products:

- bestseller: Top 20% of products by conversion volume (last 30/90 days)
- average: Middle 60% of products
- underperformer: Bottom 20% by conversion volume with significant impressions
- new: Products added in the last 30 days (no performance history)

Update performance tiers monthly. Many feed management tools can automate this
using Google Ads conversion data or Google Analytics data.

### Using Custom Labels in Performance Max

Custom labels let you build targeted Asset Groups within Performance Max:

1. Create separate Asset Groups by custom label (e.g., one for high_margin bestsellers)
2. Set different tROAS targets per Asset Group based on margin
3. Provide tailored ad creative per segment (hero products get premium assets)
4. Aim for 3-7 Asset Groups per campaign -- enough to segment, few enough for data
5. Each Asset Group should generate at least 20 conversions per month
6. If an Asset Group has fewer than 5 conversions, merge it with another

Example PMax structure using custom labels:

```
Campaign: PMax - All Products
  Asset Group: Hero Products (custom_label_0 = high_margin AND custom_label_1 = bestseller)
    tROAS: 300%
  Asset Group: Core Products (custom_label_0 = medium_margin AND custom_label_1 = average)
    tROAS: 400%
  Asset Group: New Arrivals (custom_label_4 = new_arrival)
    tROAS: 200% (lower target to allow learning)
  Asset Group: Clearance (custom_label_4 = clearance)
    tROAS: 500% (conservative, protect margin)
  Asset Group: Low Margin (custom_label_0 = low_margin)
    tROAS: 600% (very conservative)
```

---

## Supplemental Feeds

### What Supplemental Feeds Do

A supplemental feed adds or overrides attributes in your primary feed without
modifying the primary feed itself. They are matched by product ID.

Key use cases:
- Adding custom labels (margin tiers, performance tiers) from business data
- Overriding titles or descriptions for A/B testing
- Adding missing attributes (GTIN, product_type, google_product_category)
- Temporary overrides for seasonal promotions or sales events
- Adding POAS/margin data that does not exist in the ecommerce platform

### Creating a Supplemental Feed

Supplemental feeds can be uploaded as:
- Google Sheets (easiest for small catalogs and manual updates)
- Scheduled fetches from a URL (CSV, TSV, or XML)
- Content API uploads (programmatic)

A simple supplemental feed in Google Sheets:

| id | custom_label_0 | custom_label_1 | custom_label_4 |
|----|----------------|----------------|----------------|
| SKU-001 | high_margin | bestseller | full_price |
| SKU-002 | medium_margin | average | on_sale |
| SKU-003 | low_margin | underperformer | clearance |

Steps in Google Merchant Center Next:
1. Go to Products > Feeds > Supplemental feeds
2. Click the + button to add a new supplemental feed
3. Name it (e.g., "Custom Labels - Margin & Performance")
4. Select source: Google Sheets, Scheduled fetch, or Upload
5. Map the "id" column to match your primary feed IDs
6. Set the feed to update on a schedule (daily recommended)

### Feed Rules in Google Merchant Center

Feed rules let you transform data without modifying the source feed. They run
server-side in Merchant Center after the feed is ingested.

Common feed rule patterns:

Assigning custom labels based on price:
- If price < 25: Set custom_label_3 = "under_25"
- If price >= 25 AND price < 50: Set custom_label_3 = "25_to_50"
- If price >= 50 AND price < 100: Set custom_label_3 = "50_to_100"
- If price >= 100: Set custom_label_3 = "over_100"

Title restructuring:
- Prepend brand to title if not already present
- Append color and size from separate attributes
- Remove promotional text patterns

Feed rules are processed in order. Place more specific rules before general ones.
Rules can reference any feed attribute as input and write to any attribute as output.

---

## POAS: Profit on Ad Spend

### Why POAS Over ROAS

ROAS (Return on Ad Spend) treats all revenue equally. A product with a 10% margin
and a product with a 70% margin both look the same at 400% ROAS, but the profit
difference is massive.

POAS formula: Gross Profit / Ad Spend

When you bid based on POAS:
- The algorithm pushes budget toward high-margin products
- Low-margin, high-revenue products stop eating your budget
- Overall profitability increases even if top-line revenue dips

### Implementing POAS via Custom Labels

If you cannot send profit as a conversion value (which requires server-side
tracking and conversion value adjustment), you can approximate POAS with
custom labels:

1. Calculate gross margin for each product (or product category)
2. Assign margin tier custom labels (high, medium, low)
3. Create separate PMax Asset Groups or Shopping campaigns per tier
4. Set different tROAS targets that account for margin:
   - high_margin (60%+ margin): tROAS 300% (aggressive)
   - medium_margin (30-60% margin): tROAS 500% (moderate)
   - low_margin (under 30% margin): tROAS 800% (conservative)

### Implementing True POAS with Server-Side Tracking

For OFM clients using Stape.io server-side GTM:

1. On purchase, calculate gross profit server-side:
   Gross Profit = Revenue - COGS - Shipping Cost - Transaction Fees
2. Send gross profit as the conversion value via the server-side container
3. Google Ads receives profit instead of revenue
4. Smart Bidding optimizes toward profit automatically
5. Set tROAS target based on desired profit efficiency (e.g., tROAS 200% means
   $2 profit for every $1 in ad spend)

Tools that support POAS tracking:
- ProfitMetrics.io: Dedicated POAS platform, integrates with Shopify/WooCommerce
- Server-side GTM with custom profit calculation
- WooTrack: WooCommerce-specific POAS tracking
- Custom server-side implementation via Stape.io

---

## Meta Commerce Manager / Catalog Setup

### Required Attributes for Meta

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

### Meta-Specific Best Practices

- Unlike Google Shopping, Meta shows products based on interest and behavior,
  not search queries. Titles should be descriptive but do not need keyword stuffing.
- Image quality matters more on Meta. Use lifestyle images when possible.
- Minimum image size is 500x500 pixels; recommended is 1024x1024 for best display.
- No HTML tags in descriptions -- this is the most common feed rejection reason.
- Ensure UTF-8 character encoding to avoid garbled text.
- Use product sets within your catalog to segment products for different ad sets.

### Feed Upload Methods

- Direct Upload: CSV, TSV, or XML file uploaded via Commerce Manager.
  Best for small catalogs (under 100 products) or initial testing.
- Scheduled Feed: URL that Meta fetches on a schedule (hourly/daily).
  Standard approach for most stores.
- Facebook Pixel / Conversions API: Products auto-created from website events.
  Microdata on product pages can populate the catalog.
- Partner Platform: Direct integration with Shopify, WooCommerce, BigCommerce.
  Easiest setup but limited optimization control.

### Dynamic Remarketing on Meta

For Dynamic Product Ads (DPA) to work:
1. Catalog must be set up with all required attributes
2. Meta Pixel or Conversions API must fire ViewContent, AddToCart, and Purchase
   events with content_ids that match the catalog product IDs
3. Product sets define which products show in which campaigns
4. Use broad audience targeting to let the algorithm match products to users

Common DPA issues:
- content_ids mismatch between pixel/CAPI and catalog (most common failure)
- Stale availability data showing out-of-stock products
- Missing or low-quality images
- Price mismatches between feed and landing page

---

## TikTok Catalog Integration

### TikTok Catalog Setup

TikTok catalogs power Video Shopping Ads, Catalog Listing Ads, and
Product Shopping Ads. The setup process:

1. Go to TikTok Ads Manager > Assets > Catalogs
2. Create a new catalog and select your product vertical
3. Add products via manual upload, scheduled feed URL, or platform integration
4. Install TikTok Pixel or Events API on your site
5. Ensure pixel event product IDs match catalog item IDs

### Required TikTok Feed Attributes

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

### TikTok-Specific Considerations

- TikTok supports CSV, XML (RSS/ATOM), and JSON feed formats
- Daily feed sync is recommended to keep inventory and pricing accurate
- Video is king on TikTok: consider adding video_link attribute for product videos
- TikTok Shop (for direct in-app purchases) has additional requirements
  beyond standard catalog ads
- Shopify and WooCommerce have native TikTok integrations that handle
  catalog sync automatically
- Feedonomics supports TikTok Shop feed management for complex catalogs

---

## Dynamic Remarketing Feed Requirements by Platform

### Cross-Platform Comparison

| Requirement | Google | Meta | TikTok |
|-------------|--------|------|--------|
| Product ID match | id matches remarketing tag | content_ids match pixel/CAPI | content_id matches pixel |
| Image size | Min 100x100 | Min 500x500 | Min 500x500 |
| Price format | Numeric + currency code | "29.99 USD" | "29.99 USD" |
| Feed format | XML, CSV, TSV, API | CSV, TSV, XML, API | CSV, XML, JSON |
| Update frequency | Min daily | Min daily | Min daily |
| Variant handling | Each variant = separate item | Each variant = separate item | Each variant = separate item |
| Item group | item_group_id for variants | item_group_id for variants | item_group_id for variants |

The critical requirement across all platforms: the product ID in your feed must
exactly match the product ID fired in your remarketing/pixel events. Mismatches
are the number one cause of dynamic remarketing failures.

---

## Feed Debugging: Common Issues and Fixes

### Disapproved Products

Most common disapproval reasons and fixes:

1. Price mismatch: Feed price differs from landing page price
   Fix: Ensure feed updates after every price change. Use microdata on product
   pages so Google can verify prices. Check currency codes.

2. Image quality: Watermarks, promotional overlays, too small, generic/stock
   Fix: Use clean product images, min 800x800 for best results.
   No "Sale" banners, logos over product, or stock photos.

3. Missing GTIN: Products that should have a GTIN are missing it
   Fix: Source GTINs from manufacturer. If truly custom/handmade, set
   identifier_exists to "no".

4. Policy violations: Restricted content, misleading claims, prohibited products
   Fix: Review Google Merchant Center policies. Common triggers include
   health claims, weapons accessories, and counterfeit goods.

5. Landing page crawl issues: 404 errors, redirects, access restrictions
   Fix: Ensure all product URLs return 200 status codes. No geo-redirects.
   No login walls before the product page.

6. Availability mismatch: Feed says "in stock" but landing page shows out of stock
   Fix: Increase feed update frequency. Use Content API for real-time updates.
   Implement inventory threshold rules (pause when stock < 2).

### Data Quality Diagnostics

In Google Merchant Center Next, check:
- Products tab: Filter by "Needs attention" or "Not approved"
- Diagnostics: Shows item-level and feed-level issues with severity
- Product data quality: Completeness scores for optional attributes
- Competitive visibility report: How your products compare to competitors

In Meta Commerce Manager:
- Diagnostics tab: Shows warnings and errors per product
- Data Sources: Check feed ingestion status and error logs
- Common errors: missing fields, invalid URLs, HTML in descriptions

### Variant Handling

Ecommerce platforms handle variants differently than ad platforms expect:

- Shopify: Parent product with child variants. Each variant needs its own
  feed item with item_group_id linking back to the parent.
- WooCommerce: Variable products with variations. Similar parent-child model.
  Feed plugins should expand variants into separate feed items.
- NetSuite: Matrix items with sub-items. Requires feed transformation to
  flatten the hierarchy into individual feed items.

Each variant must have:
- Its own unique id
- Shared item_group_id with other variants of the same product
- Specific values for variant attributes (color, size, material)
- Its own GTIN (if applicable)
- Its own image showing that specific variant
- Its own price (if prices differ by variant)

### Out-of-Stock Management

Options for handling out-of-stock products:

1. Set availability to "out of stock": Products stay in feed but do not serve.
   Best for temporarily out-of-stock items that will be restocked.
2. Remove from feed entirely: Products disappear from catalog.
   Use for discontinued items. Re-adding later requires re-learning.
3. Use inventory thresholds: Automatically mark as out of stock when
   quantity drops below a threshold (e.g., fewer than 2 units).
4. Backorder handling: Use "preorder" or "backorder" availability values
   if the platform supports it.

---

## Feed Management Tools

### Tool Comparison

| Tool | Best For | Price Range | Key Strength |
|------|----------|-------------|--------------|
| Feedonomics | Enterprise, agencies, complex catalogs | $500-5000+/mo | Fully managed service, advanced rules |
| DataFeedWatch | Mid-market, multi-channel | $64-239/mo | Strong Google Shopping optimization |
| GoDataFeed | Mid-market Shopify/WooCommerce | $39-399/mo | Easy setup, good support |
| Channable | European markets, many channels | Custom pricing | 2500+ export channels |
| Google Merchant Center (native) | Simple setups, single market | Free | No additional cost |

### When to Use a Feed Management Tool

Use a dedicated tool when:
- Managing 500+ products across multiple channels
- Need title/description optimization rules at scale
- Running feeds to 3+ advertising platforms
- Require automated custom label assignment based on performance data
- Need error monitoring and automated fixes
- Managing feeds for multiple client accounts (agency use case)

### Shopify Feed Options

Shopify stores have three tiers of feed management:

1. Native Google & YouTube Channel (Free)
   - Automatic product sync to Merchant Center
   - Supports free listings and Shopping ads
   - Limited optimization control
   - No custom label automation
   - Good for stores with fewer than 500 products, single market

2. Shopify Feed Apps (Mid-tier)
   - Simprosys Google Shopping Feed: Multi-platform feed generation
   - AdNabu: AI-powered title and description optimization
   - Feed rules, custom label mapping, variant handling
   - Typically $5-50/month
   - Good for stores with 500-10,000 products

3. Enterprise Feed Tools (Feedonomics, DataFeedWatch)
   - Full feed transformation and optimization engine
   - Custom label automation from external data sources
   - Error monitoring and automated remediation
   - Multi-channel output (Google, Meta, TikTok, Amazon, etc.)
   - Good for stores with 10,000+ products or complex requirements

Key Shopify feed issue: Shopify treats variants as children of a parent product.
Google Shopping expects each variant as a separate item with item_group_id. Native
Shopify integration handles this, but custom feed setups must account for it.

### WooCommerce Feed Plugins

Top WooCommerce feed plugins:

1. CTX Feed (WebAppick)
   - Supports 220+ shopping and social channels
   - Free version available; Pro starts at $119/year
   - Intelligent batch processing for large catalogs
   - 100+ ready-made feed templates
   - 2026 Google Merchant Center compliant
   - Supports subscription product feeds (new Google policy as of Jan 2026)

2. Product Feed PRO for WooCommerce (AdTribes)
   - Supports Google, Meta, TikTok, Bing, and 100+ channels
   - Free version with premium options
   - Category mapping tool for google_product_category
   - Custom field and attribute mapping

3. WooCommerce Google Product Feed (official)
   - Direct WooCommerce-to-Google Merchant Center integration
   - Automatic product sync
   - Limited compared to third-party plugins

For WooCommerce stores with margin data:
- Use the product cost field (WooCommerce > Product > General > Cost price)
- CTX Feed Pro can calculate margin and assign custom labels automatically
- Or export cost data and create a supplemental feed in Google Sheets

### NetSuite Feed Considerations

NetSuite requires custom feed generation:

- Use a Saved Search or SuiteScript to export product data
- Include item cost from the Item record for margin calculations
- Matrix items must be flattened to individual SKU-level feed items
- Use a feed management tool (Feedonomics works well with NetSuite) or
  build a custom export to CSV/XML format
- Map NetSuite item types to Google product categories
- Handle NetSuite multi-currency pricing for international feeds

---

## Shipping and Tax Data in Feeds

### Shipping

Google requires shipping information, provided via:
- Account-level shipping settings in Merchant Center (recommended)
- Product-level shipping attribute in the feed
- shipping_weight for calculated shipping rates

Common shipping issues:
- Shipping cost in feed does not match checkout shipping cost
- Missing shipping for some delivery regions
- Free shipping threshold not reflected in feed

### Tax

- For US: Configure tax settings at the account level in Merchant Center
- Do not include tax in the price attribute for US products
- For non-US: Tax may need to be included in the price (VAT-inclusive)

---

## Feed Optimization Checklist

Use this checklist when auditing or setting up a product feed:

### Foundation
- [ ] All required attributes present and populated
- [ ] Product IDs are stable and unique
- [ ] Titles follow optimized structure for vertical
- [ ] Descriptions are keyword-rich, no HTML tags
- [ ] Images meet minimum size requirements per platform
- [ ] GTINs included where available
- [ ] google_product_category set to most specific level
- [ ] product_type includes full category hierarchy

### Accuracy
- [ ] Prices match landing pages
- [ ] Availability matches actual stock levels
- [ ] Shipping data is accurate
- [ ] Currency codes are correct
- [ ] Landing page URLs return 200 status

### Optimization
- [ ] Custom labels assigned for margin tiers
- [ ] Custom labels assigned for performance tiers
- [ ] Custom labels assigned for seasonality
- [ ] Supplemental feed set up for custom label management
- [ ] Feed rules configured for title optimization
- [ ] Variant products properly expanded with item_group_id
- [ ] Out-of-stock products handled appropriately

### Multi-Platform
- [ ] Product IDs match across all platform pixels/tags
- [ ] Feed formatted for each platform (Google, Meta, TikTok)
- [ ] Image sizes meet each platform minimum
- [ ] Category mapping done for each platform taxonomy
- [ ] Feed update schedule set (minimum daily)

### Monitoring
- [ ] Merchant Center diagnostics reviewed weekly
- [ ] Disapproved products investigated and fixed
- [ ] Feed error alerts configured
- [ ] Custom label assignments updated monthly
- [ ] Performance tier labels refreshed with current data

---

## Integration with OFM Workflows

### Stape.io Server-Side GTM Integration

For clients using Stape.io server-side GTM:
- Use the server container to enrich purchase events with margin/profit data
- Send profit as conversion value to Google Ads for true POAS bidding
- Ensure product IDs in the dataLayer match feed IDs across all platforms
- Use the GA4 tag in server GTM to send item-level margin data for analysis

### Client Onboarding Feed Checklist

When onboarding a new ecommerce client:
1. Audit existing feed for completeness and accuracy
2. Check Merchant Center diagnostics for current issues
3. Request product cost/margin data from client
4. Set up custom label framework (margin, performance, seasonality)
5. Create supplemental feed for custom labels
6. Verify pixel/tag product IDs match feed IDs (Google, Meta, TikTok)
7. Set up feed monitoring and error alerting
8. Document feed update schedule and responsible parties

---

## References

- Google Merchant Center feed specifications: https://support.google.com/merchants/answer/7052112
- Google custom labels documentation: https://support.google.com/merchants/answer/6324473
- Meta catalog specifications: https://www.facebook.com/business/help/120325381656392
- TikTok catalog parameters: https://ads.tiktok.com/help/article/catalog-product-parameters
- Google Ads custom labels for Shopping: https://support.google.com/google-ads/answer/6275295
