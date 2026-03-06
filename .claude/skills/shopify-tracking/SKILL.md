---
name: shopify-tracking
description: Conversion tracking on Shopify including native integrations, GTM setup, Shopify Pixel API, server-side tracking via Stape, and CAPI configuration. Use when someone mentions Shopify tracking, Shopify checkout tracking, Shopify pixels, or ecommerce tracking on Shopify.
disable-model-invocation: true
---

# Shopify Conversion Tracking Implementation Guide

This guide covers every layer of conversion tracking for Shopify stores, from native integrations through full server-side measurement via Stape.io. It is written for senior implementers managing Meta CAPI, TikTok Events API, Google Enhanced Conversions, and GA4 ecommerce on Shopify.

---

## 1. Shopify's Native Tracking

### Built-in Meta Conversions API (CAPI)

Shopify offers a first-party Meta CAPI integration through the **Facebook & Instagram sales channel**. When connected:

- Shopify sends server-side events directly to Meta from its own servers.
- Events include `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, and `Purchase`.
- Customer matching parameters (email, phone, external_id) are hashed and sent automatically when the customer is known.
- Shopify generates an `event_id` for browser-side and server-side events to enable deduplication.

**Limitations of the native integration:**

- Limited parameter customization. You cannot add custom data properties or modify event payloads.
- Event timing is controlled by Shopify, not by you. Some events fire on slightly different triggers than what you might configure in GTM.
- No support for custom events beyond the standard ecommerce funnel.
- Multi-pixel setups (e.g., agency pixel + client pixel) require workarounds since the native channel supports one pixel/dataset per store.
- Cannot add `content_category`, custom audiences, or non-standard parameters without additional code.

### Built-in Google Channel

Shopify's Google channel integration handles:

- Google Merchant Center feed sync
- Basic Google Ads conversion tracking (purchase event)
- Free listing management

It does **not** provide full GA4 ecommerce event tracking, enhanced conversions, or custom audience signals. For any serious Google Ads measurement, you will still need GTM or gtag.js with a proper dataLayer.

### When Native Is Sufficient vs. When Custom GTM Is Needed

**Native is sufficient when:**
- The client runs only Meta ads with a single pixel.
- Basic purchase conversion data is all that is needed.
- The client is on Shopify Basic/Standard and has no developer resources.
- There is no requirement for TikTok, Pinterest, or other platforms.

**Custom GTM is needed when:**
- Multiple ad platforms are in use (Meta + Google + TikTok).
- Enhanced Conversions for Google Ads are required.
- The client needs micro-conversion tracking (scroll depth, video views, form interactions).
- Server-side tracking via Stape is the architecture.
- The client needs full GA4 ecommerce with custom dimensions.
- Deduplication logic must be customized.
- Multi-brand or multi-region stores share a Shopify instance.

---

## 2. GTM on Shopify

### Installation Methods

#### Method A: theme.liquid Injection (Legacy)

Place the GTM container snippet in the `<head>` section of `theme.liquid`:

```liquid
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

And the noscript fallback immediately after the `<body>` tag:

```liquid
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Advantages:** Full control, fires on every page including non-checkout pages, works with all GTM triggers.

**Disadvantages:** Does not execute on the Shopify checkout for non-Plus stores (checkout is on a sandboxed domain). On Plus stores, `checkout.liquid` is deprecated in favor of Checkout Extensibility.

#### Method B: Shopify Custom Pixels (Modern Approach, Post-2023)

Shopify's **Customer Events** system (Settings > Customer events > Add custom pixel) provides a sandboxed JavaScript environment that fires on all pages including checkout.

```javascript
// Inside Shopify Custom Pixel
const GTMID = 'GTM-XXXXXXX';

const script = document.createElement('script');
script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTMID;
script.async = true;
document.head.appendChild(script);

window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

// Subscribe to Shopify events and push to dataLayer
analytics.subscribe('page_viewed', (event) => {
  window.dataLayer.push({
    event: 'page_view',
    page_location: event.context.document.location.href,
    page_title: event.context.document.title
  });
});

analytics.subscribe('product_viewed', (event) => {
  const product = event.data.productVariant;
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: product.price.currencyCode,
      value: parseFloat(product.price.amount),
      items: [{
        item_id: product.sku || product.id,
        item_name: product.title,
        price: parseFloat(product.price.amount),
        item_variant: product.title,
        quantity: 1
      }]
    }
  });
});

analytics.subscribe('product_added_to_cart', (event) => {
  const item = event.data.cartLine;
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: item.merchandise.price.currencyCode,
      value: parseFloat(item.merchandise.price.amount) * item.quantity,
      items: [{
        item_id: item.merchandise.sku || item.merchandise.id,
        item_name: item.merchandise.title,
        price: parseFloat(item.merchandise.price.amount),
        quantity: item.quantity
      }]
    }
  });
});

analytics.subscribe('checkout_started', (event) => {
  const checkout = event.data.checkout;
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: checkout.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      items: checkout.lineItems.map(item => ({
        item_id: item.variant.sku || item.variant.id,
        item_name: item.title,
        price: parseFloat(item.variant.price.amount),
        quantity: item.quantity
      }))
    }
  });
});

analytics.subscribe('checkout_completed', (event) => {
  const checkout = event.data.checkout;
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: checkout.order?.id || checkout.token,
      currency: checkout.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      tax: parseFloat(checkout.totalTax?.amount || '0'),
      shipping: parseFloat(checkout.shippingLine?.price?.amount || '0'),
      items: checkout.lineItems.map(item => ({
        item_id: item.variant.sku || item.variant.id,
        item_name: item.title,
        price: parseFloat(item.variant.price.amount),
        quantity: item.quantity
      }))
    }
  });
});
```

### Web Pixels API vs. Traditional theme.liquid Injection

| Feature | theme.liquid | Custom Pixel (Web Pixels API) |
|---|---|---|
| Fires on checkout | No (non-Plus) | Yes |
| Sandboxed | No | Yes (iframe sandbox) |
| Access to DOM | Full | Limited |
| Cookie access | Full | Restricted (3P context) |
| GTM triggers | All standard | Push-based only |
| Consent integration | Manual | Built-in Shopify consent |

**Key implication:** Custom Pixels run in a sandboxed iframe, so `document.cookie` access is limited and some GTM triggers (e.g., Click triggers, Scroll triggers) will not work in that context. The recommended hybrid approach is:

- Use theme.liquid GTM for browsing behavior (pageview, scroll, clicks, product views on non-checkout pages).
- Use Custom Pixel for checkout and purchase events that theme.liquid cannot reach on non-Plus stores.

### Checkout Limitations

- **Shopify Standard/Basic/Advanced:** `checkout.liquid` is not editable. Checkout runs on a Shopify-managed subdomain. Custom Pixels are the only way to track checkout events.
- **Shopify Plus:** Checkout Extensibility replaces `checkout.liquid`. Use checkout UI extensions and Custom Pixels. Direct script injection into checkout is deprecated.

---

## 3. DataLayer for Shopify

### Standard GA4 Ecommerce DataLayer Structure

#### Product Page: view_item

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: '{{ shop.currency }}',
    value: {{ product.price | money_without_currency | remove: ',' }},
    items: [{
      item_id: '{{ product.variants.first.sku | default: product.id }}',
      item_name: '{{ product.title | escape }}',
      item_brand: '{{ product.vendor | escape }}',
      item_category: '{{ product.type | escape }}',
      item_variant: '{{ product.variants.first.title | escape }}',
      price: {{ product.price | money_without_currency | remove: ',' }},
      quantity: 1
    }]
  }
});
```

#### Collection Page: view_item_list

```javascript
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'view_item_list',
  ecommerce: {
    item_list_id: '{{ collection.handle }}',
    item_list_name: '{{ collection.title | escape }}',
    items: [
      {% for product in collection.products limit: 20 %}
      {
        item_id: '{{ product.variants.first.sku | default: product.id }}',
        item_name: '{{ product.title | escape }}',
        item_brand: '{{ product.vendor | escape }}',
        item_category: '{{ product.type | escape }}',
        price: {{ product.price | money_without_currency | remove: ',' }},
        index: {{ forloop.index }},
        quantity: 1
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  }
});
```

#### Add to Cart: add_to_cart

For AJAX-based carts (most modern themes), intercept the fetch/XHR to `/cart/add.js`:

```javascript
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/cart/add')) {
      const body = options && options.body ? JSON.parse(options.body) : {};
      return originalFetch.apply(this, arguments).then(response => {
        response.clone().json().then(data => {
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              currency: window.Shopify?.currency?.active || 'USD',
              value: (data.final_price || data.price) / 100,
              items: [{
                item_id: data.sku || data.variant_id?.toString(),
                item_name: data.product_title,
                item_variant: data.variant_title,
                price: (data.final_price || data.price) / 100,
                quantity: data.quantity
              }]
            }
          });
        });
        return response;
      });
    }
    return originalFetch.apply(this, arguments);
  };
})();
```

#### Checkout: begin_checkout

In the Custom Pixel, subscribe to `checkout_started` (see Section 2 code example above).

For theme.liquid (if accessible), push before redirect:

```javascript
document.querySelectorAll('[name="checkout"], a[href="/checkout"]').forEach(el => {
  el.addEventListener('click', function() {
    fetch('/cart.js').then(r => r.json()).then(cart => {
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'begin_checkout',
        ecommerce: {
          currency: cart.currency,
          value: cart.total_price / 100,
          items: cart.items.map((item, i) => ({
            item_id: item.sku || item.variant_id.toString(),
            item_name: item.product_title,
            item_variant: item.variant_title,
            price: item.final_price / 100,
            quantity: item.quantity,
            index: i
          }))
        }
      });
    });
  });
});
```

#### Purchase: purchase

Via Custom Pixel `checkout_completed` event (see Section 2). On the order status page (accessible via **Settings > Checkout > Additional scripts** or **Order status page additional scripts**):

```liquid
{% if first_time_accessed %}
<script>
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: '{{ order.name }}',
    value: {{ checkout.total_price | money_without_currency | remove: ',' }},
    tax: {{ checkout.tax_price | money_without_currency | remove: ',' }},
    shipping: {{ checkout.shipping_price | money_without_currency | remove: ',' }},
    currency: '{{ checkout.currency }}',
    coupon: '{{ checkout.discount_applications.first.title | escape }}',
    items: [
      {% for line_item in checkout.line_items %}
      {
        item_id: '{{ line_item.sku | default: line_item.variant_id }}',
        item_name: '{{ line_item.product.title | escape }}',
        item_variant: '{{ line_item.variant.title | escape }}',
        item_brand: '{{ line_item.vendor | escape }}',
        item_category: '{{ line_item.product.type | escape }}',
        price: {{ line_item.final_price | money_without_currency | remove: ',' }},
        quantity: {{ line_item.quantity }}
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  }
});
</script>
{% endif %}
```

### DataLayer Apps/Plugins

| App | Free/Paid | Notes |
|---|---|---|
| **Analyzify** | Paid ($499+ one-time) | Full GA4 ecommerce, server-side support, great support |
| **Elevar** | Paid ($150+/mo) | Server-side first approach, strong Meta CAPI |
| **Littledata** | Paid ($99+/mo) | Server-side GA4, headless support |
| **GTM Kit** | Free (basic) | Lightweight, community maintained |
| **Fueled by Flavor** | Paid | Hydrogen/headless focused |

For OFM clients, Analyzify or Elevar are recommended when the client wants a managed app. For full control with Stape, implement the dataLayer manually or use Elevar's server-side mode.

---

## 4. Server-Side via Stape

### Architecture Overview

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

### Stape.io Setup for Shopify

1. **Create a Stape server container** at [stape.io](https://stape.io). Note the server container URL (e.g., `https://gtm.yourclient.com` or `https://sst.yourclient.com`).

2. **Configure a first-party subdomain** via DNS CNAME record pointing to Stape's provided hostname. This is critical for cookie longevity and bypassing ad blockers.

3. **In the client-side GTM container**, update the GA4 Configuration tag:
   - Set the `transport_url` (or `server_container_url`) to the Stape subdomain.
   - Enable `send_page_view` as needed.

4. **In the Stape server container**, add:
   - **GA4 Client** (claims incoming GA4 requests)
   - **Meta CAPI tag** (Stape's official template)
   - **TikTok Events API tag** (Stape's official template)
   - **Google Ads Conversion tag** with Enhanced Conversions enabled
   - **GA4 tag** (forwarding to Google's endpoint for GA4 reporting)

5. **Event mapping** in server GTM:
   - `page_view` -> Meta `PageView`, TikTok `Pageview`
   - `view_item` -> Meta `ViewContent`, TikTok `ViewContent`
   - `add_to_cart` -> Meta `AddToCart`, TikTok `AddToCart`
   - `begin_checkout` -> Meta `InitiateCheckout`, TikTok `InitiateCheckout`
   - `purchase` -> Meta `Purchase`, TikTok `CompletePayment`

### Shopify Webhook Alternative

For server-only purchase tracking (no client dependency):

1. In Shopify Admin, go to **Settings > Notifications > Webhooks** (or create via Shopify API).
2. Add a webhook for `orders/create` pointing to a Stape endpoint or a custom Cloud Function.
3. The webhook payload contains order details, customer email, phone, shipping address.
4. Parse the payload and forward to Meta CAPI, TikTok Events API, etc.

**Advantages:** Does not rely on browser JavaScript. Captures all orders including draft orders, POS, and API-created orders.

**Disadvantages:** No browser-side event data (no fbp, fbc cookies, no user_agent, no IP). Lower match quality for Meta unless you supplement with stored click IDs.

---

## 5. Meta CAPI on Shopify

### Option A: Shopify Native CAPI (Simplest)

- Install the **Facebook & Instagram** sales channel from Shopify.
- Connect your Meta Business account and pixel.
- Shopify automatically sends server-side events.
- Deduplication is handled via `event_id` matching between browser pixel and server event.
- **Best for:** Clients who only use Meta and want zero maintenance.

### Option B: Stape Server-Side (More Control)

- Use the architecture from Section 4.
- Install Stape's **Meta Conversions API tag** in the server container.
- Configure:
  - `Pixel ID`
  - `Access Token` (generate in Meta Events Manager > Settings)
  - `Action Source`: `website`
  - Event mapping from GA4 events to Meta standard events
  - User data: `em` (email), `ph` (phone), `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`, `fbp`, `fbc`
- **Best for:** Multi-platform advertisers, agencies wanting uniform tracking architecture.

### Option C: Direct API via Shopify Webhook

- Webhook fires on `orders/create`.
- Cloud Function or Stape endpoint receives the order data.
- Constructs a Meta CAPI payload and sends to `https://graph.facebook.com/v18.0/{pixel_id}/events`.
- Must include `event_name`, `event_time`, `user_data`, `custom_data`, and `action_source`.
- **Best for:** Server-only tracking where browser-side pixel is not desired or possible.

### Deduplication

When both Shopify's native pixel (browser) and CAPI (server) fire:

- Shopify's native integration handles dedup automatically.
- If you run your own CAPI alongside Shopify's native pixel, you must ensure the `event_id` matches between the browser event and server event.
- Common mistake: running both Shopify native CAPI AND a Stape server-side CAPI. This causes **triple counting** (browser pixel + Shopify server + Stape server). Choose one server-side path.

### Checking Event Match Quality (EMQ)

1. Go to **Meta Events Manager > Your Pixel > Overview**.
2. Click on any server event to see its EMQ score (1-10).
3. Target a score of **7+** for strong matching.
4. Improve EMQ by sending more user parameters: email, phone, first name, last name, city, state, zip, country, external_id, fbp cookie, fbc cookie.
5. On Shopify, customer data is available in the order/checkout object. Ensure your dataLayer includes user data on purchase.

---

## 6. Click ID Capture on Shopify

### GCLID, FBCLID, TTCLID Capture

Place this script in theme.liquid (or a Custom Pixel) to capture click IDs from URL parameters and store them as first-party cookies:

```javascript
(function() {
  function getParam(name) {
    const match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;domain=.' + window.location.hostname + ';SameSite=Lax';
  }

  const params = {
    gclid: getParam('gclid'),
    fbclid: getParam('fbclid'),
    ttclid: getParam('ttclid'),
    msclkid: getParam('msclkid'),
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign')
  };

  Object.keys(params).forEach(key => {
    if (params[key]) {
      setCookie('_ofm_' + key, params[key], 90);
    }
  });

  // Construct fbc cookie format for Meta if fbclid present
  if (params.fbclid) {
    const fbc = 'fb.1.' + Date.now() + '.' + params.fbclid;
    setCookie('_fbc', fbc, 90);
  }
})();
```

### Passing Click IDs Through Shopify Checkout

**Challenge:** Cookies set on the storefront domain may not be readable on the checkout domain (for non-Plus stores, checkout runs on `checkout.shopify.com`).

**Solutions:**

1. **Cart attributes:** Before checkout, write click IDs as cart attributes via the AJAX API:
```javascript
fetch('/cart/update.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attributes: {
      gclid: getCookie('_ofm_gclid') || '',
      fbclid: getCookie('_ofm_fbclid') || '',
      ttclid: getCookie('_ofm_ttclid') || ''
    }
  })
});
```
These attributes persist through checkout and appear on the order in Shopify Admin, accessible via webhooks and API.

2. **Shopify Plus: checkout UI extensions** can read cart attributes and include them in the dataLayer.

3. **Order status page (Additional Scripts):** Read cart/order attributes on the thank-you page:
```liquid
{% if first_time_accessed %}
<script>
  var orderAttributes = {
    {% for attr in checkout.attributes %}
      '{{ attr.first }}': '{{ attr.last }}'{% unless forloop.last %},{% endunless %}
    {% endfor %}
  };
  // Push to dataLayer for server-side tags to pick up
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'order_attributes',
    gclid: orderAttributes.gclid || '',
    fbclid: orderAttributes.fbclid || '',
    ttclid: orderAttributes.ttclid || ''
  });
</script>
{% endif %}
```

### Shopify Plus vs. Standard Limitations

| Capability | Standard | Plus |
|---|---|---|
| Theme.liquid editing | Yes | Yes |
| Checkout script injection | No | Checkout Extensibility only |
| Cart attributes | Yes | Yes |
| Additional scripts (thank you) | Yes | Yes |
| Checkout UI extensions | No | Yes |
| Custom pixel (Customer Events) | Yes | Yes |

---

## 7. Common Shopify Tracking Issues

### Cross-Domain Tracking: Headless Frontends + Shopify Checkout

When using a headless frontend (Hydrogen, Next.js, custom) with Shopify checkout:

- The frontend is on `www.example.com`, checkout is on `checkout.example.com` or `checkout.shopify.com`.
- GA4 cross-domain tracking must be configured in GTM: add both domains to the GA4 Configuration tag's cross-domain linking settings.
- For Meta: the `_fbp` and `_fbc` cookies must be passed via cart attributes or URL decoration since they are domain-specific.
- Use `linker` parameter in GA4 to maintain session continuity.

### Shopify's Checkout Domain and Cookie Issues

- On non-Plus stores, checkout runs on `checkout.shopify.com` as of late 2023. This is a third-party domain.
- First-party cookies from the storefront domain are not accessible.
- Custom Pixels (Web Pixels API) are the approved method for tracking checkout events on this domain.
- Server-side tokens (`_shopify_y`, `_shopify_s`) are Shopify's own tracking identifiers and can be used for deduplication.

### Draft Order Tracking Gaps

- Draft orders (created manually in Shopify admin or via API) do not trigger the standard checkout flow.
- The customer may receive a checkout link that bypasses the storefront entirely.
- Solution: use the `orders/create` webhook to catch all orders regardless of source.

### Subscription / Recurring Order Tracking

- Subscription apps (ReCharge, Bold, Skio) create recurring orders via the Shopify API.
- These orders do not have a browser session, so no client-side tracking fires.
- Solution: use `orders/create` webhook with attribution logic based on the original subscription order's click IDs stored as order metafields.
- Do NOT count recurring charges as new conversions in ad platforms unless you have a specific LTV-based bidding strategy.

### Shopify Markets (Multi-Currency / Multi-Region)

- Shopify Markets enables multi-currency and multi-region on a single store.
- The `currency` field in ecommerce events must reflect the **presentment currency** (what the customer sees), not the store's base currency.
- Use `{{ cart.currency.iso_code }}` in Liquid, or `event.data.checkout.currencyCode` in Custom Pixels.
- Ensure GA4, Meta, and TikTok all receive prices in the correct currency.
- Different market domains/subfolders (e.g., `/en-gb/`, `/fr/`) should be handled in GA4 as different data streams or via regex-based audience segmentation.
- Tax-inclusive vs. tax-exclusive pricing varies by market; ensure your `value` parameter is consistent (typically use the total the customer pays).
