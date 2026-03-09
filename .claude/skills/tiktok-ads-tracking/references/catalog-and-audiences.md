# TikTok Catalog and Audience Details

## Product Feed Requirements

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| sku_id | Unique product identifier | SKU-001 |
| title | Product name (max 255 chars) | Blue Running Shoes |
| description | Product description (max 10000 chars) | Lightweight running shoes... |
| availability | in stock, out of stock, preorder | in stock |
| condition | new, refurbished, used | new |
| price | Price with currency | 59.99 USD |
| image_link | Main product image URL (min 500x500) | https://... |
| landing_page_url | Product page URL | https://... |

### Recommended Fields

| Field | Description | Why It Matters |
|-------|-------------|---------------|
| sale_price | Discounted price | Enables sale badges in ads |
| brand | Brand name | Filtering and targeting |
| google_product_category | Standard taxonomy | Better classification |
| product_type | Your own category path | Custom reporting |
| item_group_id | Parent SKU for variants | Groups color/size variants |
| additional_image_link | Extra images | More creative options |
| age_group | Target age group | Compliance and targeting |
| gender | Target gender | Audience matching |
| color | Product color | Filter and variant grouping |
| size | Product size | Filter and variant grouping |
| custom_label_0 through 4 | Custom segmentation | POAS tiers, margin groups |

### Feed Formats and Delivery

TikTok accepts CSV, TSV, XML (Google Merchant Center format accepted), and JSON feed.
Feed refresh schedule: at least daily. For frequently changing inventory, every 6 hours.
Google Merchant Center feeds can often be reused with minor modifications (sku_id instead of id).

### TikTok Shop Considerations

- Shop transactions happen within the TikTok app; browser pixel does not apply
- TikTok provides its own analytics for Shop transactions
- When selling on both website and TikTok Shop, reconcile both data sources
- Separate Shop revenue in reporting to understand true website ROAS vs total ROAS

## Custom Audiences

**Pixel-based:** Website visitors (all or specific pages), event-based, time-based (7 to 180 days), engagement-based

**Customer file:** Upload hashed emails, phone numbers, or mobile advertiser IDs. Minimum 1,000 matched users.

**App activity:** Requires TikTok SDK integration.

**Engagement:** Users who interacted with TikTok content (video views, profile visits, likes, shares).

## Lookalike Audiences

- Seed minimum: 100 users (1,000+ recommended)
- Three sizes: Narrow (top 1-2%), Balanced (top 3-5%), Broad (top 5-10%)
- Best seeds: purchasers, high-value customers, repeat buyers
- Refresh when seed grows by 20% or more

## Interest and Behavior Targeting

**Interest categories:** Based on user engagement patterns (Apparel, Automotive, Beauty, etc.)

**Behavioral targeting:** Video interactions, creator interactions, hashtag interactions

**Purchase intent:** Users showing shopping behavior on TikTok

## Audience Strategy Best Practices

- Start with broad targeting and let the algorithm find your audience
- Layer interest targeting only if broad is not performing after $500+ with no conversions
- Use custom audiences for retargeting and exclusion, not primary prospecting
- Exclude recent purchasers (30 to 60 day window)
- Test Narrow vs Balanced lookalikes
