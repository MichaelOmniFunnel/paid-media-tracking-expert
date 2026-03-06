# OFM POAS Optimization Framework

## Definition
POAS — Profit on Ad Spend. Gross profit generated per dollar of ad spend. The true optimization north star for ecommerce clients where margin varies by product or category.

## Why Not Platform ROAS
Platform-reported ROAS is inflated by view-through attribution, cross-platform overlap, and organic assist. POAS anchors decisions to actual business outcome.

## Calculation
POAS = Gross Profit from Ad-Attributed Sales divided by Total Ad Spend
Gross Profit = Revenue minus COGS, ideally minus fulfillment and return costs

## Implementation
- Requires product-level margin data from client
- Pass margin as a custom parameter in the dataLayer at checkout
- Import POAS as a custom conversion metric in Google Ads for Smart Bidding signal
- Use POAS targets in tROAS bidding where margin data is available

## Blended ROAS (when POAS data is not yet available)
Total revenue from all ad channels divided by total ad spend across all channels. Removes platform self-attribution inflation.