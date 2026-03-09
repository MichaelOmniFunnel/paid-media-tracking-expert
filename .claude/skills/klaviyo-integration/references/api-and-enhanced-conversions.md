# Klaviyo API & Enhanced Conversions Code

## Klaviyo API Integration

### Create Event (Server-Side Event Tracking)

```javascript
// POST https://a.klaviyo.com/api/events
// Server-side event creation using Klaviyo's revision 2024-02-15+ API

var https = require('https');

function sendKlaviyoEvent(apiKey, eventData) {
  var payload = JSON.stringify({
    data: {
      type: 'event',
      attributes: {
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: eventData.eventName
            }
          }
        },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: eventData.email,
              phone_number: eventData.phone,
              first_name: eventData.firstName,
              last_name: eventData.lastName,
              properties: {
                source: eventData.source || 'website'
              }
            }
          }
        },
        properties: eventData.properties || {},
        value: eventData.value || 0,
        time: eventData.time || new Date().toISOString(),
        unique_id: eventData.uniqueId || null
      }
    }
  });

  var options = {
    hostname: 'a.klaviyo.com',
    path: '/api/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Klaviyo-API-Key ' + apiKey,
      'revision': '2024-10-15',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      if (res.statusCode === 202) {
        console.log('Event created successfully');
      } else {
        console.error('Error: ' + res.statusCode + ' - ' + body);
      }
    });
  });

  req.on('error', function(err) {
    console.error('Request error: ' + err.message);
  });

  req.write(payload);
  req.end();
}

// Usage: Track a purchase event
sendKlaviyoEvent('pk_your_private_api_key', {
  eventName: 'Placed Order',
  email: 'customer@example.com',
  phone: '+15551234567',
  firstName: 'John',
  lastName: 'Doe',
  value: 149.99,
  properties: {
    OrderId: 'ORD-12345',
    Items: [
      { ProductName: 'Widget', SKU: 'WDG-001', Quantity: 2, Price: 49.99 },
      { ProductName: 'Gadget', SKU: 'GDG-002', Quantity: 1, Price: 50.01 }
    ],
    Source: 'google_ads',
    GCLID: 'abc123def456'
  }
});
```

### Client-Side Event Tracking

```javascript
// Client-side tracking using Klaviyo's JavaScript SDK
// This fires from the browser - subject to ad blockers and ITP

// Identify a user (call after login, form submit, or purchase)
var _learnq = window._learnq || [];
_learnq.push(['identify', {
  '$email': 'customer@example.com',
  '$first_name': 'John',
  '$last_name': 'Doe',
  '$phone_number': '+15551234567',
  'Source': 'paid_search',
  'GCLID': getUrlParam('gclid') || getCookie('_gcl_aw'),
  'FBCLID': getUrlParam('fbclid') || getCookie('_fbc')
}]);

// Track a custom event
_learnq.push(['track', 'Started Checkout', {
  '$value': 149.99,
  'ItemCount': 3,
  'CheckoutURL': window.location.href
}]);

// Helper: Extract URL parameter
function getUrlParam(param) {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || '';
}

// Helper: Read cookie value
function getCookie(name) {
  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
```

**Rate Limits (Server-Side API):**
- Burst: 350 requests/second
- Steady: 3,500 requests/minute
- Use batch endpoints for bulk operations

---

## Enhanced Conversions & Advanced Matching with Klaviyo Data

### Feeding Klaviyo Data to Google Enhanced Conversions

Klaviyo profile data can enrich Google's Enhanced Conversions by providing hashed PII on the conversion event:

```javascript
// In GTM or server-side GTM: enrich purchase dataLayer with Klaviyo profile data
// This improves Google's ability to match conversions to ad clicks

// dataLayer push on purchase confirmation page
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'purchase',
  'transaction_id': 'ORD-12345',
  'value': 149.99,
  'currency': 'USD',
  // Enhanced conversion data (from Klaviyo profile or checkout form)
  'user_data': {
    'email': 'customer@example.com',       // or SHA-256 hash
    'phone_number': '+15551234567',         // or SHA-256 hash
    'address': {
      'first_name': 'John',
      'last_name': 'Doe',
      'street': '123 Main St',
      'city': 'Austin',
      'region': 'TX',
      'postal_code': '78701',
      'country': 'US'
    }
  }
});
```

### Feeding Klaviyo Data to Meta Advanced Matching

```javascript
// Initialize Meta Pixel with Advanced Matching using Klaviyo profile data
// This dramatically improves Event Match Quality (target: 7+)

fbq('init', 'PIXEL_ID', {
  em: 'customer@example.com',     // email (auto-hashed by pixel)
  ph: '15551234567',              // phone (auto-hashed by pixel)
  fn: 'john',                     // first name (auto-hashed)
  ln: 'doe',                      // last name (auto-hashed)
  ct: 'austin',                   // city
  st: 'tx',                       // state
  zp: '78701',                    // zip
  country: 'us',                  // country
  external_id: 'klav_abc123'      // Klaviyo profile ID as external_id
});
```

---
