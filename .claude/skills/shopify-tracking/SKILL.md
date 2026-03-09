---
name: shopify-tracking
description: Conversion tracking on Shopify including native integrations, GTM setup, Shopify Pixel API, server-side tracking via Stape, and CAPI configuration. Use when someone mentions Shopify tracking, Shopify checkout tracking, Shopify pixels, or ecommerce tracking on Shopify.
disable-model-invocation: true
model: sonnet
allowed-tools: Read, Grep, Glob
---

# Shopify Conversion Tracking Implementation Guide

This guide covers every layer of conversion tracking for Shopify stores, from native integrations through full server-side measurement via Stape.io.

---

## 1. Shopify's Native Tracking

### Built-in Meta Conversions API

Shopify offers a first-party Meta CAPI integration through the Facebook and Instagram sales channel. It sends server-side events including PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, and Purchase with automatic deduplication via event_id.

**Limitations:** Limited parameter customization, no custom events, single pixel support only, cannot add content_category or non-standard parameters.

### Built-in Google Channel

Handles Merchant Center feed sync, basic Google Ads purchase tracking, and free listing management. Does NOT provide full GA4 ecommerce, enhanced conversions, or custom audience signals.

### When Native Is Sufficient vs Custom GTM

**Native works when:** Single Meta pixel only, basic purchase tracking, no developer resources, no TikTok/Pinterest.

**Custom GTM needed when:** Multiple platforms (Meta + Google + TikTok), Enhanced Conversions required, micro-conversion tracking needed, server-side via Stape, full GA4 ecommerce with custom dimensions, multi-brand/multi-region stores.

---

## 2. GTM on Shopify

### Installation Methods

**Method A: theme.liquid injection** -- Full control, fires on every non-checkout page. Does not execute on Shopify checkout for non-Plus stores.

**Method B: Custom Pixels (modern approach)** -- Via Settings > Customer events. Fires on all pages including checkout. Runs in a sandboxed iframe.

### Web Pixels API vs theme.liquid

| Feature | theme.liquid | Custom Pixel |
|---|---|---|
| Fires on checkout | No (non-Plus) | Yes |
| Sandboxed | No | Yes (iframe) |
| Access to DOM | Full | Limited |
| Cookie access | Full | Restricted |
| GTM triggers | All standard | Push-based only |
| Consent integration | Manual | Built-in Shopify consent |

**Recommended hybrid approach:** Use theme.liquid GTM for browsing behavior. Use Custom Pixel for checkout and purchase events.

For all GTM code, Custom Pixel code, and dataLayer examples, read references/pixel-api-code.md

---

## 3. DataLayer for Shopify

### Standard Events

The dataLayer should include: view_item (product pages), view_item_list (collection pages), add_to_cart (AJAX intercept), begin_checkout (Custom Pixel or checkout button intercept), and purchase (order status page or Custom Pixel).

### DataLayer Apps/Plugins

| App | Free/Paid | Notes |
|---|---|---|
| **Analyzify** | Paid ($499+ one-time) | Full GA4 ecommerce, server-side support |
| **Elevar** | Paid ($150+/mo) | Server-side first approach, strong Meta CAPI |
| **Littledata** | Paid ($99+/mo) | Server-side GA4, headless support |
| **GTM Kit** | Free (basic) | Lightweight, community maintained |

For OFM clients, Analyzify or Elevar are recommended when the client wants a managed app. For full control with Stape, implement the dataLayer manually or use Elevar's server-side mode.

For all dataLayer code examples (product, collection, cart, checkout, purchase), read references/pixel-api-code.md

---

## 4. Server-Side via Stape

### Architecture

```
Browser (Shopify store)
  |
  v
Client-side GTM container (web)
  |  sends events via GA4 transport
  v
Stape.io server container (sGTM)
  |
  +---> Meta Conversions API
  +---> TikTok Events API
  +---> Google Ads Enhanced Conversions
  +---> GA4 (server-side)
```

### Setup Steps

1. Create a Stape server container, note the URL
2. Configure first-party subdomain via DNS CNAME
3. Update client-side GTM GA4 tag with transport_url
4. Add server container tags: GA4 Client, Meta CAPI, TikTok Events API, Google Ads, GA4

### Event Mapping

- page_view -> Meta PageView, TikTok Pageview
- view_item -> Meta ViewContent, TikTok ViewContent
- add_to_cart -> Meta AddToCart, TikTok AddToCart
- begin_checkout -> Meta InitiateCheckout, TikTok InitiateCheckout
- purchase -> Meta Purchase, TikTok CompletePayment

### Shopify Webhook Alternative

For server-only purchase tracking: add a webhook for orders/create pointing to a Stape endpoint. Captures all orders including draft, POS, and API-created. Disadvantage: no browser-side event data (no fbp/fbc cookies, no user_agent, no IP).

---

## 5. Meta CAPI on Shopify

### Three Options

**Option A: Shopify Native CAPI** -- Install Facebook and Instagram sales channel. Automatic server-side events with dedup. Best for single-pixel, zero maintenance.

**Option B: Stape Server-Side** -- Meta CAPI tag in server container with Pixel ID, Access Token, event mapping, user data fields (em, ph, fn, ln, ct, st, zp, country, external_id, fbp, fbc). Best for multi-platform advertisers.

**Option C: Direct API via Webhook** -- Webhook fires on orders/create, Cloud Function constructs CAPI payload. Best for server-only tracking.

### Deduplication Warning

Common mistake: running both Shopify native CAPI AND a Stape server-side CAPI. This causes **triple counting** (browser pixel + Shopify server + Stape server). Choose one server-side path.

### Event Match Quality (EMQ)

Target score of 7+ in Meta Events Manager. Improve by sending more user parameters: email, phone, first name, last name, city, state, zip, country, external_id, fbp cookie, fbc cookie.

---

## 6. Click ID Capture on Shopify

### Strategy

Capture gclid, fbclid, ttclid, msclkid from URL parameters and store as first-party cookies.

**Challenge:** Cookies set on the storefront domain may not be readable on the checkout domain (checkout.shopify.com for non-Plus stores).

**Solutions:**
1. Cart attributes: write click IDs as cart attributes via AJAX API before checkout
2. Shopify Plus: checkout UI extensions can read cart attributes
3. Order status page: read cart/order attributes on thank-you page

For click ID capture scripts, cart attribute code, and thank-you page code, read references/click-id-and-checkout.md

---

## 7. Common Shopify Tracking Issues

### Cross-Domain Tracking: Headless Frontends

When using a headless frontend with Shopify checkout, configure GA4 cross-domain linking for both domains. Pass _fbp and _fbc cookies via cart attributes or URL decoration.

### Shopify's Checkout Domain and Cookie Issues

On non-Plus stores, checkout runs on checkout.shopify.com (third-party domain). First-party cookies from the storefront are not accessible. Custom Pixels are the approved method for checkout event tracking.

### Draft Order Tracking Gaps

Draft orders do not trigger the standard checkout flow. Use the orders/create webhook to catch all orders regardless of source.

### Subscription / Recurring Order Tracking

Subscription apps create recurring orders via API with no browser session. Use orders/create webhook with attribution from original subscription order's stored click IDs. Do NOT count recurring charges as new conversions unless using LTV-based bidding.

### Shopify Markets (Multi-Currency / Multi-Region)

The currency field must reflect the presentment currency (what the customer sees). Use cart.currency.iso_code in Liquid or event.data.checkout.currencyCode in Custom Pixels. Ensure GA4, Meta, and TikTok all receive correct currency. Handle tax-inclusive vs tax-exclusive pricing consistently.
