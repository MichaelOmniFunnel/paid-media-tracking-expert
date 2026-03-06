# OFM Platform UI Navigation Guide

Quick reference for where to find specific settings and data in each ad platform UI. Use this when navigating platforms via Chrome to quickly locate what you need.

---

## Google Ads UI

### Conversion Settings
- **Conversion actions:** Tools & Settings > Measurement > Conversions
- **Conversion action details:** Click into action > Settings tab
- **Enhanced conversions toggle:** Inside conversion action settings > scroll to "Enhanced conversions" section
- **Conversion value rules:** Tools & Settings > Measurement > Conversions > Value rules tab
- **Default conversion goals:** Tools & Settings > Measurement > Conversions > check "Include in account default conversions" toggle per action
- **Attribution model:** Inside conversion action > Settings > Attribution model dropdown
- **Conversion window:** Inside conversion action > Settings > Click through and engaged view windows

### Campaign Settings
- **Bidding strategy:** Campaign > Settings > Bidding
- **Budget:** Campaign > Settings > Budget
- **Location targeting:** Campaign > Settings > Locations
- **Location targeting options (presence vs interest):** Campaign > Settings > Locations > Location options (advanced)
- **Ad schedule:** Campaign > Settings > Ad schedule
- **Negative keywords (campaign level):** Campaign > Keywords > Negative keywords
- **Negative keyword lists:** Tools & Settings > Shared Library > Negative keyword lists
- **Audiences (campaign level):** Campaign > Audiences, keywords, and content > Audiences
- **Device bid adjustments:** Campaign > Settings > Devices (Note: not available for all bid strategies)
- **Network settings:** Campaign > Settings > Networks

### Performance Max
- **Asset groups:** Campaign > Asset groups tab
- **Listing groups:** Campaign > Listing groups tab
- **Audience signals:** Inside Asset group > Audience signal section
- **Search themes:** Inside Asset group > Search themes section
- **Final URL expansion:** Campaign > Settings > Final URL expansion toggle
- **URL exclusions:** Campaign > Settings > Final URL expansion > URL exclusions
- **Brand exclusions:** Campaign > Settings > Brand restrictions

### Shopping Campaigns
- **Product groups:** Campaign > Product groups tab
- **Merchant Center link:** Tools & Settings > Setup > Linked accounts > Google Merchant Center
- **Product feed diagnostics:** Merchant Center > Products > Diagnostics
- **Feed rules:** Merchant Center > Products > Feeds > click feed > Feed rules

### Diagnostics
- **Auction insights:** Campaign or Ad group > Auction insights (under Insights & reports)
- **Search terms:** Campaign > Insights & reports > Search terms
- **Change history:** Tools & Settings > Troubleshooting > Change history
- **Recommendations:** Recommendations tab (left nav)
- **Quality Score:** Keywords tab > Modify columns > add Quality Score, Landing page exp, Ad relevance, Expected CTR
- **Keyword diagnosis:** Keywords tab > Status column > hover for diagnosis
- **Ad strength:** Ads tab > Ad strength column
- **Asset performance:** Ads tab > click into ad > View asset details
- **Impression share data:** Modify columns > Competitive metrics > Search impr. share, Search top IS, Search abs. top IS
- **Segment by conversions:** Use "Segment" button > Conversions > Conversion action

### Account Level
- **Account access:** Tools & Settings > Setup > Access and security
- **Linked accounts:** Tools & Settings > Setup > Linked accounts (GA4, Merchant Center, etc.)
- **Auto applied recommendations:** Recommendations > Auto apply (top right)
- **Account level automated extensions:** Ads & assets > Assets > Association type: Account > filter for "Automatically created"

---

## Meta Ads Manager

### Campaign Structure
- **Campaign list:** Ads Manager main view (default landing)
- **Ad set targeting:** Click into Campaign > click into Ad Set > Audience section
- **Detailed targeting:** Inside Ad Set > Audience > Detailed targeting (interests, behaviors, demographics)
- **Custom audiences:** Inside Ad Set > Audience > Custom Audiences field
- **Lookalike audiences:** Inside Ad Set > Audience > Custom Audiences field > select LAL
- **Budget and schedule:** Ad Set level > Budget & Schedule section
- **Conversion event selection:** Ad Set level > Optimization & Delivery > Conversion Event dropdown
- **Placement:** Ad Set level > Placements section (Advantage+ or Manual)
- **Attribution setting:** Ad Set level > Optimization & Delivery > Attribution setting (click to expand "Show more options")

### Events Manager
- **Pixel overview:** Events Manager (from main menu) > Data Sources > select pixel
- **Event list:** Events Manager > Overview tab (shows all events received)
- **Event Match Quality (EMQ):** Events Manager > Overview > click on specific event > see EMQ score in the detail panel
- **Test Events:** Events Manager > Test Events tab (top nav within Events Manager)
- **CAPI diagnostics:** Events Manager > Data Sources > select pixel > Settings tab > check "Server events" connection status
- **Aggregated Event Measurement (AEM):** Events Manager > Aggregated Event Measurement tab (top nav within Events Manager)
- **Event deduplication check:** Events Manager > Overview > look for "Browser" and "Server" labels on events; compare volumes
- **Conversions API Gateway status:** Events Manager > Data Sources > select pixel > Settings > Conversions API section

### Diagnostics
- **Delivery insights:** Ad Set level > click "Inspect" button (or Delivery column > "See insights")
- **Audience overlap:** Audiences section (main menu > All Tools > Audiences) > select 2+ audiences > Actions > Show Audience Overlap
- **Account Quality:** Business Settings > Account Quality (or direct via facebook.com/accountquality)
- **Ad rejections:** Account Quality > Advertising restrictions
- **Learning phase status:** Ad Set delivery column > will show "Learning" or "Learning Limited"
- **Estimated audience size:** Inside Ad Set > Audience section > right panel shows estimated audience size meter

### Business Manager
- **Domain verification:** Business Settings > Brand Safety > Domains
- **Verify a domain:** Business Settings > Brand Safety > Domains > Add > follow DNS or meta tag verification
- **Partner access:** Business Settings > Users > Partners > Add
- **System users (for CAPI):** Business Settings > Users > System Users
- **Data sharing settings:** Business Settings > Data Sources > Pixels > select pixel > Settings > Data sharing
- **Business verification:** Business Settings > Security Center > Start verification

### Audiences
- **Custom audience creation:** All Tools > Audiences > Create Audience > Custom Audience
- **Source options:** Website, Customer list, App activity, Offline activity, Video, Lead form, Instant Experience, Shopping, Instagram account, Facebook Page
- **Lookalike creation:** Audiences > Create Audience > Lookalike Audience > select source, location, percentage
- **Audience retention settings:** Inside custom audience creation > specify retention window (e.g., 30, 60, 90, 180 days)

---

## TikTok Ads Manager

### Campaign Structure
- **Campaign list:** Campaign tab (main nav)
- **Ad group targeting:** Click into Campaign > click into Ad Group > Targeting section
- **Demographics:** Ad Group > Targeting > Demographics (age, gender, language)
- **Interests and behaviors:** Ad Group > Targeting > Interests & Behaviors
- **Budget:** Campaign level (CBO) or Ad Group level
- **Optimization goal:** Ad Group > Optimization goal dropdown
- **Bid strategy:** Ad Group > Bidding & Optimization section
- **Placement:** Ad Group > Placements (automatic or select placements)
- **Dayparting:** Ad Group > Schedule > specific time scheduling

### Events Manager
- **Pixel/event setup:** Assets (top nav) > Events > Web Events
- **Create pixel:** Assets > Events > Web Events > Create Pixel
- **Event diagnostics:** Click into pixel > Overview tab (shows events, activity, diagnostics)
- **Test events:** Events > Test Events tool
- **Event rules:** Click into pixel > Settings > Event Rules (for URL based events)
- **Partner integrations:** Assets > Events > Web Events > Partner Setup (Shopify, WooCommerce, etc.)

### Audiences
- **Audience manager:** Assets > Audiences
- **Custom audience creation:** Assets > Audiences > Create Audience
- **Source options:** Customer File, Website Traffic, App Activity, Engagement, Lead Gen, Business Account, Shop Activity
- **Lookalike audience:** Assets > Audiences > Create Audience > Lookalike Audience

### Creative Tools
- **Creative Center:** ads.tiktok.com/business/creativecenter
- **Top Ads:** Creative Center > Top Ads (filter by region, industry, objective)
- **Video editor:** Assets > Creative > Video Editor
- **Smart Video:** Campaign creation flow > Ad level > Smart Video option

### Diagnostics
- **Ad diagnostics:** Hover over ad status for rejection reasons or delivery issues
- **Creative performance:** Ads tab > click into ad for detailed metrics
- **Audience insights:** Reporting > Audience Insights (may require minimum data)
- **Custom reports:** Reporting > Custom Reports > Create Report
- **Attribution settings:** Ad Group level > Attribution settings (click through and view through windows)

---

## GTM (Google Tag Manager)

### Container Navigation
- **Tags:** Left nav > Tags
- **Triggers:** Left nav > Triggers
- **Variables:** Left nav > Variables (Built in and User Defined)
- **Folders:** Left nav > Folders (for organizing tags, triggers, variables)
- **Templates:** Left nav > Templates (Community Template Gallery)
- **Custom Templates:** Left nav > Templates > New (for custom tag or variable templates)

### Tag Configuration
- **Create new tag:** Tags > New > click "Tag Configuration" area
- **Common tag types:** Google Analytics: GA4 Event, Google Ads Conversion Tracking, Google Ads Remarketing, Custom HTML, Custom Image
- **Firing triggers:** Inside tag > Triggering section > select or create trigger
- **Exception triggers:** Inside tag > Triggering section > Add Exception (prevents tag from firing on specific conditions)
- **Tag sequencing:** Inside tag > Advanced Settings > Tag firing options + Tag Sequencing (setup/cleanup tags)
- **Fire once per event vs once per page:** Inside tag > Advanced Settings > Tag firing options

### Trigger Types
- **Page View triggers:** Trigger type > Page View (fires on gtm.js), DOM Ready (fires on gtm.dom), Window Loaded (fires on gtm.load)
- **Click triggers:** All Clicks or Just Links
- **Form submission:** Form Submission trigger type
- **Custom event:** Custom Event trigger type (matches dataLayer.push events)
- **History change:** History Change trigger (for SPA navigation)
- **Scroll depth:** Scroll Depth trigger (percentage or pixel based)
- **Timer:** Timer trigger (for time on page events)
- **Consent Initialization:** Fires before all other triggers; used for CMP setup

### Variables
- **Enable built in variables:** Variables > Built In Variables > Configure > check the ones you need (Click URL, Click Text, Form ID, etc.)
- **Data Layer variable:** User Defined > New > Data Layer Variable > specify key path
- **JavaScript variable:** User Defined > New > JavaScript Variable > specify global JS variable path
- **Custom JavaScript:** User Defined > New > Custom JavaScript > write function that returns a value
- **Lookup Table:** User Defined > New > Lookup Table (maps input variable to output values)
- **RegEx Table:** User Defined > New > RegEx Table (maps regex patterns to output values)
- **Constant:** User Defined > New > Constant (for IDs, keys, etc.)
- **1st Party Cookie:** User Defined > New > 1st Party Cookie (reads cookie value)
- **URL variable:** User Defined > New > URL > Component type (hostname, path, query, fragment)

### Debugging
- **Preview mode:** Click "Preview" button (top right) > enters Tag Assistant connected mode
- **Tag Assistant:** tagassistant.google.com (standalone debugging tool)
- **Summary panel:** Shows all events fired on the page (Container Loaded, DOM Ready, Window Loaded, custom events, clicks, etc.)
- **Tag details:** Click on event > Tags tab shows which tags fired, which did not, and why
- **Variable values:** Click on event > Variables tab shows all variable values at that moment
- **Data Layer contents:** Click on event > Data Layer tab shows the current state of the dataLayer
- **Version history:** Admin > Container > Versions (top nav)
- **Compare versions:** Versions > select two versions > Compare
- **Activity log:** Admin > Container > Activity log

### Publishing
- **Submit:** Submit button (top right) > creates a new version
- **Version naming:** Always name versions descriptively (e.g., "Added Meta CAPI purchase event")
- **Workspace management:** Admin > Container > Workspaces (for team collaboration)
- **Environments:** Admin > Container > Environments (for staging vs production)

### Server Side GTM
- **Server container URL:** Admin > Container Settings > Server container URL (sGTM endpoint)
- **Server container tags:** Same nav as web container but within the server container
- **Client claiming:** Server container > Clients (defines which requests the server handles)
- **Transport URL:** In web container GA4 tag > Fields to Set > transport_url = your sGTM URL

### Consent Mode
- **Consent overview:** Admin > Container Settings > Enable consent overview
- **Consent state per tag:** Tag > Advanced Settings > Consent Settings (specify required consent types)
- **Consent initialization trigger:** Triggers > type "Consent Initialization" (fires before all other triggers)
- **Default consent state:** Set in the consent management tag (e.g., CookieBot, OneTrust) or via gtag consent default command
- **Consent update:** Triggered when user interacts with consent banner; updates consent state via gtag consent update
