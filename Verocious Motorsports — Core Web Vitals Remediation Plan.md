# **Verocious Motorsports — Core Web Vitals Remediation Plan**

## **Site: verociousmotorsports.com | Platform: NetSuite SuiteCommerce Advanced (Backbone/jQuery 3.5.1, BluePoint/Summit theme)**

## **Current State Summary**

Your Core Web Vitals assessment is **FAILED** on both Mobile and Desktop. Here are the real-user (CrUX) 75th-percentile numbers vs. the passing thresholds:

| Metric | Desktop (p75) | Mobile (p75) | Passing Threshold | Status |
| ----- | ----- | ----- | ----- | ----- |
| **LCP** | 3.0 s | 3.3 s | ≤ 2.5 s | ❌ FAIL |
| **INP** | 110 ms | 133 ms | ≤ 200 ms | ✅ PASS |
| **CLS** | 0.25 | 0.75 | ≤ 0.1 | ❌ FAIL |
| FCP | 1.4 s | 2.5 s | ≤ 1.8 s | ⚠️ Desktop pass / Mobile fail |
| TTFB | 0.6 s | 1.0 s | ≤ 0.8 s | ⚠️ Desktop pass / Mobile fail |
| **INP is already passing — no work needed there.** The two metrics that must be fixed to pass are **LCP** and **CLS**. FCP and TTFB improvements will come as a side effect. |  |  |  |  |
| I'm noting your image showed the **Layout shift culprits** (CLS from the cookie consent banner, score 0.236) — you said you're already working on that one, so I'll include it for completeness but mark it accordingly. |  |  |  |  |

---

## **METRIC 1: CUMULATIVE LAYOUT SHIFT (CLS) — Currently 0.25 Desktop / 0.75 Mobile, Target ≤ 0.1**

### **Issue 1A: Cookie Consent Banner Injection *(you noted this is in-progress — including for reference)***

The `<div id="cookieconsent-banner" class="cookieconsent-overlay-banner-bottom">` is the single largest CLS offender at **0.212 shift score**. It appears after page load and pushes content down. **Root cause:** The banner is rendered with `position: relative` or `static` inside the document flow. When it appears, it displaces all content below it. **Fix:** Change the cookie consent banner to `position: fixed` at the bottom of the viewport so it overlays content rather than displacing it. In your SuiteCommerce theme's cookie consent template (likely in the `skins` or `templates` folder in File Cabinet, under the BluePoint/Summit extension), modify the CSS:

css  
\#cookieconsent-banner,  
.cookieconsent-overlay-banner-bottom {  
  position: fixed **\!important**;  
  bottom: 0;  
  left: 0;  
  right: 0;  
  z-index: 10000;  
}

## **Alternatively, reserve the exact space for the banner in the initial HTML by adding a placeholder `<div>` with a matching min-height before the banner loads.**

### **Issue 1B: Images Without Explicit Width and Height Attributes**

**19 of 22 images** on the homepage are missing explicit `width` and `height` HTML attributes. When the browser doesn't know the aspect ratio before loading, it causes layout shifts as images load. **Specific images your devs need to fix:** The critical one flagged by Lighthouse is `vms_homepage_freshproducemfg_headers.jpg` inside `.home-page-freetext-content-image`. It's served at 1080×648 but displayed at approximately 668×401. It has no `width` or `height` attributes. **Fix:** In the SuiteCommerce CMS content or template where this image is rendered, add explicit dimensions:

html  
\<img src\=".../vms\_homepage\_freshproducemfg\_headers.jpg"   
     width\="1080" height\="648"   
     alt\="Fresh Produce MFG"  
     style\="width: 100%; height: auto;"\>

## **Do the same for all homepage slider images (the bxSlider carousel images) and info-block background images. The `width` and `height` attributes only need to express the correct aspect ratio — CSS can still control the rendered size.**

![][image1]

### **Issue 1C: bxSlider Carousel Has No Height Reservation**

Your homepage uses bxSlider (`.bx-wrapper` / `.bx-viewport`) for the hero carousel. The bxSlider viewport height is set dynamically by JavaScript after the images load, which causes a layout shift as the slider "pops" into its final size. **Fix:** Pre-set the aspect ratio on the slider container using CSS so the browser reserves the correct space before JS executes:

css  
.bx-wrapper,  
.bx-viewport {  
  aspect-ratio: 1170 / 400; /\* matches your banner dimensions \*/  
  width: 100%;  
  overflow: hidden;  
}  
/\* Prevent height: 0 on initial load \*/  
.bx-viewport {  
  min-height: 246px; /\* approximate rendered height on desktop \*/  
}

## **Also ensure each `.home-slide-image` has `width` and `height` attributes matching the source images (1170×400 for your banners).**

### **Issue 1D: SuiteCommerce Loading Indicator**

## **The `<img id="loadingIndicator" class="global-loading-indicator">` element (from BluePoint/Summit) is positioned absolute with `display: none`, scoring 0.000 CLS. This one is fine — no action needed.**

## **METRIC 2: LARGEST CONTENTFUL PAINT (LCP) — Currently 3.0s Desktop / 3.3s Mobile, Target ≤ 2.5s**

The Lighthouse lab test shows the LCP element is `div.home-infoblock.home-infoblock0` with a background image (`vms_homethumb_tubing_v3.jpg`). The LCP breakdown shows **2,220 ms of "Resource Load Delay"** — meaning the browser doesn't discover the LCP image until very late because it's a CSS background-image loaded after render-blocking JS completes.

### **Issue 2A: Nine Render-Blocking First-Party Scripts (Est. Savings 9,540 ms on mobile, 310 ms on desktop)**

This is the **single biggest LCP problem**. Your SuiteCommerce application loads these scripts synchronously (no `async`, no `defer`) in the body, blocking all rendering until they finish downloading and executing:

1. `shopping.environment.ssp` — 19 KiB, 1,050 ms  
2. `shopping.environment.shortcache.ssp` — 19 KiB  
3. `shopping_en_US.js` — 10 KiB, 700 ms  
4. `cms.js` — 52 KiB (204 KiB uncompressed), 2,090 ms  
5. `shopping-templates_5.js` — 250 KiB, 6,950 ms  
6. `shopping.js` — 367 KiB, 8,340 ms  
7. `shopping_5.js` — 335 KiB, 7,820 ms  
8. `shopping_5.css` — 204 KiB, 4,520 ms  
9. `cms-templates` — 1 KiB, 180 ms These are SuiteCommerce core bundles, so they can't simply be deferred without breaking the SPA. However, your devs should implement the following: **Fix A — Preload the LCP image:** Since the LCP element uses a CSS `background-image`, the browser can't discover it until after CSS/JS parses. Add a `<link rel="preload">` in the `<head>` of your shopping.ssp template:

html  
\<link rel\="preload" as\="image" href\="/site/img/Backgrounds/vms\_homethumb\_tubing\_v3.jpg" fetchpriority\="high"\>

**Fix B — Switch LCP element from CSS background-image to `<img>` tag:** CSS background images are invisible to the browser's preload scanner. Convert the `.home-infoblock0` from a background-image to a real `<img>` tag with `fetchpriority="high"`. This lets the browser discover and start fetching it immediately during HTML parse, without waiting for CSS/JS:

html  
\<div class\="home-infoblock home-infoblock0"\>  
  \<img src\="/site/img/Backgrounds/vms\_homethumb\_tubing\_v3.jpg"   
       alt\="Shop Tubing"   
       fetchpriority\="high"  
       width\="800" height\="600"  
       style\="width: 100%; height: 100%; object-fit: cover;"\>  
  \<\!-- existing content \--\>  
\</div\>

**Fix C — Add `<link rel="preconnect">` hints:** Your page currently has **zero** preconnect hints. Add these to the `<head>` of shopping.ssp for the domains your page requests resources from early:

html  
\<link rel\="preconnect" href\="https://fonts.googleapis.com"\>  
\<link rel\="preconnect" href\="https://fonts.gstatic.com" crossorigin\>  
\<link rel\="preconnect" href\="https://www.googletagmanager.com"\>  
\`\`\`  
\---  
\#\#\# Issue 2B: Cache TTL Set to Only 2 Hours (Est. Savings 1,644 KiB)  
Every first-party resource — all JS bundles, CSS, fonts, and images — has a cache TTL of just \*\*2 hours\*\*. This means returning visitors re-download everything, dramatically inflating LCP for repeat visits. Your CrUX data aggregates repeat visits, so this is hurting your real-world scores.  
\*\*Fix:\*\* In NetSuite, update the cache headers for static assets. Navigate to \*\*Commerce \> Website \> Configuration\*\* (or the web server configuration where cache-control headers are set). For versioned/fingerprinted files (JS/CSS bundles with \`?t=177...\` query strings), set:  
\`\`\`  
Cache-Control: public, max-age=31536000, immutable  
\`\`\`  
For non-versioned assets (images, fonts), set at minimum:  
\`\`\`  
Cache-Control: public, max-age=604800

## **The `?t=177...` query parameter on your SuiteCommerce bundles already acts as a cache-buster, so long cache times are safe. The NetSuite cache settings are typically managed through the Web Site Setup record or via SuiteScript/CDN configuration. If you're using a CDN (e.g., Cloudflare, CloudFront), configure these cache headers at the CDN level. Critical note: The `shopping.environment.shortcache.ssp` file currently has only a 5-minute cache. This is by NetSuite design (it contains dynamic data), but review whether its content truly needs to be that fresh.**

### **Issue 2C: Enormous JavaScript Payload — 997 KiB First-Party JS, \~654 KiB Unused**

Your three core SuiteCommerce bundles total nearly 1 MB of JavaScript:

* `shopping.js` — 367 KiB (208 KiB unused)  
* `shopping_5.js` — 335 KiB (201 KiB unused)  
* `shopping-templates_5.js` — 250 KiB (222 KiB unused) Additionally, `shopping_5.js` has **117 KiB** that could be saved through minification (it's not fully minified). **Fix A — Minify `shopping_5.js`:** Run the SuiteCommerce Advanced build process (`gulp deploy`) with production minification enabled. Check `distro.json` or your Gulp configuration to ensure uglify/terser is running on the extension bundle. **Fix B — Audit and remove unused SuiteCommerce extensions:** The \~654 KiB of unused JS means extensions are being loaded that aren't needed on the homepage. Review your active SCA extensions in the **Extension Manager** (Commerce \> Extensions). Common culprits include wish-list modules, product comparison, and advanced checkout features loaded on every page. Use code-splitting where SCA supports it to load extension code only on relevant pages. **Fix C — Tree-shake `cms.js`:** This file is 52 KiB with 23.6 KiB unused and contains legacy JavaScript polyfills. If you're using the CMS content system, check if a newer version of the CMS bundle is available that drops legacy polyfills.

---

### **Issue 2D: Unused CSS — 188 KiB of 204 KiB in `shopping_5.css`**

An astonishing **92% of your main CSS file is unused** on the homepage. This is typical of SuiteCommerce monolithic CSS bundles. **Fix:** The SCA build system compiles all extension SCSS into one file. To reduce this, your devs should split critical CSS (above-the-fold styles) inline in the `<head>` and lazy-load the rest:

html  
\<style\>/\* Critical CSS for homepage header, nav, hero slider \*/\</style\>  
\<link rel\="stylesheet" href\="shopping\_5.css" media\="print" onload\="this.media='all'"\>

## **Use Chrome DevTools Coverage tab to extract the \~16 KiB of CSS actually used above the fold, then inline it.**

### **Issue 2E: Font Loading Optimization**

Your page loads **7 custom font files** (DroidSans, DroidSans-Bold, OpenSans-Regular, OpenSans-SemiBold, OpenSans-ExtraBold, FontAwesome webfont, and Google Fonts Exo/Nunito/Oswald/Poppins). Many of the 24 `@font-face` rules have **no `font-display` property set** (16 out of 24). **Fix A — Add `font-display: swap` to ALL @font-face rules:** In your SCSS/CSS files in the SCA theme (File Cabinet \> Web Site Hosting Files \> skins or the extension SCSS), ensure every `@font-face` declaration includes:

css  
@font-face {  
  font-family: 'chevron\_up'; /\* and all other icon fonts \*/  
  font-display: swap;  
  /\* ... existing src rules ... \*/  
}

**Fix B — Preload critical fonts:** The DroidSans and OpenSans fonts are used in the header/navigation and are on the critical rendering path. Add preload hints:

html  
\<link rel\="preload" href\="/site/fonts/DroidSans.woff2" as\="font" type\="font/woff2" crossorigin\>  
\<link rel\="preload" href\="/site/fonts/OpenSans-Regular.woff2" as\="font" type\="font/woff2" crossorigin\>

## **Fix C — Consolidate font families: You're loading fonts from at least 7 different families (Exo, Nunito Sans, Oswald, Poppins, Nunito, Open Sans, Droid Sans). Audit whether all are actually visible on the homepage and remove any that aren't. Each font family delays rendering. Fix D — Self-host Google Fonts: Any fonts loaded from `fonts.googleapis.com` add an extra DNS lookup \+ connection. Download the WOFF2 files and host them locally in the File Cabinet.**

## **METRIC 3: THIRD-PARTY SCRIPT IMPACT**

Your page loads scripts from **8 third-party domains** that collectively consume 1,286 KiB and 970 ms of main-thread time:

| Third Party | Transfer Size | Main Thread Time |
| ----- | ----- | ----- |
| Google Tag Manager (4 gtag/gtm scripts) | 596 KiB | 538 ms |
| Facebook/Meta Pixel | 220 KiB | 186 ms |
| Slaask live chat | 242 KiB | 136 ms |
| Klaviyo (20+ chunk files) | 160 KiB | 73 ms |
| Google CDN (call tracking \+ WCM) | 24 KiB | 16 ms |
| Bing Ads | 18 KiB | 16 ms |
| Google Ads/DoubleClick | 3 KiB | 1 ms |
| **Fix A — Consolidate GTM tags:** You have **4 separate Google Tag Manager/gtag scripts** loading independently. Consolidate all Google tags into a single GTM container (`GTM-57T4T5BW`) and remove the individual gtag.js calls for `G-MDZKSYLJ1B`, `G-862KMNBJX6`, and `AW-110...`. This alone saves \~300 KiB and \~250 ms. |  |  |
| **Fix B — Defer Slaask chat widget:** Slaask (`cdn.slaask.com/chat.js` at 237 KiB) should be lazy-loaded after user interaction or after a 5-second delay: |  |  |

javascript  
// Replace direct \<script\> inclusion with:  
setTimeout(function() {  
  var s \= document.createElement('script');  
  s.src \= 'https://cdn.slaask.com/chat.js';  
  s.async \= true;  
  document.body.appendChild(s);  
}, 5000);

**Fix C — Defer Klaviyo:** Klaviyo loads **20+ chunk files**. Delay Klaviyo initialization until after the page is interactive:

javascript  
window.addEventListener('load', function() {  
  setTimeout(function() {  
    // Initialize Klaviyo  
    var s \= document.createElement('script');  
    s.src \= 'https://static.klaviyo.com/onsite/js/klaviyo.js?company\_id=Wwzs6N';  
    s.async \= true;  
    document.body.appendChild(s);  
  }, 3000);  
});

## **Fix D — Defer Facebook Pixel and Bing Ads: Move these to load after the `window.load` event as well. They are analytics/tracking and have no impact on user experience if delayed 2-3 seconds.**

## **IMPLEMENTATION PRIORITY ORDER**

Here's the recommended order based on impact vs. effort: **Phase 1 — Quick wins (1-2 days, biggest CLS \+ LCP impact):**

1. Add `width` and `height` attributes to all 19 images missing them  
2. Add `<link rel="preload">` for the LCP background image in shopping.ssp `<head>`  
3. Add `<link rel="preconnect">` hints to shopping.ssp `<head>`  
4. Add `font-display: swap` to the 16 @font-face rules missing it  
5. Pre-set aspect ratio / min-height on `.bx-viewport` CSS **Phase 2 — Medium effort (3-5 days, major LCP improvement):**  
6. Convert LCP element from CSS background-image to `<img>` with `fetchpriority="high"`  
7. Defer Slaask, Klaviyo, Facebook, Bing third-party scripts  
8. Consolidate 4 GTM/gtag scripts into single GTM container  
9. Preload critical fonts (DroidSans, OpenSans) **Phase 3 — SuiteCommerce build changes (1-2 weeks, sustained improvement):**  
10. Fix `shopping_5.js` minification in the SCA build pipeline  
11. Inline critical CSS and lazy-load `shopping_5.css`  
12. Increase cache TTL from 2 hours to 1 year for versioned assets  
13. Audit and remove unused SCA extensions to reduce JS bundle size  
14. Convert `vms_homepage_freshproducemfg_headers.jpg` to WebP and serve responsive sizes via `srcset`  
15. Self-host Google Fonts and consolidate font families

---

## **WHAT PASSING LOOKS LIKE**

Once these changes are implemented, your target metrics should be:

| Metric | Current (Desktop) | Target | How We Get There |
| ----- | ----- | ----- | ----- |
| **LCP** | 3.0 s | ≤ 2.0 s | Preload LCP image, convert to `<img>`, defer 3rd-party scripts, cache improvements |
| **CLS** | 0.25 | ≤ 0.05 | Cookie banner fix (in-progress), image dimensions, slider height reservation |
| **INP** | 110 ms | ≤ 110 ms | Already passing, no changes needed |
| FCP | 1.4 s | ≤ 1.2 s | Preconnects, font-display swap, critical CSS inlining |
| TTFB | 0.6 s | ≤ 0.6 s | Already borderline passing, cache improvements help repeat visits |
| All code references, file paths, and element selectors above are taken directly from your live site at verociousmotorsports.com and your PageSpeed Insights report. Your dev team should be able to locate every file in the NetSuite File Cabinet under Web Site Hosting Files and the SuiteCommerce extension directories. Let me know if you need me to drill deeper into any specific item. |  |  |  |

[image1]: <data:image/png;base64,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>