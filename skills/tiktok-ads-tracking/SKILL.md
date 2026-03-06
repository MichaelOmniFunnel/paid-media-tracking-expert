---
name: TikTok Ads Tracking
description: Implementation reference for TikTok Pixel, Events API, Advanced Matching, Catalog and Shop integration, Spark Ads tracking, and Smart+ campaigns
---

# TikTok Ads Tracking Implementation

## TikTok Pixel Base Code

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

TikTok uses different event names than Meta and Google. Case sensitivity matters.

```javascript
// View content
ttq.track("ViewContent", {
  content_id: "SKU-001",
  content_type: "product",
  content_name: "Product Name",
  value: 59.99,
  currency: "USD"
});

// Add to cart
ttq.track("AddToCart", {
  content_id: "SKU-001",
  content_type: "product",
  value: 59.99,
  currency: "USD",
  quantity: 1
});

// Place order / initiate checkout
ttq.track("PlaceAnOrder", {
  content_id: "SKU-001",
  content_type: "product",
  value: 119.98,
  currency: "USD",
  quantity: 2
});

// Complete payment (purchase)
ttq.track("CompletePayment", {
  content_id: "SKU-001",
  content_type: "product",
  value: 119.98,
  currency: "USD",
  quantity: 2
});

// Lead form submission
ttq.track("SubmitForm", {
  content_name: "Contact Form",
  value: 50.00,
  currency: "USD"
});

// Registration
ttq.track("CompleteRegistration", {
  content_name: "Account Signup"
});

// Subscribe
ttq.track("Subscribe", {
  content_name: "Newsletter",
  value: 0,
  currency: "USD"
});

// Download
ttq.track("Download", {
  content_name: "Whitepaper",
  content_id: "WP-001"
});

// Search
ttq.track("Search", {
  query: "search term",
  content_type: "product"
});

// Add to wishlist
ttq.track("AddToWishlist", {
  content_id: "SKU-001",
  content_type: "product",
  value: 59.99,
  currency: "USD"
});
```

### Event Name Mapping (TikTok vs Meta vs Google)

| User Action | TikTok Event | Meta Event | GA4 Event |
|-------------|-------------|------------|-----------|
| View a product | ViewContent | ViewContent | view_item |
| Add to cart | AddToCart | AddToCart | add_to_cart |
| Start checkout | PlaceAnOrder | InitiateCheckout | begin_checkout |
| Complete purchase | CompletePayment | Purchase | purchase |
| Submit a lead form | SubmitForm | Lead | generate_lead |
| Create an account | CompleteRegistration | CompleteRegistration | sign_up |
| Subscribe | Subscribe | Subscribe | N/A (custom) |
| Search | Search | Search | search |
| Add to wishlist | AddToWishlist | AddToWishlist | add_to_wishlist |

---

## Advanced Matching

Advanced Matching sends hashed user data with pixel events to improve match rates. TikTok accepts the data in plaintext (it hashes automatically) or pre-hashed with SHA-256.

### All Available Matching Parameters

```javascript
ttq.identify({
  email: "user@example.com",              // Email address (auto-hashed or pre-hash with SHA-256)
  phone_number: "+11234567890",            // Phone with country code (auto-hashed or pre-hash)
  external_id: "USER-12345",              // Your internal user ID (auto-hashed or pre-hash)
  first_name: "John",                     // First name (auto-hashed)
  last_name: "Doe",                       // Last name (auto-hashed)
  city: "Los Angeles",                    // City (auto-hashed)
  state: "CA",                            // State/province code (auto-hashed)
  country: "US",                          // Two-letter country code (auto-hashed)
  zip_code: "90001"                       // Zip/postal code (auto-hashed)
});
```

**Important rules for Advanced Matching:**

- Call `ttq.identify()` before any `ttq.track()` events in the same page session
- If user data is not available on initial page load (e.g., guest browsing), call identify when the data becomes available (e.g., after login or form fill)
- Pre-hashed values must use SHA-256 with lowercase hex encoding
- Phone numbers must include country code and contain only digits and the leading plus sign
- Email addresses must be lowercase and trimmed before hashing

### Advanced Matching on Form Submissions

```javascript
// ES5 compatible. Capture form data and identify before tracking.
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
      value: 50.00,
      currency: "USD"
    });
  });
})();
```

---

## TikTok Events API (Server-Side)

### Full API Request Structure

```json
POST https://business-api.tiktok.com/open_api/v1.3/event/track/
Headers: {
  "Content-Type": "application/json",
  "Access-Token": "YOUR_ACCESS_TOKEN"
}
{
  "pixel_code": "PIXEL_ID",
  "event": "CompletePayment",
  "event_id": "unique-event-id-123",
  "timestamp": "2025-01-15T10:30:00Z",
  "context": {
    "user_agent": "Mozilla/5.0...",
    "ip": "1.2.3.4",
    "page": {
      "url": "https://example.com/thank-you",
      "referrer": "https://example.com/checkout"
    },
    "ad": {
      "callback": "TTCLID_VALUE"
    },
    "user": {
      "email": "SHA256_HASHED_EMAIL",
      "phone": "SHA256_HASHED_PHONE",
      "external_id": "SHA256_HASHED_ID",
      "first_name": "SHA256_HASHED_FIRST_NAME",
      "last_name": "SHA256_HASHED_LAST_NAME",
      "city": "SHA256_HASHED_CITY",
      "state": "SHA256_HASHED_STATE",
      "country": "SHA256_HASHED_COUNTRY",
      "zip_code": "SHA256_HASHED_ZIP"
    }
  },
  "properties": {
    "contents": [{
      "content_id": "SKU-001",
      "content_type": "product",
      "content_name": "Product Name",
      "quantity": 2,
      "price": 59.99,
      "content_category": "Category Name",
      "brand": "Brand Name"
    }],
    "value": 119.98,
    "currency": "USD",
    "order_id": "TXN-12345",
    "query": "search term if applicable"
  }
}
```

### Events API Advanced Matching: All Available Fields

Every field in `context.user` must be SHA-256 hashed (lowercase hex). The API does NOT auto-hash like the browser pixel does.

| Field | Key | Format Before Hashing | Example |
|-------|-----|----------------------|---------|
| Email | email | lowercase, trimmed | user@example.com |
| Phone | phone | digits with country code, no formatting | 11234567890 |
| External ID | external_id | your raw user ID string | USER-12345 |
| First Name | first_name | lowercase, trimmed | john |
| Last Name | last_name | lowercase, trimmed | doe |
| City | city | lowercase, no punctuation | los angeles |
| State | state | two-letter code, lowercase | ca |
| Country | country | two-letter ISO code, lowercase | us |
| Zip Code | zip_code | digits only (for US, first 5) | 90001 |

### Events API Deduplication

The event_id must match between the browser pixel and Events API call for the same user action.

```javascript
// ES5 compatible. Browser side with event_id.
var eventId = "tt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8);
ttq.track("CompletePayment", {
  value: 119.98,
  currency: "USD"
}, { event_id: eventId });

// Server side: same event_id in the API payload
// The server reads event_id from the dataLayer or from the incoming
// GA4 transport request and maps it to the Events API payload.
```

TikTok's deduplication window is 48 hours. If both events arrive with the same event_id within 48 hours, only one is counted.

### ttclid Capture for Server-Side Attribution

The ttclid parameter is appended to URLs when a user clicks a TikTok ad. It must be captured and stored, then passed to the Events API in the `context.ad.callback` field.

```javascript
// ES5 compatible. Capture ttclid from URL and store in cookie.
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

---

## Consent Management

```javascript
// Hold consent until user decision
ttq.holdConsent();

// Grant after user accepts
ttq.grantConsent();

// Revoke if user declines
ttq.revokeConsent();
```

When holdConsent() is called before the pixel loads, no data is sent until grantConsent() is explicitly called. This is required for GDPR compliance. For the server-side Events API, consent must be checked before making API calls since the API itself has no consent mechanism built in.

---

## TikTok Catalog and Shop Integration

### Product Feed Requirements

TikTok Catalog requires a product data feed that meets their specifications. Feeds can be uploaded via file upload, URL fetch, or API.

**Required fields:**

| Field | Description | Example |
|-------|-------------|---------|
| sku_id | Unique product identifier | SKU-001 |
| title | Product name (max 255 chars) | Blue Running Shoes |
| description | Product description (max 10000 chars) | Lightweight running shoes... |
| availability | in stock, out of stock, preorder | in stock |
| condition | new, refurbished, used | new |
| price | Price with currency | 59.99 USD |
| image_link | Main product image URL (min 500x500) | https://... |
| landing_page_url | Product page URL | https://... |

**Recommended fields for better performance:**

| Field | Description | Why It Matters |
|-------|-------------|---------------|
| sale_price | Discounted price | Enables sale badges in ads |
| brand | Brand name | Filtering and targeting |
| google_product_category | Standard taxonomy | Better classification |
| product_type | Your own category path | Custom reporting |
| item_group_id | Parent SKU for variants | Groups color/size variants |
| additional_image_link | Extra images | More creative options |
| age_group | Target age group | Compliance and targeting |
| gender | Target gender | Audience matching |
| color | Product color | Filter and variant grouping |
| size | Product size | Filter and variant grouping |
| custom_label_0 through 4 | Custom segmentation | POAS tiers, margin groups |

### Matching Pixel Events to Catalog

The content_id in pixel events must exactly match the sku_id in the product feed. This is the single most common failure point in TikTok catalog ads. If these do not match, Dynamic Showcase Ads (DSA) cannot render the correct products.

```javascript
// The content_id here must match sku_id in the feed exactly
ttq.track("ViewContent", {
  content_id: "SKU-001",    // Must match feed sku_id
  content_type: "product",  // Must be "product" for catalog matching
  content_name: "Blue Running Shoes",
  value: 59.99,
  currency: "USD"
});
```

### Feed Format and Delivery

TikTok accepts feeds in the following formats:
- CSV (comma-separated)
- TSV (tab-separated)
- XML (Google Merchant Center format is accepted)
- JSON feed

For ecommerce clients already running Google Shopping, the Google Merchant Center feed can often be reused for TikTok with minor modifications. The primary difference is that TikTok uses `sku_id` instead of Google's `id` field. Map accordingly.

Feed refresh schedule: set to at least daily. For clients with frequently changing inventory or prices, every 6 hours is preferred. Stale feed data causes disapproved products and incorrect pricing in ads.

### TikTok Shop Considerations

For clients using TikTok Shop (in-app commerce), tracking works differently:

- TikTok Shop transactions happen within the TikTok app, so browser pixel does not apply
- TikTok provides its own analytics for Shop transactions
- Attribution for Shop sales is handled natively by TikTok
- When a client sells both on their website and TikTok Shop, you need to reconcile both data sources to avoid double-counting revenue
- TikTok Shop revenue should be separated in reporting to understand true website ROAS vs total ROAS

---

## Audience Targeting Deep Dive

### Custom Audiences

Custom audiences are built from your own data and are critical for retargeting and exclusion.

**Pixel-based audiences:**
- Website visitors (all or specific pages)
- Event-based: users who triggered specific events (ViewContent, AddToCart, CompletePayment)
- Time-based: visitors in the last 7, 14, 30, 60, or 180 days
- Engagement-based: time on site thresholds

**Customer file audiences:**
- Upload hashed emails, phone numbers, or mobile advertiser IDs
- Minimum audience size: 1,000 matched users
- Update frequency: refresh monthly at minimum to keep audiences current

**App activity audiences:**
- Users who installed, opened, or took actions in your mobile app
- Requires TikTok SDK integration

**Engagement audiences:**
- Users who interacted with your TikTok content (video views, profile visits, likes, shares)
- Available for organic and paid content
- Useful for building warm audiences from Spark Ads engagement

### Lookalike Audiences

Lookalike audiences find users similar to your seed audience.

- Seed audience minimum: 100 users (1,000+ recommended for quality)
- Three size options: Narrow (top 1% to 2% similar), Balanced (top 3% to 5% similar), Broad (top 5% to 10% similar)
- Best seed audiences: purchasers, high-value customers, repeat buyers
- Avoid using broad seed audiences (all website visitors) as the signal is too diluted
- Refresh lookalikes when the seed audience grows by 20% or more

### Interest and Behavior Targeting

**Interest categories** are based on user engagement patterns with content on TikTok. These are broad categories like Apparel, Automotive, Beauty, Food, Sports, Technology, etc.

**Behavioral targeting** is based on specific actions:
- Video interactions: watched, liked, commented, shared specific content categories
- Creator interactions: followed creators in specific categories
- Hashtag interactions: engaged with specific hashtags

**Purchase intent signals:**
- Users who have shown shopping behavior on TikTok
- Users who have clicked on product links
- Users who have engaged with TikTok Shop content

### Audience Strategy Best Practices

- Start with broad targeting on TikTok and let the algorithm find your audience
- Layer interest targeting only if broad is not performing after sufficient spend ($500+ with no conversions)
- Use custom audiences for retargeting and exclusion, not as primary prospecting audiences
- Exclude recent purchasers (30 to 60 day window) from prospecting campaigns
- For lookalikes, test Narrow vs Balanced and let performance data decide

---

## Spark Ads Tracking Considerations

Spark Ads use organic TikTok posts (from the advertiser or a creator) as the ad creative. Tracking has specific nuances.

### How Spark Ads Attribution Works

- Spark Ads use the advertiser's pixel for conversion tracking, not the creator's
- When a user clicks a Spark Ad CTA, they land on the advertiser's website with ttclid attached
- In-app engagement (likes, comments, follows) is attributed to the campaign but does not trigger website pixel events
- Video views on Spark Ads are tracked within TikTok analytics, not via the website pixel

### Tracking Setup for Spark Ads

1. Ensure the pixel is installed on the advertiser's landing page (same as regular ads)
2. ttclid capture must be working (see section above)
3. Events API should be running server-side for conversion recovery
4. Separate Spark Ads into their own campaign or ad group if you want to isolate performance from standard video ads

### Creator Collaboration Tracking

When working with content creators for Spark Ads:

- Creators provide an authorization code that grants the advertiser permission to use their post
- The authorization code is entered in TikTok Ads Manager when creating the Spark Ad
- All paid media metrics (impressions, clicks, conversions, spend) appear in the advertiser's Ads Manager
- Organic metrics (likes, comments, shares, follows) appear in both the creator's and advertiser's dashboards
- For performance analysis, separate organic engagement lift from paid conversion performance

### UTM Strategy for Spark Ads

Use distinct UTM parameters to differentiate Spark Ads from standard video ads in GA4:

```
utm_source=tiktok
utm_medium=paid_social
utm_campaign={{campaign_name}}
utm_content=spark_{{creator_handle}}_{{post_id}}
```

---

## Conversion Window Optimization

### TikTok Attribution Windows

TikTok offers configurable attribution windows:

- Click attribution: 1 day, 7 days (default), 14 days, 28 days
- View-through attribution: off, 1 day (default), 7 days

### When to Adjust Windows

**Shorter click windows (1 day or 7 days):**
- Products with short consideration cycles (impulse buys, low-cost items)
- When trying to align TikTok reporting with GA4 (which defaults to 30 day click, 0 day view)
- When TikTok is over-claiming conversions relative to blended data

**Longer click windows (14 day or 28 day):**
- Products with longer consideration cycles (high-ticket items, B2B, services)
- When TikTok is under-reporting and you have blended data showing TikTok is driving more than reported
- When comparing directly to Meta's 7 day click/1 day view window

**View-through considerations:**
- View-through attribution can inflate reported conversions significantly on TikTok since video completion rates are high
- OFM default: 7 day click / 1 day view-through for ecommerce, 7 day click / off for lead gen
- Always compare TikTok reported conversions against blended ROAS to calibrate

---

## Creative Performance Metrics Unique to TikTok

TikTok's creative metrics differ from other platforms due to the short-form video format.

### Key Creative Metrics

| Metric | Definition | Good Benchmark | What It Tells You |
|--------|-----------|----------------|-------------------|
| Thumb-stop rate | (Video views / Impressions) x 100 | Above 25% | Whether the first frame captures attention |
| Average watch time | Mean seconds watched per view | Above 5 seconds | Whether the hook works beyond first frame |
| Video completion rate | (Full views / Total views) x 100 | Above 15% for 15s, above 5% for 60s | Whether the full message lands |
| 2-second view rate | (2s+ views / Impressions) x 100 | Above 40% | Quick filter for hook quality |
| 6-second view rate | (6s+ views / Impressions) x 100 | Above 20% | Mid-point engagement check |
| CTR (all clicks) | (All clicks / Impressions) x 100 | Above 1.5% | Total engagement including profile, share |
| CTR (destination) | (Link clicks / Impressions) x 100 | Above 0.8% | Traffic quality to landing page |
| Engagement rate | (Likes + Comments + Shares) / Impressions | Above 3% | Content resonance signal |
| Share rate | Shares / Impressions | Above 0.5% | Organic amplification potential |

### Creative Fatigue Indicators

- CTR declining week over week while frequency increases
- Average watch time dropping below 3 seconds
- CPM increasing without seasonal explanation
- Engagement rate declining below 1%
- Frequency above 4.0 on the same audience

When creative fatigue is detected, the solution is new creative, not audience changes. TikTok is a creative-first platform.

### Creative Testing Framework

- Test 3 to 5 creative variations per ad group
- Let each creative reach at least 1,000 impressions before making decisions
- Kill creatives with thumb-stop rate below 15% after 2,000 impressions
- Scale creatives with above-average watch time AND below-average CPA
- Rotate new creative every 2 to 3 weeks even for top performers

---

## Smart+ Campaigns (Performance Automation)

Smart+ (previously known as Smart Performance Campaigns) is TikTok's automated campaign type that handles targeting, bidding, and creative selection.

### Tracking Requirements for Smart+

Smart+ campaigns are especially dependent on strong conversion data because the automation relies on real-time signals.

- Minimum: 50 conversions per week for the optimization event
- Recommended: 100+ conversions per week for stable performance
- Events API (server-side) is strongly recommended to maximize signal volume
- Advanced Matching must be configured (email at minimum) for user matching
- Product catalog must be connected if running Smart+ Shopping campaigns

### Smart+ Campaign Types

**Smart+ Web Campaigns:**
- Optimizes for website conversions (CompletePayment, SubmitForm, etc.)
- Requires pixel and Events API with sufficient conversion volume
- Automatically tests audiences, placements, and creative combinations

**Smart+ Catalog Campaigns:**
- Dynamic product ads powered by your product feed
- Requires catalog feed with content_id matching pixel events
- Automatically creates video ads from product images
- Best for ecommerce with 50+ products

**Smart+ App Campaigns:**
- Optimizes for app installs and in-app events
- Requires TikTok SDK integration

### Monitoring Smart+ Performance

- Check conversion volume daily during the first two weeks
- If conversions drop below 50/week, the campaign will struggle to optimize
- Watch for CPA volatility in the first 7 days (this is expected during learning)
- Do not make changes during the learning phase (similar to Meta)
- If CPA is 2x target after 2 weeks with sufficient data, pause and restructure

---

## Debugging with TikTok Events Manager

### Accessing the Events Manager

TikTok Events Manager is found in TikTok Ads Manager > Assets > Events.

### Overview Dashboard

The overview shows:
- Total events received (browser + server) over time
- Event breakdown by name
- Match rate: percentage of events matched to a TikTok user
- Deduplication rate: what percentage of events are being deduplicated

### Diagnostics Tab

The diagnostics tab shows:
- Connection status for browser pixel and Events API
- Data freshness: when the last event was received
- Parameter completeness: which user data fields are being sent
- Recommendations for improving match quality

### Test Events Tool

**How to use the Test Events tool:**

1. Go to Events Manager > select your pixel > Test Events tab
2. Enter your website URL
3. Click "Test" to open your site in a new tab
4. Perform actions on your site (view product, add to cart, purchase)
5. Return to TikTok Events Manager to see events arriving in real time
6. Verify:
   - Correct event names
   - All expected parameters present (value, currency, content_id)
   - User data parameters present (email, phone)
   - event_id present (for deduplication)
   - Server events arriving alongside browser events

### Common Debugging Scenarios

**Events not showing in Events Manager:**
1. Check that the pixel code is loading on the page (look for analytics.tiktok.com in Network tab)
2. Verify the pixel ID is correct
3. Check for JavaScript errors that might prevent the pixel from initializing
4. Confirm consent has been granted if using holdConsent()
5. For Events API: verify access token is valid and not expired

**Events showing but with low match rate:**
1. Advanced Matching is not configured or not sending data
2. Email/phone fields are empty at the time identify() is called
3. Phone numbers are not formatted correctly (missing country code)
4. ttclid is not being captured from the URL

**Duplicate events appearing:**
1. event_id is missing on browser events, server events, or both
2. event_id values do not match between browser and server
3. Multiple pixels are installed on the same page
4. GTM triggers are firing more than once per user action

---

## TikTok-Specific Naming and Behavior

- TikTok uses `CompletePayment` (not `Purchase` like Meta)
- `PlaceAnOrder` is checkout initiation (not `InitiateCheckout`)
- `SubmitForm` is the lead event (not `Lead`)
- Event names are case-sensitive: `CompletePayment` works, `completepayment` does not
- TikTok's default attribution is 7 day click / 1 day view (different from Meta's 7/1 and Google's 30 day)
- Smart+ campaigns require robust conversion data to function; they will not optimize well with sparse data
- TikTok's algorithm is heavily creative-dependent: poor creative will not be saved by good targeting
- Video ads under 15 seconds tend to outperform longer formats for direct response, while 30 to 60 seconds works better for consideration

---

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No Advanced Matching | Poor user matching, higher CPAs | Add identify() calls with email and phone |
| Using wrong event names | Events not recognized by TikTok | Map to exact TikTok standard event names |
| No Events API | Losing conversions to browser blocking | Implement server-side via Stape |
| No event_id dedup | Double counting with browser + API | Add matching event_id to both sides |
| Missing value/currency | Cannot optimize for ROAS | Pass dynamic values on all commerce events |
| Pixel loads late | Missed page_view events | Load pixel in head section |
| No ttclid capture | Cannot attribute server events to clicks | Capture ttclid from URL into cookie |
| content_id mismatch | Catalog ads show wrong products | Ensure pixel content_id matches feed sku_id |
| Expired access token | Server events stop arriving silently | Monitor token expiry, refresh proactively |
| Creative fatigue | Rising CPAs, declining engagement | Rotate creative every 2 to 3 weeks |
