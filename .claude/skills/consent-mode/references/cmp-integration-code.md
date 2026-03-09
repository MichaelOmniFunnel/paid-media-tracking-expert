# CMP Integration Code Examples

## Consent Initialization Tag (GTM Custom HTML)

```html
<!-- ES5 compatible -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag("consent", "default", {
    "analytics_storage": "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied",
    "wait_for_update": 500
  });
</script>
```

## Consent Update Functions

```html
<script>
  // ES5 compatible. Called when user accepts cookies.
  function grantAllConsent() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("consent", "update", {
      "analytics_storage": "granted",
      "ad_storage": "granted",
      "ad_user_data": "granted",
      "ad_personalization": "granted"
    });
  }

  // Called when user declines
  function denyAllConsent() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("consent", "update", {
      "analytics_storage": "denied",
      "ad_storage": "denied",
      "ad_user_data": "denied",
      "ad_personalization": "denied"
    });
  }
</script>
```

## Regional Consent Defaults

```html
<script>
  // ES5 compatible
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Denied for EEA and UK
  gtag("consent", "default", {
    "analytics_storage": "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied",
    "region": ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
              "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
              "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB"],
    "wait_for_update": 500
  });

  // Granted for all other regions
  gtag("consent", "default", {
    "analytics_storage": "granted",
    "ad_storage": "granted",
    "ad_user_data": "granted",
    "ad_personalization": "granted"
  });
</script>
```

## OneTrust Integration

**Setup:**
1. Enable "Google Consent Mode" in OneTrust Cookie Compliance > Settings
2. Map categories: Performance/Analytics -> analytics_storage, Targeting -> ad_storage + ad_user_data + ad_personalization
3. OneTrust automatically calls gtag("consent", "update", ...) on user choice
4. Set Consent Initialization tag with denied defaults in GTM
5. OneTrust script must load before GTM, or use wait_for_update

**DataLayer events:** OneTrustGroupsUpdated, OptanonLoaded

## Cookiebot Integration

**Setup:**
1. Install Cookiebot CMP tag template from GTM Community Template Gallery
2. Configure with your Cookiebot ID
3. Set to fire on Consent Initialization
4. Template handles both default and update calls automatically

**DataLayer events:** cookie_consent_preferences, cookie_consent_statistics, cookie_consent_marketing

## Osano Integration

```html
<script>
  // ES5 compatible
  window.addEventListener("osano-cm-initialized", function() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    var consent = window.Osano.cm.getConsent();
    gtag("consent", "update", {
      "analytics_storage": consent.ANALYTICS === "ACCEPT" ? "granted" : "denied",
      "ad_storage": consent.MARKETING === "ACCEPT" ? "granted" : "denied",
      "ad_user_data": consent.MARKETING === "ACCEPT" ? "granted" : "denied",
      "ad_personalization": consent.MARKETING === "ACCEPT" ? "granted" : "denied"
    });
  });

  window.addEventListener("osano-cm-consent-changed", function(event) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    var consent = event.detail;
    gtag("consent", "update", {
      "analytics_storage": consent.ANALYTICS === "ACCEPT" ? "granted" : "denied",
      "ad_storage": consent.MARKETING === "ACCEPT" ? "granted" : "denied",
      "ad_user_data": consent.MARKETING === "ACCEPT" ? "granted" : "denied",
      "ad_personalization": consent.MARKETING === "ACCEPT" ? "granted" : "denied"
    });
  });
</script>
```

## TrustArc Integration

```html
<script>
  // ES5 compatible
  function checkTrustArcConsent() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    if (typeof window.truste === "undefined") return;

    var consentDecision = window.truste.eu.bindMap.prefCookie;
    var analyticsGranted = consentDecision.indexOf("2:") !== -1;
    var marketingGranted = consentDecision.indexOf("4:") !== -1;

    gtag("consent", "update", {
      "analytics_storage": analyticsGranted ? "granted" : "denied",
      "ad_storage": marketingGranted ? "granted" : "denied",
      "ad_user_data": marketingGranted ? "granted" : "denied",
      "ad_personalization": marketingGranted ? "granted" : "denied"
    });
  }

  window.addEventListener("message", function(event) {
    if (event.data === "submit_preferences") {
      checkTrustArcConsent();
    }
  });
</script>
```

## Custom Banner Implementation

```html
<script>
  // ES5 compatible. Full custom consent banner integration.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Step 1: Set defaults
  gtag("consent", "default", {
    "analytics_storage": "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied",
    "wait_for_update": 500
  });

  // Step 2: Check stored consent
  function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      if (parts[0] === name) return decodeURIComponent(parts.slice(1).join("="));
    }
    return null;
  }

  var savedConsent = getCookie("cookie_consent");
  if (savedConsent === "all") {
    gtag("consent", "update", {
      "analytics_storage": "granted", "ad_storage": "granted",
      "ad_user_data": "granted", "ad_personalization": "granted"
    });
  } else if (savedConsent === "analytics_only") {
    gtag("consent", "update", {
      "analytics_storage": "granted", "ad_storage": "denied",
      "ad_user_data": "denied", "ad_personalization": "denied"
    });
  }

  // Step 3: Banner button handlers
  function acceptAll() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=all; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";
    gtag("consent", "update", {
      "analytics_storage": "granted", "ad_storage": "granted",
      "ad_user_data": "granted", "ad_personalization": "granted"
    });
    hideBanner();
  }

  function acceptAnalyticsOnly() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=analytics_only; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";
    gtag("consent", "update", {
      "analytics_storage": "granted", "ad_storage": "denied",
      "ad_user_data": "denied", "ad_personalization": "denied"
    });
    hideBanner();
  }

  function rejectAll() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=none; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";
    hideBanner();
  }

  function hideBanner() {
    var banner = document.getElementById("cookie-banner");
    if (banner) banner.style.display = "none";
  }
</script>
```

## TCF 2.0 TC String Reading

```javascript
// ES5 compatible
if (typeof window.__tcfapi === "function") {
  window.__tcfapi("getTCData", 2, function(tcData, success) {
    if (success) {
      var googleConsent = tcData.vendor && tcData.vendor.consents && tcData.vendor.consents[755];
      var purposeConsent = tcData.purpose && tcData.purpose.consents;
      // Purpose 1: Store/access info (analytics_storage, ad_storage)
      // Purpose 3-4: Personalized advertising (ad_personalization)
      // Purpose 7: Measure ads (ad_storage)
      // Purpose 9-10: Research/improve (analytics_storage)
    }
  });
}
```

## Meta Pixel Consent Gating

```javascript
// ES5 compatible
function checkMetaConsent() {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i] && dl[i][0] === "consent" && dl[i][1] === "update") {
      return dl[i][2] && dl[i][2].ad_storage === "granted";
    }
  }
  return false;
}
```

In GTM, configure Meta Pixel tag with built-in consent requirements for ad_storage.

## TikTok Pixel Consent Sync

```javascript
// ES5 compatible
ttq.holdConsent();          // On page load, before pixel fires
ttq.grantConsent();         // When CMP reports marketing consent granted
ttq.revokeConsent();        // When CMP reports marketing consent denied
```

## Debug Consent State in Console

```javascript
var dl = window.dataLayer || [];
for (var i = 0; i < dl.length; i++) {
  if (dl[i] && dl[i][0] === "consent") {
    console.log("Consent entry:", dl[i]);
  }
}
```
