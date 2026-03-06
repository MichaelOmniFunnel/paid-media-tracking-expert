# MCP Server & Skill Installation Guide
## Paid Media & Tracking Expert - Claude Code Project

**Prepared:** 2026-03-05
**Status:** READY FOR REVIEW - Do not install until Michael approves
**Platform:** Windows 11

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Recommended Install Order](#recommended-install-order)
3. [Server 1: Google Tag Manager (GTM)](#1-google-tag-manager-mcp-server)
4. [Server 2: Google Ads](#2-google-ads-mcp-server)
5. [Server 3: Meta Ads](#3-meta-ads-mcp-server)
6. [Server 4: TikTok Ads](#4-tiktok-ads-mcp-server)
7. [Server 5: Google Analytics 4](#5-google-analytics-4-mcp-server)
8. [Tool 6: Google Sheets CLI + Skill](#6-google-sheets-cli--skill)
9. [Skill 7: Google Docs/Drive](#7-google-docs--drive-skill)
10. [Combined .mcp.json Configuration](#combined-mcpjson-configuration)
11. [Authentication Checklist](#authentication-checklist)

---

## Prerequisites

### Software Requirements

| Requirement | Needed For | Install Command |
|---|---|---|
| Python 3.11+ | Google Ads, TikTok Ads, GA4 | `winget install Python.Python.3.12` |
| Node.js 18+ | GTM (npx), general tooling | `winget install OpenJS.NodeJS` |
| Bun runtime | Sheets CLI | `powershell -c "irm bun.sh/install.ps1 | iex"` |
| Ruby | Google Docs Skill | `winget install RubyInstallerTeam.Ruby.3.2` |
| Git | Cloning repos | Already installed |
| uv (Python) | TikTok Ads (optional) | `pip install uv` |

### Google Cloud Project Setup (Shared Across Multiple Servers)

Several servers need a Google Cloud Project. Set up ONE project and enable all needed APIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Claude Code Paid Media")
3. Enable these APIs:
   - Google Ads API
   - Google Analytics Data API
   - Google Sheets API
   - Google Drive API
   - Google Docs API
   - Tag Manager API (if using local GTM setup later)
4. Create OAuth 2.0 credentials (Desktop Application type)
5. Download the `client_secret.json` file
6. Create a Service Account (for GA4) and download its JSON key

---

## Recommended Install Order

Install in this order to minimize context-switching between auth providers:

| Order | Server | Why This Order |
|---|---|---|
| 1 | GTM MCP | Easiest - remote server, just OAuth in browser |
| 2 | Meta Ads MCP | Second easiest - remote server via Pipeboard |
| 3 | Google Analytics 4 | Uses service account from GCP setup |
| 4 | Google Ads MCP | Uses OAuth + developer token from GCP setup |
| 5 | Google Sheets CLI | Uses same GCP OAuth credentials |
| 6 | Google Docs Skill | Uses same GCP OAuth credentials (shared token) |
| 7 | TikTok Ads MCP | Separate platform - TikTok Developer Portal |

---

## 1. Google Tag Manager MCP Server

**Repository:** [stape-io/google-tag-manager-mcp-server](https://github.com/stape-io/google-tag-manager-mcp-server)
**Type:** Remote MCP Server (hosted by Stape)
**License:** Apache-2.0

### What It Does
Provides Claude with direct access to Google Tag Manager via the GTM API. Manage containers, tags, triggers, and variables through natural language.

### Authentication
- **Method:** Google OAuth (browser-based)
- **API Keys Needed:** None - OAuth handled automatically via browser popup
- **First Run:** A browser window opens for Google login and GTM permission grant

### Install Command (Claude Code CLI)

```bash
claude mcp add gtm-mcp-server -- npx -y mcp-remote https://gtm-mcp.stape.ai/mcp
```

### Configuration (.mcp.json entry)

```json
{
  "gtm-mcp-server": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://gtm-mcp.stape.ai/mcp"]
  }
}
```

### Notes
- Keep the server name short (under ~20 chars) to avoid client name-length limits
- To clear cached credentials: `rm -rf ~/.mcp-auth` then restart
- No local dependencies beyond Node.js/npx

---

## 2. Google Ads MCP Server

**Repository:** [cohnen/mcp-google-ads](https://github.com/cohnen/mcp-google-ads)
**Type:** Local MCP Server (Python)
**License:** Check repo

### What It Does
Execute Google Ads Query Language (GAQL) queries, view campaign/ad performance, list accounts, and analyze advertising data in JSON/table/CSV formats.

### Available Tools
- `list_accounts` - Display all Google Ads accounts
- `execute_gaql_query` - Run GAQL queries
- `get_campaign_performance` - Campaign metrics and trends
- `get_ad_performance` - Creative performance analysis
- `run_gaql` - Custom GAQL with formatting options

### Authentication
- **Method:** OAuth 2.0 Client ID OR Service Account
- **Required Credentials:**
  1. `client_secret.json` (OAuth) OR service account JSON key
  2. Google Ads Developer Token (from Tools & Settings > API Center in Google Ads)
  3. Login Customer ID (if using a Manager/MCC account)
- **Developer Token:** Apply at Google Ads > Tools & Settings > API Center (1-3 business day approval)

### Install Commands

```bash
# Clone the repository
git clone https://github.com/cohnen/mcp-google-ads.git C:/Users/mtate/mcp-servers/mcp-google-ads
cd C:/Users/mtate/mcp-servers/mcp-google-ads

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install mcp
```

### Environment Variables

Create a `.env` file in the server directory:

```env
GOOGLE_ADS_AUTH_TYPE=oauth
GOOGLE_ADS_CREDENTIALS_PATH=C:/Users/mtate/credentials/google-ads-client-secret.json
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_manager_id_here
```

### Configuration (.mcp.json entry)

```json
{
  "google-ads": {
    "command": "C:/Users/mtate/mcp-servers/mcp-google-ads/.venv/Scripts/python.exe",
    "args": ["C:/Users/mtate/mcp-servers/mcp-google-ads/google_ads_server.py"],
    "env": {
      "GOOGLE_ADS_CREDENTIALS_PATH": "C:/Users/mtate/credentials/google-ads-client-secret.json",
      "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_DEVELOPER_TOKEN",
      "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "YOUR_MANAGER_ID"
    }
  }
}
```

### Install Command (Claude Code CLI)

```bash
claude mcp add google-ads \
  -e GOOGLE_ADS_CREDENTIALS_PATH=C:/Users/mtate/credentials/google-ads-client-secret.json \
  -e GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_TOKEN \
  -e GOOGLE_ADS_LOGIN_CUSTOMER_ID=YOUR_MANAGER_ID \
  -- C:/Users/mtate/mcp-servers/mcp-google-ads/.venv/Scripts/python.exe \
  C:/Users/mtate/mcp-servers/mcp-google-ads/google_ads_server.py
```

### Notes
- Developer Token can take 1-3 business days to get approved
- Use full absolute paths for all file references on Windows
- Test with: `python test_google_ads_mcp.py`

---

## 3. Meta Ads MCP Server

**Repository:** [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp)
**Type:** Remote MCP Server (hosted by Pipeboard)
**License:** BSL 1.1 (becomes Apache 2.0 on Jan 1, 2029)

### What It Does
Full Meta/Facebook Ads management with 25+ tools: campaign CRUD, ad set management, ad creation, creative uploads, performance insights, audience targeting research, and budget scheduling.

### Available Tools (25+)
- **Account:** `get_ad_accounts`, `get_account_info`, `get_account_pages`
- **Campaigns:** `get_campaigns`, `create_campaign`, `update_campaign`
- **Ad Sets:** `get_adsets`, `create_adset`, `update_adset`
- **Ads:** `create_ad`, `update_ad`, `get_ad_details`
- **Creatives:** `create_ad_creative`, `update_ad_creative`, `upload_ad_image`
- **Analytics:** `get_insights`
- **Targeting:** `search_interests`, `search_behaviors`, `search_geo_locations`, `search_demographics`
- **Budget:** `create_budget_schedule`
- **Auth:** `get_login_link`

### Authentication
- **Method:** OAuth via Pipeboard (browser-based) OR Pipeboard API token
- **API Keys Needed:** None for basic setup - Meta OAuth handled through Pipeboard
- **Optional:** Pipeboard API token from [pipeboard.co/api-tokens](https://pipeboard.co/api-tokens)

### Install Command (Claude Code CLI)

```bash
claude mcp add meta-ads -- npx -y mcp-remote https://mcp.pipeboard.co/meta-ads-mcp
```

Or with a Pipeboard token:

```bash
claude mcp add meta-ads -- npx -y mcp-remote "https://mcp.pipeboard.co/meta-ads-mcp?token=YOUR_PIPEBOARD_TOKEN"
```

### Configuration (.mcp.json entry)

```json
{
  "meta-ads": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.pipeboard.co/meta-ads-mcp"]
  }
}
```

With token authentication:

```json
{
  "meta-ads": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.pipeboard.co/meta-ads-mcp?token=YOUR_PIPEBOARD_TOKEN"]
  }
}
```

### Notes
- Remote server means zero local setup beyond Node.js
- First use triggers Meta OAuth in browser
- Free to use; BSL license allows modification and redistribution

---

## 4. TikTok Ads MCP Server

**Repository:** [AdsMCP/tiktok-ads-mcp-server](https://github.com/AdsMCP/tiktok-ads-mcp-server)
**Type:** Local MCP Server (Python)
**License:** Check repo

### What It Does
Manage TikTok advertising campaigns, retrieve performance metrics, and handle ad group analytics through the TikTok Marketing API.

### Available Tools
- **Auth:** `tiktok_ads_login`, `tiktok_ads_complete_auth`, `tiktok_ads_auth_status`, `tiktok_ads_switch_ad_account`
- **Campaigns:** `tiktok_ads_get_campaigns`, `tiktok_ads_get_campaign_details`, `tiktok_ads_get_adgroups`
- **Analytics:** `tiktok_ads_get_campaign_performance`, `tiktok_ads_get_adgroup_performance`

### Authentication
- **Method:** OAuth 2.0 via TikTok For Business Developer Portal
- **Required Credentials:**
  1. TikTok App ID (from registered developer application)
  2. TikTok App Secret (from registered developer application)
  3. Advertiser ID (from TikTok Ads Manager)
- **Setup Steps:**
  1. Register at [TikTok For Business Developer Portal](https://business-api.tiktok.com/portal/docs)
  2. Create a developer account
  3. Register an application
  4. Get App ID and App Secret
  5. OAuth flow handled by the MCP server tools at runtime

### Install Commands

```bash
# Clone the repository
git clone https://github.com/AdsMCP/tiktok-ads-mcp-server.git C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server
cd C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -e .
```

### Environment Variables

```env
TIKTOK_APP_ID=your_app_id
TIKTOK_APP_SECRET=your_app_secret
```

### Configuration (.mcp.json entry)

```json
{
  "tiktok-ads": {
    "command": "C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/venv/Scripts/python.exe",
    "args": ["C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/run_server.py"],
    "env": {
      "TIKTOK_APP_ID": "your_app_id",
      "TIKTOK_APP_SECRET": "your_app_secret"
    }
  }
}
```

### Install Command (Claude Code CLI)

```bash
claude mcp add tiktok-ads \
  -e TIKTOK_APP_ID=your_app_id \
  -e TIKTOK_APP_SECRET=your_app_secret \
  -- C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/venv/Scripts/python.exe \
  C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/run_server.py
```

### Notes
- Rate limit: 1000 requests/hour, 10 concurrent max
- Built-in rate limiting and retry logic
- Alternative: AdsMCP offers a hosted version at adsmcp.com/onboarding (one-minute setup)

---

## 5. Google Analytics 4 MCP Server

**Repository:** [surendranb/google-analytics-mcp](https://github.com/surendranb/google-analytics-mcp)
**Type:** Local MCP Server (Python)
**License:** Check repo

### What It Does
Query GA4 data, explore available dimensions/metrics, search schemas, and retrieve analytics reports via the GA4 Data API.

### Available Tools
- `search_schema` - Search dimensions/metrics by keyword
- `get_ga4_data` - Retrieve analytics data with safeguards
- `list_dimension_categories` - Browse dimension types
- `list_metric_categories` - Browse metric types
- `get_dimensions_by_category` - Get specific dimensions
- `get_metrics_by_category` - Get specific metrics
- `get_property_schema` - Full property schema

### Authentication
- **Method:** Google Cloud Service Account
- **Required Credentials:**
  1. Service Account JSON key file (from Google Cloud Console)
  2. GA4 Property ID (numeric, NOT the "G-XXXXX" Measurement ID)
- **Setup Steps:**
  1. In Google Cloud Console: APIs & Services > Library > Enable "Google Analytics Data API"
  2. Create a Service Account > Download JSON key
  3. Copy the `client_email` from the JSON key file
  4. In GA4: Admin > Property Access Management > Add the service account email with Viewer role
  5. Find your Property ID: GA4 Admin > Property Details > Property ID (numeric)

### Install Commands

**Option A: pip install (Recommended)**

```bash
pip install google-analytics-mcp
```

**Option B: Clone from GitHub**

```bash
git clone https://github.com/surendranb/google-analytics-mcp.git C:/Users/mtate/mcp-servers/google-analytics-mcp
cd C:/Users/mtate/mcp-servers/google-analytics-mcp
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

```env
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/mtate/credentials/ga4-service-account-key.json
GA4_PROPERTY_ID=123456789
```

### Configuration (.mcp.json entry)

**Using pip install (Option A):**

```json
{
  "ga4-analytics": {
    "command": "python",
    "args": ["-m", "ga4_mcp_server"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "C:/Users/mtate/credentials/ga4-service-account-key.json",
      "GA4_PROPERTY_ID": "YOUR_PROPERTY_ID"
    }
  }
}
```

**Using clone (Option B):**

```json
{
  "ga4-analytics": {
    "command": "C:/Users/mtate/mcp-servers/google-analytics-mcp/venv/Scripts/python.exe",
    "args": ["C:/Users/mtate/mcp-servers/google-analytics-mcp/ga4_mcp_server.py"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "C:/Users/mtate/credentials/ga4-service-account-key.json",
      "GA4_PROPERTY_ID": "YOUR_PROPERTY_ID"
    }
  }
}
```

### Install Command (Claude Code CLI - Option A)

```bash
claude mcp add ga4-analytics \
  -e GOOGLE_APPLICATION_CREDENTIALS=C:/Users/mtate/credentials/ga4-service-account-key.json \
  -e GA4_PROPERTY_ID=YOUR_PROPERTY_ID \
  -- python -m ga4_mcp_server
```

### Notes
- Use the numeric Property ID, NOT the Measurement ID (G-XXXXXXX)
- Service account needs Viewer role in GA4 property
- Python 3.10+ required
- Test credentials with the verification script in the README

---

## 6. Google Sheets CLI + Skill

**Repository:** [gmickel/sheets-cli](https://github.com/gmickel/sheets-cli)
**Type:** CLI Tool + Agent Skill (NOT an MCP server)
**License:** MIT

### What It Does
Read, write, append, update, and search Google Sheets from the command line. Installs as a Claude Code "skill" so Claude automatically knows how to use it when you mention spreadsheets.

### Core Commands
- `sheets-cli sheets list` - List all sheets in a spreadsheet
- `sheets-cli sheets find --name "query"` - Search for spreadsheets
- `sheets-cli read table --sheet "name"` - Read sheet as table
- `sheets-cli read range --range "Sheet1!A1:Z50"` - Read specific range
- `sheets-cli append --sheet "name" --values '<json>'` - Append rows
- `sheets-cli update key --sheet "name" --key-col "Col" --key "Val" --set '<json>'` - Update by key
- `sheets-cli batch --ops '<json>'` - Batch operations
- `sheets-cli auth status` - Check auth status

### Authentication
- **Method:** Google OAuth 2.0 (Desktop Application)
- **Required Credentials:**
  1. OAuth 2.0 Client ID credentials (`client_secret.json`) from Google Cloud Console
  2. Google Sheets API enabled in GCP
  3. Google Drive API enabled in GCP (for the `find` command)
- **Auth Flow:** `sheets-cli auth login --credentials ./client_secret.json` opens browser

### Install Commands

```bash
# Clone and build
git clone https://github.com/gmickel/sheets-cli.git C:/Users/mtate/mcp-servers/sheets-cli
cd C:/Users/mtate/mcp-servers/sheets-cli
bun install
bun run build
# Binary created at: ./dist/sheets-cli

# Authenticate
./dist/sheets-cli auth login --credentials C:/Users/mtate/credentials/client_secret.json

# Install as Claude Code skill (project-level)
./dist/sheets-cli install-skill

# OR install globally
./dist/sheets-cli install-skill --global
```

### Configuration
This is NOT an MCP server. It installs as a Claude Code skill:

```bash
# Project-level skill (creates .claude/skills/sheets-cli/SKILL.md)
sheets-cli install-skill

# Global skill (creates ~/.claude/skills/sheets-cli/SKILL.md)
sheets-cli install-skill --global
```

### Environment Variables (Optional)

```env
SHEETS_CLI_DEFAULT_SPREADSHEET_ID=your_default_spreadsheet_id
```

### Notes
- Requires Bun runtime (not Node.js) to build
- All command output is JSON format
- Exit codes: 0=success, 10=validation, 20=auth, 30=permission, 40=API error
- After installing as skill, restart Claude Code to load it
- Shares Google OAuth credentials with other Google tools if using same GCP project

---

## 7. Google Docs / Drive Skill

**Repository:** [robtaylor/google-docs-skill](https://github.com/robtaylor/google-docs-skill)
**Type:** Claude Code Skill (NOT an MCP server)
**License:** Check repo

### What It Does
Full Google Docs and Google Drive management: read/create/edit documents (with Markdown support), format text, insert images/tables, upload/download/share Drive files, create folders, and search Drive.

### Capabilities
- **Docs:** Read, create (from Markdown), insert/append/delete text, find-and-replace, format text (bold/italic/underline), insert page breaks, extract headings, insert images and tables
- **Drive:** Upload, download, export (PDF/CSV), search, share, create folders, copy/move/delete files, get metadata
- **Markdown Support:** Headings, bold, italic, lists, checkboxes, tables, code blocks, horizontal rules

### Authentication
- **Method:** Google OAuth 2.0
- **Required Credentials:**
  1. OAuth 2.0 credentials file placed at: `~/.claude/.google/client_secret.json`
  2. Google Docs API enabled in GCP
  3. Google Drive API enabled in GCP
- **First Run:** Prompts for browser-based authorization
- **Token Sharing:** OAuth token is shared with other Google skills (Sheets, Calendar, Gmail, etc.)
- **Requires:** Ruby runtime

### Install Commands

```bash
# Clone to Claude Code skills directory
git clone https://github.com/robtaylor/google-docs-skill.git ~/.claude/skills/google-docs

# OR as a git submodule
cd ~/.claude
git submodule add https://github.com/robtaylor/google-docs-skill.git skills/google-docs

# Place OAuth credentials
mkdir -p ~/.claude/.google
cp C:/Users/mtate/credentials/client_secret.json ~/.claude/.google/client_secret.json
```

### Configuration
No MCP configuration needed. Skills are auto-discovered by Claude Code from the `~/.claude/skills/` directory.

### Notes
- Written in Ruby - requires Ruby runtime installed
- Shares OAuth tokens with other Google skills (one login covers Docs, Drive, Sheets, Calendar, Gmail, Contacts)
- Scripts: `docs_manager.rb` (documents) and `drive_manager.rb` (files)
- Supports Markdown-to-Google-Docs formatting

---

## Combined .mcp.json Configuration

For the MCP servers (not skills), here is the complete `.mcp.json` file for the project:

```json
{
  "mcpServers": {
    "gtm-mcp-server": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://gtm-mcp.stape.ai/mcp"]
    },
    "google-ads": {
      "command": "C:/Users/mtate/mcp-servers/mcp-google-ads/.venv/Scripts/python.exe",
      "args": ["C:/Users/mtate/mcp-servers/mcp-google-ads/google_ads_server.py"],
      "env": {
        "GOOGLE_ADS_CREDENTIALS_PATH": "C:/Users/mtate/credentials/google-ads-client-secret.json",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_DEVELOPER_TOKEN",
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "YOUR_MANAGER_ID"
      }
    },
    "meta-ads": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.pipeboard.co/meta-ads-mcp"]
    },
    "tiktok-ads": {
      "command": "C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/venv/Scripts/python.exe",
      "args": ["C:/Users/mtate/mcp-servers/tiktok-ads-mcp-server/run_server.py"],
      "env": {
        "TIKTOK_APP_ID": "YOUR_APP_ID",
        "TIKTOK_APP_SECRET": "YOUR_APP_SECRET"
      }
    },
    "ga4-analytics": {
      "command": "python",
      "args": ["-m", "ga4_mcp_server"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:/Users/mtate/credentials/ga4-service-account-key.json",
        "GA4_PROPERTY_ID": "YOUR_PROPERTY_ID"
      }
    }
  }
}
```

**Note:** Google Sheets CLI and Google Docs Skill are NOT MCP servers. They are installed as Claude Code skills (see their respective sections above).

---

## Authentication Checklist

### Google Cloud Platform (shared across Google Ads, GA4, Sheets, Docs)

- [ ] Create Google Cloud Project
- [ ] Enable Google Ads API
- [ ] Enable Google Analytics Data API
- [ ] Enable Google Sheets API
- [ ] Enable Google Drive API
- [ ] Enable Google Docs API
- [ ] Enable Tag Manager API (optional, GTM uses remote server)
- [ ] Create OAuth 2.0 Client ID (Desktop Application) > download `client_secret.json`
- [ ] Create Service Account (for GA4) > download JSON key
- [ ] Store credentials in `C:/Users/mtate/credentials/` folder

### Google Ads Specific

- [ ] Apply for Google Ads Developer Token (Tools & Settings > API Center)
- [ ] Wait for approval (1-3 business days)
- [ ] Note your Manager/MCC Customer ID (if applicable)

### GA4 Specific

- [ ] Find your GA4 Property ID (Admin > Property Details > numeric ID)
- [ ] Add service account email to GA4 property with Viewer role

### Meta Ads

- [ ] Have an active Meta Business account
- [ ] First use: complete OAuth via Pipeboard in browser
- [ ] Optional: create Pipeboard API token at pipeboard.co/api-tokens

### TikTok Ads

- [ ] Register at TikTok For Business Developer Portal
- [ ] Create developer application
- [ ] Note App ID and App Secret
- [ ] Have your Advertiser ID ready

### Google Sheets CLI

- [ ] Install Bun runtime
- [ ] Build sheets-cli from source
- [ ] Run `sheets-cli auth login --credentials ./client_secret.json`
- [ ] Run `sheets-cli install-skill` or `sheets-cli install-skill --global`

### Google Docs Skill

- [ ] Install Ruby runtime
- [ ] Clone skill to `~/.claude/skills/google-docs`
- [ ] Place `client_secret.json` at `~/.claude/.google/client_secret.json`
- [ ] Complete browser OAuth on first use

---

## Directory Structure (Suggested)

```
C:/Users/mtate/
  credentials/
    client_secret.json              # OAuth 2.0 (shared across Google services)
    ga4-service-account-key.json    # GA4 service account
    google-ads-client-secret.json   # Google Ads OAuth (can be same as above)
  mcp-servers/
    mcp-google-ads/                 # Google Ads MCP server
    tiktok-ads-mcp-server/          # TikTok Ads MCP server
    google-analytics-mcp/           # GA4 MCP server (if using clone method)
    sheets-cli/                     # Sheets CLI tool
  .claude/
    .google/
      client_secret.json            # For Google Docs skill
    skills/
      google-docs/                  # Google Docs skill
      sheets-cli/                   # Sheets CLI skill (auto-created by install-skill)
```

---

## Quick Reference: What is an MCP Server vs. a Skill?

| Type | How It Works | Configuration |
|---|---|---|
| **MCP Server** | Runs as a separate process, communicates via MCP protocol | Added to `.mcp.json` or via `claude mcp add` |
| **Skill** | A set of instructions/scripts that Claude reads and executes | Placed in `~/.claude/skills/` or `.claude/skills/` |
| **Remote MCP** | Hosted externally, connected via `mcp-remote` proxy | Uses `npx mcp-remote <url>` as the command |

**In this setup:**
- GTM, Meta Ads = Remote MCP servers (easiest)
- Google Ads, TikTok Ads, GA4 = Local MCP servers (need Python)
- Sheets CLI = CLI tool installed as a skill (needs Bun)
- Google Docs = Skill (needs Ruby)
