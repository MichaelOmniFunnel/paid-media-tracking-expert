# Platform Dynamic Parameters and Tracking Templates

## Google Ads ValueTrack Parameters

Google Ads ValueTrack parameters are enclosed in curly braces and replaced at click time.

### Key ValueTrack Parameters

| Parameter | What It Returns | Example Output |
|-----------|----------------|----------------|
| {campaignid} | Campaign ID number | 12345678 |
| {campaign} | Campaign name | Spring_Sale_2026 |
| {adgroupid} | Ad group ID number | 87654321 |
| {adgroup} | Ad group name (not all types) | Brand_Exact |
| {creative} | Ad creative ID | 555666777 |
| {keyword} | Matched keyword (Search only) | running shoes |
| {matchtype} | Keyword match type | b, p, or e |
| {network} | Network type | g (Search), s (Search Partner), d (Display) |
| {device} | Device type | c (computer), m (mobile), t (tablet) |
| {placement} | Placement URL (Display only) | www.example.com |
| {loc_physical_ms} | Physical location geo ID | 9061285 |
| {feeditemid} | Feed item ID (extensions) | 999888 |
| {targetid} | Target ID (audience, keyword) | kwd-12345 |
| {lpurl} | Final URL (for tracking templates) | https://example.com/page |

### Custom Parameters ({_campaign})

Google Ads supports custom parameters (prefixed with underscore) defined at campaign, ad group, or ad level. The `{_campaign}` parameter lets you set a clean, readable name instead of using raw `{campaign}` which may include encoding-problematic characters.

Set in Google Ads > Campaign/Ad Group > Settings > Custom Parameters:
- Key: campaign
- Value: spring_sale_2026

---

## Meta Ads Dynamic URL Parameters

Set in the URL Parameters field at the ad level. Uses double curly braces.

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

### Meta-Specific Notes

- The URL Parameters field automatically appends to the destination URL; do not include a `?`
- If the destination URL already has query parameters, Meta handles `?` vs `&` joining
- Campaign and ad set names with special characters are URL-encoded automatically
- Always include campaign_id, adset_id, and ad_id as separate non-UTM parameters for troubleshooting

---

## TikTok Ads Dynamic Macros

TikTok uses double underscore syntax.

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

---

## Microsoft Ads (Bing) Dynamic Parameters

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

---

## Copy-Paste Tracking Templates

### Google Ads: Search (account-level tracking template)

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={creative}&utm_term={keyword}&matchtype={matchtype}&network={network}&device={device}&adgroupid={adgroupid}&campaignid={campaignid}
```

Note: With auto-tagging on, gclid is already appended. Including it explicitly is redundant but harmless.

### Google Ads: Performance Max

PMax does not support keyword-level ValueTrack.

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={creative}&device={device}&campaignid={campaignid}
```

### Google Ads: Display

```
{lpurl}?utm_source=google&utm_medium=display&utm_campaign={_campaign}&utm_content={creative}&placement={placement}&device={device}
```

### Google Ads: YouTube/Video

```
{lpurl}?utm_source=google&utm_medium=video&utm_campaign={_campaign}&utm_content={creative}&device={device}&campaignid={campaignid}
```

### Meta Ads (URL Parameters field at ad level)

```
utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
```

### TikTok Ads (URL field at ad level)

```
?utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__&campaign_id=__CAMPAIGN_ID__&adgroup_id=__AID__&creative_id=__CID__
```

### Microsoft Ads (account-level tracking template)

```
{lpurl}?utm_source=bing&utm_medium=cpc&utm_campaign={Campaign}&utm_content={AdId}&utm_term={keyword}&matchtype={MatchType}&network={Network}&device={Device}
```

### Klaviyo Email

```
?utm_source=klaviyo&utm_medium=email&utm_campaign=CAMPAIGN_NAME&utm_content=LINK_DESCRIPTION
```

Replace CAMPAIGN_NAME and LINK_DESCRIPTION with actual values. Klaviyo supports dynamic variables like {{ campaign.name }} in URLs.
