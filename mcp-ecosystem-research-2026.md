# MCP Ecosystem Research: Complete Landscape for Paid Media Agencies
## Research Date: 2026-03-05
## Status: RESEARCH FINDINGS for Michael's Review

---

## Executive Summary

The MCP (Model Context Protocol) ecosystem has exploded since Anthropic open sourced it. As of March 2026, there are 8,600+ MCP servers listed in the PulseMCP directory alone. The official Anthropic MCP Registry is live at registry.modelcontextprotocol.io. Every major ad platform, analytics tool, and marketing SaaS now has at least one MCP server available, and several have official first party servers.

For OFM specifically, this research identified 25+ MCP servers directly relevant to our paid media and tracking operations. The most significant developments since our original mcp-setup-guide.md was written:

1. **Google released an official Google Ads MCP server** (read only, but community forks add write capabilities)
2. **Google released an official GA4 MCP server** at github.com/googleanalytics/google-analytics-mcp
3. **Klaviyo launched an official MCP server** with OAuth and remote hosting (no local setup)
4. **Shopify launched official MCP servers** including Dev MCP and Storefront MCP
5. **Semrush and Ahrefs both have official MCP servers** for competitive intelligence
6. **Slack has a production MCP server** (GA since 2025, now with 50+ partners)
7. **Adspirer emerged as a unified multi platform ads MCP** covering Google, Meta, TikTok, LinkedIn, and Amazon
8. **WooCommerce now has native MCP support** via the WordPress MCP Adapter (moving into WP Core 6.9)
9. **BigQuery has a fully managed remote MCP server** from Google Cloud (auto enabled after March 17, 2026)
10. **Zapier MCP connects to 8,000+ apps** as a universal bridge

---

## TIER 1: CRITICAL for OFM Operations (Install First)

These directly serve our core service pillars and should be prioritized.

### 1. Google Ads MCP Server (Official by Google)

| Field | Detail |
|---|---|
| **Name** | Google Ads MCP Server |
| **GitHub** | github.com/googleads/google-ads-mcp (official) and github.com/google-marketing-solutions/google_ads_mcp |
| **What It Does** | Enables LLMs to interact directly with the Google Ads API. Read only: diagnostics, analytics, account queries |
| **Maturity** | Production (official Google release, October 2025). Not officially supported; labeled experimental |
| **Read/Write** | READ ONLY in official version. Community fork by mathiaschu and DigitalRocket google-ads-mcp-v20 add write tools (pause campaigns, add negatives, update bids) |
| **Auth** | OAuth 2.0 + Google Ads Developer Token |
| **Install** | Python based, local server |
| **vs. Our Current** | Our guide uses cohnen/mcp-google-ads. The official Google server is newer and more actively maintained. Consider switching or running both |

**Recommendation:** Keep cohnen/mcp-google-ads for its richer tool set (GAQL queries, formatted output). Add the official Google server as a secondary option. For write operations, evaluate the DigitalRocket fork carefully before any use (remember: NEVER make changes without Michael's approval).

---

### 2. Meta Ads MCP Server (Pipeboard)

| Field | Detail |
|---|---|
| **Name** | Meta Ads MCP (Pipeboard) |
| **GitHub** | github.com/pipeboard-co/meta-ads-mcp |
| **What It Does** | Full Meta/Facebook Ads management: 25+ tools for campaigns, ad sets, ads, creatives, insights, targeting research, budget scheduling |
| **Maturity** | Production. Remote hosted. Available on PyPI as meta-ads-mcp |
| **Read/Write** | FULL READ AND WRITE |
| **Auth** | OAuth via Pipeboard (browser based) or Pipeboard API token |
| **Install** | npx mcp-remote (already in our setup guide) |

**Status:** Already in our mcp-setup-guide.md. No changes needed. This remains the best Meta Ads MCP option.

Additional options discovered:
- **GoMarble facebook-ads-mcp-server** (github.com/gomarble-ai/facebook-ads-mcp-server): alternative with programmatic access
- **brijr/meta-mcp** (github.com/brijr/meta-mcp): connects to Meta Marketing API

---

### 3. TikTok Ads MCP Server

| Field | Detail |
|---|---|
| **Name** | TikTok Ads MCP Server (AdsMCP) |
| **GitHub** | github.com/AdsMCP/tiktok-ads-mcp-server |
| **What It Does** | Campaign management, performance analytics, audience management, creative operations |
| **Maturity** | Production. Local Python server |
| **Read/Write** | READ AND WRITE (campaign CRUD, ad group management) |
| **Auth** | TikTok OAuth 2.0 (App ID + App Secret) |
| **Install** | Python, local server (already in our setup guide) |

**Status:** Already in our mcp-setup-guide.md. No changes needed.

Additional option discovered:
- **ysntony/tiktok-ads-mcp** (github.com/ysntony/tiktok-ads-mcp): Pure MCP server for TikTok Business API, designed for AI first interactions. Worth evaluating as alternative.

---

### 4. Google Tag Manager MCP Server (Stape)

| Field | Detail |
|---|---|
| **Name** | GTM MCP Server (Stape) |
| **GitHub** | github.com/stape-io/google-tag-manager-mcp-server |
| **What It Does** | Full GTM management: containers, tags, triggers, variables, folders, templates, user permissions, versions, environments. Also manages Stape server side containers |
| **Maturity** | Production. Remote hosted by Stape |
| **Read/Write** | FULL READ AND WRITE (create, modify, delete tags/triggers/variables/containers) |
| **Auth** | Google OAuth (browser based) |
| **Install** | npx mcp-remote (already in our setup guide) |

**Status:** Already in our mcp-setup-guide.md. No changes needed. Stape has expanded capabilities since our initial guide, now including Stape server container management.

---

### 5. Google Analytics 4 MCP Server (Multiple Options)

**Option A: Official Google Server (NEW)**

| Field | Detail |
|---|---|
| **Name** | Official Google Analytics MCP Server |
| **GitHub** | github.com/googleanalytics/google-analytics-mcp |
| **What It Does** | get_account_summaries, run_report, run_realtime_report via GA4 Data API and Admin API |
| **Maturity** | Production (official Google release) |
| **Auth** | Google OAuth / Service Account |

**Option B: Stape GA4 MCP Server**

| Field | Detail |
|---|---|
| **Name** | Stape GA4 MCP Server |
| **URL** | stape.io/solutions/mcp-server-ga4 |
| **What It Does** | GA4 reporting and administrative tasks via MCP. Developed by Stape (our existing Stape relationship) |
| **Maturity** | Production |

**Option C: surendranb Community Server (Current)**

| Field | Detail |
|---|---|
| **Name** | surendranb/google-analytics-mcp |
| **GitHub** | github.com/surendranb/google-analytics-mcp |
| **What It Does** | 200+ dimensions and metrics, schema search, category browsing |
| **Maturity** | Active community project |

**Recommendation:** Our guide currently uses the surendranb community server. Google now has an official server. Consider switching to the official one or adding the Stape version since we already use Stape for server side GTM. The official Google server is simpler (3 tools) but backed by Google directly.

---

### 6. Klaviyo MCP Server (Official, NEW)

| Field | Detail |
|---|---|
| **Name** | Klaviyo MCP Server |
| **URL** | developers.klaviyo.com/en/docs/klaviyo_mcp_server |
| **Remote URL** | https://mcp.klaviyo.com/mcp |
| **What It Does** | Campaign creation, flow performance reports, audience data, natural language queries against Klaviyo data |
| **Maturity** | Production (GA since August 2025, enhanced with remote server) |
| **Read/Write** | READ AND WRITE (create content, manage campaigns) |
| **Auth** | OAuth authentication OR private Klaviyo API key |
| **Install** | Remote MCP server (no local setup needed) |

**This is a major addition.** Klaviyo is a core part of our client stack and this was not in our original setup guide. The remote server with OAuth means zero friction setup.

**Suggested .mcp.json entry:**
```json
{
  "klaviyo": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.klaviyo.com/mcp"]
  }
}
```

---

## TIER 2: HIGH VALUE for Agency Operations

### 7. Slack MCP Server (Official)

| Field | Detail |
|---|---|
| **Name** | Slack MCP Server |
| **URL** | docs.slack.dev/ai/slack-mcp-server |
| **GitHub** | github.com/korotovsky/slack-mcp-server (community, more powerful, no permission requirements) |
| **What It Does** | Search messages/files, send messages, read channels/threads, create/update canvases, draft messages |
| **Maturity** | Production (GA, 50+ partners, 25x increase in tool calls). Real Time Search API now available |
| **Read/Write** | READ AND WRITE |
| **Auth** | Slack app configuration |

**Agency value:** Internal team communication, client channel monitoring, automated status updates.

---

### 8. Semrush MCP Server (Official)

| Field | Detail |
|---|---|
| **Name** | Semrush MCP Connector |
| **URL** | semrush.com/blog/what-is-mcp-connector |
| **GitHub** | github.com/metehan777/semrush-mcp (community) |
| **What It Does** | Domain analytics, keyword research, organic/paid search analysis, backlinks overview, competitor research, authority scores |
| **Maturity** | Production (official remote server available) |
| **Auth** | Semrush API key |

**Agency value:** Competitive intelligence for client pitches and ongoing optimization. Query keyword metrics, traffic breakdowns, and competitive data through natural language.

---

### 9. Ahrefs MCP Server (Official)

| Field | Detail |
|---|---|
| **Name** | Ahrefs MCP Server |
| **GitHub** | github.com/ahrefs/ahrefs-mcp-server (original, now deprecated in favor of remote) |
| **Docs** | docs.ahrefs.com/docs/mcp/reference/introduction |
| **What It Does** | Keyword research, competitor analysis, backlink data, live Ahrefs metrics |
| **Maturity** | Production (remote server, replaces local). Requires Enterprise Plan |
| **Auth** | MCP key (not API v3 key) |

**Note:** The local server is deprecated. Ahrefs now offers a remote MCP server that requires no local setup. Enterprise Plan required.

---

### 10. Google Search Console MCP Server

| Field | Detail |
|---|---|
| **Name** | Multiple options available |
| **Best Options** | ahonn/mcp-server-gsc (TypeScript, 157 stars), surendranb/google-search-console-mcp, crunchtools/mcp-google-search-console |
| **What It Does** | Search analytics queries, sitemap management, URL inspection, indexing status |
| **Maturity** | Active community projects (20+ implementations available) |
| **Auth** | Google OAuth / Service Account |

**Agency value:** SEO overlap intelligence, organic vs paid keyword analysis, technical SEO monitoring for client sites.

---

### 11. Shopify MCP Servers (Official)

| Field | Detail |
|---|---|
| **Name** | Shopify Dev MCP + Storefront MCP |
| **URL** | shopify.dev/docs/apps/build/devmcp and shopify.dev/docs/apps/build/storefront-mcp |
| **What It Does** | Dev MCP: search Shopify docs, explore API schemas, build Functions. Storefront MCP: browse and buy from specific stores |
| **Maturity** | Production (official Shopify, API version 2026-01) |
| **Significance** | Shopify and Google announced the Universal Commerce Protocol on March 3, 2026, built on MCP |

**Agency value:** For ecommerce clients on Shopify, direct access to store data, product catalogs, and order analytics.

---

### 12. WooCommerce MCP Server

| Field | Detail |
|---|---|
| **Name** | Multiple options including WordPress MCP Adapter |
| **GitHub** | github.com/WordPress/mcp-adapter (official WP), github.com/techspawn/woocommerce-mcp-server, github.com/iOSDevSK/mcp-for-woocommerce |
| **What It Does** | Interact with WooCommerce stores via REST API: products, orders, customers, analytics |
| **Maturity** | Moving into WordPress Core 6.9 (the Abilities API). Community servers are active |
| **Auth** | WooCommerce REST API keys, optional JWT |

**Key development:** WooCommerce now includes native MCP support. The WordPress MCP Adapter is becoming the canonical plugin.

---

## TIER 3: VALUABLE ADD ONS

### 13. Adspirer (Unified Multi Platform Ads MCP)

| Field | Detail |
|---|---|
| **Name** | Adspirer MCP Server |
| **URL** | adspirer.com |
| **npm** | @mseep/adspirer-mcp-server |
| **What It Does** | Single MCP server for Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, and Amazon Ads. Read AND write: create campaigns, modify budgets, pause ads, add negative keywords |
| **Maturity** | Production (commercial product) |
| **Pricing** | Free tier: 15 tool calls/month. Paid tiers available |
| **Auth** | Adspirer account + platform OAuth connections |

**Agency value:** One server to rule all ad platforms. However, for professional agency use, the per platform servers give more granular control. Adspirer is better for quick cross platform snapshots.

---

### 14. Adzviser (Multi Platform Ads Data MCP)

| Field | Detail |
|---|---|
| **Name** | Adzviser MCP Server |
| **URL** | adzviser.com |
| **Docs** | docs.adzviser.com/claude/intro |
| **What It Does** | Connects 18 data sources (Google Ads, Meta Ads, GA4, Shopify, Amazon Ads, X Ads, and more) to Claude for real time analytics |
| **Maturity** | Production |
| **Pricing** | Starting at $0.99 |
| **Auth** | Platform OAuth via Adzviser middleware |

**Agency value:** Lightweight cross platform reporting. Good for quick client data pulls without switching between platform specific servers.

---

### 15. Google Workspace Suite (Docs, Sheets, Drive)

**Option A: Unified Server (NEW)**

| Field | Detail |
|---|---|
| **Name** | Google Docs MCP (a-bonus) |
| **GitHub** | github.com/a-bonus/google-docs-mcp |
| **What It Does** | Full access to Google Docs, Sheets, and Drive in a single server. Create, edit, format documents. Manage folders and files |
| **Maturity** | Active community project |

**Option B: Drive + Docs + Sheets + Slides + Calendar**

| Field | Detail |
|---|---|
| **Name** | Google Drive MCP (piotr-agier) |
| **GitHub** | github.com/piotr-agier/google-drive-mcp |
| **What It Does** | Secure integration with Drive, Docs, Sheets, Slides, AND Calendar |

**Option C: Sheets Focused**

| Field | Detail |
|---|---|
| **Name** | Google Sheets MCP (xing5) |
| **GitHub** | github.com/xing5/mcp-google-sheets |
| **What It Does** | Create and modify spreadsheets via Google Drive and Sheets APIs |

**Note:** Our existing setup guide uses sheets-cli (skill based, requires Bun) and google-docs-skill (Ruby). These newer MCP server options may be simpler and more capable. The a-bonus/google-docs-mcp covers Docs, Sheets, AND Drive in one server, eliminating the need for two separate tools.

---

### 16. BigQuery MCP Server (Official Google Cloud)

| Field | Detail |
|---|---|
| **Name** | BigQuery Remote MCP Server |
| **URL** | docs.cloud.google.com/bigquery/docs/use-bigquery-mcp |
| **What It Does** | Data queries, schema exploration, data analysis directly through MCP |
| **Maturity** | Production (Preview). Auto enabled after March 17, 2026 |
| **Auth** | Google Cloud authentication |

**Agency value:** Directly query GA4 BigQuery exports, build POAS analysis, create audience segments. Pairs with our ga4-bigquery-analytics skill.

---

### 17. Looker Studio MCP Server (Official Google Cloud)

| Field | Detail |
|---|---|
| **Name** | Looker MCP Server |
| **URL** | cloud.google.com/blog/products/business-intelligence/introducing-looker-mcp-server |
| **GitHub** | github.com/datadaddy89/looker-mcp (community) |
| **What It Does** | Query Looker data with natural language. Connects to Looker's semantic layer |
| **Maturity** | Production |
| **Auth** | Google Cloud authentication |

---

### 18. LinkedIn Ads MCP Server

| Field | Detail |
|---|---|
| **Name** | Multiple options: Radiate B2B, CData, Zapier, community |
| **GitHub** | github.com/radiateb2b/mcp-linkedin-ads, github.com/CDataSoftware/linkedin-ads-mcp-server-by-cdata |
| **What It Does** | LinkedIn Ads performance analytics, campaign data access |
| **Maturity** | Mixed (CData is read only, Radiate B2B is paid at 50 GBP/month) |

---

### 19. Microsoft/Bing Ads MCP Server

| Field | Detail |
|---|---|
| **Name** | Microsoft Ads MCP |
| **Options** | Termo AI skill (full CRUD), CData (read only), Windsor MCP |
| **What It Does** | Campaign lifecycle management, keyword operations, bid/budget adjustments, performance reporting |
| **Maturity** | Active (Termo skill is most complete with full write capabilities) |

---

### 20. Gmail MCP Server

| Field | Detail |
|---|---|
| **Name** | Gmail MCP Server |
| **GitHub** | github.com/GongRzhe/Gmail-MCP-Server |
| **What It Does** | Read, send, draft emails. Supports plain text, HTML, attachments |
| **Auth** | Google OAuth (Gmail API) |

---

### 21. Outlook MCP Server

| Field | Detail |
|---|---|
| **Name** | Outlook MCP |
| **GitHub** | github.com/ryaker/outlook-mcp |
| **What It Does** | Access Outlook email and calendar via Microsoft Graph API |
| **Auth** | Microsoft Graph API |

---

### 22. Zapier MCP (Universal Bridge)

| Field | Detail |
|---|---|
| **Name** | Zapier MCP |
| **URL** | zapier.com/mcp |
| **What It Does** | Connects to 8,000+ apps with 30,000+ actions. Universal bridge for any app Zapier supports |
| **Maturity** | Production (available on all Zapier plans) |
| **Pricing** | 2 Zapier tasks per tool call |
| **Auth** | Zapier account |

**Agency value:** Fills gaps where a dedicated MCP server does not exist. CallRail (via Zapier MCP), any CRM, any project management tool. However, each call costs 2 Zapier tasks.

---

### 23. Asana MCP Server (Official)

| Field | Detail |
|---|---|
| **Name** | Asana MCP Server V2 |
| **URL** | developers.asana.com/docs/mcp-server |
| **What It Does** | Access the Asana Work Graph: tasks, projects, sections, statuses, dependencies |
| **Maturity** | Production (V2 launched February 2026, V1 deprecated May 11, 2026) |
| **Transport** | Streamable HTTP (new standard) |

**Note:** We already have Asana MCP tools loaded in this project.

---

## TIER 4: EMERGING / NICHE

### 24. CallRail MCP

| Field | Detail |
|---|---|
| **Name** | CallRail MCP (via Zapier only) |
| **URL** | zapier.com/mcp/callrail |
| **What It Does** | Access CallRail actions through Zapier's MCP server |
| **Maturity** | Production (via Zapier bridge) |
| **Limitation** | No dedicated native CallRail MCP server found. Zapier bridge is the only option |

**Note:** No standalone CallRail MCP server exists as of March 2026. The Zapier MCP bridge is the only path. A custom MCP server wrapping the CallRail API v3 would be straightforward to build (see Building Custom Servers section).

---

## Official MCP Registry and Ecosystem Infrastructure

### Anthropic MCP Registry
- **URL:** registry.modelcontextprotocol.io
- **Status:** Live (Preview)
- **What It Is:** The official, community driven, canonical feed of MCP servers. Intentionally minimal with no polished search or browsing UI
- **Third Party Registries:** Smithery, Mastra, Glama.ai, MCP.so, PulseMCP, MCPcat.io all provide user facing discovery and curated listings on top of the upstream registry

### Key Numbers (March 2026)
- 8,600+ MCP servers listed on PulseMCP
- Official registry live at registry.modelcontextprotocol.io
- Spec updates: async operations, statelessness, server identity, official extensions
- Streamable HTTP is now the preferred transport for remote servers
- Anthropic donated MCP to the Agentic AI Foundation, establishing it as an open standard

---

## Building Custom MCP Servers

For gaps like CallRail, building a custom MCP server is straightforward.

### Difficulty: Low to Moderate
- Official SDKs available in **Python** (FastMCP), **TypeScript/Node**, and **C#**
- A basic server can be built in an afternoon
- Official guide: modelcontextprotocol.io/docs/develop/build-server
- Comprehensive tutorials at leanware.co, composio.dev, freecodecamp.org

### Architecture
MCP servers expose three types of capabilities:
1. **Resources**: File like data that can be read by clients
2. **Tools**: Functions that the LLM can call
3. **Prompts**: Pre written templates for specific tasks

### Deployment
Servers can be containerized, pushed to a registry, and deployed as secure, autoscalable services with secrets management, health checks, and HTTP/SSE or WebSocket support.

### Custom Server Candidates for OFM
- **CallRail MCP Server**: Wrap CallRail API v3 for call tracking data, DNI, and offline conversion data
- **Client Reporting MCP Server**: Aggregate cross platform data for automated monthly reports

---

## Recommended Priority Installation Order (Updated)

Based on this research, here is the updated recommended installation order:

| Priority | Server | Reason | Setup Complexity |
|---|---|---|---|
| 1 | GTM MCP (Stape) | Already configured, core to tracking work | Remote, easy |
| 2 | Meta Ads MCP (Pipeboard) | Already configured, core to media buying | Remote, easy |
| 3 | Klaviyo MCP (Official) | NEW. Core client stack, remote server, zero friction | Remote, easy |
| 4 | GA4 MCP (Official Google or Stape) | Upgrade from community to official | Remote or local |
| 5 | Google Ads MCP (cohnen + official) | Already configured, consider adding official as backup | Local, moderate |
| 6 | TikTok Ads MCP (AdsMCP) | Already configured | Local, moderate |
| 7 | Slack MCP (Official) | Team communication and client channel monitoring | Moderate |
| 8 | Semrush MCP | Competitive intelligence for client work | Remote, easy |
| 9 | Google Search Console MCP | SEO/SEM overlap analysis | Local, moderate |
| 10 | Shopify MCP (Official) | Ecommerce client data access | Remote, easy |
| 11 | WooCommerce MCP | Ecommerce client data access | Plugin or local |
| 12 | Google Docs/Sheets/Drive MCP | Deliverable creation (upgrade from skill based) | Local, moderate |
| 13 | BigQuery MCP (Google Cloud) | Advanced analytics and POAS | Remote (auto enabled) |
| 14 | Zapier MCP | Universal bridge for everything else | Remote, easy |
| 15 | Adspirer or Adzviser | Cross platform quick snapshots | Remote, easy |

---

## Key Changes vs. Original mcp-setup-guide.md

| Area | Original Guide | What Changed |
|---|---|---|
| Google Ads | cohnen/mcp-google-ads only | Official Google server now exists (read only). Community forks add write tools |
| GA4 | surendranb community server only | Official Google server at github.com/googleanalytics/google-analytics-mcp. Stape also offers one |
| Klaviyo | Not included | Official MCP server with remote hosting and OAuth. Major addition |
| Shopify | Not included | Official Dev MCP and Storefront MCP servers. Universal Commerce Protocol announced |
| WooCommerce | Not included | Native MCP support moving into WordPress Core 6.9 |
| Semrush/Ahrefs | Not included | Both have official MCP servers for competitive intelligence |
| Slack | Not included | Official GA server for team/client communication |
| Google Workspace | Skill based (sheets-cli + Ruby) | Full MCP server options now available (a-bonus covers Docs+Sheets+Drive) |
| BigQuery | Not included | Fully managed remote server from Google Cloud |
| Zapier | Not included | Universal bridge to 8,000+ apps |
| CallRail | Not included | No native MCP server. Available through Zapier bridge only |
| Registry | Did not exist | Official Anthropic MCP Registry live at registry.modelcontextprotocol.io |

---

## Sources

- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [PulseMCP Server Directory (8,600+)](https://www.pulsemcp.com/servers)
- [Awesome MCP Servers](https://mcpservers.org/)
- [GitHub MCP Servers (Anthropic)](https://github.com/modelcontextprotocol/servers)
- [Google Ads MCP (Official)](https://github.com/google-marketing-solutions/google_ads_mcp)
- [Google Ads MCP Developer Guide](https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server)
- [Google Ads MCP Blog Announcement](https://ads-developers.googleblog.com/2025/10/open-source-google-ads-api-mcp-server.html)
- [Google Analytics MCP (Official)](https://developers.google.com/analytics/devguides/MCP)
- [Google Analytics MCP GitHub](https://github.com/googleanalytics/google-analytics-mcp)
- [Stape GTM MCP Server](https://stape.io/solutions/mcp-server-for-gtm)
- [Stape GA4 MCP Server](https://stape.io/solutions/mcp-server-ga4)
- [Klaviyo MCP Server Docs](https://developers.klaviyo.com/en/docs/klaviyo_mcp_server)
- [Klaviyo MCP Blog](https://www.klaviyo.com/blog/introducing-mcp-server)
- [Shopify Dev MCP](https://shopify.dev/docs/apps/build/devmcp)
- [Shopify Storefront MCP](https://shopify.dev/docs/apps/build/storefront-mcp)
- [WooCommerce MCP Docs](https://developer.woocommerce.com/docs/features/mcp/)
- [WordPress MCP Adapter](https://github.com/WordPress/mcp-adapter)
- [Pipeboard Meta Ads MCP](https://github.com/pipeboard-co/meta-ads-mcp)
- [AdsMCP TikTok Ads](https://github.com/AdsMCP/tiktok-ads-mcp-server)
- [Slack MCP Overview](https://docs.slack.dev/ai/slack-mcp-server/)
- [Semrush MCP Blog](https://www.semrush.com/blog/what-is-mcp-connector/)
- [Ahrefs MCP Docs](https://docs.ahrefs.com/docs/mcp/reference/introduction)
- [Ahrefs MCP GitHub](https://github.com/ahrefs/ahrefs-mcp-server)
- [BigQuery MCP](https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp)
- [Looker MCP](https://cloud.google.com/blog/products/business-intelligence/introducing-looker-mcp-server)
- [Zapier MCP](https://zapier.com/mcp)
- [Adspirer](https://www.adspirer.com)
- [Adzviser](https://adzviser.com)
- [Asana MCP Docs](https://developers.asana.com/docs/mcp-server)
- [Google Search Console MCP (ahonn)](https://github.com/ahonn/mcp-server-gsc)
- [Gmail MCP Server](https://github.com/GongRzhe/Gmail-MCP-Server)
- [Outlook MCP](https://github.com/ryaker/outlook-mcp)
- [Google Docs MCP (a-bonus)](https://github.com/a-bonus/google-docs-mcp)
- [Google Drive MCP (piotr-agier)](https://github.com/piotr-agier/google-drive-mcp)
- [MCP Build Guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [Anthropic MCP Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [Top 5 MCPs for Google and Meta Ads 2026](https://www.flyweel.co/blog/top-5-mcps-for-google-meta-ads-in-2026)
- [50+ Best MCP Servers for Claude Code](https://claudefa.st/blog/tools/mcp-extensions/best-addons)
