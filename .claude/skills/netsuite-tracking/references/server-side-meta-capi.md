# Server-Side Tracking & Meta CAPI on NetSuite

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
