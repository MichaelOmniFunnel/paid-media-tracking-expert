# TikTok Pixel Code Examples

## Base Code

```html
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
  ttq.load("PIXEL_ID");
  ttq.page();
}(window, document, "ttq");
</script>
```

## Standard Events

```javascript
// View content
ttq.track("ViewContent", {
  content_id: "SKU-001", content_type: "product",
  content_name: "Product Name", value: 59.99, currency: "USD"
});

// Add to cart
ttq.track("AddToCart", {
  content_id: "SKU-001", content_type: "product",
  value: 59.99, currency: "USD", quantity: 1
});

// Place order / initiate checkout
ttq.track("PlaceAnOrder", {
  content_id: "SKU-001", content_type: "product",
  value: 119.98, currency: "USD", quantity: 2
});

// Complete payment (purchase)
ttq.track("CompletePayment", {
  content_id: "SKU-001", content_type: "product",
  value: 119.98, currency: "USD", quantity: 2
});

// Lead form submission
ttq.track("SubmitForm", {
  content_name: "Contact Form", value: 50.00, currency: "USD"
});

// Registration
ttq.track("CompleteRegistration", { content_name: "Account Signup" });

// Subscribe
ttq.track("Subscribe", { content_name: "Newsletter", value: 0, currency: "USD" });

// Download
ttq.track("Download", { content_name: "Whitepaper", content_id: "WP-001" });

// Search
ttq.track("Search", { query: "search term", content_type: "product" });

// Add to wishlist
ttq.track("AddToWishlist", {
  content_id: "SKU-001", content_type: "product",
  value: 59.99, currency: "USD"
});
```

## Advanced Matching Parameters

```javascript
ttq.identify({
  email: "user@example.com",
  phone_number: "+11234567890",
  external_id: "USER-12345",
  first_name: "John",
  last_name: "Doe",
  city: "Los Angeles",
  state: "CA",
  country: "US",
  zip_code: "90001"
});
```

Rules:
- Call identify() before any track() events in the same page session
- Pre-hashed values must use SHA-256 with lowercase hex encoding
- Phone numbers must include country code
- Email addresses must be lowercase and trimmed before hashing

## Advanced Matching on Form Submissions

```javascript
// ES5 compatible
(function() {
  var form = document.getElementById("lead-form");
  if (!form) return;

  form.addEventListener("submit", function() {
    var emailField = form.querySelector("input[type=email], input[name=email]");
    var phoneField = form.querySelector("input[type=tel], input[name=phone]");
    var fnField = form.querySelector("input[name=first_name], input[name=fname]");
    var lnField = form.querySelector("input[name=last_name], input[name=lname]");

    var identifyData = {};
    if (emailField && emailField.value) identifyData.email = emailField.value.toLowerCase().trim();
    if (phoneField && phoneField.value) identifyData.phone_number = phoneField.value.replace(/[^\+\d]/g, "");
    if (fnField && fnField.value) identifyData.first_name = fnField.value.trim();
    if (lnField && lnField.value) identifyData.last_name = lnField.value.trim();

    ttq.identify(identifyData);
    ttq.track("SubmitForm", {
      content_name: form.getAttribute("data-form-name") || "Lead Form",
      value: 50.00, currency: "USD"
    });
  });
})();
```

## Deduplication with event_id

```javascript
// ES5 compatible
var eventId = "tt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8);
ttq.track("CompletePayment", {
  value: 119.98, currency: "USD"
}, { event_id: eventId });
```

TikTok's deduplication window is 48 hours.

## ttclid Capture

```javascript
// ES5 compatible
(function() {
  var search = window.location.search.substring(1);
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair[0] === "ttclid" && pair[1]) {
      var expires = new Date();
      expires.setTime(expires.getTime() + (7776000 * 1000)); // 90 days
      document.cookie = "ttclid=" + decodeURIComponent(pair[1]) +
        "; expires=" + expires.toUTCString() +
        "; path=/; SameSite=Lax; Secure";
      break;
    }
  }
})();
```

## Consent Management

```javascript
ttq.holdConsent();    // Hold until user decision
ttq.grantConsent();   // Grant after user accepts
ttq.revokeConsent();  // Revoke if user declines
```

When holdConsent() is called before the pixel loads, no data is sent until grantConsent() is explicitly called.
