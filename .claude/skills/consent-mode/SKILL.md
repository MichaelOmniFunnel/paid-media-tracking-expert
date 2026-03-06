---
name: consent-mode
description: Google Consent Mode v2 implementation, cookie banner integrations, GTM consent configuration, TCF 2.0, regional requirements, and conversion modeling impact. Use when someone mentions consent mode, cookie banners, GDPR tracking, privacy compliance in ads, consent signals, or how consent affects conversions.
model: sonnet
---

# Google Consent Mode v2 Implementation

## What Consent Mode Does

Google Consent Mode is a framework that adjusts how Google tags (Analytics, Ads, Floodlight) behave based on the user's consent status. When a user has not consented, tags still load but send cookieless pings instead of full tracking data. Google then uses behavioral modeling to fill gaps in conversion and audience data.

As of March 2024, Consent Mode v2 is required for sending data to Google services for users in the European Economic Area (EEA). Without it, Google Ads cannot build audiences or report conversions for EEA users.

## Consent Mode v2 vs v1

Consent Mode v2 adds two new consent types beyond the original two:

| Consent Type | v1 | v2 | What It Controls |
|-------------|----|----|-----------------|
| analytics_storage | Yes | Yes | GA4 cookies (_ga, _gid) |
| ad_storage | Yes | Yes | Ads cookies (_gcl_*, _gac_*) |
| ad_user_data | No | Yes | Sending user data to Google for advertising |
| ad_personalization | No | Yes | Using data for remarketing and personalization |

All four must be set for full Consent Mode v2 compliance.

## Basic vs Advanced Mode

### Basic Mode

Tags do not fire at all until consent is granted. No data is sent to Google, no modeling occurs.

- Simplest to implement
- No cookieless pings
- No conversion modeling for unconsented users
- Results in significant data gaps for EU traffic

### Advanced Mode (Recommended)

Tags fire immediately but in a restricted state. Cookieless pings are sent to Google, which enable behavioral modeling.

- Tags load on every page regardless of consent
- Before consent: tags send cookieless, anonymized pings
- After consent granted: tags switch to full tracking mode
- Google models conversions and audiences from cookieless data
- Recovers an estimated 70% of otherwise lost conversion data through modeling

**OFM always recommends Advanced Mode** because the modeling recovery is critical for campaign optimization. The data gap from Basic Mode makes it nearly impossible to optimize campaigns for EU audiences.

---

## GTM Consent Configuration

### Built-in Consent Types in GTM

GTM has built-in support for consent-aware tag firing. Each tag can be configured with consent requirements.

**Tag-level consent settings (in GTM > Tag > Advanced Settings > Consent Settings):**

- "Not set": tag fires regardless of consent (default for legacy tags)
- "No additional consent required": tag fires with no consent checks
- Specific consent types required: tag only fires when those consent types are granted

### Consent Initialization Tag

The consent defaults must be set before any other tags fire. Use a Consent Initialization trigger (fires before All Pages).

```html
<!-- GTM Custom HTML Tag on Consent Initialization trigger -->
<!-- ES5 compatible -->
<script>
  // Set default consent state (denied for EU, granted for others)
  // This MUST fire before any Google tags
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

The `wait_for_update` parameter tells Google tags to wait up to 500ms for the consent management platform (CMP) to load and update consent. This prevents tags from firing with denied consent when the CMP just has not loaded yet.

### Updating Consent After User Decision

When the user interacts with the cookie banner, the CMP should push a consent update:

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

  // Called when user declines (or accepts only necessary cookies)
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

### Regional Consent Defaults

Set different defaults based on the user's region to avoid unnecessarily restricting tracking for non-EU users:

```html
<script>
  // ES5 compatible. Regional consent defaults.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Default: denied for EEA and UK
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

  // Default: granted for all other regions
  gtag("consent", "default", {
    "analytics_storage": "granted",
    "ad_storage": "granted",
    "ad_user_data": "granted",
    "ad_personalization": "granted"
  });
</script>
```

---

## Cookie Banner Tool Integrations

### OneTrust

OneTrust is the most common enterprise CMP. It supports Consent Mode v2 natively.

**Setup:**
1. In OneTrust, enable "Google Consent Mode" in Cookie Compliance > Settings
2. Map OneTrust cookie categories to Google consent types:
   - Strictly Necessary: no consent type mapping needed
   - Performance/Analytics: analytics_storage
   - Functional: functionality_storage
   - Targeting/Advertising: ad_storage, ad_user_data, ad_personalization
3. OneTrust automatically calls `gtag("consent", "update", ...)` when the user makes a choice
4. In GTM, set the Consent Initialization tag with defaults as shown above
5. OneTrust's script must load before GTM, or use `wait_for_update` to allow time

**OneTrust dataLayer events to listen for:**
- `OneTrustGroupsUpdated`: fires when consent categories change
- `OptanonLoaded`: fires when OneTrust has loaded

### Cookiebot

Cookiebot has built-in Consent Mode v2 support through their GTM template.

**Setup:**
1. Install the Cookiebot CMP tag template from GTM's Community Template Gallery
2. Configure the Cookiebot tag with your Cookiebot ID
3. Set the tag to fire on Consent Initialization
4. The Cookiebot template handles both `gtag("consent", "default", ...)` and `gtag("consent", "update", ...)` automatically
5. No custom code needed if using the official template

**Cookiebot dataLayer events:**
- `cookie_consent_preferences`: user chose preferences
- `cookie_consent_statistics`: user granted statistics cookies
- `cookie_consent_marketing`: user granted marketing cookies

### Osano

Osano supports Consent Mode v2 and can be integrated via GTM.

**Setup:**
1. Add the Osano script to the site (loads before GTM or via GTM with Consent Initialization)
2. Use Osano's consent callback to update Google consent:

```html
<script>
  // ES5 compatible. Osano consent callback.
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

### TrustArc

TrustArc (formerly TrustE) supports Consent Mode via their preference manager.

**Setup:**
1. Configure TrustArc consent categories to map to Google consent types
2. Use TrustArc's API to detect consent changes:

```html
<script>
  // ES5 compatible. TrustArc consent mapping.
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

  // Listen for consent changes
  window.addEventListener("message", function(event) {
    if (event.data === "submit_preferences") {
      checkTrustArcConsent();
    }
  });
</script>
```

### Custom Banner Implementation

For clients with a custom-built cookie banner (no third-party CMP):

```html
<script>
  // ES5 compatible. Custom consent banner integration.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Step 1: Set defaults (denied)
  gtag("consent", "default", {
    "analytics_storage": "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied",
    "wait_for_update": 500
  });

  // Step 2: Check if user has already made a choice (stored in cookie)
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
      "analytics_storage": "granted",
      "ad_storage": "granted",
      "ad_user_data": "granted",
      "ad_personalization": "granted"
    });
  } else if (savedConsent === "analytics_only") {
    gtag("consent", "update", {
      "analytics_storage": "granted",
      "ad_storage": "denied",
      "ad_user_data": "denied",
      "ad_personalization": "denied"
    });
  }
  // If no saved consent, defaults remain (denied)

  // Step 3: Banner button handlers
  function acceptAll() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=all; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";

    gtag("consent", "update", {
      "analytics_storage": "granted",
      "ad_storage": "granted",
      "ad_user_data": "granted",
      "ad_personalization": "granted"
    });

    hideBanner();
  }

  function acceptAnalyticsOnly() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=analytics_only; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";

    gtag("consent", "update", {
      "analytics_storage": "granted",
      "ad_storage": "denied",
      "ad_user_data": "denied",
      "ad_personalization": "denied"
    });

    hideBanner();
  }

  function rejectAll() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "cookie_consent=none; expires=" + expires.toUTCString() + "; path=/; SameSite=Lax";

    // Consent stays denied (defaults)
    hideBanner();
  }

  function hideBanner() {
    var banner = document.getElementById("cookie-banner");
    if (banner) banner.style.display = "none";
  }
</script>
```

---

## TCF 2.0 (Transparency and Consent Framework)

### What TCF 2.0 Is

TCF 2.0 is the IAB Europe standard for communicating consent signals between CMPs, advertisers, and ad tech vendors. Google participates as a TCF vendor (vendor ID 755).

### How TCF 2.0 Relates to Consent Mode

- CMPs that support TCF 2.0 generate a TC string (consent string) encoding the user's choices
- Google tags can read the TC string directly if the CMP implements the TCF API
- When both TCF 2.0 and Consent Mode are present, Google uses the more restrictive of the two signals
- OFM recommendation: use Consent Mode v2 as the primary mechanism, with TCF 2.0 support for programmatic ad partners that require it

### Reading the TC String

The TC string is stored in a cookie (usually `euconsent-v2`) and is accessible via the CMP API:

```javascript
// ES5 compatible. Check TCF consent status.
if (typeof window.__tcfapi === "function") {
  window.__tcfapi("getTCData", 2, function(tcData, success) {
    if (success) {
      // Google is vendor 755
      var googleConsent = tcData.vendor && tcData.vendor.consents && tcData.vendor.consents[755];
      var purposeConsent = tcData.purpose && tcData.purpose.consents;

      // Purpose 1: Store and access information (analytics_storage, ad_storage)
      // Purpose 3: Create profiles for personalised advertising (ad_personalization)
      // Purpose 4: Use profiles for personalised advertising (ad_personalization)
      // Purpose 7: Measure advertising performance (ad_storage)
      // Purpose 9: Apply market research (analytics_storage)
      // Purpose 10: Develop and improve products (analytics_storage)

      console.log("Google vendor consent:", googleConsent);
      console.log("Purpose consents:", purposeConsent);
    }
  });
}
```

---

## Regional Requirements

### EU / EEA (GDPR)

- Consent must be obtained BEFORE any tracking fires (opt-in model)
- All four Consent Mode v2 types must default to denied
- The cookie banner must offer a genuine choice (not just "Accept")
- Pre-checked boxes are not valid consent
- Users must be able to withdraw consent as easily as they granted it
- Consent records must be stored for audit purposes
- Cookie wall (blocking content until consent) is generally not permitted

### United Kingdom

- UK GDPR and PECR apply similar requirements as EU GDPR
- Include GB in the regional consent defaults
- The ICO has signaled stricter enforcement of cookie consent

### United States

**California (CCPA/CPRA):**
- Opt-out model: tracking can start by default
- Must provide a "Do Not Sell or Share My Personal Information" link
- When a user opts out, ad_user_data and ad_personalization should be set to denied
- analytics_storage and ad_storage can remain granted (data collection is permitted, sharing is not)

**Other US states with privacy laws (Colorado, Connecticut, Virginia, Utah, etc.):**
- Most follow an opt-out model similar to California
- Some require consent for sensitive data categories
- OFM recommendation: apply California-level compliance across all US states to future-proof

### Canada (PIPEDA)

- Requires "meaningful consent" which is interpreted as closer to opt-in for tracking cookies
- The approach should be similar to EU for Canadian visitors
- Include CA in the denied-by-default region list if the client has significant Canadian traffic

---

## Consent Mode Impact on Conversion Modeling

### How Modeling Works

When Consent Mode Advanced is enabled and a user does not grant consent:

1. Google tags send cookieless pings (no user identifiers, no cookies)
2. Google observes the conversion rate of consented users
3. Google models the likely conversions among unconsented users based on behavioral signals
4. Modeled conversions appear in Google Ads reporting with a "modeled" label
5. GA4 also includes modeled data in its reports

### Requirements for Modeling to Activate

- Advanced Mode must be used (Basic Mode does not send pings, so no modeling)
- Minimum traffic thresholds apply (Google does not disclose exact numbers, but approximately 1,000 daily users)
- The site must have a sufficient consent rate to establish a baseline (estimated minimum 30% consent rate)
- Modeling applies per domain, not per page

### Impact on Reported Data

| Scenario | Without Consent Mode | Basic Mode | Advanced Mode |
|----------|---------------------|------------|---------------|
| EU user denies consent | Full tracking fires (non-compliant) | No data at all | Cookieless ping + modeled conversion |
| Reported conversions | 100% (but illegal) | 30 to 50% (consent rate) | 70 to 90% (consent + modeled) |
| Audience building | Full (non-compliant) | Only consented | Consented + modeled signals |
| Campaign optimization | Normal | Severely degraded | Near-normal with modeling |

---

## Consent Mode with Server-Side GTM

### How Consent Flows to the Server Container

1. Client-side GTM reads consent state
2. When events are sent to the server-side container (via GA4 transport), consent state is included in the request
3. The GA4 client in the server container parses consent state
4. Server-side tags can check consent state before firing

### Server-Side Tag Consent Configuration

In the server-side container, tags should be configured with consent requirements that match their client-side equivalents:

- Meta CAPI tag: require ad_storage and ad_user_data to be granted
- TikTok Events API tag: require ad_storage to be granted
- Google Ads Enhanced Conversions tag: require ad_storage and ad_user_data
- GA4 tag: require analytics_storage

### Important: Never Bypass Consent Server-Side

It is technically possible to fire server-side tags regardless of consent state because the server container is under your control. This is a compliance violation and must never be done. The server container must respect the same consent decisions as the client container.

---

## Consent Mode for Non-Google Tags

### Meta Pixel and Consent

Meta's pixel does not natively read Google Consent Mode. You must implement separate consent gating:

```javascript
// ES5 compatible. Only fire Meta Pixel if marketing consent is granted.
function checkMetaConsent() {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i] && dl[i][0] === "consent" && dl[i][1] === "update") {
      return dl[i][2] && dl[i][2].ad_storage === "granted";
    }
  }
  return false;
}

// In GTM: use a Custom JavaScript variable that returns consent state
// Then use this variable as a condition on Meta Pixel triggers
```

In GTM, the simplest approach is to configure the Meta Pixel tag with built-in consent requirements for ad_storage. GTM handles the blocking natively.

### TikTok Pixel and Consent

TikTok has its own consent API (holdConsent/grantConsent/revokeConsent). Coordinate it with the CMP:

```javascript
// ES5 compatible. Sync TikTok consent with CMP.
// On page load, before pixel fires:
ttq.holdConsent();

// When CMP reports marketing consent granted:
ttq.grantConsent();

// When CMP reports marketing consent denied or revoked:
ttq.revokeConsent();
```

---

## Debugging Consent Signals

### GTM Preview Mode

1. Open GTM Preview mode
2. Navigate to the site
3. In the Tag Assistant panel, click the "Consent" tab
4. This shows:
   - Default consent state (set on Consent Initialization)
   - Updated consent state (after user interaction with banner)
   - Which tags fired and which were blocked by consent
   - The exact consent type that blocked each tag

### Browser Console

Check the current consent state at any time:

```javascript
// ES5 compatible. Check current consent state.
// This works because gtag pushes to the dataLayer
var dl = window.dataLayer || [];
for (var i = 0; i < dl.length; i++) {
  if (dl[i] && dl[i][0] === "consent") {
    console.log("Consent entry:", dl[i]);
  }
}
```

### Google Tag Assistant (Chrome Extension)

The Google Tag Assistant extension shows consent state for all Google tags on the page. Look for the consent icon next to each tag to see whether it is firing in full mode or restricted mode.

### Verifying Consent Updates Fire Correctly

Test each scenario:

1. **Fresh visit, no prior consent:** verify defaults are denied, banner appears, Google tags send cookieless pings (check Network tab for collect requests with gcs parameter)
2. **Accept all:** verify consent updates to granted for all types, full tracking activates, cookies are set
3. **Reject all:** verify consent stays denied, no tracking cookies are set, only cookieless pings
4. **Accept analytics only:** verify analytics_storage is granted but ad_storage, ad_user_data, ad_personalization remain denied
5. **Return visit with prior consent:** verify consent is restored from the CMP's cookie without showing the banner, and consent update fires on page load
6. **Withdraw consent:** verify consent reverts to denied, tracking cookies are removed

### Common Debugging Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Consent defaults not set | Tags fire with full tracking before banner loads | Add Consent Initialization tag with denied defaults |
| wait_for_update too short | CMP loads after tags fire with denied state | Increase to 500ms or 1000ms |
| CMP not updating consent | Tags stay in denied state after user accepts | Verify CMP is calling gtag("consent", "update", ...) |
| Consent not persisting | Banner shows on every page | CMP cookie is not being set or is being blocked |
| Server-side tags ignoring consent | Events sent to platforms despite denied consent | Configure consent requirements on server-side tags |
| ad_user_data and ad_personalization missing | v2 compliance failure, Google may reject data | Update CMP integration to include both new consent types |
| Regional defaults not working | Non-EU users see denied defaults | Verify region array in gtag consent default call |
| Tags blocked unexpectedly | Tags not firing for consented users | Check for conflicting consent settings in tag configuration |
