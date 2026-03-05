# Report 1: Completed CWV Implementations

**Client:** Verocious Motorsports
**Domain:** verociousmotorsports.com
**Verification Date:** March 5, 2026
**Verification Method:** Live DOM inspection via Chrome DevTools

---

## Executive Summary

The following optimizations have been **verified as implemented and working** on the live site. These represent completed work that is actively improving Core Web Vitals performance.

| Implementation | Metric Impact | Status |
|---------------|---------------|--------|
| Desktop LCP image optimization | LCP | **VERIFIED** |
| LCP image preloads (desktop + mobile) | LCP | **VERIFIED** |
| Cookie consent banner position:fixed | CLS | **VERIFIED** |
| Head scripts async loading | LCP/TBT | **VERIFIED** |

---

## 1. Desktop LCP Image Optimization

### What Was Implemented
The desktop hero image (LCP element) has been properly optimized with modern best practices.

### Verified Configuration
```html
<img class="home-slide-image home-slide-image-lcp"
     fetchpriority="high"
     src="/site/img/banners/UltimateFabWarehouse_top_backdrop.webp"
     width="1200"
     height="410">
```

### Verification Evidence
- **Element found:** `img.home-slide-image.home-slide-image-lcp`
- **fetchpriority="high":** YES
- **Image format:** WebP (modern, compressed)
- **Dimensions set:** YES (1200x410)

### Impact
- Browser prioritizes this image in the loading queue
- Preload scanner can discover the image immediately
- No layout shift from missing dimensions
- WebP format reduces file size by ~30% vs JPEG

---

## 2. LCP Image Preloads

### What Was Implemented
Both desktop and mobile LCP images have `<link rel="preload">` hints in the document `<head>`.

### Verified Configuration
```html
<!-- Desktop LCP preload -->
<link rel="preload" as="image" href="/site/img/banners/UltimateFabWarehouse_top_backdrop.webp">

<!-- Mobile LCP preload -->
<link rel="preload" as="image" href="/site/img/Backgrounds/vms_homethumb_tubing_v3.jpg">
```

### Verification Evidence
- **Total preloads found:** 2
- **Desktop image preloaded:** UltimateFabWarehouse_top_backdrop.webp
- **Mobile image preloaded:** vms_homethumb_tubing_v3.jpg

### Impact
- Browser begins fetching LCP images before parsing CSS
- Reduces Resource Load Delay phase of LCP
- Estimated savings: 200-400ms

---

## 3. Cookie Consent Banner CLS Fix

### What Was Implemented
The cookie consent overlay uses `position: fixed` which removes it from document flow, preventing layout shift.

### Verified Configuration
```css
.cookieconsent-overlay-dark {
    position: fixed;
    display: none; /* hidden until triggered */
}
```

### Verification Evidence
- **Element class:** `cookieconsent-overlay-dark`
- **Position:** `fixed`
- **Default display:** `none`

### Impact
- Cookie banner appears as overlay, not pushing content down
- Eliminates CLS contribution from cookie consent
- Estimated CLS reduction: ~0.1-0.2

---

## 4. Head Scripts Async Loading

### What Was Implemented
All JavaScript files loaded in the document `<head>` use the `async` attribute, preventing render-blocking.

### Verified Configuration
```html
<head>
  <!-- All 26 scripts have async attribute -->
  <script async src="shopping.js"></script>
  <script async src="shopping_5.js"></script>
  <script async src="shopping-templates_5.js"></script>
  <!-- ... -->
</head>
```

### Verification Evidence
- **Total scripts in head:** 26
- **Async scripts:** 26
- **Defer scripts:** 0
- **Render-blocking scripts:** 0

### Impact
- HTML parsing not blocked by JavaScript
- Faster First Contentful Paint (FCP)
- Faster Time to Interactive (TTI)

---

## Summary of Completed Work

| Fix ID | Description | Verified |
|--------|-------------|----------|
| fix-003 | LCP image preloads | YES |
| fix-009 | Cookie banner position:fixed | YES |
| N/A | Desktop LCP img with fetchpriority | YES |
| N/A | Head scripts async | YES |

---

## What This Means for Performance

These implementations address critical rendering path optimizations:

1. **Desktop LCP is optimized** - The hero image loads efficiently with high priority
2. **Preloads reduce discovery time** - Both LCP images start loading immediately
3. **No CLS from cookie banner** - Fixed positioning prevents layout shift
4. **No render-blocking JS** - Page can render while scripts load

**However**, significant opportunities remain, particularly:
- Mobile LCP element (CSS background-image, not `<img>`)
- Old GA4 property still loading
- Missing preconnect hints
- Missing font-display: swap on many fonts
- Facebook Pixel (fbevents.js) still loading client-side

See **Report 2** for detailed recommendations and implementation instructions.

---

*Verified: March 5, 2026 via Chrome DevTools live inspection*
