---
name: woocommerce-tracking
description: Conversion tracking on WooCommerce including GTM integration, dataLayer setup, server-side tracking via Stape, and WordPress plugin configurations. Use when someone mentions WooCommerce tracking, WordPress analytics, WooCommerce conversions, or ecommerce tracking on WooCommerce.
disable-model-invocation: true
model: sonnet
---

# WooCommerce Conversion Tracking Implementation Guide

This guide covers end-to-end conversion tracking for WooCommerce stores, from plugin-based GTM integration through full server-side measurement via Stape.io. Written for senior implementers managing Meta CAPI, TikTok Events API, Google Enhanced Conversions, and GA4 ecommerce on WordPress/WooCommerce.

---

## 1. GTM on WooCommerce

### Plugin Options

#### GTM4WP (Free, Most Popular)

**Plugin:** [GTM4WP by Thomas Geiger](https://wordpress.org/plugins/duracelltomi-google-tag-manager/)

- Automatically injects the GTM container snippet into the `<head>` and `<body>`.
- Generates a full GA4 ecommerce dataLayer out of the box.
- Supports all standard ecommerce events: `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`.
- Configuration: **Settings > Google Tag Manager > Integration > WooCommerce** — enable all ecommerce event checkboxes.

**Recommended settings in GTM4WP:**

- Container code placement: **Codeless injection** (uses `wp_head` and `wp_body_open` hooks).
- WooCommerce integration: Enable **all** event tracking options.
- Include customer data on order received page: **Yes** (for enhanced conversions).
- Product ID format: Choose **SKU** if the product feed uses SKUs, or **Product ID** if feeds use WordPress post IDs.

#### Other Plugin Options

| Plugin | Cost | Notes |
|---|---|---|
| **Google Tag Manager for WordPress (GTM4WP)** | Free | The go-to for most WooCommerce setups |
| **MonsterInsights** | Paid ($99+/yr) | GA4-focused, less GTM flexibility |
| **PixelYourSite** | Free + Pro ($150/yr) | Strong Meta/TikTok pixel support, optional GTM |
| **Conversios** | Free + Pro | GA4 + Google Ads focused |
| **GTM Kit** | Free | Lightweight alternative to GTM4WP |

### Manual Installation

If no plugin is used, add GTM via the theme's `functions.php`:

```php
// Add GTM to head
add_action('wp_head', function() {
    ?>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
    <!-- End Google Tag Manager -->
    <?php
}, 1);

// Add GTM noscript to body
add_action('wp_body_open', function() {
    ?>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <?php
}, 1);
```

**Important:** Use a child theme or a site-specific plugin to avoid losing customizations on theme updates.

---

## 2. DataLayer for WooCommerce

### GTM4WP Standard DataLayer Format

GTM4WP generates a dataLayer that follows Google's GA4 ecommerce schema. Below is what each event looks like and how to verify it.

#### Product Page: view_item

Fires on single product pages. GTM4WP pushes:

```javascript
{
  event: 'view_item',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'SKU-12345',       // or WP post ID depending on config
      item_name: 'Product Name',
      item_brand: '',              // requires custom mapping or ACF
      item_category: 'Category Name',
      item_variant: '',
      price: 29.99,
      quantity: 1
    }]
  }
}
```

#### Category Page: view_item_list

Fires on product archive/category pages:

```javascript
{
  event: 'view_item_list',
  ecommerce: {
    item_list_id: 'category-slug',
    item_list_name: 'Category Name',
    items: [
      {
        item_id: 'SKU-12345',
        item_name: 'Product Name',
        price: 29.99,
        index: 1,
        item_category: 'Category Name',
        quantity: 1
      }
      // ... more items
    ]
  }
}
```

#### Add to Cart: add_to_cart

GTM4WP handles both standard form submissions and AJAX add-to-cart. For AJAX carts, GTM4WP hooks into WooCommerce's `added_to_cart` jQuery event.

```javascript
{
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'SKU-12345',
      item_name: 'Product Name',
      price: 29.99,
      quantity: 1
    }]
  }
}
```

**AJAX cart troubleshooting:** Some themes override the default WooCommerce AJAX cart behavior. If `add_to_cart` does not fire:

1. Check that the theme uses WooCommerce's standard AJAX add-to-cart (look for `wc-add-to-cart.js`).
2. If the theme uses a custom AJAX handler, add a custom event listener that pushes to the dataLayer.
3. Ensure WooCommerce's "Enable AJAX add to cart buttons on archives" is checked in **WooCommerce > Settings > Products**.

#### Checkout Steps

GTM4WP tracks the following checkout events:

```javascript
// begin_checkout - fires when customer lands on /checkout/
{
  event: 'begin_checkout',
  ecommerce: {
    currency: 'USD',
    value: 59.98,
    items: [/* cart items */]
  }
}

// add_shipping_info - fires when shipping method is selected
{
  event: 'add_shipping_info',
  ecommerce: {
    currency: 'USD',
    value: 59.98,
    shipping_tier: 'Flat Rate',
    items: [/* cart items */]
  }
}

// add_payment_info - fires when payment method is selected
{
  event: 'add_payment_info',
  ecommerce: {
    currency: 'USD',
    value: 59.98,
    payment_type: 'Credit Card',
    items: [/* cart items */]
  }
}
```

#### Purchase: order-received page

Fires on the `/checkout/order-received/` page (WooCommerce's thank you page):

```javascript
{
  event: 'purchase',
  ecommerce: {
    transaction_id: '12345',
    value: 59.98,
    tax: 4.80,
    shipping: 5.00,
    currency: 'USD',
    coupon: 'SAVE10',
    items: [
      {
        item_id: 'SKU-12345',
        item_name: 'Product A',
        price: 29.99,
        quantity: 1,
        item_category: 'Category'
      },
      {
        item_id: 'SKU-67890',
        item_name: 'Product B',
        price: 29.99,
        quantity: 1,
        item_category: 'Category'
      }
    ]
  }
}
```

### User Data Layer for Enhanced Conversions

To enable Google Enhanced Conversions and improve Meta CAPI matching, push user data on the order-received page. GTM4WP can be configured to include this, or add it manually:

```php
// In functions.php or a custom plugin
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    ?>
    <script>
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'user_data_ready',
      user_data: {
        email: '<?php echo strtolower(trim($order->get_billing_email())); ?>',
        phone_number: '<?php echo preg_replace("/[^0-9+]/", "", $order->get_billing_phone()); ?>',
        address: {
          first_name: '<?php echo esc_js($order->get_billing_first_name()); ?>',
          last_name: '<?php echo esc_js($order->get_billing_last_name()); ?>',
          street: '<?php echo esc_js($order->get_billing_address_1()); ?>',
          city: '<?php echo esc_js($order->get_billing_city()); ?>',
          region: '<?php echo esc_js($order->get_billing_state()); ?>',
          postal_code: '<?php echo esc_js($order->get_billing_postcode()); ?>',
          country: '<?php echo esc_js($order->get_billing_country()); ?>'
        }
      }
    });
    </script>
    <?php
}, 10, 1);
```

### Variable Product Handling

Variable products in WooCommerce present a common tracking challenge:

- The **parent product** has one ID (WordPress post ID).
- Each **variation** has its own ID and potentially its own SKU.
- Product feeds (Google Merchant Center) typically use the **variation ID** or **variation SKU** as the `item_id`.

**GTM4WP behavior:** By default, GTM4WP uses the parent product's SKU or ID. To track the selected variation:

1. In GTM4WP settings, ensure "Product ID format" matches your feed.
2. For variation-level tracking, GTM4WP updates the dataLayer when a customer selects a variation (changing size, color, etc.).
3. Verify with the dataLayer debugger that the `item_id` and `item_variant` change when a variation is selected.

If GTM4WP does not capture variation changes correctly, add a custom listener:

```javascript
jQuery(document).on('found_variation', function(event, variation) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: jQuery('.woocommerce-Price-currencySymbol').length ?
        (document.querySelector('meta[property="og:price:currency"]')?.content || 'USD') : 'USD',
      value: parseFloat(variation.display_price),
      items: [{
        item_id: variation.sku || variation.variation_id.toString(),
        item_name: jQuery('.product_title').text().trim(),
        item_variant: variation.attributes ?
          Object.values(variation.attributes).join(' / ') : '',
        price: parseFloat(variation.display_price),
        quantity: 1
      }]
    }
  });
});
```

---

## 3. Server-Side via Stape

### Architecture for WooCommerce

```
Browser (WooCommerce site)
  |
  v
Client-side GTM container (web)
  |  sends events via GA4 transport to first-party subdomain
  v
Stape.io server container (sGTM)
  |
  +---> Meta Conversions API
  +---> TikTok Events API
  +---> Google Ads Enhanced Conversions
  +---> GA4 (server-side)
```

### Stape.io Setup for WooCommerce

1. **Create a Stape server container** at [stape.io](https://stape.io).
2. **Set up a first-party subdomain**: Add a CNAME record (e.g., `sst.clientdomain.com`) pointing to Stape's hostname. This is essential for first-party cookie context and bypassing ad blockers.
3. **Update client-side GTM**: In your GA4 Configuration tag, set `server_container_url` to `https://sst.clientdomain.com`.
4. **Configure server container tags**: Add Meta CAPI, TikTok Events API, Google Ads, and GA4 server-side tags using Stape's templates.

### WooCommerce Webhook Approach

WooCommerce supports webhooks natively (**WooCommerce > Settings > Advanced > Webhooks**):

1. Create a webhook with topic **Order created**.
2. Set the delivery URL to a Stape endpoint or custom Cloud Function.
3. The webhook payload includes full order details, customer email, phone, billing/shipping address.

```
Webhook payload example (simplified):
{
  "id": 12345,
  "status": "processing",
  "currency": "USD",
  "total": "59.98",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "city": "Denver",
    "state": "CO",
    "postcode": "80202",
    "country": "US"
  },
  "line_items": [
    {
      "product_id": 100,
      "sku": "SKU-12345",
      "name": "Product A",
      "quantity": 1,
      "price": 29.99
    }
  ]
}
```

4. Parse and forward to Meta CAPI, TikTok, etc.

### WordPress Plugin Options for Server-Side

| Plugin | Notes |
|---|---|
| **Stape Plugin for WordPress** | Configures sGTM integration, adds server-side tracking |
| **Server-Side Tagging for WooCommerce (by Stape)** | Dedicated WooCommerce integration, sends purchase data server-side |
| **Conversios Pro** | GA4 + Ads server-side tracking |

The **Stape Plugin for WordPress** is the recommended option for OFM clients. It:

- Automatically configures the server container URL for the GTM snippet.
- Can send WooCommerce order data directly to the server container.
- Supports custom event mapping.

---

## 4. Meta CAPI on WooCommerce

### Plugin Options

#### Facebook for WooCommerce (Official)

- Installs Meta pixel and optionally enables CAPI.
- Sends standard ecommerce events server-side.
- Handles deduplication via `event_id`.
- **Limitation:** Limited customization of event parameters. No support for custom events.

#### PixelYourSite Pro

- Supports Meta, Google, TikTok, Pinterest pixels.
- Built-in CAPI support.
- Captures `fbclid` automatically and stores as first-party cookie.
- Sends user data (email, phone) for enhanced matching.
- Handles WooCommerce variable products correctly.
- **Best for:** Clients who want a plugin-based CAPI without GTM complexity.

#### Conversios

- GA4 + Google Ads + Meta CAPI in one plugin.
- Server-side sending for purchase events.
- Product feed generation included.

### Stape Server-Side Approach (Preferred for OFM)

This is the recommended architecture:

1. GTM4WP generates the dataLayer on the WooCommerce frontend.
2. Client-side GTM fires GA4 events to the Stape server container.
3. In the server container, the **Meta CAPI tag** (Stape template) sends events to Meta.
4. Configure the tag with:
   - **Pixel ID** and **Access Token** from Meta Events Manager.
   - **Event mapping:** `page_view` -> `PageView`, `view_item` -> `ViewContent`, etc.
   - **User data:** Pull from the GA4 event's user properties (email, phone, address).
   - **Custom data:** Map `value`, `currency`, `content_ids`, `content_type`, `num_items`.

### Manual CAPI via WooCommerce Hooks

For maximum control, implement CAPI directly in PHP:

```php
// In a custom plugin or functions.php
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || $order->get_meta('_meta_capi_sent')) return;

    $pixel_id = 'YOUR_PIXEL_ID';
    $access_token = 'YOUR_ACCESS_TOKEN';

    $user_data = [
        'em' => [hash('sha256', strtolower(trim($order->get_billing_email())))],
        'ph' => [hash('sha256', preg_replace('/[^0-9]/', '', $order->get_billing_phone()))],
        'fn' => [hash('sha256', strtolower(trim($order->get_billing_first_name())))],
        'ln' => [hash('sha256', strtolower(trim($order->get_billing_last_name())))],
        'ct' => [hash('sha256', strtolower(trim($order->get_billing_city())))],
        'st' => [hash('sha256', strtolower(trim($order->get_billing_state())))],
        'zp' => [hash('sha256', trim($order->get_billing_postcode()))],
        'country' => [hash('sha256', strtolower($order->get_billing_country()))],
        'external_id' => [hash('sha256', (string)$order->get_customer_id())],
        'client_ip_address' => $order->get_customer_ip_address(),
        'client_user_agent' => $order->get_customer_user_agent()
    ];

    // Retrieve stored fbp/fbc from order meta
    $fbp = $order->get_meta('_fbp');
    $fbc = $order->get_meta('_fbc');
    if ($fbp) $user_data['fbp'] = $fbp;
    if ($fbc) $user_data['fbc'] = $fbc;

    $items = [];
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $items[] = $product ? $product->get_sku() : (string)$item->get_product_id();
    }

    $event_data = [
        'data' => [[
            'event_name' => 'Purchase',
            'event_time' => time(),
            'event_id' => 'purchase_' . $order_id,
            'event_source_url' => $order->get_checkout_order_received_url(),
            'action_source' => 'website',
            'user_data' => $user_data,
            'custom_data' => [
                'value' => (float)$order->get_total(),
                'currency' => $order->get_currency(),
                'content_ids' => $items,
                'content_type' => 'product',
                'num_items' => count($items),
                'order_id' => $order->get_order_number()
            ]
        ]]
    ];

    $url = "https://graph.facebook.com/v18.0/{$pixel_id}/events?access_token={$access_token}";

    wp_remote_post($url, [
        'body' => json_encode($event_data),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 15
    ]);

    $order->update_meta_data('_meta_capi_sent', true);
    $order->save();
}, 10, 1);
```

### Advanced Matching from WooCommerce Checkout Fields

WooCommerce checkout collects rich user data by default:

- Email (required)
- Phone (optional, often required)
- First name, last name
- Billing address: street, city, state, zip, country

Push this data to the dataLayer before the purchase event so it can be used by both Meta and Google enhanced conversions:

```javascript
// On checkout page, capture form data as user fills it in
jQuery(document).on('change', '#billing_email, #billing_phone, #billing_first_name, #billing_last_name', function() {
  window.dataLayer.push({
    event: 'checkout_user_data',
    user_data: {
      email: jQuery('#billing_email').val().toLowerCase().trim(),
      phone: jQuery('#billing_phone').val().replace(/[^0-9+]/g, ''),
      first_name: jQuery('#billing_first_name').val().trim(),
      last_name: jQuery('#billing_last_name').val().trim()
    }
  });
});
```

---

## 5. Click ID Capture

### JavaScript Cookie Capture

Place in the theme header or via GTM custom HTML tag:

```javascript
(function() {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  const clickIds = ['gclid', 'fbclid', 'ttclid', 'msclkid'];
  clickIds.forEach(id => {
    const val = getParam(id);
    if (val) setCookie('_ofm_' + id, val, 90);
  });

  // UTM parameters
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(p => {
    const val = getParam(p);
    if (val) setCookie('_ofm_' + p, val, 90);
  });
})();
```

### Passing Click IDs to WooCommerce Order Meta

#### Hidden Checkout Fields Approach

```php
// Add hidden fields to WooCommerce checkout
add_action('woocommerce_after_order_notes', function($checkout) {
    echo '<div style="display:none">';
    woocommerce_form_field('_ofm_gclid', ['type' => 'hidden'], $checkout->get_value('_ofm_gclid'));
    woocommerce_form_field('_ofm_fbclid', ['type' => 'hidden'], $checkout->get_value('_ofm_fbclid'));
    woocommerce_form_field('_ofm_ttclid', ['type' => 'hidden'], $checkout->get_value('_ofm_ttclid'));
    woocommerce_form_field('_ofm_fbp', ['type' => 'hidden'], $checkout->get_value('_ofm_fbp'));
    woocommerce_form_field('_ofm_fbc', ['type' => 'hidden'], $checkout->get_value('_ofm_fbc'));
    echo '</div>';
});

// Populate hidden fields from cookies via JavaScript
add_action('wp_footer', function() {
    if (!is_checkout()) return;
    ?>
    <script>
    (function() {
      function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
      }
      const fields = {
        '_ofm_gclid': getCookie('_ofm_gclid'),
        '_ofm_fbclid': getCookie('_ofm_fbclid'),
        '_ofm_ttclid': getCookie('_ofm_ttclid'),
        '_ofm_fbp': getCookie('_fbp'),
        '_ofm_fbc': getCookie('_fbc')
      };
      Object.keys(fields).forEach(id => {
        const el = document.getElementById(id);
        if (el && fields[id]) el.value = fields[id];
      });
    })();
    </script>
    <?php
});

// Save click IDs to order meta
add_action('woocommerce_checkout_update_order_meta', function($order_id) {
    $fields = ['_ofm_gclid', '_ofm_fbclid', '_ofm_ttclid', '_ofm_fbp', '_ofm_fbc'];
    foreach ($fields as $field) {
        if (!empty($_POST[$field])) {
            update_post_meta($order_id, $field, sanitize_text_field($_POST[$field]));
        }
    }
});
```

This allows you to:
- Export click IDs with orders for offline conversion uploads.
- Pass click IDs to CAPI events (fbp, fbc for Meta; gclid for Google).
- Build attribution reports in WooCommerce.

### Plugin Options for Automated Click ID Storage

- **PixelYourSite Pro:** Automatically captures fbclid, stores as first-party cookie, passes to CAPI.
- **WooCommerce Conversion Tracking by Woopt:** Stores gclid and fbclid in order meta.
- **AttributionWP:** Full multi-touch attribution with click ID storage.

---

## 6. Common WooCommerce Tracking Issues

### Cache Plugins Breaking DataLayer

**Problem:** Page caching plugins serve static HTML, which means the dataLayer is generated once and cached. This causes issues with:
- Purchase event firing for the wrong order (cached order-received page).
- User data in the dataLayer being stale or belonging to a different user.
- Cart-specific data being cached (wrong items in `begin_checkout`).

**Solutions by plugin:**

| Cache Plugin | Fix |
|---|---|
| **WP Rocket** | Add `/checkout/*` and `/cart/*` to "Never Cache" URLs. Add `woocommerce_items_in_cart` cookie to cache exception cookies. |
| **W3 Total Cache** | Exclude `/checkout/order-received` from page cache. Enable "Don't cache pages for logged-in users." |
| **LiteSpeed Cache** | Add `/checkout` and `/cart` to "Do Not Cache URIs." Enable "Do not cache cookies" for WooCommerce cookies. |
| **Cloudflare** | Create a Page Rule: `*domain.com/checkout/*` -> Cache Level: Bypass. Also bypass for `/cart/*`. |
| **WP Super Cache** | Enable "Don't cache pages with GET parameters." Exclude WooCommerce pages. |

**Critical rule:** The `/checkout/order-received/` page must NEVER be cached. This is where the purchase dataLayer fires, and caching it causes duplicate or incorrect conversion events.

### AJAX Add-to-Cart Events Not Firing

**Root causes:**
1. Theme overrides the default WooCommerce AJAX handler.
2. Cart page uses a non-standard template.
3. Mini-cart widget uses custom JavaScript.

**Debugging steps:**
1. Open browser console, go to a product page, click "Add to Cart."
2. Check if `dataLayer.push` with `add_to_cart` fires.
3. If not, check if the theme uses `?add-to-cart=ID` (full page reload) vs. AJAX.
4. For themes with custom AJAX, add a MutationObserver or intercept fetch/XHR calls.

### Order Received Page Caching

**Symptoms:**
- Multiple `purchase` events for the same transaction_id.
- Purchase events firing with incorrect amounts.
- Users bookmarking or sharing the order-received URL.

**Solutions:**
1. **GTM4WP** includes a built-in flag (`orderIdSent`) using `sessionStorage` to prevent duplicate fires.
2. Add a cookie/sessionStorage check in GTM with a custom JavaScript variable:
```javascript
function() {
  var transactionId = {{DL - ecommerce.transaction_id}};
  var sentKey = 'purchase_sent_' + transactionId;
  if (sessionStorage.getItem(sentKey)) return false;
  sessionStorage.setItem(sentKey, 'true');
  return true;
}
```
3. Use this variable as a condition on the GA4 Purchase event tag and all conversion tags.

### Variable/Grouped Product ID Mismatches

**Problem:** The product ID in the dataLayer does not match the ID in the Google Merchant Center or Meta product catalog feed.

**Diagnosis:**
1. Check the feed: does it use parent product IDs, variation IDs, or SKUs?
2. Check the dataLayer: what does `item_id` contain?
3. Common mismatch: feed uses `woo_12345` prefix, but dataLayer pushes raw `12345`.

**Fix:** In GTM4WP, configure the Product ID format to match your feed. If the feed uses a custom format (e.g., `shopify_US_12345_67890` or `woo_12345`), create a custom JavaScript variable in GTM to transform the ID.

### Payment Gateway Redirect Tracking Gaps

**Problem:** When customers pay via PayPal, Klarna, or other redirect-based gateways, they leave the WooCommerce site, complete payment, and return to the order-received page. Sometimes:
- The session is lost during the redirect.
- The order-received page loads without the dataLayer (caching issue).
- The customer never returns to the order-received page (closes browser after PayPal).

**Solutions:**
1. **WooCommerce webhook** as a backup: Send order data server-side when order status changes to "processing" or "completed."
2. **Stape server-side:** The server container receives the event regardless of browser behavior.
3. **Order status hook in PHP:**
```php
add_action('woocommerce_order_status_processing', function($order_id) {
    // Send server-side conversion event
    // This fires regardless of whether the customer returns to the site
}, 10, 1);
```

### WordPress Security Plugins Blocking Tracking Scripts

**Common offenders:**
- **Wordfence:** May block GTM or analytics scripts if configured aggressively.
- **Sucuri:** CDN/WAF may strip inline scripts.
- **iThemes Security:** Content Security Policy headers may block external scripts.
- **All-in-One Security:** May modify headers that affect script loading.

**Fixes:**
- Whitelist `googletagmanager.com`, `google-analytics.com`, `connect.facebook.net`, `analytics.tiktok.com`, and your Stape subdomain.
- If using CSP headers, add these domains to `script-src` and `connect-src` directives.
- Test in incognito mode with browser developer tools to verify scripts load correctly.

### WooCommerce Blocks (New Checkout) Considerations

WooCommerce is transitioning from the classic shortcode-based checkout to a **Blocks-based checkout** (Gutenberg blocks). This affects tracking:

- Classic checkout (`[woocommerce_checkout]` shortcode) works with GTM4WP and custom jQuery hooks.
- Blocks checkout is React-based. jQuery event hooks (`updated_checkout`, `payment_method_selected`) do not fire.
- GTM4WP has added Blocks support in recent versions, but verify events fire on all checkout steps.
- Custom checkout field injection (hidden click ID fields) requires the WooCommerce Checkout Block's extensibility API instead of PHP hooks.

**Recommendation:** Test thoroughly after any WooCommerce or GTM4WP update, especially if the client migrates from classic to Blocks checkout.
