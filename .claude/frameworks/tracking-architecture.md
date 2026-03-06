# OFM Tracking Architecture Framework

## Standard Stack
1. Client-side GTM container — browser-level events, dataLayer, non-conversion tags
2. Server-side GTM container via Stape.io — receives from client-side, fans out to all platforms
3. Meta Pixel plus CAPI in parallel — same event_id on both for deduplication
4. TikTok Pixel plus Events API in parallel — same deduplication architecture
5. Google Ads Enhanced Conversions — server-side container with hashed first-party data
6. GA4 — client-side and/or server-side per client requirements

## Non-Negotiable Rules
- Every server-side and client-side event pair must share the same event_id — no exceptions
- All GTM Custom HTML JavaScript is ES5 only
- Consent Mode v2 signals must be respected before any tag fires on EU-relevant properties

## Verification Checklist
- Meta Events Manager shows high match quality and correct deduplication
- TikTok Events Manager shows events arriving with deduplication working
- Google Ads conversion actions show recent conversions with no warnings
- GTM Preview confirms all tags fire on correct triggers with no errors
- No duplicate conversions visible in any platform within a 24-hour test window