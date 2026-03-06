---
name: utm-strategy
description: UTM naming conventions, dynamic parameter generation per platform, GA4 attribution logic, auto-tagging vs manual tagging, and UTM debugging. Use when someone mentions UTMs, campaign tracking parameters, where traffic is coming from, attribution confusion, or UTM naming conventions.
model: sonnet
---

# UTM Strategy for Paid Media

## UTM Parameter Fundamentals

UTM (Urchin Tracking Module) parameters are query string parameters appended to URLs that tell analytics platforms where traffic came from. GA4 uses these parameters to attribute sessions and conversions to the correct campaigns.

### The Five Standard UTM Parameters

| Parameter | Purpose | Required | Example |
|-----------|---------|----------|---------|
| utm_source | Identifies the platform or publisher | Yes | google, facebook, tiktok, newsletter |
| utm_medium | Identifies the marketing channel | Yes | cpc, paid_social, email, organic_social |
| utm_campaign | Identifies the specific campaign | Yes | spring_sale_2026, brand_awareness_q1 |
| utm_content | Differentiates ad variations or links | No | red_banner, video_testimonial, cta_v2 |
| utm_term | Identifies the keyword (search campaigns) | No | running_shoes, best_crm_software |

### GA4 Additional Parameters

GA4 also recognizes these non-standard parameters:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| utm_source_platform | Identifies the platform tool used | Google Ads, Meta Ads Manager |
| utm_creative_format | Identifies the creative format | video, image, carousel |
| utm_marketing_tactic | Identifies the marketing tactic | prospecting, retargeting |

---

## OFM Naming Conventions

Consistency is everything. Every client should follow a standardized naming convention from day one. Once UTM values are in GA4, they cannot be retroactively cleaned up.

### General Rules

- All lowercase, always. GA4 is case-sensitive: "Facebook" and "facebook" are different sources
- Use underscores for spaces, never hyphens (per OFM writing standards) or actual spaces
- No special characters except underscores
- Keep values descriptive but concise
- Never include client-identifying information in UTM values (no account IDs or internal codes that are meaningless in reports)

### Standard Source Values

| Platform | utm_source Value |
|----------|-----------------|
| Google Ads (Search) | google |
| Google Ads (Shopping/PMax) | google |
| Meta Ads | facebook |
| Instagram Ads | instagram (or facebook if managed through Meta Ads Manager) |
| TikTok Ads | tiktok |
| Microsoft Ads (Bing) | bing |
| LinkedIn Ads | linkedin |
| Pinterest Ads | pinterest |
| Email (Klaviyo) | klaviyo |
| Email (other) | email |
| Organic Social | facebook, instagram, tiktok, linkedin (match the platform) |

### Standard Medium Values

| Channel | utm_medium Value |
|---------|-----------------|
| Paid search | cpc |
| Paid social | paid_social |
| Display advertising | display |
| Video advertising | video |
| Shopping/PMax | cpc (Google auto-tags with this) |
| Email marketing | email |
| Organic social | organic_social |
| Referral | referral |
| Affiliate | affiliate |
| SMS marketing | sms |

### Campaign Naming Pattern

Use a consistent pattern across all platforms:

```
[platform]_[objective]_[audience]_[detail]
```

Examples:
- `google_search_brand_exact`
- `facebook_conversions_prospecting_spring2026`
- `tiktok_traffic_lookalike_video_test`
- `google_pmax_all_products`
- `bing_search_nonbrand_services`

---

## Platform-Specific Dynamic Parameters

Each ad platform supports dynamic URL parameters (macros) that are automatically replaced with actual values when the ad is clicked. This eliminates manual UTM maintenance and ensures accuracy.

### Google Ads ValueTrack Parameters

Google Ads ValueTrack parameters are enclosed in curly braces and are replaced at click time.

**Most useful ValueTrack parameters:**

| Parameter | What It Returns | Example Output |
|-----------|----------------|----------------|
| {campaignid} | Campaign ID number | 12345678 |
| {campaign} | Campaign name | Spring_Sale_2026 |
| {adgroupid} | Ad group ID number | 87654321 |
| {adgroup} | Ad group name (not available in all types) | Brand_Exact |
| {creative} | Ad creative ID | 555666777 |
| {keyword} | Matched keyword (Search only) | running shoes |
| {matchtype} | Keyword match type | b, p, or e (broad, phrase, exact) |
| {network} | Network (Search vs Display) | g (Google Search), s (Search Partner), d (Display) |
| {device} | Device type | c (computer), m (mobile), t (tablet) |
| {placement} | Placement URL (Display only) | www.example.com |
| {loc_physical_ms} | User's physical location (geo ID) | 9061285 |
| {feeditemid} | Feed item ID (extensions) | 999888 |
| {targetid} | Target ID (audience, keyword, etc.) | kwd-12345 |
| {lpurl} | Final URL (for use in tracking templates) | https://example.com/page |

**Recommended Google Ads tracking template:**

Set this at the account level in Google Ads > Settings > Tracking:

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={creative}&utm_term={keyword}&matchtype={matchtype}&network={network}&device={device}&adgroupid={adgroupid}&campaignid={campaignid}
```

**Using custom parameters ({_campaign}):**

Google Ads supports custom parameters (prefixed with underscore) that you define at the campaign, ad group, or ad level. The `{_campaign}` parameter lets you set a clean, readable campaign name instead of using the raw `{campaign}` ValueTrack which returns the exact campaign name including any characters that might cause encoding issues.

Set custom parameters in Google Ads > Campaign/Ad Group > Settings > Custom Parameters:
- Key: campaign
- Value: spring_sale_2026

### Meta Ads Dynamic URL Parameters

Meta supports dynamic URL parameters in the URL Parameters field at the ad level.

**Available dynamic parameters:**

| Parameter | What It Returns | Example Output |
|-----------|----------------|----------------|
| {{campaign.id}} | Campaign ID | 23456789012345 |
| {{campaign.name}} | Campaign name | Spring Sale 2026 |
| {{adset.id}} | Ad set ID | 34567890123456 |
| {{adset.name}} | Ad set name | LAL 1% Purchasers |
| {{ad.id}} | Ad ID | 45678901234567 |
| {{ad.name}} | Ad name | Video Testimonial v2 |
| {{placement}} | Placement | Facebook_Mobile_Feed |
| {{site_source_name}} | Publisher platform | fb, ig, msg, an |

**Recommended Meta URL parameters (set at ad level):**

```
utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}
```

**Important Meta-specific notes:**
- Meta's dynamic parameters use double curly braces: `{{param}}`
- The URL Parameters field automatically appends these to the destination URL; do not include a `?` in the parameters field
- If the destination URL already has query parameters, Meta handles the `?` vs `&` joining
- Campaign and ad set names with special characters will be URL-encoded automatically
- Always include campaign_id, adset_id, and ad_id as separate non-UTM parameters for precise troubleshooting

### TikTok Ads Dynamic Macros

TikTok supports dynamic macros using double underscores.

**Available dynamic macros:**

| Macro | What It Returns | Example Output |
|-------|----------------|----------------|
| __CAMPAIGN_ID__ | Campaign ID | 7891234567890 |
| __CAMPAIGN_NAME__ | Campaign name | Spring_Sale |
| __AID__ | Ad group ID | 7891234567891 |
| __AID_NAME__ | Ad group name | LAL_Purchasers |
| __CID__ | Creative ID | 7891234567892 |
| __CID_NAME__ | Creative name | UGC_Review_v1 |
| __PLACEMENT__ | Placement | TikTok |
| __OS__ | Operating system | Android, iOS |

**Recommended TikTok URL parameters:**

```
utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__&campaign_id=__CAMPAIGN_ID__&adgroup_id=__AID__&creative_id=__CID__
```

### Microsoft Ads (Bing) Dynamic Parameters

Microsoft Ads supports URL tracking parameters similar to Google.

**Key parameters:**

| Parameter | What It Returns |
|-----------|----------------|
| {CampaignId} | Campaign ID |
| {Campaign} | Campaign name |
| {AdGroupId} | Ad group ID |
| {AdGroup} | Ad group name |
| {AdId} | Ad ID |
| {keyword} | Keyword text |
| {MatchType} | Match type (e, p, b) |
| {Network} | Network (o for Bing, s for syndicated) |
| {Device} | Device type |
| {QueryString} | Actual search query |

**Recommended Bing tracking template:**

```
{lpurl}?utm_source=bing&utm_medium=cpc&utm_campaign={Campaign}&utm_content={AdId}&utm_term={keyword}&matchtype={MatchType}&network={Network}&device={Device}
```

---

## Auto-Tagging vs Manual Tagging

### What Auto-Tagging Does

Google Ads auto-tagging appends a `gclid` parameter to the destination URL. This parameter is used by GA4 to attribute the session to the specific Google Ads click, campaign, ad group, keyword, etc.

When auto-tagging is enabled (it is on by default), Google Ads sessions in GA4 show full campaign detail without any UTM parameters. The gclid carries all the information.

### The Conflict: GCLID vs UTM

When both auto-tagging (gclid) and manual UTM parameters are present on the same URL, GA4 must decide which one to use for attribution. GA4's behavior:

- **Default behavior (auto-tagging overrides manual tagging):** GA4 uses gclid for attribution and ignores UTM parameters. Source shows as "google / cpc" with full campaign detail from gclid.
- **When "Allow manual tagging to override" is enabled in GA4:** UTM parameters take priority over gclid. This is found in GA4 Admin > Data Streams > Web Stream > Google Ads Linking > Advanced Settings.

### OFM Recommendation

**Keep auto-tagging ON. Add UTM parameters as backup and for non-Google platforms.**

Reasoning:
- Auto-tagging provides richer data than UTMs (keyword, ad group, search term, device all come through gclid)
- UTM parameters serve as a fallback if gclid is stripped (some email clients, some redirect chains)
- UTM parameters are essential for non-Google platforms (Meta, TikTok, Bing) since those platforms do not have gclid-equivalent auto-tagging in GA4
- Do NOT enable "Allow manual tagging to override" unless there is a specific reason; gclid data is more reliable

### Platform-Specific Auto-Tagging

| Platform | Auto-Tag Parameter | GA4 Integration |
|----------|-------------------|----------------|
| Google Ads | gclid | Native GA4 linking, full attribution |
| Meta Ads | fbclid | No GA4 auto-linking; must use UTMs |
| TikTok Ads | ttclid | No GA4 auto-linking; must use UTMs |
| Microsoft Ads | msclkid | Partial GA4 support; UTMs recommended |

For Meta, TikTok, and Microsoft, UTM parameters are the primary attribution mechanism in GA4. There is no alternative.

---

## GA4 Campaign Attribution Logic

### How GA4 Maps UTM Parameters to Dimensions

| UTM Parameter | GA4 Dimension | Report Location |
|---------------|--------------|-----------------|
| utm_source | Session source / First user source | Traffic Acquisition |
| utm_medium | Session medium / First user medium | Traffic Acquisition |
| utm_campaign | Session campaign / First user campaign | Traffic Acquisition |
| utm_content | Session manual ad content | Traffic Acquisition (add dimension) |
| utm_term | Session manual term | Traffic Acquisition (add dimension) |
| utm_source_platform | Session source platform | Traffic Acquisition (add dimension) |

### Attribution Models in GA4

GA4 uses data-driven attribution by default for conversion credit:

- **Data-driven (default):** Machine learning distributes credit based on actual user paths. No fixed rules.
- **Last click:** 100% credit to the last non-direct click before conversion. Useful for comparison.
- **First click:** No longer available as a reporting model in GA4 (removed in 2023), but "first user" dimensions show the original acquisition source.

### Session Timeout and New Session Rules

A new session starts in GA4 when:
- 30 minutes of inactivity (default, configurable)
- Midnight crosses (new calendar day)
- UTM parameters change (a click with new UTM values starts a new session)

This last point is critical: if a user arrives via google/cpc, then 10 minutes later clicks a facebook/paid_social ad, GA4 starts a new session. This means multi-touch journeys are split across sessions, and each session is attributed to the last UTM source that initiated it.

---

## UTM Encoding Issues

### Common Encoding Problems

Special characters in UTM values cause broken tracking, misattributed sessions, and messy reports.

| Character | Problem | Solution |
|-----------|---------|----------|
| Space | Breaks the URL or becomes %20 or + | Use underscores instead |
| & | Interpreted as parameter separator | Never use in values; use "and" |
| = | Interpreted as key-value separator | Never use in values |
| # | Interpreted as fragment identifier | Never use in values |
| % | Starts a percent-encoded sequence | Never use in values |
| + | Interpreted as space in some contexts | Use underscores instead |
| Curly braces {} | Can conflict with dynamic parameters | Avoid in static values |

### How URL Encoding Works

When dynamic parameters return values with special characters (e.g., a campaign name like "Spring Sale 20% Off"), the platform should URL-encode them automatically. However, not all platforms handle this reliably.

**Google Ads:** ValueTrack parameters are URL-encoded automatically.

**Meta Ads:** Dynamic parameters are URL-encoded, but campaign/ad names with certain characters can still cause issues. Clean campaign names at the source.

**TikTok Ads:** Dynamic macros are URL-encoded, but the same caveat applies.

### Prevention Strategy

The best approach is to avoid problematic characters in campaign, ad set, and ad names entirely:

- Use only letters, numbers, and underscores in naming
- No spaces, ampersands, percent signs, or special characters
- This makes the URL encoding question irrelevant

---

## UTM Parameter Templates by Platform

### Google Ads (Search)

**Account-level tracking template:**
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={creative}&utm_term={keyword}&matchtype={matchtype}&network={network}&device={device}&gclid={gclid}
```

Note: When auto-tagging is on, the gclid is already appended. Including it explicitly in the tracking template is redundant but does not cause harm. Some practitioners include it for visibility in server logs.

### Google Ads (Performance Max)

PMax does not support keyword-level ValueTrack. Use:
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={creative}&device={device}&campaignid={campaignid}
```

### Google Ads (Display)

```
{lpurl}?utm_source=google&utm_medium=display&utm_campaign={_campaign}&utm_content={creative}&placement={placement}&device={device}
```

### Google Ads (YouTube/Video)

```
{lpurl}?utm_source=google&utm_medium=video&utm_campaign={_campaign}&utm_content={creative}&device={device}&campaignid={campaignid}
```

### Meta Ads

**Set in the URL Parameters field at the ad level:**
```
utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
```

### TikTok Ads

**Set in the URL field at the ad level:**
```
?utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__&campaign_id=__CAMPAIGN_ID__&adgroup_id=__AID__&creative_id=__CID__
```

### Microsoft Ads (Bing)

**Account-level tracking template:**
```
{lpurl}?utm_source=bing&utm_medium=cpc&utm_campaign={Campaign}&utm_content={AdId}&utm_term={keyword}&matchtype={MatchType}&network={Network}&device={Device}
```

### Klaviyo (Email)

**Set in Klaviyo campaign/flow email links:**
```
?utm_source=klaviyo&utm_medium=email&utm_campaign=CAMPAIGN_NAME&utm_content=LINK_DESCRIPTION
```

Replace CAMPAIGN_NAME and LINK_DESCRIPTION with actual values. Klaviyo also supports dynamic variables like {{ campaign.name }} in URLs.

---

## Debugging UTM Discrepancies

### Symptom: Platform Reports More Clicks Than GA4 Reports Sessions

**Common causes:**
1. UTM parameters are being stripped by redirects or link shorteners
2. The landing page has a redirect that drops query parameters
3. Users click but the page does not fully load (slow page, user bounces before GA4 fires)
4. Bot traffic is being filtered by GA4 but counted by the ad platform
5. Cross-domain tracking is not configured and UTMs are lost on domain transitions
6. Auto-tagging is overriding UTMs, so traffic appears under "google / cpc" instead of the expected source

**Diagnostic steps:**
1. Click a test ad and verify the landing page URL contains UTM parameters in the browser address bar
2. Check if there are any server-side redirects (301/302) that strip query parameters
3. Open GA4 Realtime report and verify the session appears with the correct source/medium
4. Check GA4 > Explore > create a free-form report with Session source, Session medium, and Landing page to see where sessions are actually being attributed

### Symptom: Sessions Appear as (direct) / (none) Instead of the Expected Source

**Common causes:**
1. UTM parameters are malformed (missing utm_source or utm_medium)
2. The referrer is being stripped (certain browser privacy settings)
3. A meta refresh or JavaScript redirect drops the query string
4. The site uses a single-page application (SPA) that does not properly handle URL parameters on navigation
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
2. GA4 attributes to the last non-direct click by default; Google Ads attributes to its own clicks
3. Conversion counting differs: GA4 counts "events" while Google Ads may count "one per click" or "every"
4. Time zone differences between GA4 property and Google Ads account
5. GA4 linking is not properly configured (Admin > Google Ads Linking)

**This is expected behavior.** Numbers will never match exactly between GA4 and Google Ads. The discrepancy should be consistent (typically 10% to 30%). If it exceeds 40%, investigate the linking and auto-tagging configuration.

---

## Common Mistakes and Fixes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Using mixed case in UTM values | Campaign data splits across multiple rows in GA4 | Enforce lowercase across all platforms |
| Spaces in UTM values | Inconsistent encoding (%20 vs +) creates duplicate entries | Use underscores only |
| Missing utm_source or utm_medium | Session attributed to (direct)/(none) | Always include both required parameters |
| Hard-coding campaign names in UTMs | UTMs become stale when campaign names change | Use dynamic parameters (ValueTrack, {{macros}}) |
| Using UTMs on internal links | Every internal click starts a new session with wrong attribution | Never put UTM parameters on links within your own site |
| UTMs on organic social posts | Inflates "paid_social" medium or confuses channel groupings | Use utm_medium=organic_social for organic posts |
| Not testing after setup | Broken UTMs go unnoticed for weeks | Click every new ad and verify in GA4 Realtime |
| Forgetting to update UTMs when cloning campaigns | New campaign attributed to old campaign name | Always update UTMs when duplicating ads or campaigns |
| Using platform-specific IDs as only UTM values | Reports are meaningless (just numbers) | Include human-readable names alongside IDs |
| Conflicting auto-tag and manual tag | Attribution confusion in GA4 | Keep auto-tagging on, use UTMs as supplement not replacement |
