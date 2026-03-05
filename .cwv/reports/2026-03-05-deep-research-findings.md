# Deep Research Findings — Additional CWV Optimizations

**Client:** Verocious Motorsports
**Date:** March 5, 2026
**Research Type:** Comprehensive PSI Analysis + NetSuite Backend Exploration

---

## Executive Summary

This deep-dive research uncovered **12 NEW optimization opportunities** not covered in the original report, with potential to reduce LCP by an additional **2-4 seconds** and significantly improve CWV scores.

### Key Discoveries

| Finding | Impact | Effort |
|---------|--------|--------|
| Infoblocks use JPG not WebP | HIGH - LCP | Medium |
| Async web fonts disabled | HIGH - LCP/FCP | 1 min fix |
| Cache TTL only 2 hours | HIGH - Repeat visits | NetSuite setting |
| 941 KiB unused JavaScript | CRITICAL - 3,750ms LCP | Complex |
| Element render delay 2,520ms | CRITICAL - LCP | Template change |
| 19 long tasks blocking | HIGH - TBT | Script optimization |

---

## Fresh PSI Scan Results (March 5, 2026)

### Field Data (CrUX p75 - Real User Data)

| Metric | Value | Status | Target |
|--------|-------|--------|--------|
| LCP | 3,314ms | AVERAGE | ≤2,500ms |
| CLS | 0.75 | **SLOW** | ≤0.10 |
| INP | 129ms | FAST | ≤200ms |
| FCP | 2,442ms | AVERAGE | ≤1,800ms |
| TTFB | 1,082ms | AVERAGE | ≤800ms |

### Origin Data (All Pages Combined)

| Metric | Value | Status |
|--------|-------|--------|
| LCP | **4,804ms** | SLOW |
| CLS | 0.40 | SLOW |
| INP | 102ms | FAST |
| FCP | 3,431ms | SLOW |
| TTFB | 1,045ms | AVERAGE |

**Note:** Origin LCP at 4.8 seconds indicates many pages have severe LCP issues beyond the homepage.

---

## LCP Breakdown Analysis

The PSI "LCP Breakdown" insight reveals exactly where time is spent:

| Phase | Duration | % of Total |
|-------|----------|------------|
| Time to First Byte | 1.3ms | 0.03% |
| Resource Load Delay | 976ms | 23% |
| Resource Load Duration | 747ms | 18% |
| **Element Render Delay** | **2,520ms** | **59%** |
| **Total LCP** | **4,244ms** | 100% |

### Root Cause: Element Render Delay (2.5 seconds!)

The 2,520ms element render delay is caused by:
1. **LCP element is CSS background-image** (not `<img>`)
2. Cannot apply `fetchpriority="high"` to CSS backgrounds
3. Must wait for CSSOM to be fully built before loading
4. Render-blocking scripts delay CSS parsing

**PSI explicitly states:** "fetchpriority=high should be applied" = **FALSE**

---

## NEW Findings from NetSuite Backend

### 1. Async Web Fonts DISABLED (1-minute fix!)

**Location:** `Commerce > Configuration > Summit Theme > Web Fonts`

**Current State:**
- ☐ ENABLE WEB FONTS (unchecked)
- ☐ LOAD WEB FONTS SCRIPT ASYNCHRONOUSLY (unchecked)

**Fix:** Check the "LOAD WEB FONTS SCRIPT ASYNCHRONOUSLY" checkbox and Save.

**Impact:** Reduces render-blocking from Google Fonts, faster FCP.

---

### 2. Infoblocks Use JPG Instead of WebP

**Location:** `Commerce > Configuration > Summit Theme > Home > Infoblocks`

**Current State:**
All 8 infoblock images use `.jpg` format:
- `vms_homethumb_tubing_v3.jpg` (MOBILE LCP!)
- `vms_homethumb_vbands_v3.jpg`
- `vms_homethumb_silicone_v3.jpg`
- `vms_homethumb_mandrelbends_v3.jpg`
- `vms_homethumb_o2_v3.jpg`
- `vms_homethumb_pipefittings_v3.jpg`
- `vms_homethumb_flex_v3.jpg`
- `vms_homethumb_bellows_v3.jpg`

**Fix:**
1. Convert all JPGs to WebP format
2. Upload to same location with `.webp` extension
3. Update BACKGROUND IMAGE URL fields in NetSuite config

**Impact:** 30-50% smaller file sizes, faster LCP image loading.

---

### 3. Infoblocks Architecture Forces CSS Background

**Critical Issue:** The Infoblocks feature uses "BACKGROUND IMAGE URL" which renders as CSS `background-image`. This is a SuiteCommerce theme architecture limitation.

**Why This Matters:**
- CSS background-images are invisible to browser preload scanner
- Cannot use `fetchpriority="high"` on CSS backgrounds
- Browser must parse HTML → CSS → discover background → fetch image

**Solutions (in order of complexity):**

**Option A: Convert infoblock image to inline `<img>` tag**
- Requires modifying SCA theme template (`home_infoblock.tpl` or similar)
- Add `<img>` with `fetchpriority="high"` for first infoblock
- Keep CSS background for visual fallback

**Option B: Use different LCP element on mobile**
- Change mobile layout to show carousel hero first (which IS an `<img>`)
- Move infoblocks below fold on mobile

**Option C: Preload the CSS background image (already done)**
- Preload exists but limited benefit for CSS backgrounds
- Browser still waits for render tree before displaying

---

### 4. Cache TTL Only 7,200 Seconds (2 hours)

**Location:** `Commerce > Configuration > Advanced > Cache`

**Current State:**
- CONTENT PAGE CDN: MEDIUM
- CONTENT PAGE TTL: 7,200 (seconds = 2 hours)

**PSI Impact:**
- **1,644 KiB wasted bytes** on repeat visits
- **7,050ms potential LCP savings** from better caching

**Fix Options:**

**Option A: Increase TTL in NetSuite (if available)**
- Change CONTENT PAGE TTL to 31536000 (1 year)
- May require NetSuite support

**Option B: CDN cache rules (Cloudflare/Akamai)**
- Override Cache-Control headers at CDN edge
- Set `max-age=31536000, immutable` for versioned assets

---

## NEW PSI Audit Findings

### 5. Unused JavaScript: 941 KiB (3,750ms LCP savings!)

This is the **single largest opportunity**.

| Script | Total Size | Unused | Waste % |
|--------|-----------|--------|---------|
| (Various) | 1,020 KiB | 941 KiB | 89% |

**Top Contributors:**
- SCA core bundles have significant unused code
- Third-party scripts load code never executed

**Solutions:**
- Code splitting in SCA build (complex)
- Tree-shaking in production build
- Lazy-load non-critical modules

---

### 6. Unused CSS: 188 KiB (1,050ms FCP/LCP savings)

| File | Total | Unused | Waste % |
|------|-------|--------|---------|
| shopping_5.css | 209 KiB | 192 KiB | **92%** |

**Fix:** Critical CSS extraction + lazy-load remainder (Phase 3 fix from original report).

---

### 7. Render-Blocking Requests: 1,460ms FCP savings

| Resource | Size | Blocking |
|----------|------|----------|
| shopping-templates_5.js | 256 KiB | Yes |
| shopping_5.js | 344 KiB | Yes |
| cms.js | 53 KiB | Yes |
| shopping_5.css | 209 KiB | 1,213ms |
| shopping_en_US.js | 10 KiB | Yes |

**Impact:** 1,460ms potential savings.

---

### 8. JavaScript Execution Time: 2.6 seconds

| Script | Execution Time |
|--------|---------------|
| shopping.js | 715ms |
| Main document | 530ms |
| Unattributable | 367ms |
| GTM container | 287ms |
| gtag AW-11060543839 | 272ms |
| gtag G-MDZKSYLJ1B | 248ms |
| gtag G-862KMNBJX6 | 231ms |
| shopping-templates_5.js | 180ms |
| shopping_5.js | 180ms |
| fbevents.js | 128ms |

**Actionable:** Remove old GA4 (G-MDZKSYLJ1B) saves 248ms immediately.

---

### 9. Long Tasks: 19 Found (1,650ms TBT impact)

| Task | Script | Duration |
|------|--------|----------|
| 1 | gtag AW-11060543839 | 270ms |
| 2 | gtag G-862KMNBJX6 | 230ms |
| 3 | shopping-templates_5.js | 216ms |
| 4 | Main document | 210ms |
| 5 | gtag G-862KMNBJX6 | 207ms |
| 6 | shopping_5.js | 203ms |

**All long tasks >50ms block the main thread and delay interactivity.**

---

### 10. Image Optimization Opportunities: 123 KiB (300ms LCP)

| Image | Current Size | Wasted | Issue |
|-------|-------------|--------|-------|
| vms_homepage_freshproducemfg_headers.jpg | 87 KiB | 54 KiB | Oversized |
| UltimateFabWarehouse_top_backdrop.webp | 36 KiB | 22 KiB | 1170x400 displayed at 721x246 |
| vms_meetmenace_home.webp | 29 KiB | 18 KiB | Same oversizing issue |

**Fix:**
- Create responsive image variants (srcset)
- Serve correctly-sized images for viewport
- Use `sizes` attribute to specify display dimensions

---

### 11. Minification Opportunity: 125 KiB

JavaScript files have 125 KiB saveable through proper minification.

**Check:** Run `gulp deploy` with production minification enabled.

---

### 12. Total Page Weight: 3,289 KiB

**Top Resources by Size:**

| Resource | Size |
|----------|------|
| shopping.js | 375 KiB |
| shopping_5.js | 344 KiB |
| shopping-templates_5.js | 256 KiB |
| shopping_5.css | 209 KiB |
| fontawesome-webfont.woff | 202 KiB |
| gtag G-MDZKSYLJ1B | 158 KiB |
| gtag G-862KMNBJX6 | 157 KiB |
| gtm.js | 155 KiB |
| gtag AW-11060543839 | 139 KiB |
| Facebook signals | 125 KiB |

**Removable:** gtag G-MDZKSYLJ1B (158 KiB) + Facebook (125 KiB) + gtag consolidation = **~450 KiB**

---

## Prioritized Action Plan (NEW Items)

### Immediate (Today) — NetSuite Config Changes

| # | Action | Location | Time |
|---|--------|----------|------|
| 1 | Enable async web fonts | Summit Theme > Web Fonts | 1 min |
| 2 | Clear old GA4 ID | Integrations > GA4 | 1 min |
| 3 | Convert infoblock images to WebP | Summit Theme > Home > Infoblocks | 30 min |

### This Week — Template Changes

| # | Action | Impact |
|---|--------|--------|
| 4 | Convert mobile LCP infoblock to `<img>` tag | 2,000ms+ LCP reduction |
| 5 | Add preconnect hints to shopping.ssp | 100-300ms per origin |
| 6 | Remove standalone gtag.js scripts | 300+ KiB JS removed |

### Next Sprint — Architecture

| # | Action | Impact |
|---|--------|--------|
| 7 | Increase cache TTL (CDN or NetSuite) | 1,644 KiB repeat visit savings |
| 8 | Implement responsive images (srcset) | 123 KiB image savings |
| 9 | Extract critical CSS | 188 KiB deferred, 1,050ms savings |

---

## Expected Outcomes After All Fixes

| Metric | Current | After Quick Wins | After All Fixes |
|--------|---------|------------------|-----------------|
| LCP (Mobile) | 3,314ms | ~2,800ms | **~1,800-2,200ms** |
| CLS (Mobile) | 0.75 | ~0.50 | **~0.05-0.10** |
| Performance Score | 38 | 50-55 | **65-75** |
| GSC Status | 0% Good | 20% Good | **80%+ Good** |

---

## Sources

- [SuiteCommerce Performance Optimization Guide](https://tavanoteam.com/suitecommerce-advanced/suitecommerce-performance-optimization-guide/)
- [SuiteCommerce Advanced Performance Checklist](https://developers.suitecommerce.com/assets/Performance_Checklist_2.8_EXTERNAL.pdf)
- [5 Performance Fixes Every SuiteCommerce Site Should Apply](https://www.brokenrubik.com/blog/5-performance-fixes-every-suitecommerce-site-should-apply-today)
- [Google's Core Web Vitals Update and Ecommerce SEO](https://developers.suitecommerce.com/what-googles-core-web-vitals-update-means-for-ecommerce-seo.html)

---

*Report generated: March 5, 2026*
*Research method: PSI API v5 analysis + Chrome DevTools + NetSuite backend exploration*
