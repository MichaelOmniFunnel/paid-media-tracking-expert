---
name: utm-strategy
description: UTM naming conventions, dynamic parameter generation per platform, GA4 attribution logic, auto-tagging vs manual tagging, and UTM debugging. Use when someone mentions UTMs, campaign tracking parameters, where traffic is coming from, attribution confusion, or UTM naming conventions.
model: sonnet
allowed-tools: Read, Grep, Glob
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

| Parameter | Purpose | Example |
|-----------|---------|---------|
| utm_source_platform | Identifies the platform tool used | Google Ads, Meta Ads Manager |
| utm_creative_format | Identifies the creative format | video, image, carousel |
| utm_marketing_tactic | Identifies the marketing tactic | prospecting, retargeting |

---

## OFM Naming Conventions

Consistency is everything. Once UTM values are in GA4, they cannot be retroactively cleaned up.

### General Rules

- All lowercase, always. GA4 is case sensitive: "Facebook" and "facebook" are different sources
- Use underscores for spaces, never hyphens or actual spaces
- No special characters except underscores
- Keep values descriptive but concise
- Never include client identifying information in UTM values

### Standard Source Values

| Platform | utm_source Value |
|----------|-----------------|
| Google Ads | google |
| Meta Ads | facebook |
| Instagram Ads | instagram (or facebook if via Meta Ads Manager) |
| TikTok Ads | tiktok |
| Microsoft Ads (Bing) | bing |
| LinkedIn Ads | linkedin |
| Pinterest Ads | pinterest |
| Email (Klaviyo) | klaviyo |
| Email (other) | email |
| Organic Social | Match the platform name |

### Standard Medium Values

| Channel | utm_medium Value |
|---------|-----------------|
| Paid search | cpc |
| Paid social | paid_social |
| Display advertising | display |
| Video advertising | video |
| Shopping/PMax | cpc |
| Email marketing | email |
| Organic social | organic_social |
| Referral | referral |
| Affiliate | affiliate |
| SMS marketing | sms |

### Campaign Naming Pattern

```
[platform]_[objective]_[audience]_[detail]
```

Examples: `google_search_brand_exact`, `facebook_conversions_prospecting_spring2026`, `tiktok_traffic_lookalike_video_test`

---

## Auto-Tagging vs Manual Tagging

### Decision Framework

| Platform | Auto-Tag Param | GA4 Native Linking | UTM Required |
|----------|---------------|-------------------|-------------|
| Google Ads | gclid | Yes, full attribution | No, but recommended as backup |
| Meta Ads | fbclid | No | Yes, primary attribution method |
| TikTok Ads | ttclid | No | Yes, primary attribution method |
| Microsoft Ads | msclkid | Partial | Yes, recommended |

**OFM Standard:** Keep auto-tagging ON for Google Ads. Add UTM parameters as backup and for all non-Google platforms. Do NOT enable "Allow manual tagging to override" in GA4 unless there is a specific reason.

For detailed platform dynamic parameters and copy-paste tracking templates, read references/platform-parameters.md

---

## GA4 Campaign Attribution Logic

### UTM to GA4 Dimension Mapping

| UTM Parameter | GA4 Dimension | Report Location |
|---------------|--------------|-----------------|
| utm_source | Session source / First user source | Traffic Acquisition |
| utm_medium | Session medium / First user medium | Traffic Acquisition |
| utm_campaign | Session campaign / First user campaign | Traffic Acquisition |
| utm_content | Session manual ad content | Traffic Acquisition (add dimension) |
| utm_term | Session manual term | Traffic Acquisition (add dimension) |
| utm_source_platform | Session source platform | Traffic Acquisition (add dimension) |

### Attribution Models

- **Data-driven (default):** ML distributes credit based on actual user paths
- **Last click:** 100% credit to last non-direct click. Useful for comparison
- **First click:** No longer available as reporting model, but "first user" dimensions show original acquisition source

### Session Rules That Affect Attribution

A new session starts when:
- 30 minutes of inactivity (default, configurable)
- Midnight crosses (new calendar day)
- UTM parameters change (critical: a click with new UTMs starts a new session, splitting multi-touch journeys)

---

## Common Mistakes Quick Reference

| Mistake | Impact | Fix |
|---------|--------|-----|
| Mixed case in UTM values | Data splits across rows in GA4 | Enforce lowercase everywhere |
| Spaces in UTM values | Duplicate entries from encoding variations | Use underscores only |
| Missing utm_source or utm_medium | Session goes to (direct)/(none) | Always include both |
| Hard-coding campaign names | UTMs become stale when names change | Use dynamic parameters |
| UTMs on internal links | Every click starts new session with wrong attribution | Never put UTMs on internal links |
| UTMs on organic social with paid_social medium | Inflates paid channel | Use utm_medium=organic_social |
| Not testing after setup | Broken UTMs go unnoticed | Verify every new ad in GA4 Realtime |
| Cloning campaigns without updating UTMs | New campaign attributed to old name | Always update when duplicating |
| Platform IDs as only UTM values | Reports are meaningless numbers | Include human-readable names alongside IDs |
| Conflicting auto-tag and manual tag | Attribution confusion | Keep auto-tagging on, UTMs as supplement |

For encoding rules and URL character handling, read references/debugging-and-encoding.md

For full debugging playbooks (click vs session discrepancies, direct/none attribution, duplicate campaigns, GA4 vs Google Ads mismatches), read references/debugging-and-encoding.md
