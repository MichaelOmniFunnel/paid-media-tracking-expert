# Event Deduplication, Async Patterns & Timeout Logic

## Event Deduplication

When running client-side pixel and server-side API in parallel (which is the OFM standard), every event will be received twice by the platform unless deduplication is in place. Deduplication relies on a matching event_id sent from both the browser and the server for the same user action.

### How Deduplication Works

1. Browser fires a pixel event with an event_id
2. Server fires a CAPI/Events API event with the same event_id
3. Platform receives both, sees matching event_id, and counts it only once
4. If the browser event is blocked (ad blocker), only the server event arrives and it is counted
5. If the server event fails, the browser event is still counted

This redundancy is the entire point of running both in parallel.

### Generating event_id Values

The event_id must be unique per user action, deterministic enough to match between client and server, and generated before the event fires on either side.

```javascript
// ES5 compatible. Generate a unique event ID for deduplication.
function generateEventId(prefix) {
  var timestamp = Date.now().toString(36);
  var random = "";
  for (var i = 0; i < 8; i++) {
    random += Math.floor(Math.random() * 36).toString(36);
  }
  return (prefix || "evt") + "_" + timestamp + "_" + random;
}

// Usage per platform:
// Meta: generateEventId("meta")
// TikTok: generateEventId("tt")
// Google: generateEventId("goog")
```

### Sharing event_id Between Client and Server

**Method 1: DataLayer Push (GTM Standard)**

The client-side tag generates the event_id, pushes it to the dataLayer, and GTM sends it both to the browser pixel and to the server-side container via the GA4 transport.

```javascript
// ES5 compatible. Push purchase event with shared event_id.
var purchaseEventId = generateEventId("purchase");

window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "purchase",
  event_id: purchaseEventId,
  ecommerce: {
    transaction_id: "TXN-12345",
    value: 119.98,
    currency: "USD",
    items: [
      {
        item_id: "SKU-001",
        item_name: "Product Name",
        price: 59.99,
        quantity: 2
      }
    ]
  }
});
```

In the GTM server-side container, the event_id is extracted from the incoming event data and mapped to each outgoing tag (Meta CAPI tag, TikTok Events API tag, Google Enhanced Conversions tag).

**Method 2: Hidden Field on Confirmation Page**

For non-SPA sites where the purchase confirmation page is a new page load, embed the event_id in the page HTML so both the client-side tag and the server can read it.

```html
<!-- Server-rendered on the confirmation page -->
<script>
  var eventId = "purchase_{{ server_generated_uuid }}";
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "purchase",
    event_id: eventId,
    transaction_id: "{{ transaction_id }}",
    value: {{ order_total }},
    currency: "USD"
  });
</script>
```

The backend uses the same UUID when sending the server-side CAPI event.

**Method 3: Transaction ID as event_id**

For purchase events specifically, using the transaction ID (order number) as the event_id is a clean approach since it is naturally unique and available on both client and server.

```javascript
// The transaction ID itself becomes the event_id
var eventId = "order_" + transactionId;

// Client side
fbq("track", "Purchase", { value: 119.98, currency: "USD" }, { eventID: eventId });

// Server side uses the same value in the CAPI payload
```

### Platform-Specific event_id Behavior

| Platform | Client-Side Parameter | Server-Side Parameter | Dedup Window |
|----------|----------------------|----------------------|--------------|
| Meta | eventID (in options object) | event_id (in payload) | 48 hours |
| TikTok | event_id (in options object) | event_id (in payload) | 48 hours |
| Google | transaction_id | transaction_id | 24 hours |

---

## Async vs Sequential Event Firing

### When to Fire Sequentially

Events that depend on each other must fire in order:

- AddToCart must fire before InitiateCheckout (for funnel integrity)
- InitiateCheckout must fire before Purchase
- Identify/Advanced Matching must fire before the conversion event

In practice, these naturally happen on different pages or user actions, so sequencing is automatic.

### When Async Is Acceptable

On a single page where multiple platform events fire for the same action (for example, a purchase confirmation page fires Meta, TikTok, and Google events), these can and should fire asynchronously since they are independent of each other.

```javascript
// ES5 compatible. Fire multiple platform events in parallel.
var eventId = generateEventId("purchase");
var orderData = {
  value: 119.98,
  currency: "USD",
  transaction_id: "TXN-12345"
};

// These fire independently and do not block each other
fbq("track", "Purchase", {
  value: orderData.value,
  currency: orderData.currency,
  content_type: "product"
}, { eventID: eventId });

ttq.track("CompletePayment", {
  value: orderData.value,
  currency: orderData.currency
}, { event_id: eventId });

// GA4 goes through the dataLayer
window.dataLayer.push({
  event: "purchase",
  event_id: eventId,
  ecommerce: {
    transaction_id: orderData.transaction_id,
    value: orderData.value,
    currency: orderData.currency
  }
});
```

### GTM Server-Side Async Behavior

In the server-side container, tags fire asynchronously by default. When the GA4 client receives an event, all server-side tags that are triggered by that event fire in parallel. There is no guaranteed order. This is normally fine because each tag sends to a different platform.

If you need one server-side tag to fire before another (rare), use tag sequencing in the server-side container.

---

## Timeout and Retry Logic for Server-Side Calls

### Default Behavior in GTM SS

GTM server-side tags use HTTP requests to send events to platform APIs. By default:

- There is no built-in retry logic in GTM SS tags
- If a request fails (timeout, 5xx, network error), the event is lost
- Most Stape-managed tags have a 5 to 10 second timeout

### Implementing Retry Logic

For critical events like purchases, use a Custom Tag template in GTM SS with retry logic:

```javascript
// GTM Server-Side Custom Tag Template (sandboxed JavaScript)
// Note: GTM SS uses its own sandboxed JS, not browser JS

const sendHttpRequest = require("sendHttpRequest");
const getEventData = require("getEventData");
const logToConsole = require("logToConsole");

const url = "https://graph.facebook.com/v18.0/" + pixelId + "/events";
const maxRetries = 2;
var attempt = 0;

function sendEvent() {
  attempt++;
  sendHttpRequest(url, {
    method: "POST",
    timeout: 5000,
    headers: { "Content-Type": "application/json" }
  }, JSON.stringify(payload))
  .then(function(response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      data.gtmOnSuccess();
    } else if (attempt <= maxRetries) {
      logToConsole("Retry attempt " + attempt + " for event: " + eventName);
      sendEvent();
    } else {
      logToConsole("Failed after " + maxRetries + " retries: " + response.statusCode);
      data.gtmOnFailure();
    }
  })
  .catch(function(error) {
    if (attempt <= maxRetries) {
      sendEvent();
    } else {
      data.gtmOnFailure();
    }
  });
}

sendEvent();
```

### Timeout Recommendations by Event Type

| Event Type | Timeout | Retries | Rationale |
|------------|---------|---------|-----------|
| Purchase | 10 seconds | 2 | High value, must not be lost |
| Lead/SubmitForm | 8 seconds | 1 | Important but less critical |
| AddToCart | 5 seconds | 0 | High volume, acceptable loss |
| ViewContent | 3 seconds | 0 | Informational, loss is fine |
| PageView | 3 seconds | 0 | Highest volume, no retries |

---
