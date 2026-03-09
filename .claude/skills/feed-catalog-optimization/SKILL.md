---
name: feed-catalog-optimization
description: Google Merchant Center, Meta Catalog, TikTok Catalog, custom labels, supplemental feeds, and POAS feed strategies. Use when someone mentions product feeds, shopping campaigns, catalog issues, custom labels, feed optimization, disapproved products, or products not showing.
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---

# Feed and Catalog Optimization

## Overview

Product feeds are the backbone of ecommerce advertising. Every Shopping ad, Dynamic Remarketing ad, and catalog-based campaign pulls creative, pricing, and availability directly from a structured data feed. Poor feed quality means disapproved products, wasted spend, and missed revenue.

### When to Use This Skill

- Setting up or auditing a Google Merchant Center product feed
- Creating Meta Commerce Manager or TikTok catalogs
- Building custom label strategies for Performance Max segmentation
- Implementing POAS through feed-level margin data
- Debugging disapproved products or policy violations
- Evaluating feed management tools
- Connecting Shopify, WooCommerce, or NetSuite to advertising platforms

For detailed platform feed specifications and required attributes, read references/platform-feed-specs.md

---

## Custom Label Strategy

### What Custom Labels Do

Custom labels (custom_label_0 through custom_label_4) let you tag products with your own business logic. Google does not use them for ad matching; they exist solely for campaign segmentation and bid management. You get five slots, each accepts one value per product (max 100 characters).

### Recommended Custom Label Framework

| Label | Purpose | Example Values |
|-------|---------|----------------|
| custom_label_0 | Margin Tier | high_margin, medium_margin, low_margin |
| custom_label_1 | Performance Tier | bestseller, average, underperformer, new |
| custom_label_2 | Seasonality | evergreen, spring, summer, fall, winter, holiday |
| custom_label_3 | Price Band | under_25, 25_to_50, 50_to_100, over_100 |
| custom_label_4 | Promo Status | full_price, on_sale, clearance, new_arrival |

### Margin Tier Classification

- high_margin: Gross margin above 60%
- medium_margin: Gross margin 30-60%
- low_margin: Gross margin below 30%

Formula: (Selling Price - COGS) / Selling Price * 100

### Performance Tier Classification

- bestseller: Top 20% by conversion volume (last 30/90 days)
- average: Middle 60%
- underperformer: Bottom 20% with significant impressions
- new: Products added in the last 30 days

Update performance tiers monthly.

### Using Custom Labels in Performance Max

Create separate Asset Groups by custom label with different tROAS targets based on margin:

```
Campaign: PMax - All Products
  Asset Group: Hero Products (high_margin + bestseller) tROAS: 300%
  Asset Group: Core Products (medium_margin + average) tROAS: 400%
  Asset Group: New Arrivals (new_arrival) tROAS: 200%
  Asset Group: Clearance (clearance) tROAS: 500%
  Asset Group: Low Margin (low_margin) tROAS: 600%
```

Aim for 3-7 Asset Groups per campaign. Each should generate at least 20 conversions per month.

---

## Supplemental Feeds

### What They Do

A supplemental feed adds or overrides attributes in your primary feed without modifying it. Matched by product ID. Key use cases: adding custom labels, overriding titles for A/B testing, adding missing attributes, temporary promotional overrides, adding POAS margin data.

### Creating a Supplemental Feed

Upload as Google Sheets (easiest for small catalogs), scheduled fetches from URL (CSV/TSV/XML), or Content API uploads.

Steps in Google Merchant Center Next:
1. Go to Products > Feeds > Supplemental feeds
2. Add a new supplemental feed
3. Map the "id" column to match primary feed IDs
4. Set the feed to update on a schedule (daily recommended)

### Feed Rules

Feed rules transform data server-side in Merchant Center after ingestion. Common patterns: assigning custom labels based on price ranges, restructuring titles (prepending brand, appending attributes), removing promotional text. Rules are processed in order; place specific rules before general ones.

---

## POAS: Profit on Ad Spend

### Why POAS Over ROAS

ROAS treats all revenue equally. A product with 10% margin and one with 70% margin both look the same at 400% ROAS. POAS formula: Gross Profit / Ad Spend.

### Implementing via Custom Labels (Approximate)

1. Calculate gross margin for each product
2. Assign margin tier custom labels
3. Create separate PMax Asset Groups per tier
4. Set different tROAS targets:
   - high_margin (60%+): tROAS 300%
   - medium_margin (30-60%): tROAS 500%
   - low_margin (under 30%): tROAS 800%

### True POAS with Server-Side Tracking

For OFM clients using Stape.io:
1. Calculate gross profit server-side on purchase
2. Send gross profit as conversion value via server container
3. Google Ads receives profit instead of revenue
4. Smart Bidding optimizes toward profit automatically

Tools: ProfitMetrics.io, Server-side GTM with custom calculation, WooTrack, custom Stape.io implementation.

---

## Feed Debugging: Common Issues

### Disapproved Products

1. **Price mismatch:** Ensure feed updates after every price change. Use microdata for verification.
2. **Image quality:** No watermarks, promotional overlays. Min 800x800 recommended.
3. **Missing GTIN:** Source from manufacturer or set identifier_exists to "no".
4. **Policy violations:** Review Merchant Center policies for restricted content.
5. **Landing page crawl issues:** All URLs must return 200. No geo-redirects or login walls.
6. **Availability mismatch:** Increase feed update frequency. Use Content API for real-time.

### Variant Handling

Each variant must have its own unique id, shared item_group_id, specific variant attribute values (color, size, material), its own GTIN if applicable, its own image, and its own price if different.

### Out-of-Stock Management

Options: set availability to "out of stock" (best for temporary), remove from feed (for discontinued), use inventory thresholds, or use backorder/preorder values.

---

## Feed Management Tools

For detailed tool comparison, Shopify/WooCommerce/NetSuite feed options, read references/feed-tools-and-plugins.md

---

## Shipping and Tax

### Shipping

Provide via account-level settings in Merchant Center (recommended), product-level shipping attribute, or shipping_weight for calculated rates.

### Tax

- US: Configure at account level. Do not include tax in price attribute.
- Non-US: Tax may need to be included in price (VAT-inclusive).

---

## Feed Optimization Checklist

### Foundation
- All required attributes present and populated
- Product IDs are stable and unique
- Titles follow optimized structure for vertical
- Descriptions are keyword-rich, no HTML tags
- Images meet minimum size requirements per platform
- GTINs included where available
- google_product_category set to most specific level

### Accuracy
- Prices match landing pages
- Availability matches actual stock levels
- Shipping data is accurate
- Landing page URLs return 200 status

### Optimization
- Custom labels assigned for margin, performance, seasonality
- Supplemental feed set up for custom label management
- Variant products properly expanded with item_group_id
- Out-of-stock products handled appropriately

### Multi-Platform
- Product IDs match across all platform pixels/tags
- Feed formatted for each platform
- Image sizes meet each platform minimum
- Feed update schedule set (minimum daily)

### Monitoring
- Merchant Center diagnostics reviewed weekly
- Disapproved products investigated and fixed
- Custom label assignments updated monthly

---

## Integration with OFM Workflows

- Use server container to enrich purchase events with margin/profit data
- Send profit as conversion value to Google Ads for true POAS bidding
- Ensure product IDs in the dataLayer match feed IDs across all platforms
- On new client onboarding: audit existing feed, check diagnostics, request cost data, set up custom labels, verify pixel IDs match feed IDs

## References

- Google Merchant Center feed specs: https://support.google.com/merchants/answer/7052112
- Google custom labels: https://support.google.com/merchants/answer/6324473
- Meta catalog specs: https://www.facebook.com/business/help/120325381656392
- TikTok catalog parameters: https://ads.tiktok.com/help/article/catalog-product-parameters
