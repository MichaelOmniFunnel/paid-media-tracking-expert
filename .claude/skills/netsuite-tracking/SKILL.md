---
name: netsuite-tracking
description: Conversion tracking on NetSuite SuiteCommerce and SCA including GTM integration, dataLayer implementation, SuiteScript server-side tracking. Use when someone mentions NetSuite tracking, SuiteCommerce analytics, SCA dataLayer, or ecommerce tracking on NetSuite.
disable-model-invocation: true
model: sonnet
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

### Virtual Pageview Tracking

Every route change in SCA must push a virtual pageview event:

```javascript
define('DataLayer.Router', [
  'Backbone',
  'underscore'
], function(Backbone, _) {
  'use strict';

  return {
    mountToApp: function(application) {
      // Listen to route changes on all SCA applications
      var layout = application.getLayout();

      layout.on('afterAppendView', function(view) {
        window.dataLayer = window.dataLayer || [];

        // Determine page type from the current view/route
        var pageType = 'other';
        var pageTitle = document.title;
        var pagePath = Backbone.history.getFragment();

        if (view.attributes && view.attributes['data-type']) {
          pageType = view.attributes['data-type'];
        }

        window.dataLayer.push({
          event: 'virtual_pageview',
          page_path: '/' + pagePath,
          page_title: pageTitle,
          page_type: pageType
        });
      });
    }
  };
});
```

**In GTM:** Create a trigger on the custom event `virtual_pageview` and use it for your GA4 `page_view` event tag. Set the page location and title from the dataLayer variables.

### Product View: Hooking into ItemDetails

```javascript
define('DataLayer.ItemDetails', [
  'ItemDetails.View',
  'underscore'
], function(ItemDetailsView, _) {
  'use strict';

  // Extend the ItemDetails.View to push dataLayer on render
  var originalInit = ItemDetailsView.prototype.initialize;

  ItemDetailsView.prototype.initialize = function() {
    originalInit.apply(this, arguments);

    this.on('afterViewRender', function() {
      var model = this.model;
      if (!model) return;

      var item = model.toJSON ? model.toJSON() : model;

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          currency: SC.ENVIRONMENT.currencyCode || 'USD',
          value: parseFloat(item.onlinecustomerprice_detail ?
            item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0,
          items: [{
            item_id: item.itemid || item.internalid,  // Use SKU or internal ID
            item_name: item.storedisplayname2 || item.displayname || item.itemid,
            item_category: item.primarycategory || '',
            item_brand: item.custitem_brand || '',     // Custom field
            price: parseFloat(item.onlinecustomerprice_detail ?
              item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0,
            quantity: 1
          }]
        }
      });
    });
  };

  return ItemDetailsView;
});
```

**Important:** The field names (`storedisplayname2`, `onlinecustomerprice_detail`, `custitem_brand`) vary by NetSuite configuration. Inspect the model object in the browser console to find the correct field names for your implementation.

### Add to Cart: Hooking into Cart Module

```javascript
define('DataLayer.AddToCart', [
  'Cart.AddToCart.View',
  'LiveOrder.Model'
], function(CartAddToCartView, LiveOrderModel) {
  'use strict';

  // Listen for successful add-to-cart
  var originalSubmit = CartAddToCartView.prototype.submitHandler ||
                       CartAddToCartView.prototype.addToCart;

  if (originalSubmit) {
    var wrappedSubmit = function() {
      var self = this;
      var result = originalSubmit.apply(this, arguments);

      // If result is a promise (AJAX add to cart)
      if (result && result.then) {
        result.then(function() {
          var item = self.model ? self.model.toJSON() : {};
          var quantity = parseInt(self.$('[name="quantity"]').val()) || 1;
          var price = parseFloat(item.onlinecustomerprice_detail ?
            item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0;

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              currency: SC.ENVIRONMENT.currencyCode || 'USD',
              value: price * quantity,
              items: [{
                item_id: item.itemid || item.internalid,
                item_name: item.storedisplayname2 || item.displayname || '',
                price: price,
                quantity: quantity
              }]
            }
          });
        });
      }

      return result;
    };

    if (CartAddToCartView.prototype.submitHandler) {
      CartAddToCartView.prototype.submitHandler = wrappedSubmit;
    } else {
      CartAddToCartView.prototype.addToCart = wrappedSubmit;
    }
  }

  return CartAddToCartView;
});
```

### Checkout: Hooking into Checkout Step Changes

SCA's checkout is a multi-step flow within the SPA. Each step renders a different Backbone view.

```javascript
define('DataLayer.Checkout', [
  'OrderWizard.Router',
  'LiveOrder.Model',
  'underscore'
], function(OrderWizardRouter, LiveOrderModel, _) {
  'use strict';

  return {
    mountToApp: function(application) {
      // Listen for checkout step changes
      var layout = application.getLayout();

      // Track begin_checkout when user enters checkout
      layout.on('afterAppendView', function(view) {
        var fragment = Backbone.history.getFragment();
        if (fragment.indexOf('checkout') === -1) return;

        var cart = LiveOrderModel.getInstance();
        var cartData = cart.toJSON ? cart.toJSON() : {};
        var lines = cartData.lines || [];

        if (lines.length === 0) return;

        var items = _.map(lines, function(line, index) {
          var itemDetail = line.item || {};
          return {
            item_id: itemDetail.itemid || itemDetail.internalid || '',
            item_name: itemDetail.storedisplayname2 || itemDetail.displayname || '',
            price: parseFloat(line.rate) || 0,
            quantity: parseInt(line.quantity) || 1,
            index: index
          };
        });

        var totalValue = parseFloat(cartData.summary ? cartData.summary.subtotal : 0) || 0;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: 'begin_checkout',
          ecommerce: {
            currency: SC.ENVIRONMENT.currencyCode || 'USD',
            value: totalValue,
            items: items
          }
        });
      });
    }
  };
});
```

### Purchase: Order Confirmation

The order confirmation page in SCA is rendered when the checkout wizard completes. Hook into the confirmation view:

```javascript
define('DataLayer.OrderConfirmation', [
  'OrderWizard.Module.Confirmation'
], function(ConfirmationModule) {
  'use strict';

  var originalRender = ConfirmationModule.prototype.render;

  ConfirmationModule.prototype.render = function() {
    var result = originalRender.apply(this, arguments);

    var confirmation = this.model ? this.model.toJSON() : {};
    var lines = confirmation.lines || [];
    var summary = confirmation.summary || {};

    if (!confirmation.tranid && !confirmation.internalid) return result;

    var items = lines.map(function(line, index) {
      var item = line.item || {};
      return {
        item_id: item.itemid || item.internalid || '',
        item_name: item.storedisplayname2 || item.displayname || '',
        price: parseFloat(line.rate) || 0,
        quantity: parseInt(line.quantity) || 1,
        index: index
      };
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: confirmation.tranid || confirmation.internalid,
        value: parseFloat(summary.total) || 0,
        tax: parseFloat(summary.taxtotal) || 0,
        shipping: parseFloat(summary.shippingcost) || 0,
        currency: SC.ENVIRONMENT.currencyCode || 'USD',
        coupon: confirmation.promocode || '',
        items: items
      }
    });

    return result;
  };

  return ConfirmationModule;
});
```

**Alternative: SuiteLet Approach**

If the SPA-based approach is unreliable, create a SuiteLet that renders the order confirmation as a standalone page:

1. Create a SuiteLet script that accepts an order ID parameter.
2. The SuiteLet loads the order record and renders a page with the purchase dataLayer.
3. Redirect the customer to this SuiteLet URL after checkout completion.
4. This gives you a traditional page load with a full GTM execution.

### Mapping NetSuite Internal IDs to Product Feed IDs

NetSuite uses internal IDs (numeric) for items. Product feeds for Google Merchant Center or Meta typically use SKU/item ID fields.

```
NetSuite Internal ID: 12345
Item ID (SKU): "WIDGET-001"
Feed ID: might be "WIDGET-001" or "netsuite_12345" depending on feed config
```

**Recommendation:**
- Use the `itemid` field (NetSuite's SKU equivalent) as `item_id` in the dataLayer.
- Ensure the product feed generator uses the same field.
- If the feed uses a transformed ID (e.g., prefixed), apply the same transformation in the dataLayer module.
- Create a mapping saved search in NetSuite if needed:
  - Columns: Internal ID, Item ID/Name, Display Name, custom fields
  - Use this to verify alignment between dataLayer and feed.

---

## 3. Server-Side Tracking

### Architecture: Client-Side GTM to Stape (Standard Approach)

```
Browser (SuiteCommerce SPA)
  |
  v
Client-side GTM container
  |  GA4 events sent to first-party subdomain
  v
Stape.io server container (sGTM)
  |
  +---> Meta Conversions API
  +---> TikTok Events API
  +---> Google Ads Enhanced Conversions
  +---> GA4 (server-side)
```

This is the same architecture as Shopify/WooCommerce. The SCA custom modules push events to the dataLayer, client-side GTM picks them up, sends to Stape.

**Setup steps:**
1. Configure Stape server container with a first-party subdomain (CNAME to Stape).
2. In client-side GTM, set the GA4 Configuration tag's `server_container_url` to the subdomain.
3. Map all custom events (`virtual_pageview`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`) to GA4 event tags.
4. In the server container, add Meta CAPI, TikTok Events API, and Google Ads tags.

### SuiteScript Approach: Server-Side Event Sends from NetSuite

For purchase events, you can bypass the browser entirely and send conversions from NetSuite's server:

#### User Event Script on Sales Order

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/record', 'N/runtime', 'N/log', 'N/crypto', 'N/encode'],
  function(https, record, runtime, log, crypto, encode) {

    function afterSubmit(context) {
      if (context.type !== context.UserEventType.CREATE) return;

      var salesOrder = context.newRecord;
      var orderId = salesOrder.getValue('tranid');
      var email = salesOrder.getValue('email');
      var total = parseFloat(salesOrder.getValue('total'));
      var currency = salesOrder.getValue('currencysymbol') || 'USD';

      // Get customer record for additional data
      var customerId = salesOrder.getValue('entity');
      var customer = record.load({ type: record.Type.CUSTOMER, id: customerId });
      var phone = customer.getValue('phone') || '';
      var firstName = customer.getValue('firstname') || '';
      var lastName = customer.getValue('lastname') || '';
      var city = customer.getValue('city') || '';
      var state = customer.getValue('state') || '';
      var zip = customer.getValue('zip') || '';
      var country = customer.getValue('country') || '';

      // Retrieve stored click IDs from custom transaction body fields
      var gclid = salesOrder.getValue('custbody_gclid') || '';
      var fbclid = salesOrder.getValue('custbody_fbclid') || '';
      var fbp = salesOrder.getValue('custbody_fbp') || '';
      var fbc = salesOrder.getValue('custbody_fbc') || '';

      // Collect line items
      var lineCount = salesOrder.getLineCount({ sublistId: 'item' });
      var items = [];
      for (var i = 0; i < lineCount; i++) {
        items.push({
          id: salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i }),
          quantity: parseInt(salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })),
          price: parseFloat(salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }))
        });
      }

      // --- Send to Meta CAPI ---
      sendMetaCAPI({
        orderId: orderId,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        city: city,
        state: state,
        zip: zip,
        country: country,
        total: total,
        currency: currency,
        items: items,
        fbp: fbp,
        fbc: fbc
      });

      // --- Send to TikTok Events API ---
      sendTikTokEvent({
        orderId: orderId,
        email: email,
        phone: phone,
        total: total,
        currency: currency,
        items: items
      });
    }

    function sha256Hash(value) {
      if (!value) return '';
      var hashObj = crypto.createHash({ algorithm: crypto.HashAlg.SHA256 });
      hashObj.update({ input: value.toLowerCase().trim() });
      return hashObj.digest({ outputEncoding: encode.Encoding.HEX });
    }

    function sendMetaCAPI(data) {
      var pixelId = runtime.getCurrentScript().getParameter('custscript_meta_pixel_id');
      var accessToken = runtime.getCurrentScript().getParameter('custscript_meta_access_token');

      var payload = {
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: 'purchase_' + data.orderId,
          action_source: 'website',
          user_data: {
            em: [sha256Hash(data.email)],
            ph: [sha256Hash(data.phone.replace(/[^0-9]/g, ''))],
            fn: [sha256Hash(data.firstName)],
            ln: [sha256Hash(data.lastName)],
            ct: [sha256Hash(data.city)],
            st: [sha256Hash(data.state)],
            zp: [sha256Hash(data.zip)],
            country: [sha256Hash(data.country)]
          },
          custom_data: {
            value: data.total,
            currency: data.currency,
            content_ids: data.items.map(function(i) { return i.id; }),
            content_type: 'product',
            num_items: data.items.length,
            order_id: data.orderId
          }
        }]
      };

      if (data.fbp) payload.data[0].user_data.fbp = data.fbp;
      if (data.fbc) payload.data[0].user_data.fbc = data.fbc;

      try {
        https.post({
          url: 'https://graph.facebook.com/v18.0/' + pixelId + '/events?access_token=' + accessToken,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        log.audit('Meta CAPI', 'Purchase event sent for order ' + data.orderId);
      } catch (e) {
        log.error('Meta CAPI Error', e.message);
      }
    }

    function sendTikTokEvent(data) {
      var pixelCode = runtime.getCurrentScript().getParameter('custscript_tiktok_pixel_code');
      var accessToken = runtime.getCurrentScript().getParameter('custscript_tiktok_access_token');

      var payload = {
        pixel_code: pixelCode,
        event: 'CompletePayment',
        event_id: 'purchase_' + data.orderId,
        timestamp: new Date().toISOString(),
        context: {
          user: {
            email: sha256Hash(data.email),
            phone_number: sha256Hash(data.phone.replace(/[^0-9]/g, ''))
          }
        },
        properties: {
          value: data.total,
          currency: data.currency,
          contents: data.items.map(function(i) {
            return { content_id: i.id, quantity: i.quantity, content_type: 'product', price: i.price };
          }),
          content_type: 'product'
        }
      };

      try {
        https.post({
          url: 'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': accessToken
          },
          body: JSON.stringify(payload)
        });
        log.audit('TikTok Events API', 'CompletePayment sent for order ' + data.orderId);
      } catch (e) {
        log.error('TikTok Events API Error', e.message);
      }
    }

    return {
      afterSubmit: afterSubmit
    };
  }
);
```

**Deployment:**
1. Upload the script to the SuiteScripts folder in the NetSuite File Cabinet.
2. Create a Script record (type: User Event) and deploy it on the Sales Order record.
3. Set execution context to include "Web Store" (and optionally "User Interface" for admin-created orders).
4. Add script parameters for pixel IDs and access tokens (never hardcode credentials).

### Webhook Alternatives via NetSuite Workflow Actions

NetSuite Workflows can trigger HTTP calls:

1. Create a Workflow on the Sales Order record.
2. Add a state transition triggered by order creation or status change.
3. Add a "Custom Action" that executes a SuiteScript to call external APIs.
4. Alternatively, use a Workflow Action Script:

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/https', 'N/runtime'], function(https, runtime) {
  function onAction(context) {
    var salesOrder = context.newRecord;
    // Send to Stape endpoint or CAPI directly
    // Similar logic as the User Event Script above
  }
  return { onAction: onAction };
});
```

### RESTlet Endpoints for Custom Integrations

RESTlets provide custom REST API endpoints in NetSuite:

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search'], function(record, search) {
  function post(requestBody) {
    // Receive order data from external systems
    // Process and send to tracking endpoints
    // Useful for headless commerce setups where the frontend
    // calls this RESTlet after purchase
    return { status: 'ok' };
  }
  return { post: post };
});
```

---

## 4. Meta CAPI on NetSuite

### No Native Integration

Unlike Shopify (which has a built-in Meta integration), NetSuite has **no native Meta CAPI integration**. All implementations must be custom.

### Approach A: Client-Side GTM to Stape to CAPI (Recommended)

This is the standard OFM approach:

1. SCA custom modules push ecommerce events to the dataLayer.
2. Client-side GTM fires GA4 event tags to the Stape server container.
3. Stape's Meta CAPI tag sends events to Meta's Conversions API.

**Advantages:**
- Consistent architecture across all client platforms.
- Browser-side data (fbp, fbc, user_agent, IP) is available.
- Easier to maintain than SuiteScript.

**Disadvantages:**
- Depends on browser JavaScript executing correctly.
- Ad blockers may block the client-side GTM (mitigated by Stape's first-party subdomain).

### Approach B: SuiteScript User Event on Sales Order

See the full code example in Section 3. This approach sends the purchase event directly from NetSuite's server.

**Advantages:**
- Does not depend on browser execution.
- Captures all orders (web, phone, admin-created).
- Reliable for the purchase event.

**Disadvantages:**
- No browser signals (fbp, fbc cookies, user_agent, IP from the customer's device).
- Lower Event Match Quality unless you store and forward click IDs.
- Cannot send upper-funnel events (PageView, ViewContent, AddToCart).

**Recommended hybrid:** Use Approach A for all events (PageView through Purchase) and Approach B as a fallback for purchase events only.

### Capturing Customer Data from NetSuite Order Records

NetSuite order records contain rich customer data for CAPI matching:

| NetSuite Field | Meta CAPI Parameter | Notes |
|---|---|---|
| `email` | `em` | SHA256 hashed, lowercased |
| `phone` (customer record) | `ph` | Digits only, SHA256 hashed |
| `firstname` (customer) | `fn` | SHA256 hashed, lowercased |
| `lastname` (customer) | `ln` | SHA256 hashed, lowercased |
| `city` (billing address) | `ct` | SHA256 hashed, lowercased |
| `state` (billing address) | `st` | SHA256 hashed, lowercased (2-letter code) |
| `zip` (billing address) | `zp` | SHA256 hashed |
| `country` (billing address) | `country` | SHA256 hashed (2-letter ISO) |
| Customer ID | `external_id` | SHA256 hashed |
| `custbody_fbp` (custom field) | `fbp` | Not hashed (cookie value) |
| `custbody_fbc` (custom field) | `fbc` | Not hashed (cookie value) |

---

## 5. Click ID Capture

### JavaScript Capture on SuiteCommerce Frontend

Add a module to capture click IDs from URL parameters and store them in cookies:

```javascript
define('DataLayer.ClickCapture', [
  'jQuery',
  'underscore',
  'Backbone',
  'js.cookie'  // Or implement cookie handling manually
], function($, _, Backbone) {
  'use strict';

  return {
    mountToApp: function(application) {
      function getParam(name) {
        var match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
        return match ? decodeURIComponent(match[1]) : null;
      }

      function setCookie(name, value, days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = name + '=' + encodeURIComponent(value) +
          ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
      }

      function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      }

      // Capture on initial page load
      var params = {
        gclid: getParam('gclid'),
        fbclid: getParam('fbclid'),
        ttclid: getParam('ttclid'),
        msclkid: getParam('msclkid')
      };

      Object.keys(params).forEach(function(key) {
        if (params[key]) {
          setCookie('_ofm_' + key, params[key], 90);
        }
      });

      // Construct fbc cookie if fbclid present
      if (params.fbclid) {
        var fbc = 'fb.1.' + Date.now() + '.' + params.fbclid;
        setCookie('_fbc', fbc, 90);
      }

      // Also capture on SPA route changes (in case of internal redirects with params)
      Backbone.history.on('route', function() {
        var newParams = {
          gclid: getParam('gclid'),
          fbclid: getParam('fbclid'),
          ttclid: getParam('ttclid')
        };
        Object.keys(newParams).forEach(function(key) {
          if (newParams[key]) setCookie('_ofm_' + key, newParams[key], 90);
        });
      });
    }
  };
});
```

### Storing Click IDs in NetSuite Order Records

#### Custom Transaction Body Fields

Create custom fields in NetSuite to store click IDs on Sales Orders:

1. Go to **Customization > Lists, Records, & Fields > Transaction Body Fields**.
2. Create fields:
   - `custbody_gclid` (Free-Form Text, applies to Sales Order)
   - `custbody_fbclid` (Free-Form Text)
   - `custbody_ttclid` (Free-Form Text)
   - `custbody_fbp` (Free-Form Text)
   - `custbody_fbc` (Free-Form Text)
   - `custbody_utm_source` (Free-Form Text)
   - `custbody_utm_medium` (Free-Form Text)
   - `custbody_utm_campaign` (Free-Form Text)
3. Set **Store Value** to true and **Display Type** to Normal (or Hidden if you don't want them visible in the UI).

#### Passing Cookie Values to Order Fields

In the SCA checkout module, before order submission, read cookies and set them as hidden fields:

```javascript
define('DataLayer.CheckoutClickIds', [
  'OrderWizard.Router',
  'LiveOrder.Model'
], function(OrderWizardRouter, LiveOrderModel) {
  'use strict';

  return {
    mountToApp: function(application) {
      function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      }

      // Before order submission, add click IDs to order custom fields
      var cart = LiveOrderModel.getInstance();

      cart.on('before:submit', function() {
        var clickIds = {
          custbody_gclid: getCookie('_ofm_gclid') || '',
          custbody_fbclid: getCookie('_ofm_fbclid') || '',
          custbody_ttclid: getCookie('_ofm_ttclid') || '',
          custbody_fbp: getCookie('_fbp') || '',
          custbody_fbc: getCookie('_fbc') || '',
          custbody_utm_source: getCookie('_ofm_utm_source') || '',
          custbody_utm_medium: getCookie('_ofm_utm_medium') || '',
          custbody_utm_campaign: getCookie('_ofm_utm_campaign') || ''
        };

        // Set custom fields on the order
        cart.set('options', _.extend(cart.get('options') || {}, clickIds));
      });
    }
  };
});
```

**Note:** The exact method to set custom body fields on the Sales Order from the SCA frontend depends on the SCA version. Some versions require modifying the `LiveOrder.Model` to include custom fields in the order submission payload. Consult the SCA developer documentation for your version.

### Saved Search for Offline Conversion Uploads

Create a NetSuite saved search to export order data with click IDs:

**Saved Search Configuration:**
- **Type:** Transaction
- **Criteria:**
  - Type is Sales Order
  - Date is within last 30 days
  - `custbody_gclid` is not empty (for Google) or `custbody_fbclid` is not empty (for Meta)
- **Columns:**
  - Transaction ID (`tranid`)
  - Date
  - Amount
  - Currency
  - Customer Email
  - `custbody_gclid`
  - `custbody_fbclid`
  - `custbody_fbc`

Export this as CSV and upload to:
- **Google Ads:** Offline Conversion Import (use gclid + conversion time + value).
- **Meta Ads:** Offline Events via Events Manager or API (use email + order value + event time).

---

## 6. Common NetSuite Tracking Issues

### SPA Behavior: Virtual Pageviews

**Problem:** Standard tracking pixels (Meta, TikTok) that rely on page loads only fire once. All subsequent navigation is a Backbone route change.

**Solution:** All pixel events must be explicitly triggered from the dataLayer. In GTM, never use the "All Pages" trigger for SCA. Use custom event triggers:
- `virtual_pageview` for page views
- `view_item`, `add_to_cart`, `begin_checkout`, `purchase` for ecommerce

**Verification:** Browse through 5-10 pages on the SCA frontend with GTM Preview mode active. Confirm that each navigation fires a `virtual_pageview` event in the dataLayer.

### Domain Structure Issues

Some NetSuite SuiteCommerce configurations use:
- Storefront: `www.clientdomain.com`
- Checkout: `checkout.clientdomain.com` or `system.netsuite.com`

If checkout is on a different domain:
1. Configure GA4 cross-domain tracking in GTM.
2. Ensure cookies (`_fbp`, `_fbc`, click IDs) are passed via URL parameters or stored server-side before the domain change.
3. Some older NetSuite configurations redirect to `https://checkout.netsuite.com` which is a third-party domain. In these cases, server-side tracking (SuiteScript) is the only reliable method for checkout/purchase events.

### Extension Deployment Cycles

**Problem:** Deploying SCA extensions is slow. The process involves:
1. Building the extension locally.
2. Uploading to NetSuite File Cabinet.
3. Activating the extension in the SCA backend.
4. Waiting for the deployment to propagate (can take 5-15 minutes).

**Impact on tracking:** Iterating on dataLayer changes is slow. Plan for longer testing cycles compared to Shopify/WooCommerce.

**Mitigation:**
- Develop and test in the SCA sandbox environment first.
- Use GTM Preview Mode with a local development server if possible.
- Batch dataLayer changes into fewer, larger deployments.

### Sandbox vs. Production Tracking Separation

**Problem:** NetSuite sandbox environments share the same GTM container if not configured separately, leading to test orders firing production conversion events.

**Solutions:**
1. Use separate GTM containers for sandbox and production.
2. Use a GTM environment (preview/staging) for the sandbox.
3. Add a dataLayer variable for environment (`production` vs. `sandbox`) and use it as a trigger condition on all conversion tags.

```javascript
// In the SCA extension entry point
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  environment: (window.location.hostname.indexOf('sandbox') > -1 ||
                window.location.hostname.indexOf('staging') > -1)
    ? 'sandbox' : 'production'
});
```

### NetSuite's Built-in Web Analytics

NetSuite includes basic web analytics (**Setup > Analytics > Web Site Analytics**). This provides:
- Page views, sessions, conversion rate
- Basic traffic sources

**This is NOT a replacement for GTM.** The built-in analytics:
- Cannot send data to Meta, TikTok, or Google Ads.
- Has no event-level tracking capability.
- Cannot be customized.
- Has limited real-time reporting.

Use it only as a sanity check for overall traffic trends.

### Rate Limiting on SuiteScript API Calls

**Problem:** NetSuite enforces governance limits on SuiteScript executions:
- User Event Scripts: 1,000 usage units per execution.
- Scheduled Scripts: 10,000 usage units per execution.
- `N/https` calls: 10 usage units per call.
- Concurrent SuiteScript executions: limited by account tier.

**Impact:** If the store processes many simultaneous orders, SuiteScript-based CAPI calls could hit rate limits.

**Mitigations:**
1. Use a **Scheduled Script** with a queue pattern: the User Event Script writes to a custom record (queue), and a Scheduled Script processes the queue in batches.
2. Use a **Map/Reduce Script** for high-volume processing.
3. Offload CAPI calls to an external service (e.g., Stape, Cloud Function) that the SuiteScript calls via a single HTTP request, passing the full payload. The external service then fans out to Meta, TikTok, etc.

```javascript
// Queue pattern: User Event writes to queue
function afterSubmit(context) {
  if (context.type !== context.UserEventType.CREATE) return;

  // Create a queue record instead of making CAPI calls directly
  var queueRecord = record.create({ type: 'customrecord_capi_queue' });
  queueRecord.setValue({ fieldId: 'custrecord_order_id', value: context.newRecord.id });
  queueRecord.setValue({ fieldId: 'custrecord_status', value: 'pending' });
  queueRecord.setValue({ fieldId: 'custrecord_created', value: new Date() });
  queueRecord.save();
  // Scheduled script picks this up and processes in batch
}
```

### Testing and Debugging

**GTM Preview Mode on SCA:**
- GTM Preview connects via a browser extension that monitors the dataLayer.
- Because SCA is a SPA, you will see the initial `gtm.js` event, then all subsequent events are custom pushes.
- Verify that each navigation and ecommerce action appears in the Preview panel.

**Browser Console Debugging:**
```javascript
// In browser console, monitor all dataLayer pushes
(function() {
  var originalPush = window.dataLayer.push;
  window.dataLayer.push = function() {
    console.log('[dataLayer push]', arguments[0]);
    return originalPush.apply(this, arguments);
  };
})();
```

**NetSuite Script Execution Log:**
- Go to **Customization > Scripting > Script Deployments** > find your script > **Execution Log**.
- Check for audit messages (successful sends) and error messages (failures).
- Monitor governance usage to ensure you are within limits.
