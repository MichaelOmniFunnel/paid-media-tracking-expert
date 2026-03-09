---
name: netsuite-tracking
description: Conversion tracking on NetSuite SuiteCommerce and SCA including GTM integration, dataLayer implementation, SuiteScript server-side tracking. Use when someone mentions NetSuite tracking, SuiteCommerce analytics, SCA dataLayer, or ecommerce tracking on NetSuite.
disable-model-invocation: true
model: sonnet
allowed-tools: Read, Grep, Glob
---
# NetSuite SuiteCommerce Conversion Tracking Implementation Guide

This guide covers the full tracking implementation for NetSuite SuiteCommerce (SC) and SuiteCommerce Advanced (SCA) stores. NetSuite's ecommerce platform is architecturally different from Shopify and WooCommerce, requiring specialized approaches for GTM, dataLayer, and server-side tracking.

---

## 1. GTM on NetSuite SuiteCommerce

### Understanding the Architecture

SuiteCommerce Advanced (SCA) is a **single-page application (SPA)** built on Backbone.js. This has profound implications for tracking:

- The page loads once (initial full page load), then all subsequent "page" navigations are handled by the Backbone router via History API / hash fragments.
- Standard GTM pageview triggers (`gtm.js`, `Window Loaded`) only fire once per session.
- Every "page" after the first is a virtual navigation that does not trigger a new GTM page load event.

### Where to Add GTM

#### SuiteCommerce Advanced (SCA)

GTM should be added via the **Shopping application configuration** or a **custom extension module**.

**Method A: Shopping.Configuration (Quick)**

In the `SC.Shopping.Configuration` module (or equivalent entry point), add the GTM snippet to the head:

```javascript
// In a custom module's entry point or Shopping.js
define('GoogleTagManager.Module', [
  'jQuery'
], function($) {
  'use strict';

  return {
    mountToApp: function(application) {
      // Inject GTM
      var gtmId = 'GTM-XXXXXXX';
      var script = document.createElement('script');
      script.innerHTML = "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
        "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
        "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
        "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
        "})(window,document,'script','dataLayer','" + gtmId + "');";
      document.head.appendChild(script);
    }
  };
});
```

**Method B: Extension (Recommended for Production)**

Create a SuiteCommerce extension:

1. Use the SCA Developer Tools (Gulp-based build system) to scaffold a new extension.
2. Add GTM injection to the extension's entry point module.
3. Deploy the extension to NetSuite via SuiteBundle or file cabinet upload.

This approach is version-controlled and survives SCA updates.

### SuiteCommerce Advanced vs. SuiteCommerce Standard

| Feature | SCA | SC Standard |
|---|---|---|
| Architecture | Backbone.js SPA | Backbone.js SPA (simplified) |
| Customization | Full module override, extensions | Extensions only, limited override |
| Build tools | Gulp, Developer Tools | Cloud-based extensions |
| GTM access | Full control via modules/extensions | Extension injection only |
| Checkout | Integrated SPA (same app) | Integrated SPA |
| Theme files | Full template access | Limited template access |

### SPA Impact on Tracking

Because SCA is a SPA:

1. **GTM's built-in Page View trigger fires once.** You must use custom `dataLayer.push` events for virtual pageviews.
2. **DOM-based triggers in GTM** (click, form submit, etc.) may not work reliably because elements are rendered dynamically by Backbone views.
3. **History change trigger** in GTM can catch URL changes, but does not provide page-specific data (title, category, product info) without additional dataLayer pushes.
4. All ecommerce events (view_item, add_to_cart, purchase) must be explicitly pushed by custom SCA modules.

---


## 2. DataLayer for NetSuite

SCA requires custom Backbone.js modules to push dataLayer events. Every route change needs a `virtual_pageview` push. GTM triggers should use custom events, never "All Pages".

**Events to implement:**
- `virtual_pageview` - On every Backbone route change via `afterAppendView`
- `view_item` - Hook into `ItemDetails.View` render
- `add_to_cart` - Wrap `Cart.AddToCart.View` submit handler
- `begin_checkout` - Listen for checkout fragment in `OrderWizard.Router`
- `purchase` - Hook into `OrderWizard.Module.Confirmation` render

**Key NetSuite field mappings:** `itemid` (SKU), `storedisplayname2` (display name), `onlinecustomerprice_detail` (price), `custitem_brand` (custom brand field). Fields vary by NetSuite config; inspect model object in console.

**Alternative:** If SPA approach is unreliable, use a SuiteLet that renders order confirmation as a standalone page with traditional GTM execution.

For complete Backbone.js module code (virtual pageview, view_item, add_to_cart, checkout, purchase, product ID mapping), read references/datalayer-implementation.md

---

## 3. Server-Side Tracking

**Standard approach:** Client-side GTM -> Stape SGTM -> Meta CAPI + TikTok Events API + Google Ads EC + GA4

**SuiteScript approach:** User Event Script on Sales Order sends purchase events directly from NetSuite server to platform APIs. Bypasses browser entirely. Captures all orders (web, phone, admin-created).

**SuiteScript setup:** Upload to File Cabinet > Create Script Record (User Event) > Deploy on Sales Order > Set context to "Web Store". Script parameters for pixel IDs and tokens (never hardcode).

**Governance limits:** User Event Scripts get 1,000 usage units. N/https calls cost 10 units each. For high-volume stores, use a queue pattern: User Event writes to custom record, Scheduled Script processes in batches.

**Also available:** Workflow Action Scripts (triggered by order status changes), RESTlets (custom REST endpoints for headless commerce).

For complete SuiteScript code (User Event with Meta CAPI + TikTok Events API), workflow alternatives, RESTlet patterns, and queue implementation, read references/server-side-meta-capi.md

---

## 4. Meta CAPI on NetSuite

NetSuite has no native Meta CAPI integration. All implementations must be custom.

**Approach A (recommended):** Client-side GTM -> Stape -> Meta CAPI tag. Standard OFM architecture, consistent across platforms.

**Approach B:** SuiteScript User Event on Sales Order. Server-to-server, bypasses browser. Reliable for purchases but no browser signals (fbp, fbc, user_agent, IP). Lower EMQ unless click IDs stored on order.

**Recommended hybrid:** Approach A for all events (PageView through Purchase) + Approach B as purchase fallback.

| NetSuite Field | CAPI Parameter | Notes |
|---|---|---|
| email | em | SHA256 hashed |
| phone | ph | Digits only, SHA256 |
| firstname/lastname | fn/ln | SHA256 |
| city/state/zip | ct/st/zp | SHA256 |
| custbody_fbp/fbc | fbp/fbc | Not hashed (cookie values) |

For field mapping details, read references/server-side-meta-capi.md

---

## 5. Click ID Capture

Add an SCA module to capture gclid/fbclid/ttclid/msclkid from URL params into cookies (90-day expiry). Also construct _fbc cookie from fbclid. Re-capture on SPA route changes.

**Storing on orders:** Create custom transaction body fields (custbody_gclid, custbody_fbclid, custbody_fbp, custbody_fbc, UTMs). Read cookies in checkout module via `LiveOrder.Model.on("before:submit")` and set as order options.

**Offline uploads:** Create a Saved Search (Transaction, last 30 days, custbody_gclid not empty) with columns: tranid, date, amount, email, gclid, fbclid, fbc. Export CSV for Google Ads Offline Conversion Import or Meta Offline Events.

For complete JavaScript capture module, checkout integration code, and saved search config, read references/click-ids-and-troubleshooting.md

---

## 6. Common NetSuite Tracking Issues

1. **SPA virtual pageviews** - Standard pixels only fire once. All events via dataLayer custom pushes. Never use "All Pages" trigger.
2. **Domain structure** - Checkout on different domain (checkout.netsuite.com) breaks cookies. Use cross-domain tracking or server-side for checkout events.
3. **Extension deployment cycles** - SCA deploys take 5-15 minutes. Plan longer testing cycles. Batch dataLayer changes.
4. **Sandbox vs production** - Use separate GTM containers or environment variable in dataLayer to prevent test orders firing production conversions.
5. **Built-in analytics** - NetSuite web analytics is NOT a replacement for GTM. No platform integration capability.
6. **SuiteScript rate limits** - 1,000 usage units per User Event, 10 per HTTP call. Use queue pattern for high volume.
7. **Debugging** - GTM Preview for SPA events, browser console dataLayer monitor, NetSuite Script Execution Log.

For detailed troubleshooting steps, debugging code, and environment config, read references/click-ids-and-troubleshooting.md
