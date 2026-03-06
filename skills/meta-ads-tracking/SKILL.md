---
name: Meta Ads Tracking
description: Implementation reference for Meta Pixel, Conversions API (CAPI), Advanced Matching, Aggregated Event Measurement, and domain verification
---

# Meta Ads Tracking Implementation

## Meta Pixel Base Code

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'PIXEL_ID');
fbq('track', 'PageView');
</script>
```

## Standard Events

```javascript
// Content viewing
fbq('track', 'ViewContent', {
  content_ids: ['SKU-001'],
  content_type: 'product',
  content_name: 'Product Name',
  value: 59.99,
  currency: 'USD'
});

// Add to cart
fbq('track', 'AddToCart', {
  content_ids: ['SKU-001'],
  content_type: 'product',
  value: 59.99,
  currency: 'USD'
});

// Initiate checkout
fbq('track', 'InitiateCheckout', {
  content_ids: ['SKU-001', 'SKU-002'],
  content_type: 'product',
  num_items: 2,
  value: 119.98,
  currency: 'USD'
});

// Purchase
fbq('track', 'Purchase', {
  content_ids: ['SKU-001', 'SKU-002'],
  content_type: 'product',
  value: 119.98,
  currency: 'USD',
  num_items: 2
});

// Lead generation
fbq('track', 'Lead', {
  content_name: 'Contact Form',
  value: 50.00,
  currency: 'USD'
});

// Registration
fbq('track', 'CompleteRegistration', {
  content_name: 'Account Signup',
  value: 10.00,
  currency: 'USD'
});
```

## Advanced Matching

Dramatically improves match rates (from ~40% to 70%+):

```javascript
fbq('init', 'PIXEL_ID', {
  em: 'user@example.com',           // Email (auto-hashed by pixel)
  ph: '11234567890',                 // Phone (digits only, with country code)
  fn: 'john',                        // First name (lowercase)
  ln: 'doe',                         // Last name (lowercase)
  ct: 'anytown',                     // City (lowercase, no spaces)
  st: 'ca',                          // State (2-letter code)
  zp: '12345',                       // Zip code
  country: 'us',                     // Country (2-letter code)
  external_id: 'USER-12345',         // Your internal user ID
  ge: 'm',                           // Gender (m or f)
  db: '19900101'                     // Date of birth (YYYYMMDD)
});
```

## Conversions API (CAPI)

Server-side event sending that bypasses browser limitations:

```json
POST https://graph.facebook.com/v18.0/PIXEL_ID/events
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1699999999,
    "event_id": "unique-event-id-123",
    "event_source_url": "https://example.com/thank-you",
    "action_source": "website",
    "user_data": {
      "em": ["SHA256_HASH_OF_EMAIL"],
      "ph": ["SHA256_HASH_OF_PHONE"],
      "fn": ["SHA256_HASH_OF_FIRST_NAME"],
      "ln": ["SHA256_HASH_OF_LAST_NAME"],
      "ct": ["SHA256_HASH_OF_CITY"],
      "st": ["SHA256_HASH_OF_STATE"],
      "zp": ["SHA256_HASH_OF_ZIP"],
      "country": ["SHA256_HASH_OF_COUNTRY"],
      "external_id": ["SHA256_HASH_OF_EXTERNAL_ID"],
      "client_ip_address": "1.2.3.4",
      "client_user_agent": "Mozilla/5.0...",
      "fbc": "fb.1.1699999999.AbCdEf",
      "fbp": "fb.1.1699999999.1234567890"
    },
    "custom_data": {
      "value": 119.98,
      "currency": "USD",
      "content_ids": ["SKU-001", "SKU-002"],
      "content_type": "product",
      "num_items": 2
    }
  }],
  "access_token": "YOUR_ACCESS_TOKEN"
}
```

### CAPI Deduplication
The `event_id` must match between browser pixel and CAPI:

```javascript
// Browser side
var eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
fbq('track', 'Purchase', { value: 119.98, currency: 'USD' }, { eventID: eventId });

// Server side - same event_id in CAPI payload
// "event_id": "evt_1699999999_abc123def"
```

## Aggregated Event Measurement (AEM)

Post-iOS 14.5 requirements:
- **Domain Verification**: Must verify domain in Business Manager
- **Event Priority**: Configure 8 prioritized events per domain
- **Event Ranking**: Higher priority events override lower ones per user session

Priority ranking recommendation:
1. Purchase (highest)
2. InitiateCheckout
3. AddToCart
4. Lead
5. CompleteRegistration
6. ViewContent
7. AddPaymentInfo
8. Search (lowest)

## Event Match Quality (EMQ) Score

Meta scores 1-10 based on customer data parameters sent:
- **Good (7-10)**: Email + phone + name + address data
- **Fair (4-6)**: Email or phone only
- **Poor (1-3)**: No customer data, IP/user agent only

Higher EMQ = better audience matching = lower CPAs = better ROAS

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No Advanced Matching | EMQ score drops 3-4 points, higher CPAs | Add AM parameters to init |
| No CAPI | Losing 15-30% of conversions to browser blocking | Implement CAPI |
| No event_id dedup | Double-counted conversions, broken optimization | Add matching event_id |
| Missing content_ids | Dynamic ads cannot match products | Pass product IDs matching catalog |
| No domain verification | AEM limited, events may not optimize | Verify domain in Business Manager |
| Static conversion values | Cannot optimize for value (ROAS bidding) | Pass dynamic values |
| Missing fbc/fbp in CAPI | Server events cannot be matched to click | Capture and pass cookie values |
