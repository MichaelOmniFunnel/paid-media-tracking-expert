# Click ID Capture & Persistence Code

## Click ID Capture and Persistence

Click IDs are the single most important signal for attributing conversions back to ad clicks. Every platform appends its own click ID to the landing page URL. If these are lost during navigation, form submissions, or redirects, server-side events cannot be attributed to the original click.

### Click ID Types

| Platform | Parameter | Cookie Name | Example Value |
|----------|-----------|-------------|---------------|
| Google Ads | gclid | _gcl_aw | EAIaIQobChMI... |
| Meta Ads | fbclid | _fbc | fb.1.1699999999.AbCdEf |
| TikTok Ads | ttclid | ttclid | E.C.P... |
| Microsoft Ads | msclkid | _uetmsclkid | abc123def |
| Google Ads (iOS) | gbraid | _gcl_gb | ... |
| Google Ads (web to app) | wbraid | _gcl_wb | ... |

### Capturing Click IDs on Landing

This script must run on every page, not just landing pages, because users may bookmark or share URLs with click IDs attached.

```javascript
// ES5 compatible. Place in GTM Custom HTML tag firing on All Pages.
(function() {
  var params = {};
  var search = window.location.search.substring(1);
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  var clickIds = ["gclid", "fbclid", "ttclid", "msclkid", "dclid", "wbraid", "gbraid"];
  var maxAge = 7776000; // 90 days in seconds

  for (var j = 0; j < clickIds.length; j++) {
    var key = clickIds[j];
    if (params[key]) {
      var expires = new Date();
      expires.setTime(expires.getTime() + (maxAge * 1000));
      document.cookie = key + "=" + encodeURIComponent(params[key]) +
        "; expires=" + expires.toUTCString() +
        "; path=/; SameSite=Lax; Secure";
    }
  }
})();
```

### Building the _fbc Cookie Value

Meta expects the _fbc cookie in a specific format. If the native Meta Pixel does not set it (which happens with ad blockers), you need to construct it yourself from the fbclid parameter.

```javascript
// ES5 compatible. Construct _fbc from fbclid.
(function() {
  var params = {};
  var search = window.location.search.substring(1);
  var pairs = search.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  if (params.fbclid) {
    var fbcValue = "fb.1." + Date.now() + "." + params.fbclid;
    var expires = new Date();
    expires.setTime(expires.getTime() + (7776000 * 1000));
    document.cookie = "_fbc=" + fbcValue +
      "; expires=" + expires.toUTCString() +
      "; path=/; SameSite=Lax; Secure";
  }
})();
```

### Generating the _fbp Cookie Value

The _fbp cookie is Meta's browser ID. If the Meta Pixel cannot set it (blocked by ad blocker), generate it server-side or client-side as a first-party cookie.

```javascript
// ES5 compatible. Generate _fbp if not already present.
(function() {
  var cookies = document.cookie.split("; ");
  var hasFbp = false;
  for (var i = 0; i < cookies.length; i++) {
    if (cookies[i].indexOf("_fbp=") === 0) {
      hasFbp = true;
      break;
    }
  }

  if (!hasFbp) {
    var randomPart = Math.floor(Math.random() * 2147483647);
    var fbpValue = "fb.1." + Date.now() + "." + randomPart;
    var expires = new Date();
    expires.setTime(expires.getTime() + (63072000 * 1000)); // 2 years
    document.cookie = "_fbp=" + fbpValue +
      "; expires=" + expires.toUTCString() +
      "; path=/; SameSite=Lax; Secure";
  }
})();
```

### Persisting Click IDs Through Form Submissions

When a user fills out a form, click IDs stored in cookies must be passed along with the form data so the backend can include them in server-side event calls.

```html
<input type="hidden" name="gclid" id="gclid_field">
<input type="hidden" name="fbclid" id="fbclid_field">
<input type="hidden" name="fbc" id="fbc_field">
<input type="hidden" name="fbp" id="fbp_field">
<input type="hidden" name="ttclid" id="ttclid_field">
<input type="hidden" name="msclkid" id="msclkid_field">
```

```javascript
// ES5 compatible. Populate hidden fields from cookies on form render.
(function() {
  function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      if (parts[0] === name) {
        return decodeURIComponent(parts.slice(1).join("="));
      }
    }
    return "";
  }

  var fields = [
    { cookie: "gclid", elementId: "gclid_field" },
    { cookie: "fbclid", elementId: "fbclid_field" },
    { cookie: "_fbc", elementId: "fbc_field" },
    { cookie: "_fbp", elementId: "fbp_field" },
    { cookie: "ttclid", elementId: "ttclid_field" },
    { cookie: "msclkid", elementId: "msclkid_field" }
  ];

  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i].elementId);
    if (el) {
      el.value = getCookie(fields[i].cookie);
    }
  }
})();
```

### Persisting Click IDs Through Redirects

When your site uses intermediate redirects (for example, a thank you page redirect, a CRM redirect, or a multi-step funnel), click IDs can be lost if they are only in the original URL query string. Two approaches to handle this:

**Approach A: Cookie-Based (Preferred)**
If the click ID capture script above runs on every page, cookies persist across redirects on the same domain automatically. No additional work needed.

**Approach B: URL Parameter Forwarding**
For cross-domain redirects where cookies do not carry over:

```javascript
// ES5 compatible. Append click ID parameters to redirect URLs.
(function() {
  function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      if (parts[0] === name) return decodeURIComponent(parts.slice(1).join("="));
    }
    return "";
  }

  function appendClickIds(url) {
    var ids = ["gclid", "fbclid", "ttclid", "msclkid"];
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    for (var i = 0; i < ids.length; i++) {
      var val = getCookie(ids[i]);
      if (val) {
        url = url + separator + ids[i] + "=" + encodeURIComponent(val);
        separator = "&";
      }
    }
    return url;
  }

  // Apply to all outbound links matching redirect domains
  var links = document.querySelectorAll("a[href]");
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute("href");
    if (href && href.indexOf("redirect-domain.com") !== -1) {
      links[i].setAttribute("href", appendClickIds(href));
    }
  }
})();
```

---
