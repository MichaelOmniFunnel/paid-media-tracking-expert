---
name: consent-mode
description: Google Consent Mode v2 implementation, cookie banner integrations, GTM consent configuration, TCF 2.0, regional requirements, and conversion modeling impact. Use when someone mentions consent mode, cookie banners, GDPR tracking, privacy compliance in ads, consent signals, or how consent affects conversions.
model: sonnet
allowed-tools: Read, Grep, Glob
---

# Google Consent Mode v2 Implementation

## What Consent Mode Does

Google Consent Mode adjusts how Google tags behave based on the user's consent status. When a user has not consented, tags send cookieless pings instead of full tracking data. Google then uses behavioral modeling to fill gaps in conversion and audience data.

As of March 2024, Consent Mode v2 is required for sending data to Google services for users in the EEA.

## Consent Mode v2 vs v1

v2 adds two new consent types beyond the original two:

| Consent Type | v1 | v2 | What It Controls |
|-------------|----|----|-----------------|
| analytics_storage | Yes | Yes | GA4 cookies (_ga, _gid) |
| ad_storage | Yes | Yes | Ads cookies (_gcl_*, _gac_*) |
| ad_user_data | No | Yes | Sending user data to Google for advertising |
| ad_personalization | No | Yes | Using data for remarketing and personalization |

All four must be set for full v2 compliance.

## Basic vs Advanced Mode

### Basic Mode

Tags do not fire until consent is granted. No data sent, no modeling. Simple but causes significant data gaps for EU traffic.

### Advanced Mode (Recommended)

Tags fire immediately but in restricted state. Cookieless pings enable behavioral modeling. Recovers an estimated 70% of otherwise lost conversion data.

**OFM always recommends Advanced Mode** because modeling recovery is critical for campaign optimization.

---

## GTM Consent Configuration

### Built-in Consent Types

Each GTM tag can be configured with consent requirements in Advanced Settings > Consent Settings: "Not set" (fires regardless), "No additional consent required," or specific consent types required.

### Consent Initialization

Consent defaults must be set before any other tags fire. Use a Consent Initialization trigger (fires before All Pages). Set all four types to "denied" with wait_for_update: 500.

### Regional Defaults

Set different defaults based on user region to avoid restricting tracking for non-EU users. Use the region parameter in the consent default call with EEA + UK country codes as denied, all others as granted.

For all GTM consent code (initialization, updates, regional defaults), read references/cmp-integration-code.md

---

## Cookie Banner Tool Integrations

### OneTrust

Enterprise CMP with native Consent Mode v2 support. Map cookie categories to Google consent types. OneTrust automatically calls consent update on user choice.

### Cookiebot

Built-in v2 support via GTM Community Template Gallery. No custom code needed.

### Osano

Supports v2 via consent callback events.

### TrustArc

Supports v2 via preference manager API.

### Custom Banner

For clients with a custom-built cookie banner: set defaults as denied, check stored consent cookie on load, provide accept/reject handlers that call consent update.

For all CMP integration code (OneTrust, Cookiebot, Osano, TrustArc, custom banner), read references/cmp-integration-code.md

---

## TCF 2.0 (Transparency and Consent Framework)

### What TCF 2.0 Is

IAB Europe standard for communicating consent signals. Google participates as TCF vendor (vendor ID 755).

### Relationship to Consent Mode

CMPs that support TCF 2.0 generate a TC string encoding user choices. Google tags can read this directly. When both TCF 2.0 and Consent Mode are present, Google uses the more restrictive signal.

OFM recommendation: use Consent Mode v2 as primary, with TCF 2.0 for programmatic partners that require it.

---

## Regional Requirements

### EU / EEA (GDPR)

- Consent must be obtained BEFORE any tracking fires (opt-in model)
- All four Consent Mode v2 types must default to denied
- The cookie banner must offer a genuine choice
- Pre-checked boxes are not valid consent
- Users must be able to withdraw consent as easily as they granted it
- Cookie wall (blocking content until consent) is generally not permitted

### United Kingdom

UK GDPR and PECR apply similar requirements as EU GDPR. Include GB in the regional consent defaults.

### United States

**California (CCPA/CPRA):** Opt-out model. Tracking can start by default. Must provide "Do Not Sell or Share My Personal Information" link. On opt-out, set ad_user_data and ad_personalization to denied.

**Other US states:** Most follow opt-out model. OFM recommendation: apply California-level compliance across all US states to future-proof.

### Canada (PIPEDA)

Requires "meaningful consent" closer to opt-in. Treat like EU for Canadian visitors if client has significant Canadian traffic.

---

## Consent Mode Impact on Conversion Modeling

### How Modeling Works

When Advanced Mode is enabled and a user does not consent:
1. Google tags send cookieless pings
2. Google observes the conversion rate of consented users
3. Google models likely conversions among unconsented users
4. Modeled conversions appear in Google Ads with a "modeled" label

### Requirements for Modeling

- Advanced Mode must be used
- Minimum ~1,000 daily users
- At least ~30% consent rate to establish baseline
- Modeling applies per domain

### Impact on Reported Data

| Scenario | Without Consent Mode | Basic Mode | Advanced Mode |
|----------|---------------------|------------|---------------|
| EU user denies consent | Full tracking (non-compliant) | No data | Cookieless ping + modeled |
| Reported conversions | 100% (but illegal) | 30-50% (consent rate) | 70-90% (consent + modeled) |
| Audience building | Full (non-compliant) | Only consented | Consented + modeled |
| Campaign optimization | Normal | Severely degraded | Near-normal |

---

## Consent Mode with Server-Side GTM

### How Consent Flows to Server Container

1. Client-side GTM reads consent state
2. Events sent to server container include consent state in the request
3. GA4 client in server container parses consent
4. Server-side tags can check consent before firing

### Server-Side Tag Consent Configuration

- Meta CAPI: require ad_storage and ad_user_data
- TikTok Events API: require ad_storage
- Google Ads Enhanced Conversions: require ad_storage and ad_user_data
- GA4: require analytics_storage

### Never Bypass Consent Server-Side

It is technically possible to fire server-side tags regardless of consent. This is a compliance violation and must never be done.

---

## Consent Mode for Non-Google Tags

### Meta Pixel

Meta's pixel does not natively read Google Consent Mode. Configure Meta Pixel tag in GTM with built-in consent requirements for ad_storage.

### TikTok Pixel

TikTok has its own consent API. Coordinate with CMP: holdConsent() on load, grantConsent() when marketing consent granted, revokeConsent() when denied.

---

## Debugging Consent Signals

### GTM Preview Mode

Open Preview mode and check the "Consent" tab to see: default consent state, updated state after user interaction, which tags fired vs blocked, and the exact consent type that blocked each tag.

### Test Scenarios

1. **Fresh visit:** Verify defaults denied, banner appears, cookieless pings in Network tab
2. **Accept all:** Verify all types granted, full tracking activates, cookies set
3. **Reject all:** Verify consent stays denied, no tracking cookies, only cookieless pings
4. **Accept analytics only:** Verify analytics_storage granted, ad types denied
5. **Return visit:** Verify consent restored from CMP cookie without banner
6. **Withdraw consent:** Verify consent reverts, tracking cookies removed

### Common Debugging Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Consent defaults not set | Tags fire fully before banner | Add Consent Initialization tag |
| wait_for_update too short | Tags fire with denied before CMP loads | Increase to 500ms or 1000ms |
| CMP not updating consent | Tags stay denied after accept | Verify CMP calls gtag update |
| Consent not persisting | Banner shows every page | CMP cookie not being set |
| Server-side ignoring consent | Events sent despite denied | Configure consent requirements on server tags |
| v2 types missing | Compliance failure | Update CMP to include ad_user_data and ad_personalization |
| Regional defaults not working | Non-EU users see denied | Verify region array in consent default call |
