# Core Web Vitals Optimization Report — VERIFIED

**Client:** Verocious Motorsports
**Domain:** verociousmotorsports.com
**Date:** March 5, 2026
**Report Type:** Verified Implementation Guide
**Prepared by:** Claude Code — CWV Optimization System

---

## Executive Summary

This report supersedes the March 4, 2026 report with **verified findings** from direct inspection of:
- Live site DOM (via Chrome extension)
- NetSuite SuiteCommerce backend (logged-in session)
- GTM container (GTM-57T4T5BW) — all 36 tags audited
- Lighthouse Treemap (2.0 MiB JS analyzed)
- Google Search Console Core Web Vitals report

### Key Verification Results

| Fix | Original Status | Verified Status |
|-----|-----------------|-----------------|
| LCP image preloads | Assumed missing | **ALREADY IMPLEMENTED** |
| Cookie banner CLS | In progress | **ALREADY FIXED** (position:fixed) |
| Old GA4 location | Unknown | **FOUND: NetSuite Integrations > GA4 field** |
| Mobile LCP element | Needs conversion | **CONFIRMED: Still CSS background-image** |
| Preconnects | Missing | **CONFIRMED: Zero preconnects** |
| Desktop LCP | Needs optimization | **ALREADY OPTIMIZED** (img + fetchpriority) |

### Current CWV Status (GSC as of March 3, 2026)

| | Mobile | Desktop |
|---|--------|---------|
| Poor URLs | 487 | 480 |
| Needs Improvement | 0 | 7 |
| Good URLs | 0 | 0 |
| **Pass Rate** | **0%** | **0%** |

---

## Verified Fix List — Bespoke Implementation

### ALREADY IMPLEMENTED (No Action Required)

#### ~~Fix #3: LCP Image Preloads~~
**Status:** IMPLEMENTED

Verification found these preloads already in `<head>`:
```html
<!-- Desktop LCP -->
<link rel="preload" as="image" href="/site/img/banners/UltimateFabWarehouse_top_backdrop.webp">

<!-- Mobile LCP -->
<link rel="preload" as="image" href="/site/img/Backgrounds/vms_homethumb_tubing_v3.jpg">
```

#### ~~Fix #9: Cookie Consent Banner CLS~~
**Status:** IMPLEMENTED

DOM inspection confirmed:
```javascript
{
  className: "cookieconsent-overlay-dark hide",
  position: "fixed",
  display: "none" // Hidden by default
}
```
No CLS from cookie banner — it overlays rather than pushes content.

---

## Phase 1: Quick Wins (< 1 hour total)

### Fix #4: Remove Old GA4 (G-MDZKSYLJ1B)
**Priority:** HIGHEST | **Effort:** 1 minute | **Impact:** ~153 KiB JS removed

**EXACT NetSuite Location Found:**
```
Commerce > Websites > Configuration > Integrations > Google Analytics 4
Field: "GOOGLE ANALYTICS 4 ID"
Current Value: G-MDZKSYLJ1B
```

**Action:** Clear the field completely and click **Save**.

**Why safe to remove:**
- Active GA4 property `G-862KMNBJX6` is handled through GTM
- Server-side GTM (GTM-P6KQPVPF) receives all GA4 events
- This old integration creates a second gtag.js script (153 KiB) on every page

**Verification after fix:**
```javascript
// Run in console — should return empty array
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('G-MDZKSYLJ1B'))
```

---

### Fix #10: Add Preconnect Hints
**Priority:** HIGH | **Effort:** 5 minutes | **Impact:** 100-300ms per origin

**Verification confirmed:** ZERO preconnects in DOM

**Add to `shopping.ssp` and `checkout.ssp` `<head>` (after `<meta charset>`):**
```html
<!-- Preconnect to critical third-party origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://sst.verociousmotorsports.com">
```

**NetSuite path for SSP files:**
```
SuiteCommerce > Extensions/Themes > [Theme Name] > shopping.ssp
SuiteCommerce > Extensions/Themes > [Theme Name] > checkout.ssp
```

---

### Fix #11: Add font-display: swap
**Priority:** MEDIUM | **Effort:** 5 minutes | **Impact:** Eliminates FOIT

**Google Fonts configuration found at:**
```
Commerce > Websites > Configuration > Summit Theme > Web Fonts
Google Families: Droid+Sans:400,700, Open+Sans:400,600,700,800
```

**Option A — Modify Google Fonts URL (if editable in NetSuite):**
```
Droid+Sans:400,700&display=swap
Open+Sans:400,600,700,800&display=swap
```

**Option B — Add CSS override (if URL not directly editable):**
```css
/* Add to theme CSS */
@font-face {
  font-family: 'Droid Sans';
  font-display: swap;
}
@font-face {
  font-family: 'Open Sans';
  font-display: swap;
}
```

---

## Phase 1: High-Impact Fixes (1-2 days)

### Fix #2: Convert Mobile LCP to `<img>` Tag
**Priority:** CRITICAL | **Effort:** 3 | **Impact:** 2,000ms+ LCP reduction

**Verified current state:**
```javascript
// Mobile LCP element (CONFIRMED via DOM inspection)
{
  element: "div.home-infoblock.home-infoblock0",
  type: "CSS background-image",
  backgroundImage: "url('/site/img/Backgrounds/vms_homethumb_tubing_v3.jpg')",
  hasImgTag: false  // THIS IS THE PROBLEM
}

// Desktop LCP element (ALREADY OPTIMIZED)
{
  element: "img.home-slide-image.home-slide-image-lcp",
  fetchpriority: "high",
  loading: "auto",
  src: "/site/img/banners/UltimateFabWarehouse_top_backdrop.webp",
  width: 1200,
  height: 410
}
```

**Fix for mobile LCP:**

Find the template (likely in `Modules/Home@X.X.X/` or theme templates):

**Current HTML:**
```html
<div class="home-infoblock home-infoblock0"
     style="background-image: url('/site/img/Backgrounds/vms_homethumb_tubing_v3.jpg')">
  <span class="home-infoblock-text">SHOP TUBING</span>
</div>
```

**New HTML:**
```html
<div class="home-infoblock home-infoblock0">
  <img src="/site/img/Backgrounds/vms_homethumb_tubing_v3.jpg"
       alt="Shop Tubing"
       width="382"
       height="160"
       fetchpriority="high"
       decoding="async"
       class="home-infoblock-image">
  <span class="home-infoblock-text">SHOP TUBING</span>
</div>
```

**CSS changes:**
```css
.home-infoblock {
  position: relative;
  overflow: hidden;
  /* REMOVE: background-image, background-size, background-position */
}

.home-infoblock-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.home-infoblock-text {
  position: relative;
  z-index: 1;
}
```

---

### Fix #1: Non-www to www Redirect
**Priority:** HIGH | **Effort:** 2 | **Impact:** 780ms mobile, 230ms desktop

**Verified:** Redirect exists from `verociousmotorsports.com` to `www.verociousmotorsports.com`

**NetSuite domain config path:**
```
Commerce > Websites > Configuration > Domain Configuration
```

**Options (in order of preference):**

1. **CDN-level redirect** (if using Cloudflare/Akamai):
   - Page Rule: `verociousmotorsports.com/*` → 301 to `https://www.verociousmotorsports.com/$1`
   - Reduces redirect from 780ms to ~10-50ms

2. **DNS CNAME flattening:**
   - Point bare domain directly to same origin as www
   - Eliminates redirect entirely

3. **NetSuite support ticket:**
   - Request redirect at load balancer level rather than application level

---

### Fix #5: Remove Client-Side Facebook Pixel
**Priority:** HIGH | **Effort:** 2 | **Impact:** 93 KiB JS removed

**Verified in NetSuite:**
```
Commerce > Websites > Configuration > Integrations > Facebook
ENABLE: ☐ (unchecked)
APPLICATION ID: (empty)
```

**Facebook is NOT loading from NetSuite native integration.**

The `fbevents.js` (verified loading) comes from one of:
1. Hardcoded script in `shopping.ssp` or theme templates
2. A GTM tag (unlikely — Stape Meta tags are the right approach)

**Search for in theme files:**
```javascript
// Look for and REMOVE this entire block
!function(f,b,e,v,n,t,s){...}fbq('init'...
```

**DO NOT REMOVE:**
- 7x Stape Meta DT tags in client GTM (they send events to server-side)
- 7x Stape Meta CAPI tags in server-side GTM (they handle actual Meta tracking)

---

### Fix #6: Consolidate Google Scripts
**Priority:** HIGH | **Effort:** 3 | **Impact:** ~300 KiB JS removed

**Treemap verified 4 separate Google scripts:**

| Script | Size | Status |
|--------|------|--------|
| `gtm.js?id=GTM-57T4T5BW` | 150.9 KiB | **KEEP** (container) |
| `gtag.js?id=G-MDZKSYLJ1B` | 153.4 KiB | **REMOVE** (via Fix #4) |
| `gtag.js?id=G-862KMNBJX6` | 152.7 KiB | **REMOVE standalone** |
| `gtag.js?id=AW-11060543839` | 134.9 KiB | **REMOVE standalone** |

After removing old GA4 (Fix #4), search theme files for:
```html
<!-- REMOVE if found -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-862KMNBJX6"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-11060543839"></script>
```

GTM container already has:
- OFM Google Tag configuring `G-862KMNBJX6` ✓
- Google Ads Tag for `AW-11060543839` ✓

Only `gtm.js` should load; GA4 and Google Ads should fire through the container.

---

## Phase 2: GTM Optimizations

### Fix #7: Defer Klaviyo SDK
**Priority:** MEDIUM | **Effort:** 2 | **Impact:** ~160 KiB deferred

**Verified:** 16 Klaviyo scripts loading. GTM has 7 Klaviyo tags.

**GTM Location:**
```
GTM-57T4T5BW > Tags > Klaviyo SDK Loader
Current Trigger: Initialization - All Pages
```

**Change to delayed loading:**

1. Create new Custom Event trigger:
   - Name: `klaviyo_deferred`
   - Event name: `klaviyo_load`

2. Create deferred loader tag:
```html
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      dataLayer.push({ event: 'klaviyo_load' });
    }, 3000);
  });
</script>
```
   - Trigger: All Pages

3. Update Klaviyo SDK Loader tag:
   - Change trigger from `Initialization - All Pages` to `klaviyo_deferred`

---

### Fix #8: Defer Bing Ads
**Priority:** LOW | **Effort:** 1 | **Impact:** ~18 KiB deferred

**GTM Location:**
```
GTM-57T4T5BW > Tags > BingAds LoadScript
```

Change trigger from `All Pages` to `Window Loaded`.

---

## Phase 1: Checkout-Specific Fixes

### Fix #16: reCAPTCHA Loading 4 Times
**Priority:** CRITICAL for checkout | **Effort:** 2 | **Impact:** ~790 KiB wasted

**Source:** BluePoint.ReCaptcha extension bug

**Fix in extension code:**
```javascript
// Add guard in BluePoint.ReCaptcha entry point
if (!window._recaptchaLoaded) {
  window._recaptchaLoaded = true;
  var script = document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?render=' + siteKey;
  script.async = true;
  document.head.appendChild(script);
}
```

Also remove any hardcoded `<script src="recaptcha/api.js">` from `checkout.ssp` `<head>`.

---

### Fix #17: main-container min-height CLS
**Priority:** MEDIUM | **Effort:** 1 | **Impact:** CLS reduction

Add to checkout CSS:
```css
#main-container {
  min-height: 315px;
}

.g-recaptcha,
.recaptcha-container {
  min-height: 78px;
}
```

Remove JavaScript that sets this dynamically.

---

## Third-Party Script Audit (Verified)

### GTM Client Container: 36 Tags

| Category | Count | Tags |
|----------|-------|------|
| Stape DT (Data Transport) | 7 | add_payment_info, add_to_cart, begin_checkout, page_view, purchase, search, view_item |
| Stape Meta (FB Events) | 7 | AddPaymentInfo, AddToCart, InitiateCheckout, PageView, Purchase, Search, ViewContent |
| Klaviyo | 7 | SDK Loader, Add To Cart, Newsletter Signup, Placed Order, Started Checkout, Viewed Product, Email Identifier |
| OFM GA4 | 6 | Google Tag, Add Payment Info, Add Shipping Info, Add To Cart, Begin Checkout, Purchase |
| Bing Ads | 3 | LoadScript, Pageview Tracking, Conversion |
| Google Ads | 1 | AW-11060543839 |
| Other | 5 | Conversion Linker, fbclid Capture, etc. |

### JavaScript Bundle Analysis (Treemap Verified)

**Total: 2.0 MiB**

| Script | Size | % | Action |
|--------|------|---|--------|
| shopping.js | 365.7 KiB | 18% | SCA core — cannot change |
| shopping_5.js | 335.5 KiB | 16% | Check minification |
| shopping-templates_5.js | 249.4 KiB | 12% | SCA core |
| gtag.js G-MDZKSYLJ1B | 153.4 KiB | 7% | **REMOVE** |
| gtag.js G-862KMNBJX6 | 152.7 KiB | 7% | **REMOVE standalone** |
| gtm.js | 150.9 KiB | 7% | Keep |
| gtag.js AW-11060543839 | 134.9 KiB | 6% | **REMOVE standalone** |
| fbevents.js | 93.6 KiB | 5% | **REMOVE** |
| Facebook signals/config | 118.2 KiB | 6% | Removed with pixel |

**Potential JS reduction: ~650 KiB (32% of total)**

---

## Implementation Priority Order

### Immediate (Today)

| # | Fix | Time | NetSuite Path |
|---|-----|------|---------------|
| 1 | Clear old GA4 ID | 1 min | Commerce > Configuration > Integrations > GA4 |
| 2 | Add preconnects | 5 min | SCA Theme > shopping.ssp |
| 3 | Add font-display:swap | 5 min | Summit Theme > Web Fonts or CSS |

### This Week

| # | Fix | Time | Location |
|---|-----|------|----------|
| 4 | Convert mobile LCP to `<img>` | 2 hrs | Home module template + CSS |
| 5 | Remove FB pixel script | 30 min | Theme templates search |
| 6 | Remove standalone gtag.js | 30 min | Theme templates search |
| 7 | Defer Klaviyo in GTM | 30 min | GTM-57T4T5BW |
| 8 | Fix reCAPTCHA dedup | 1 hr | BluePoint.ReCaptcha extension |

### Next Sprint

| # | Fix | Time | Notes |
|---|-----|------|-------|
| 9 | Fix www redirect | 1 hr | DNS/CDN config |
| 10 | Checkout main-container CSS | 15 min | Checkout CSS |
| 11 | Defer Bing in GTM | 15 min | GTM-57T4T5BW |
| 12 | Checkout script defer | 2 hrs | Test carefully in staging |

---

## Verification Commands

After each fix, run these to verify:

```bash
# PSI scan
bash scripts/psi-fetch.sh "https://www.verociousmotorsports.com/" "MOBILE" "<api_key>" ".cwv/scans/verify-$(date +%s)-MOBILE.json"
```

```javascript
// Console: Check Google scripts
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('google'))
  .forEach(r => console.log(r.name.split('?')[0], Math.round(r.duration) + 'ms'));

// Console: Check for FB pixel
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('facebook') || r.name.includes('fbevents'))
  .forEach(r => console.log(r.name));

// Console: CLS observer
new PerformanceObserver(l => l.getEntries().forEach(e => {
  console.log('CLS:', e.value.toFixed(4),
    'Sources:', e.sources?.map(s => s.node?.className).join(', '));
})).observe({type: 'layout-shift', buffered: true});
```

---

## Expected Outcomes

| Metric | Current | Target | After Fixes |
|--------|---------|--------|-------------|
| Performance (Mobile) | 38 | 90+ | 65-75* |
| LCP (Mobile) | 3,315ms | ≤2,500ms | ~1,800-2,200ms |
| CLS (Mobile) | 0.75 | ≤0.1 | ~0.05-0.10 |
| INP (Mobile) | 133ms | ≤200ms | ~130ms (passing) |
| GSC Good URLs | 0 | 100% | 80%+ |

*Performance score limited by SCA core bundle size (366 KiB mandatory)

---

## Files Updated

- `.cwv/client/profile.json` — Updated with verified findings
- `.cwv/fixes/queue.json` — Updated status for each fix
- `.cwv/reports/2026-03-05-verified-report.md` — This report

---

## Appendix: NetSuite Navigation Reference

| Setting | Path |
|---------|------|
| GA4 Integration | Commerce > Websites > Configuration > Integrations > Google Analytics 4 |
| Facebook Integration | Commerce > Websites > Configuration > Integrations > Facebook |
| GTM Integration | Commerce > Websites > Configuration > Integrations > Google Tag Manager |
| Web Fonts | Commerce > Websites > Configuration > Summit Theme > Web Fonts |
| Domain Config | Commerce > Websites > Configuration > [select domain] |
| Theme Files | SuiteCommerce > Extensions > [Theme] > Files |

---

*Report generated: March 5, 2026*
*Verification method: Chrome extension DOM inspection, NetSuite backend exploration, GTM audit, Treemap analysis*
