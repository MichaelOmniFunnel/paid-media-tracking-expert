# UTM Debugging and Encoding Reference

## URL Encoding Issues

### Problematic Characters

| Character | Problem | Solution |
|-----------|---------|----------|
| Space | Breaks URL or becomes %20 or + | Use underscores instead |
| & | Interpreted as parameter separator | Never use in values; use "and" |
| = | Interpreted as key-value separator | Never use in values |
| # | Interpreted as fragment identifier | Never use in values |
| % | Starts a percent-encoded sequence | Never use in values |
| + | Interpreted as space in some contexts | Use underscores instead |
| Curly braces {} | Can conflict with dynamic parameters | Avoid in static values |

### Platform Encoding Behavior

- **Google Ads:** ValueTrack parameters are URL-encoded automatically
- **Meta Ads:** Dynamic parameters are URL-encoded, but campaign/ad names with certain characters can still cause issues. Clean campaign names at the source
- **TikTok Ads:** Dynamic macros are URL-encoded, but the same caveat applies

### Prevention Strategy

Avoid problematic characters in campaign, ad set, and ad names entirely:
- Use only letters, numbers, and underscores in naming
- No spaces, ampersands, percent signs, or special characters
- This makes the URL encoding question irrelevant

---

## Debugging Playbooks

### Symptom: Platform Reports More Clicks Than GA4 Reports Sessions

**Common causes:**
1. UTM parameters are being stripped by redirects or link shorteners
2. Landing page has a redirect that drops query parameters
3. Users click but page does not fully load (slow page, user bounces before GA4 fires)
4. Bot traffic is filtered by GA4 but counted by the ad platform
5. Cross-domain tracking is not configured and UTMs are lost on domain transitions
6. Auto-tagging is overriding UTMs, so traffic appears under "google / cpc" instead of expected source

**Diagnostic steps:**
1. Click a test ad and verify the landing page URL contains UTM parameters in the browser address bar
2. Check for server-side redirects (301/302) that strip query parameters
3. Open GA4 Realtime report and verify the session appears with correct source/medium
4. In GA4 > Explore, create a free-form report with Session source, Session medium, and Landing page to see where sessions are actually attributed

### Symptom: Sessions Appear as (direct) / (none) Instead of Expected Source

**Common causes:**
1. UTM parameters are malformed (missing utm_source or utm_medium)
2. Referrer is being stripped (certain browser privacy settings)
3. A meta refresh or JavaScript redirect drops the query string
4. Site uses a single-page application (SPA) that does not properly handle URL parameters on navigation
5. GA4 measurement ID is incorrect or GTM is not firing on the landing page

### Symptom: Same Campaign Appears Multiple Times in GA4 Reports

**Common causes:**
1. Inconsistent capitalization: "Spring_Sale" vs "spring_sale" vs "Spring_sale"
2. Trailing spaces in campaign names
3. Different URL encoding: "spring%20sale" vs "spring_sale"
4. Multiple people managing UTMs without a shared standard

**Fix:** Enforce the OFM naming convention from the start. For existing data, use GA4 data filters or Looker Studio calculated fields to normalize.

### Symptom: Google Ads Data in GA4 Does Not Match Google Ads Reports

**Common causes:**
1. GA4 uses session-based attribution; Google Ads uses click-based
2. GA4 attributes to last non-direct click by default; Google Ads attributes to its own clicks
3. Conversion counting differs: GA4 counts "events" while Google Ads may count "one per click" or "every"
4. Time zone differences between GA4 property and Google Ads account
5. GA4 linking is not properly configured (Admin > Google Ads Linking)

**This is expected behavior.** Numbers will never match exactly. The discrepancy should be consistent (typically 10% to 30%). If it exceeds 40%, investigate linking and auto-tagging configuration.
