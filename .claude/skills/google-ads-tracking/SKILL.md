---
name: google-ads-tracking
description: Implementation reference for Google Ads conversion tracking, Google Tag, gtag.js, GTM, Enhanced Conversions, and Consent Mode v2. Use when someone mentions Google conversion tracking, gclid, enhanced conversions, Google Tag setup, or Google not tracking conversions.
model: sonnet
allowed-tools: Read, Grep, Glob
---

# Google Ads Tracking Implementation

## Google Tag (gtag.js) Structure

### Base Tag Installation
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXXX');
</script>
```

### Conversion Tracking
```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXX',
  'value': 100.00,
  'currency': 'USD',
  'transaction_id': 'ORDER-12345'
});
```

### Enhanced Conversions (Web)
```javascript
gtag('set', 'user_data', {
  'email': 'user@example.com',        // SHA-256 hashed or plaintext (auto-hashed)
  'phone_number': '+11234567890',
  'address': {
    'first_name': 'John',
    'last_name': 'Doe',
    'street': '123 Main St',
    'city': 'Anytown',
    'region': 'CA',
    'postal_code': '12345',
    'country': 'US'
  }
});
```

### Enhanced Conversions for Leads
Requires GCLID capture on form submission, stored in CRM, then uploaded via:
- Google Ads API offline conversion upload
- Google Ads UI manual upload
- Zapier/integration platform

GCLID capture implementation:
```javascript
// Capture GCLID from URL and store in hidden form field
function getGclid() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gclid');
}
// Store in cookie for cross-page persistence (90-day expiry)
document.cookie = `gclid=${getGclid()}; max-age=7776000; path=/`;
```

## Google Consent Mode v2

Required for EEA compliance and conversion modeling.

```javascript
// Default consent state (before user interaction)
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});

// Update after user consents
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
  'analytics_storage': 'granted'
});
```

**Critical v2 Parameters** (added March 2024):
- `ad_user_data` - Controls sending user data to Google for advertising
- `ad_personalization` - Controls personalized advertising
- Without these, conversion data may not be usable for optimization in EEA

## Google Tag Manager Implementation

### GTM Container Placement
```html
<!-- HEAD (as high as possible) -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>

<!-- BODY (immediately after opening tag) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

### Data Layer for E-commerce
```javascript
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'T12345',
    value: 59.99,
    currency: 'USD',
    items: [{
      item_id: 'SKU-001',
      item_name: 'Product Name',
      price: 59.99,
      quantity: 1
    }]
  }
});
```

## Dynamic Remarketing Parameters

Required for Performance Max and Shopping campaigns:
```javascript
gtag('event', 'view_item', {
  'send_to': 'AW-XXXXXXXXXX',
  'ecomm_prodid': 'SKU-001',          // Must match Merchant Center feed
  'ecomm_pagetype': 'product',         // home, category, product, cart, purchase
  'ecomm_totalvalue': 59.99,
  'items': [{ 'id': 'SKU-001', 'google_business_vertical': 'retail' }]
});
```

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| GTM in body only | Delayed pixel load, missed pageviews | Move to head |
| No enhanced conversions | 5-15% conversion loss | Add user data parameters |
| Missing consent mode v2 | Data loss in EEA, no conversion modeling | Implement consent mode |
| Hardcoded conversion values | Platform cannot optimize for value | Pass dynamic values |
| No GCLID capture | Cannot import offline conversions | Add GCLID persistence |
| Duplicate GTM containers | Event duplication, inflated metrics | Remove duplicate |
| Missing transaction_id | Cannot deduplicate conversions | Add unique transaction ID |
