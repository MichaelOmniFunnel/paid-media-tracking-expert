# Flow Triggers, Ecommerce Integrations & Server-Side

## Klaviyo Flow Triggers from Ad Conversion Events

### Triggering Flows from Ad-Driven Actions

Klaviyo flows can be triggered by events that originate from ad clicks:

```javascript
// Example: Server-side event that triggers a Klaviyo flow
// When a lead comes from Google Ads, send them into a nurture sequence

// POST to Klaviyo API when form is submitted with GCLID present
sendKlaviyoEvent('pk_your_private_api_key', {
  eventName: 'Ad Lead Captured',
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
  value: 0,
  properties: {
    'Source': 'google_ads',
    'Campaign': utmData.campaign,
    'AdGroup': utmData.adGroup,
    'Keyword': utmData.keyword,
    'GCLID': utmData.gclid,
    'LandingPage': utmData.landingPage,
    'FormName': formData.formName
  }
});

// In Klaviyo, create a flow triggered by "Ad Lead Captured" metric
// Flow can branch based on Source property:
//   - Google Ads leads -> send specific nurture sequence
//   - Meta Ads leads -> send different creative sequence
//   - TikTok leads -> send mobile-optimized sequence
```

### Webhook Actions in Flows

Klaviyo flows can include webhook actions that POST data to external endpoints:

```javascript
// Klaviyo Flow Webhook Configuration
// Action: Webhook in a flow step
// URL: https://sgtm.yourdomain.com/klaviyo-webhook
// Method: POST
// Headers: Content-Type: application/json

// The webhook sends profile and event data to your server-side GTM
// This enables feeding Klaviyo engagement data BACK to ad platforms

// Example: When a Klaviyo email drives a purchase, notify SGTM
// so it can fire enhanced conversion events to Google/Meta

// Webhook payload template (configured in Klaviyo):
// {
//   "email": "{{ person.email }}",
//   "phone": "{{ person.phone_number }}",
//   "first_name": "{{ person.first_name }}",
//   "last_name": "{{ person.last_name }}",
//   "event_name": "{{ event.name }}",
//   "order_value": "{{ event.value }}",
//   "order_id": "{{ event.OrderId }}",
//   "klaviyo_profile_id": "{{ person.id }}"
// }
```

**Webhook Limitations:**
- Maximum 10 webhooks per Klaviyo account (system webhooks)
- Flow webhooks do not count against this limit
- Webhooks may take up to 3 minutes to begin forwarding after creation
- HMAC-SHA256 signing available for payload verification

---

## Ecommerce Platform Integrations

### Shopify + Klaviyo

**Native Integration Features:**
- Real-time event sync for: Active on Site, Viewed Product, Added to Cart, Started Checkout, Placed Order, Ordered Product, Fulfilled Order, Cancelled Order, Refunded Order
- Automatic catalog sync for product recommendations
- Back-in-stock flow triggers
- Customer property sync (total spent, order count, tags)

**Key Events for Paid Media:**

| Klaviyo Event | Trigger | Value Field | Use in Paid Media |
|---------------|---------|-------------|-------------------|
| Placed Order | Checkout complete | Order total | Revenue attribution |
| Started Checkout | Checkout initiated | Cart value | Retargeting audiences |
| Added to Cart | Cart action | Item price | Retargeting audiences |
| Viewed Product | Product page view | Product price | Prospecting signals |

**Placed Order Event Properties (Shopify):**
```javascript
// Shopify Placed Order event properties available in Klaviyo:
// $value - order total (used for revenue metrics)
// OrderId - Shopify order ID
// Categories - product categories
// ItemNames - array of product names
// Items - array of line item objects with:
//   ProductName, SKU, Quantity, ItemPrice, RowTotal, ProductURL, ImageURL
// Tags - Shopify order tags
// DiscountCodes - applied discount codes
// DiscountValue - total discount amount
// SourceName - "web", "pos", "shopify_draft_order", etc.
```

### WooCommerce + Klaviyo

**Integration Notes:**
- Placed Order fires when WooCommerce order status = "processing"
- Custom order statuses may not trigger Placed Order (common issue)
- Real-time sync for orders, checkout, and product views
- Requires Klaviyo WooCommerce plugin installed and activated

**Common WooCommerce Issues:**
- Payment gateway order status mapping (some gateways use "on-hold" instead of "processing")
- Caching plugins (WP Rocket, W3 Total Cache) can interfere with Klaviyo's JavaScript tracking
- If using server-side tracking via Stape, ensure events are not double-fired from both plugin and SGTM

### Custom Ecommerce (Headless / Custom Platforms)

For non-Shopify/WooCommerce stores, use the Klaviyo API directly:

```javascript
// Server-side integration for custom ecommerce
// Call this from your order processing backend

function trackPurchaseToKlaviyo(orderData) {
  var items = [];
  for (var i = 0; i < orderData.lineItems.length; i++) {
    var item = orderData.lineItems[i];
    items.push({
      ProductName: item.name,
      SKU: item.sku,
      Quantity: item.quantity,
      ItemPrice: item.price,
      RowTotal: item.price * item.quantity,
      ProductURL: item.url,
      ImageURL: item.imageUrl,
      Categories: item.categories
    });
  }

  sendKlaviyoEvent('pk_your_private_api_key', {
    eventName: 'Placed Order',
    email: orderData.customerEmail,
    phone: orderData.customerPhone,
    firstName: orderData.firstName,
    lastName: orderData.lastName,
    value: orderData.orderTotal,
    uniqueId: orderData.orderId,
    properties: {
      OrderId: orderData.orderId,
      Categories: orderData.categories,
      ItemNames: orderData.itemNames,
      Items: items,
      DiscountCodes: orderData.discountCodes || [],
      DiscountValue: orderData.discountTotal || 0,
      Source: orderData.trafficSource || 'direct'
    }
  });
}
```

---

## Server-Side Event Forwarding via Stape + GTM SS

### Architecture: Klaviyo Tag in Server-Side GTM

```
Browser -> GTM Web Container -> GTM Server Container (Stape) -> Klaviyo API
                                     |-> Google Ads API
                                     |-> Meta CAPI
                                     |-> TikTok Events API
```

### Stape Klaviyo Tag Setup

1. In your server GTM container, add the **Klaviyo tag** from the Template Gallery
2. Configure the tag:
   - **Klaviyo Public API Key**: Your site's public key (starts with site_)
   - **Action Type**: "Event" (for tracking), "Active on Site" (for page views), "Add to List", or "Create/Update Profile"
   - **Contact Email**: Map from event data variable
   - **Event Name**: Map to the event name (e.g., "Placed Order")
   - **Event Properties**: Map individual properties or pass entire event object

3. **Trigger**: Fire on the appropriate server-side event (e.g., purchase event from GA4 client)

### Server-Side Tracking Benefits for Klaviyo

- **Bypass ad blockers**: Klaviyo's client-side JS is blocked by many ad blockers
- **First-party cookies**: Store Klaviyo's exchange_id in a first-party cookie set by your server
- **Data enrichment**: Add server-side data (CRM fields, lead scores) before sending to Klaviyo
- **Single event source**: One browser event fans out to Klaviyo + Google + Meta + TikTok

### Email Cookie Persistence

```javascript
// Server-side GTM: Store email in first-party cookie for Klaviyo
// When a user identifies themselves (form, login, purchase),
// store their email in a server-set cookie for future page views

// In server-side GTM, use the Klaviyo tag's built-in option:
// "Store email in cookies" = enabled
// This allows the tag to use the stored email on subsequent
// page views even when the user is not actively identified

// Cookie name: _klav_email (set by server GTM)
// Duration: 365 days (configurable)
// Domain: your first-party domain
```

---
