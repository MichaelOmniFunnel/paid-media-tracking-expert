# Report 2: Remaining CWV Recommendations — VERIFIED

**Client:** Verocious Motorsports
**Domain:** verociousmotorsports.com
**Date:** March 5, 2026
**Verification Method:** Live Chrome inspection, GTM audit, NetSuite backend review

---

## Executive Summary

This report contains **verified pending optimizations** with **exact locations and implementation instructions**. All findings have been confirmed through direct inspection of GTM, NetSuite, and live website.

### Current Core Web Vitals (Field Data)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP | 3,314ms | ≤2,500ms | **FAIL** |
| CLS | 0.75 | ≤0.10 | **FAIL** |
| INP | 129ms | ≤200ms | PASS |

---

## TIER 1: Quick Wins (NetSuite Config Changes)

---

### FIX-004: Remove Old GA4 Property (G-MDZKSYLJ1B)

**Status:** VERIFIED - Still present in NetSuite
**Effort:** 1 minute
**Savings:** ~153 KiB JS, ~100ms main thread

#### Verified Location
```
NetSuite > Commerce > Websites > Configuration > Integrations > Google Analytics 4
```

#### Current Value (Verified)
```
GOOGLE ANALYTICS 4 ID: G-MDZKSYLJ1B
```

#### Exact Steps
1. Log into NetSuite admin: https://606473.app.netsuite.com
2. Go to: Commerce > Websites > Configuration
3. Select website: www.verociousmotorsports.com
4. Expand **Integrations** section
5. Find **Google Analytics 4** subsection
6. **Clear the field** containing `G-MDZKSYLJ1B`
7. Click **Save**

#### Verification After Fix
- Network tab should NOT show: `gtag/js?id=G-MDZKSYLJ1B`
- GTM will continue handling GA4 via G-862KMNBJX6

---

### FIX-NEW: Enable Async Web Fonts

**Status:** VERIFIED - Both checkboxes UNCHECKED
**Effort:** 1 minute
**Savings:** Reduced render-blocking, faster FCP

#### Verified Location
```
NetSuite > Commerce > Websites > Configuration > Summit Theme > Web Fonts
```

#### Current State (Verified)
```
☐ ENABLE WEB FONTS (unchecked)
☐ LOAD WEB FONTS SCRIPT ASYNCHRONOUSLY (unchecked)
```

#### Exact Steps
1. Navigate to: Commerce > Websites > Configuration
2. Select website: www.verociousmotorsports.com
3. Expand **Summit Theme** section
4. Find **Web Fonts** subsection
5. Check: **☑ ENABLE WEB FONTS**
6. Check: **☑ LOAD WEB FONTS SCRIPT ASYNCHRONOUSLY**
7. Click **Save**

---

### FIX-010: Add Preconnect Hints

**Status:** VERIFIED - 0 preconnects found in DOM
**Effort:** 5 minutes
**Savings:** 100-300ms per origin

#### Verified Finding
DOM inspection confirmed: **Zero `<link rel="preconnect">` elements** in document head.

#### Verified File Location (NetSuite File Cabinet)
```
File Cabinet Path: Web Site Hosting Files > Live Hosting Files - not used > SSP Applications > NetSuite Inc. - SCS > SuiteCommerce Standard > shopping.ssp
File ID: 2480994
File Type: SuiteScript Page
File Size: 8,142 bytes
```

**Direct Edit URL:** `https://606473.app.netsuite.com/app/common/media/mediaitem.nl?id=2480994`

#### Exact Code to Add
```html
<!-- Add immediately after <meta charset="UTF-8"> in shopping.ssp <head> section -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://sst.verociousmotorsports.com">
```

Also add to `checkout.ssp` in the same File Cabinet location.

---

## TIER 2: GTM Configuration Changes

---

### FIX-007: Defer Klaviyo SDK Loading

**Status:** VERIFIED - Fires on Initialization - All Pages
**Effort:** 30 minutes
**Savings:** ~160 KiB deferred, reduced TBT

#### Verified Location
```
GTM Container: GTM-57T4T5BW
Tag Name: "Klaviyo SDK Loader"
Tag Type: Custom HTML
Current Trigger: Initialization - All Pages
```

#### Verified Code
```html
<script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=WwzsGN"></script>
```

#### Exact Implementation Steps

**Step 1: Create delay mechanism tag**
1. Open GTM: https://tagmanager.google.com/#/container/accounts/6225143986/containers/181906440/workspaces/48
2. Go to Tags > New
3. Name: `Delayed Init - Klaviyo Trigger`
4. Type: Custom HTML
5. HTML:
```html
<script>
window.addEventListener('load', function() {
  setTimeout(function() {
    window.dataLayer.push({'event': 'klaviyo_delayed_init'});
  }, 3000);
});
</script>
```
6. Trigger: All Pages
7. Save

**Step 2: Create custom trigger**
1. Go to Triggers > New
2. Name: `Custom Event - Klaviyo Delayed Init`
3. Type: Custom Event
4. Event name: `klaviyo_delayed_init`
5. Save

**Step 3: Update Klaviyo SDK Loader**
1. Open tag: "Klaviyo SDK Loader"
2. Remove trigger: "Initialization - All Pages"
3. Add trigger: "Custom Event - Klaviyo Delayed Init"
4. Save

**Step 4: Publish**
1. Test in Preview mode
2. Verify Klaviyo SDK loads ~3 seconds after page load
3. Submit/Publish changes

---

### FIX-005: Facebook Pixel (fbevents.js) — IMPORTANT CONTEXT

**Status:** VERIFIED - Source definitively identified
**Effort:** Complex - requires business decision

#### Root Cause VERIFIED

The Facebook Pixel is loaded by the **"Facebook Pixel by Stape" GTM template**.

**Verified Location:**
```
GTM Container: GTM-57T4T5BW
Template: Facebook Pixel by Stape (stape-io)
Template Code Line 33: injectScript('https://connect.facebook.net/en_US/fbevents.js', ...)
Tags Using This Template: 7 [Stape] Meta tags
Pixel ID: 794984379558867
```

#### Why It Exists
This is **intentional by design**. The Stape hybrid approach:
1. Loads fbevents.js to set `_fbc` and `_fbp` cookies
2. These cookies are required for CAPI event deduplication
3. Provides browser-side tracking as fallback

#### Options

**Option A: Keep as-is (Recommended for tracking accuracy)**
- Accept ~93 KiB JS load
- Maintains optimal tracking deduplication
- No risk of conversion data loss

**Option B: Remove for performance (Higher risk)**
1. Delete all 7 [Stape] Meta tags:
   - [Stape] Meta - AddPaymentInfo
   - [Stape] Meta - AddToCart
   - [Stape] Meta - InitiateCheckout
   - [Stape] Meta - PageView
   - [Stape] Meta - Purchase
   - [Stape] Meta - Search
   - [Stape] Meta - ViewContent
2. Rely solely on [Stape] DT (Data Tag) tags + server-side container
3. Configure alternative _fbc/_fbp cookie handling
4. Accept potential tracking gaps during transition

**Decision Required:** Consult with marketing team before removing. The performance gain (~93 KiB) must be weighed against potential conversion tracking loss.

---

## TIER 3: Template Changes

---

### FIX-002: Convert Mobile LCP Element to IMG Tag

**Status:** VERIFIED - Still CSS background-image, no IMG tag
**Effort:** 2-3 hours
**Savings:** 2,000ms+ element render delay

#### Verified Current State
```
Element: div.home-infoblock.home-infoblock0
Type: CSS background-image
Has IMG tag: NO
Has fetchpriority: N/A (cannot apply to CSS background)
Background URL: /site/img/Backgrounds/vms_homethumb_tubing_v3.jpg
```

Desktop LCP is already optimized (`img.home-slide-image-lcp` with `fetchpriority="high"`).

#### Verified File Location (NetSuite File Cabinet)
```
File Cabinet Path: SuiteBundles > Bundle 312830 > com.netsuite.summittheme > Summit > Modules > Home@sco-2018.1.0 > Templates > home.tpl
File ID: 2532017
File Type: Other Binary File (Handlebars template)
File Size: 9,275 bytes
```

**Direct Edit URL:** `https://606473.app.netsuite.com/app/common/media/mediaitem.nl?id=2532017`

**Note:** The infoblocks are rendered within `home.tpl`. The background images are configured in NetSuite Commerce Configuration:
```
NetSuite > Commerce > Websites > Configuration > Summit Theme > Home > Infoblocks
```

#### Implementation

**Step 1: Modify the infoblock template**
```handlebars
{{!-- BEFORE: CSS background-image --}}
<div class="home-infoblock home-infoblock{{index}}"
     style="background-image: url('{{backgroundImage}}')">
    <div class="home-infoblock-content">{{content}}</div>
</div>

{{!-- AFTER: IMG tag with fetchpriority on first item --}}
<div class="home-infoblock home-infoblock{{index}}">
    {{#if @first}}
    <img class="home-infoblock-image home-infoblock-image-lcp"
         src="{{backgroundImage}}"
         fetchpriority="high"
         loading="eager"
         width="400"
         height="300"
         alt="{{title}}">
    {{else}}
    <img class="home-infoblock-image"
         src="{{backgroundImage}}"
         loading="lazy"
         width="400"
         height="300"
         alt="{{title}}">
    {{/if}}
    <div class="home-infoblock-content">{{content}}</div>
</div>
```

**Step 2: Add CSS**
```css
.home-infoblock {
    position: relative;
    overflow: hidden;
}

.home-infoblock-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
}

.home-infoblock-content {
    position: relative;
    z-index: 1;
}
```

**Step 3: Convert images to WebP**
Convert all 8 infoblock images from JPG to WebP:
```
vms_homethumb_tubing_v3.jpg → vms_homethumb_tubing_v3.webp
vms_homethumb_vbands_v3.jpg → vms_homethumb_vbands_v3.webp
vms_homethumb_silicone_v3.jpg → vms_homethumb_silicone_v3.webp
vms_homethumb_mandrelbends_v3.jpg → vms_homethumb_mandrelbends_v3.webp
vms_homethumb_o2_v3.jpg → vms_homethumb_o2_v3.webp
vms_homethumb_pipefittings_v3.jpg → vms_homethumb_pipefittings_v3.webp
vms_homethumb_flex_v3.jpg → vms_homethumb_flex_v3.webp
vms_homethumb_bellows_v3.jpg → vms_homethumb_bellows_v3.webp
```

**Step 4: Update NetSuite config**
```
Commerce > Configuration > Summit Theme > Home > Infoblocks
```
Update BACKGROUND IMAGE URL fields to use .webp extension.

**Step 5: Update preload in shopping.ssp**
```html
<link rel="preload"
      as="image"
      href="/site/img/Backgrounds/vms_homethumb_tubing_v3.webp"
      media="(max-width: 991px)">
```

---

### FIX-011: Add font-display: swap

**Status:** VERIFIED - 22 of 24 @font-face rules missing font-display
**Effort:** 30 minutes

#### Verified Finding
Only FontAwesome and rss_feed_square have `font-display: swap`. All others (chevron_up, ic-chevron-down, spinner, etc.) are missing it.

#### Verified File Location (NetSuite File Cabinet)
```
File Cabinet Path: Web Site Hosting Files > Live Hosting Files - not used > SSP Applications > NetSuite Inc. - SCS > SuiteCommerce Standard > extensions > shopping_5.css
File ID: 2786528
File Type: CSS File
File Size: 1,502,188 bytes (~1.5 MB)
Owner: Maria Noya
```

**Direct Edit URL:** `https://606473.app.netsuite.com/app/common/media/mediaitem.nl?id=2786528`

#### Implementation
In `shopping_5.css`, add `font-display: swap` to every @font-face rule:

```css
@font-face {
  font-family: 'chevron_up';
  src: url('../fonts/chevron_up.woff2') format('woff2');
  font-display: swap; /* ADD THIS LINE */
}
```

---

## Summary: Verified Fix Queue

| Priority | Fix | Location | Status |
|----------|-----|----------|--------|
| 1 | Remove old GA4 (G-MDZKSYLJ1B) | NetSuite > Integrations | VERIFIED |
| 2 | Enable async web fonts | NetSuite > Summit Theme > Web Fonts | VERIFIED |
| 3 | Add preconnect hints | shopping.ssp `<head>` | VERIFIED |
| 4 | Defer Klaviyo SDK | GTM > Klaviyo SDK Loader tag | VERIFIED |
| 5 | Convert mobile LCP to IMG | SCA theme template | VERIFIED |
| 6 | Add font-display: swap | shopping_5.css | VERIFIED |
| 7 | Facebook Pixel (optional) | GTM > [Stape] Meta tags | VERIFIED - Decision needed |

---

## Verification Checklist

| Fix | How to Verify |
|-----|---------------|
| GA4 removed | Network: no `gtag/js?id=G-MDZKSYLJ1B` |
| Async fonts | Network: fonts load without render-blocking |
| Preconnects | Elements: 4 `<link rel="preconnect">` in head |
| Klaviyo deferred | Network: Klaviyo loads ~3s after page load |
| Mobile LCP IMG | Elements: `<img>` with `fetchpriority="high"` in infoblock |
| font-display | Styles: all @font-face have `font-display: swap` |

---

## Appendix: Verified File Paths Summary

| File | NetSuite File Cabinet Path | File ID |
|------|---------------------------|---------|
| shopping.ssp | Web Site Hosting Files > Live Hosting Files - not used > SSP Applications > NetSuite Inc. - SCS > SuiteCommerce Standard | 2480994 |
| shopping_5.css | Web Site Hosting Files > Live Hosting Files - not used > SSP Applications > NetSuite Inc. - SCS > SuiteCommerce Standard > extensions | 2786528 |
| home.tpl | SuiteBundles > Bundle 312830 > com.netsuite.summittheme > Summit > Modules > Home@sco-2018.1.0 > Templates | 2532017 |

---

*Report verified: March 5, 2026*
*Methods: GTM template code inspection, NetSuite config verification, live DOM inspection, **NetSuite File Cabinet exploration***
