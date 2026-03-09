# OmniFunnel Marketing: Claude Code Project Setup Guide

This document covers every MCP server, API integration, OAuth configuration, hook, and setting required to run this project. Follow each section in order.

---

## Prerequisites

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v18+ | MCP servers (Asana, GSC, Meta Ads), hooks, scripts |
| Python | 3.10+ | Google Ads MCP server, OAuth authorization scripts |
| pipx | latest | Installing Python MCP packages globally |
| Git | latest | Version control |
| Claude Code CLI | latest | Primary interface |

### Install Commands

```bash
# Node.js (download from nodejs.org or use nvm)
nvm install 22

# Python pipx (for GA4 MCP)
pip install pipx
pipx ensurepath

# Google Ads MCP Python venv (from project root)
cd ../mcp-google-ads
python -m venv .venv
.venv/Scripts/pip install google-ads mcp   # Windows
# .venv/bin/pip install google-ads mcp      # macOS/Linux
```

---

## GCP Project Setup

All Google MCP servers authenticate through a single GCP project using OAuth 2.0 Desktop credentials.

### Step 1: Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (example name: `OFM-MCP`)
3. Note the **Project ID** (example: `famous-palisade-468818-j2`)

### Step 2: Enable APIs

Enable these three APIs under **APIs & Services > Library**:

1. **Analytics Data API** (for GA4)
2. **Search Console API** (for GSC)
3. **Google Ads API** (for Google Ads)

### Step 3: Create OAuth 2.0 Client

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Desktop app**
4. Name: `OFM-MCP` (or any descriptive name)
5. Download the client secret JSON file
6. Save it to the `mcp-google-ads/` directory as `client_secret.json`

### Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. User type: **Internal** (if using Google Workspace) or **External**
3. Add scopes:
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/webmasters.readonly`
   - `https://www.googleapis.com/auth/adwords`
4. Add your Google account as a test user (if External)

---

## Google Ads Developer Token

A Google Ads Developer Token is required for the Google Ads MCP server.

1. Log into [Google Ads](https://ads.google.com/) with your MCC account
2. Go to **Tools & Settings > Setup > API Center**
3. Apply for API access (Standard access recommended)
4. Once approved, note your **Developer Token**
5. Note your **MCC Customer ID** (format: `XXX-XXX-XXXX`, remove dashes for config: `XXXXXXXXXX`)

---

## OAuth Token Generation

Two separate token files are needed because Google Ads uses a different OAuth scope than GA4/GSC.

### Token 1: GA4 + GSC (Combined)

Create the authorization script at `mcp-google-ads/authorize-analytics.py`:

```python
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
]

flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
credentials = flow.run_local_server(port=0)

token_path = os.path.expanduser('~/.config/gcloud/ofm-analytics-oauth.json')
os.makedirs(os.path.dirname(token_path), exist_ok=True)

token_data = {
    "type": "authorized_user",
    "client_id": credentials.client_id,
    "client_secret": credentials.client_secret,
    "refresh_token": credentials.refresh_token
}

with open(token_path, 'w') as f:
    json.dump(token_data, f, indent=2)

print(f"Token saved to {token_path}")
```

Run it:

```bash
cd mcp-google-ads
.venv/Scripts/python authorize-analytics.py   # Windows
# .venv/bin/python authorize-analytics.py      # macOS/Linux
```

Sign in with the Google account that has access to your GA4 properties and GSC sites. The token saves to `~/.config/gcloud/ofm-analytics-oauth.json`.

### Token 2: Google Ads

Create the authorization script at `mcp-google-ads/authorize.py`:

```python
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/adwords']

flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
credentials = flow.run_local_server(port=0)

token_path = os.path.expanduser('~/.config/gcloud/google-ads-client.json')
os.makedirs(os.path.dirname(token_path), exist_ok=True)

token_data = {
    "refresh_token": credentials.refresh_token,
    "token": credentials.token,
    "scopes": ["https://www.googleapis.com/auth/adwords"]
}

with open(token_path, 'w') as f:
    json.dump(token_data, f, indent=2)

print(f"Token saved to {token_path}")
```

Run it:

```bash
cd mcp-google-ads
.venv/Scripts/python authorize.py
```

Sign in with the Google account that has access to the Google Ads MCC. The token saves to `~/.config/gcloud/google-ads-client.json`.

---

## MCP Server Configuration

All MCP servers are configured in `~/.claude.json` (global) or `.claude/settings.local.json` (project level). Below is the complete configuration.

### Global MCP Servers (~/.claude.json)

Add the following under the `mcpServers` key in `~/.claude.json`:

```json
{
  "mcpServers": {
    "asana": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@roychri/mcp-server-asana"],
      "env": {
        "ASANA_ACCESS_TOKEN": "YOUR_ASANA_PERSONAL_ACCESS_TOKEN"
      }
    },
    "google-analytics": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "pipx", "run", "analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\YOUR_USER\\.config\\gcloud\\ofm-analytics-oauth.json",
        "GOOGLE_PROJECT_ID": "YOUR_GCP_PROJECT_ID"
      }
    },
    "google-search-console": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-server-gsc"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\YOUR_USER\\.config\\gcloud\\ofm-analytics-oauth.json"
      }
    },
    "google-ads": {
      "type": "stdio",
      "command": "PATH_TO\\mcp-google-ads\\.venv\\Scripts\\python.exe",
      "args": ["PATH_TO\\mcp-google-ads\\google_ads_server.py"],
      "env": {
        "GOOGLE_ADS_AUTH_TYPE": "oauth",
        "GOOGLE_ADS_CREDENTIALS_PATH": "C:\\Users\\YOUR_USER\\.config\\gcloud\\google-ads-client.json",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "YOUR_MCC_CUSTOMER_ID_NO_DASHES"
      }
    }
  }
}
```

**macOS/Linux Variants:**

Replace `"command": "cmd"` and `"args": ["/c", ...]` patterns with direct commands:

```json
{
  "google-analytics": {
    "type": "stdio",
    "command": "pipx",
    "args": ["run", "analytics-mcp"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "~/.config/gcloud/ofm-analytics-oauth.json",
      "GOOGLE_PROJECT_ID": "YOUR_GCP_PROJECT_ID"
    }
  },
  "google-search-console": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "mcp-server-gsc"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "~/.config/gcloud/ofm-analytics-oauth.json"
    }
  },
  "asana": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@roychri/mcp-server-asana"],
    "env": {
      "ASANA_ACCESS_TOKEN": "YOUR_ASANA_PERSONAL_ACCESS_TOKEN"
    }
  },
  "google-ads": {
    "type": "stdio",
    "command": "PATH_TO/mcp-google-ads/.venv/bin/python",
    "args": ["PATH_TO/mcp-google-ads/google_ads_server.py"],
    "env": {
      "GOOGLE_ADS_AUTH_TYPE": "oauth",
      "GOOGLE_ADS_CREDENTIALS_PATH": "~/.config/gcloud/google-ads-client.json",
      "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "YOUR_MCC_CUSTOMER_ID_NO_DASHES"
    }
  }
}
```

### Project Level MCP Server (Meta Ads)

This is configured per project. Add to the project section of `~/.claude.json` or to `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "meta-ads": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-remote", "https://mcp.pipeboard.co/meta-ads-mcp"],
      "env": {}
    }
  }
}
```

**Pipeboard Setup:**

1. Go to [pipeboard.co](https://pipeboard.co) and create an account
2. Connect your Meta Business Manager account
3. Authorize ad account access
4. The `mcp-remote` package handles authentication via Pipeboard's hosted OAuth flow

### Chrome MCP (Built In)

The Chrome MCP (`mcp__claude-in-chrome__*`) is a built in Claude Code feature. No configuration needed. Install the [Claude in Chrome](https://chromewebstore.google.com/) browser extension.

Used for: GTM container management, Stape.io dashboards, Google Merchant Center, TikTok Ads, and any platform UI navigation.

---

## Google Ads MCP Server: Critical Patch

The `cohnen/mcp-google-ads` server must use API **v20**. Version 19 returns persistent 500 Internal Server errors.

Clone and patch:

```bash
git clone https://github.com/cohnen/mcp-google-ads.git
cd mcp-google-ads
python -m venv .venv
.venv/Scripts/pip install -e .   # Windows
# .venv/bin/pip install -e .      # macOS/Linux
```

In `google_ads_server.py`, verify line ~35:

```python
API_VERSION = "v20"
```

If it says `v19`, change it to `v20`.

---

## Asana Personal Access Token

1. Go to [Asana Developer Console](https://app.asana.com/0/developer-console)
2. Click **Create new token**
3. Name it (e.g., `Claude Code MCP`)
4. Copy the token and add it to `~/.claude.json` under `mcpServers.asana.env.ASANA_ACCESS_TOKEN`

---

## Claude Code Settings

### Global Settings (~/.claude/settings.json)

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_EFFORT_LEVEL": "high",
    "SLASH_COMMAND_TOOL_CHAR_BUDGET": "30000"
  },
  "alwaysThinkingEnabled": true
}
```

| Setting | Purpose |
|---------|---------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enables multi agent orchestration |
| `CLAUDE_CODE_EFFORT_LEVEL` | Sets reasoning depth to high |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Increases skill description budget for 27+ skills |
| `alwaysThinkingEnabled` | Adaptive thinking mode (auto) |

### Project Settings (.claude/settings.json)

Already committed to the repo. Contains permission denies for sensitive file paths:

```json
{
  "permissions": {
    "deny": [
      "Edit(~/.ssh/**)", "Edit(~/.aws/**)", "Edit(~/.npmrc)",
      "Edit(**/.env)", "Edit(**/.env.*)", "Edit(**/credentials*)",
      "Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.npmrc)",
      "Read(**/.env)", "Read(**/.env.*)", "Read(**/credentials*)", "Read(**/secrets*)"
    ]
  }
}
```

### Project Local Settings (.claude/settings.local.json)

This file is gitignored and must be created manually. It contains hook configurations and the Meta Ads MCP server:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__meta-ads__update_*|mcp__meta-ads__create_*|mcp__meta-ads__bulk_update_*|mcp__meta-ads__bulk_upload_*|mcp__meta-ads__duplicate_*|mcp__meta-ads__upload_*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/deny-platform-writes.js"
          }
        ]
      },
      {
        "matcher": "mcp__claude_ai_Zapier__google_ads_set_*|mcp__claude_ai_Zapier__google_ads_add_*|mcp__claude_ai_Zapier__google_ads_create_*|mcp__claude_ai_Zapier__google_ads_send_*|mcp__claude_ai_Zapier__google_ads_remove_*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/deny-platform-writes.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File .claude/hooks/stop-notify.ps1",
            "async": true
          }
        ]
      }
    ]
  }
}
```

**macOS/Linux Stop Hook:** Replace the PowerShell command with:

```json
{
  "type": "command",
  "command": "bash .claude/hooks/stop-notify.sh",
  "async": true
}
```

---

## Hooks Reference

All hook scripts are in `.claude/hooks/` and committed to the repo.

| Hook File | Type | Purpose |
|-----------|------|---------|
| `deny-platform-writes.js` | PreToolUse | Blocks all Meta Ads and Google Ads Zapier write operations with a JSON `permissionDecision: "deny"` response |
| `deny-meta-writes.js` | PreToolUse | Legacy version (superseded by deny-platform-writes.js) |
| `compact-context.js` | SessionStart | Re-injects critical safety context after context compaction |
| `pre-compact-preserve.js` | PreCompact | Outputs critical context that must survive compaction |
| `stop-notify.ps1` | Stop (Windows) | Shows Windows MessageBox notification when Claude finishes |
| `stop-notify.sh` | Stop (macOS) | Shows macOS notification when Claude finishes |

---

## Project Architecture

```
.claude/
  CLAUDE.md              # Master brief (84 lines, under 100 target)
  settings.json          # Shared permissions (committed)
  settings.local.json    # Local hooks + Meta Ads MCP (gitignored)
  agents/                # 9 specialist agent definitions
  frameworks/            # 11 operational frameworks
  hooks/                 # 6 hook scripts
  memory/                # Auto memory (gitignored)
  rules/                 # 3 rule files (auto loaded)
  skills/                # 27 skills (18 reference + 9 workflow)
scripts/
  chrome/                # 12 Chrome automation scripts
  gtm/                   # 5 GTM utility scripts
  eval/                  # Project validation scripts
templates/               # 4 deliverable templates
clients/                 # Client data folders (gitignored)
```

---

## Verification: Testing All MCP Servers

After setup, verify all six MCP servers are operational:

| Server | Test Command |
|--------|-------------|
| Chrome | `mcp__claude-in-chrome__tabs_context_mcp` |
| Meta Ads | `mcp__meta-ads__get_ad_accounts` |
| Asana | `mcp__asana__asana_list_workspaces` |
| Google Analytics | `mcp__google-analytics__get_account_summaries` |
| Google Search Console | `mcp__google-search-console__list_sites` |
| Google Ads | `mcp__google-ads__list_accounts` |

Ask Claude: "test mcp servers" and it will run all six automatically.

---

## Troubleshooting

### GA4 or GSC Returns Limited Data

- Verify `GOOGLE_APPLICATION_CREDENTIALS` points to `ofm-analytics-oauth.json` (not a service account file)
- The JSON file must have `"type": "authorized_user"` (not `"type": "service_account"`)
- If token expired, re-run `authorize-analytics.py`

### Google Ads Returns 500 Errors

- Verify `google_ads_server.py` has `API_VERSION = "v20"` (not v19)
- Confirm `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is the MCC ID (not an individual account ID)
- Ensure the Python venv has all required packages installed

### Meta Ads MCP Not Connecting

- Verify Pipeboard account is active and Meta Business Manager is connected
- Run `npx mcp-remote https://mcp.pipeboard.co/meta-ads-mcp` manually to test
- Check if Pipeboard OAuth needs re-authorization

### Asana MCP Returns 401

- Personal access tokens expire if revoked in Asana settings
- Generate a new token at [Asana Developer Console](https://app.asana.com/0/developer-console)
- Update `~/.claude.json` with the new token

### Token Regeneration (Any Google MCP)

1. Go to [GCP Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Download the OAuth client secret JSON
3. Place in `mcp-google-ads/` directory as `client_secret.json`
4. Run the appropriate authorize script
5. Sign in with the Google account that has platform access

---

## Environment Variable Summary

### Required for MCP Servers

```
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/ofm-analytics-oauth.json
GOOGLE_PROJECT_ID=YOUR_GCP_PROJECT_ID
GOOGLE_ADS_AUTH_TYPE=oauth
GOOGLE_ADS_CREDENTIALS_PATH=~/.config/gcloud/google-ads-client.json
GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN
GOOGLE_ADS_LOGIN_CUSTOMER_ID=YOUR_MCC_ID_NO_DASHES
ASANA_ACCESS_TOKEN=YOUR_ASANA_PAT
```

### Required for Claude Code

```
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
CLAUDE_CODE_EFFORT_LEVEL=high
SLASH_COMMAND_TOOL_CHAR_BUDGET=30000
```

---

## Token File Locations

| File | Purpose | Created By |
|------|---------|------------|
| `~/.config/gcloud/ofm-analytics-oauth.json` | GA4 + GSC OAuth token | `authorize-analytics.py` |
| `~/.config/gcloud/google-ads-client.json` | Google Ads OAuth token | `authorize.py` |
| `~/.claude.json` | Asana PAT + MCP server configs | Manual setup |

---

## Security Notes

- Never commit token files, `.env` files, or credential files to Git
- All OAuth tokens use **read only** scopes (analytics.readonly, webmasters.readonly, adwords read only via MCC)
- Write operations to Meta Ads and Google Ads are blocked at the hook level (`deny-platform-writes.js`)
- Sensitive file paths are protected by permission deny rules in `.claude/settings.json`
- GTM Custom HTML must always be ES5 (no const, let, arrow functions, template literals)
- The `.gitignore` should exclude: `clients/`, `.claude/memory/`, `.claude/settings.local.json`, `*.env`, `credentials*`, `secrets*`
