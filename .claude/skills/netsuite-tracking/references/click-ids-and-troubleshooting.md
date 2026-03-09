# Click ID Capture & Common Issues

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
