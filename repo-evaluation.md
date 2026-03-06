# Repo Evaluation: Skills and Content Assessment

Evaluated on 2026-03-05

---

## Repo 1: indranilbanerjee/digital-marketing-pro

**Repository:** https://github.com/indranilbanerjee/digital-marketing-pro

### Overview
A Claude Code plugin providing an extensive marketing intelligence system with 16 modules, 25 specialist agents, 118 slash commands, 65 Python scripts, and 67 MCP server integrations. It targets a very broad marketing audience across all disciplines, from SEO to influencer management to agency operations.

### What They Have That We Do Not

**Agents we are missing (worth considering):**
- Content Creator agent: ad copy generation, email sequences, social posts, landing page copy, multilingual support
- SEO Specialist agent: technical SEO audits, keyword research, rank monitoring, site architecture analysis
- CRO Specialist agent: A/B test design, form optimization, pricing psychology, landing page scoring
- Competitive Intelligence agent: ongoing competitive monitoring with change detection, share of voice tracking
- Email Marketing Specialist agent: email sequence design, flow optimization, subject line testing
- Growth Engineer agent: referral systems, viral loops, retention strategies, product led growth
- Agency Operations agent: multi brand switching, portfolio dashboards, team assignments, SOP libraries
- Social Media Manager agent: social scheduling, content calendars, engagement strategies
- Marketing Scientist agent: media mix modeling, incrementality testing, predictive analytics
- Memory Manager agent: persistent cross session learning architecture

**Modules/capabilities we are missing:**
- AEO/GEO Intelligence: AI visibility tracking across ChatGPT, Perplexity, Gemini, and Copilot. Monitors how brands appear in AI generated answers. This is a genuinely novel capability worth building.
- Content Engine: structured ad copy and content generation system. We have no content creation capability.
- Digital PR and Authority: E-E-A-T optimization, media outreach templates, press releases. Not in our scope but useful for full service clients.
- Influencer and Creator Management: discovery, briefs, FTC compliance, UGC measurement. Useful for some OFM clients.
- Reputation Management: review strategy, crisis communication, brand safety. Low priority but exists.
- Emerging Channels: voice search, visual search, social commerce, podcasts. Forward looking.
- Marketing Automation: workflow design, lead scoring, nurture sequences. Relevant for our Klaviyo integration.
- Local SEO: Google Business Profile optimization, NAP consistency, citations, multi location. Relevant for franchise and legal verticals.

**Technical capabilities we are missing:**
- Python scoring scripts: 65 deterministic Python scripts for things like ROI calculation, budget optimization, churn prediction, A/B test significance, hallucination detection. We have no computational scripts beyond Chrome/GTM inspection.
- Five layer memory architecture: session context, vector database RAG (Pinecone/Qdrant), temporal knowledge graphs (Graphiti), universal agent memory (Supermemory), knowledge bases. Far more sophisticated than our file based memory.
- Approval workflows with risk classification: categorizes actions as low/medium/high/critical risk with industry specific compliance gates. We have a simple "ask Michael" rule.
- Synthetic audience testing: simulates focus groups from CRM data. Novel capability.
- Self healing campaigns: automatic correction within guardrails. We explicitly prohibit automated changes, so this conflicts with our philosophy.
- Multilingual support: 4 translation MCP servers. Low priority for OFM's current client base.

**MCP Integrations referenced (67 total, notable ones we lack):**
- Ahrefs MCP: SEO competitive data, backlink analysis, keyword research
- Similarweb MCP: traffic estimation, competitive benchmarking
- Amplitude MCP: product analytics
- BigQuery MCP: data warehouse queries
- Figma MCP: creative asset management
- Canva MCP: design automation
- Salesforce MCP: CRM integration
- HubSpot MCP: CRM integration
- WordPress MCP: content management
- Webflow MCP: website builder
- Monday.com / Asana MCP: project management
- Intercom MCP: customer messaging
- SendGrid MCP: email delivery
- Customer.io MCP: behavioral email
- Stripe MCP: payment data
- Google Sheets MCP: reporting and dashboards
- Supabase MCP: database
- Pinecone / Qdrant MCP: vector search for memory

**MCP integrations they have that directly align with our stack:**
- Google Ads MCP: we should investigate if a usable Google Ads MCP exists
- Meta Ads MCP: same
- TikTok Ads MCP: same
- GA4 MCP: same
- Klaviyo MCP: directly in our stack
- Slack MCP: for client/team communication
- Notion MCP: for knowledge management
- Google Sheets MCP: for reporting dashboards

### What Is Worth Extracting or Adapting

**High priority (build this):**
1. AEO/GEO Intelligence capability: AI visibility monitoring is genuinely useful for OFM clients and not something we have any version of. Build a skill that can check how a client's brand appears in AI search results.
2. Content creation agent: even a lightweight version for ad copy variants, email subject lines, and landing page headline generation would be valuable.
3. Competitive monitoring framework: they have automated competitive scanning with change detection. Our competitive-analysis.md is a manual framework. Adding automation would be valuable.
4. Python or Node.js scoring scripts: budget optimization calculator, A/B test significance calculator, pacing calculator. These could be simple scripts that enhance our reporting pipeline.

**Medium priority (consider building):**
5. Marketing automation / Klaviyo optimization agent: we track Klaviyo data but have no agent focused on optimizing flows, sequences, or email performance.
6. Local SEO capabilities: relevant for our legal and franchise verticals.
7. Google Sheets MCP integration: would enable automated reporting dashboard population.
8. CRM integration capabilities: Salesforce/HubSpot connections for lead gen clients.

**Low priority (note for future):**
9. Influencer management: only if clients request it.
10. Multilingual support: only if international clients come aboard.
11. Memory architecture upgrade: their vector DB approach is more sophisticated but our file based system works for now.

### Assessment
This repo is broad but shallow. It covers the entire marketing discipline with impressive scope but lacks the depth and opinionation that makes our project valuable. Their paid media coverage is generic; ours is deep and specific to the OFM workflow. Their tracking coverage is minimal compared to our detailed platform specific skills with actual code.

The main gaps it reveals in our project are: content creation, SEO, CRO scoring, AI visibility monitoring, and computational utility scripts.

---

## Repo 2: VoltAgent/awesome-agent-skills

**Repository:** https://github.com/VoltAgent/awesome-agent-skills

### Overview
A curated catalog of 549+ agent skills from official dev teams and the community for Claude Code and similar AI coding agents. Organized by contributor/team. Heavily skewed toward developer tooling, cloud infrastructure, and engineering workflows.

### Marketing/Advertising/Ecommerce Related Skills Found

**None.** After thorough review of all 549+ listed skills, zero are explicitly focused on:
- Google Ads, Meta Ads, TikTok Ads, or any advertising platform
- Email marketing (Klaviyo, Mailchimp, etc.)
- Analytics (GA4, tracking, pixels)
- Ecommerce (Shopify, WooCommerce)
- Call tracking
- Reporting dashboards
- CRO or conversion optimization
- SEO tools
- Paid media management

This is a significant finding. It means the marketing/advertising vertical is essentially unrepresented in the Claude Code skills ecosystem.

### Potentially Useful Skills From Adjacent Categories

**Google Workspace CLI (googleworkspace):**
- gws-sheets: Read and write Google Sheets spreadsheets. Could be useful for automated reporting dashboards.
- gws-gmail: Send, read, and manage Gmail. Could be useful for automated client reporting delivery.
- gws-drive: Manage Google Drive files. Could be useful for report storage and sharing.
- gws-docs: Read and write Google Docs. Alternative to Word docs for deliverables.
- gws-slides: Read and write Google Slides. Could be useful for client presentations.
- gws-calendar: Manage Google Calendar. Could schedule reporting cadences.
- These are official Google skills and could integrate well with our reporting pipeline workflow.

**Anthropic Official Skills:**
- anthropics/docx: Create, edit, and analyze Word documents. Directly relevant since OFM outputs Word docs.
- anthropics/xlsx: Create, edit, and analyze Excel spreadsheets. Could be useful for data export and analysis.
- anthropics/pptx: Create PowerPoint presentations. Useful for quarterly review presentations.
- anthropics/pdf: Extract text, create PDFs. Useful for report generation.

**ComposioHQ/skills:**
- Connect AI agents to 1000+ external apps with managed authentication. Worth investigating whether this includes Google Ads, Meta Ads, Shopify, Klaviyo, or CallRail connectors. If it does, this could be a significant force multiplier.

**Cloudflare:**
- cloudflare/web-perf: Audit Core Web Vitals and render blocking resources. Directly relevant to landing page audits and page speed analysis.

**Stripe:**
- stripe/stripe-best-practices: If any OFM clients use Stripe for payments, this could be useful for conversion tracking and revenue reconciliation.

**Supabase:**
- supabase/postgres-best-practices: If we ever build a data pipeline for storing historical performance data, Supabase or PostgreSQL knowledge would be useful.

### Repos Worth Investigating Further

1. **ComposioHQ/skills** (https://github.com/ComposioHQ): Claims 1000+ app integrations with managed auth. Need to check if marketing platforms (Google Ads, Meta, Shopify, Klaviyo) are included. If so, this could provide programmatic access to ad platforms without building custom integrations.

2. **googleworkspace tools** (multiple repos): The full suite of Google Workspace CLI skills could automate significant portions of our reporting workflow: pulling data into Sheets, generating Slides presentations for quarterly reviews, managing Calendar for reporting cadences.

3. **anthropics/docx, xlsx, pptx**: Official Anthropic document creation skills. Since our deliverables default to Word format, the docx skill should be installed and tested immediately.

4. **cloudflare/web-perf**: Core Web Vitals auditing could complement our existing audit-page-speed.js Chrome script with a more comprehensive analysis.

### Assessment
The awesome-agent-skills repo confirms that marketing technology is a massive gap in the Claude Code skills ecosystem. OFM's Paid Media and Tracking Expert project is potentially one of the most developed marketing focused Claude Code implementations in existence. There is an opportunity to contribute our skills back to the community or publish them as a standalone skill package.

The immediately actionable items from this repo are: install the Anthropic document creation skills (docx, xlsx, pptx), investigate ComposioHQ for ad platform connectors, and consider the Google Workspace CLI skills for reporting automation.

---

## Summary of Recommended Actions

### Immediate (should do now)
1. Install anthropics/docx skill for Word document generation (our default deliverable format)
2. Install anthropics/xlsx skill for Excel data exports and analysis
3. Investigate ComposioHQ/skills for Google Ads, Meta, Shopify, Klaviyo connectors
4. Install cloudflare/web-perf for enhanced page speed auditing

### Near Term (next 2 to 4 weeks)
5. Build a content creation agent: ad copy variants, email subject lines, landing page headlines
6. Build an AI visibility / AEO monitoring skill (inspired by digital-marketing-pro)
7. Build utility scripts: budget pacing calculator, A/B test significance calculator, ROAS/POAS calculator
8. Explore Google Workspace CLI skills for reporting pipeline automation (Sheets, Slides, Gmail)

### Medium Term (next 1 to 3 months)
9. Build a competitive monitoring agent with automated scanning and change detection
10. Build a CRO scoring agent for systematic landing page evaluation
11. Build a Klaviyo optimization agent for email/SMS flow analysis and recommendations
12. Add local SEO capabilities for franchise and legal vertical clients
13. Investigate Google Ads MCP and Meta Ads MCP for direct API access

### Consider for Future
14. SEO specialist agent (only if OFM adds SEO as a service line)
15. Advanced memory architecture with vector DB (when file based memory becomes limiting)
16. Multilingual capabilities (when international clients are onboarded)
