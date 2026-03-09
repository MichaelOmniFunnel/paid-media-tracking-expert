# WooCommerce Plugin Configurations

## GTM4WP (Free, Most Popular)

**Plugin:** [GTM4WP by Thomas Geiger](https://wordpress.org/plugins/duracelltomi-google-tag-manager/)

- Automatically injects the GTM container snippet into the `<head>` and `<body>`.
- Generates a full GA4 ecommerce dataLayer out of the box.
- Supports all standard ecommerce events: `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`.
- Configuration: **Settings > Google Tag Manager > Integration > WooCommerce** -- enable all ecommerce event checkboxes.

**Recommended settings in GTM4WP:**

- Container code placement: **Codeless injection** (uses `wp_head` and `wp_body_open` hooks).
- WooCommerce integration: Enable **all** event tracking options.
- Include customer data on order received page: **Yes** (for enhanced conversions).
- Product ID format: Choose **SKU** if the product feed uses SKUs, or **Product ID** if feeds use WordPress post IDs.

## Other Plugin Options

| Plugin | Cost | Notes |
|---|---|---|
| **Google Tag Manager for WordPress (GTM4WP)** | Free | The go-to for most WooCommerce setups |
| **MonsterInsights** | Paid ($99+/yr) | GA4-focused, less GTM flexibility |
| **PixelYourSite** | Free + Pro ($150/yr) | Strong Meta/TikTok pixel support, optional GTM |
| **Conversios** | Free + Pro | GA4 + Google Ads focused |
| **GTM Kit** | Free | Lightweight alternative to GTM4WP |

## Manual GTM Installation

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

## Server-Side Plugin Options

| Plugin | Notes |
|---|---|
| **Stape Plugin for WordPress** | Configures sGTM integration, adds server-side tracking |
| **Server-Side Tagging for WooCommerce (by Stape)** | Dedicated WooCommerce integration, sends purchase data server-side |
| **Conversios Pro** | GA4 + Ads server-side tracking |

The **Stape Plugin for WordPress** is the recommended option for OFM clients. It:

- Automatically configures the server container URL for the GTM snippet.
- Can send WooCommerce order data directly to the server container.
- Supports custom event mapping.

## Meta CAPI Plugin Options

### Facebook for WooCommerce (Official)

- Installs Meta pixel and optionally enables CAPI.
- Sends standard ecommerce events server-side.
- Handles deduplication via `event_id`.
- **Limitation:** Limited customization of event parameters. No support for custom events.

### PixelYourSite Pro

- Supports Meta, Google, TikTok, Pinterest pixels.
- Built-in CAPI support.
- Captures `fbclid` automatically and stores as first-party cookie.
- Sends user data (email, phone) for enhanced matching.
- Handles WooCommerce variable products correctly.
- **Best for:** Clients who want a plugin-based CAPI without GTM complexity.

### Conversios

- GA4 + Google Ads + Meta CAPI in one plugin.
- Server-side sending for purchase events.
- Product feed generation included.

## Click ID Storage Plugins

- **PixelYourSite Pro:** Automatically captures fbclid, stores as first-party cookie, passes to CAPI.
- **WooCommerce Conversion Tracking by Woopt:** Stores gclid and fbclid in order meta.
- **AttributionWP:** Full multi-touch attribution with click ID storage.
