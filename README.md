# Paid Media & Tracking Expert

OmniFunnel Marketing's Claude Code project for paid media management, tracking implementation, and ad account auditing.

## What's in this repo

| Directory | Contents |
|-----------|----------|
| `.claude/` | CLAUDE.md (master instructions), 11 frameworks, 3 rules |
| `agents/` | 9 specialist agents (tracking, creative, budget, attribution, etc.) |
| `commands/` | 9 audit and workflow commands (/full-audit, /tracking-audit, /new-client, etc.) |
| `skills/` | 18 project skills (platform tracking, consent mode, attribution, etc.) |
| `scripts/chrome/` | 11 Chrome automation scripts (dataLayer, pixels, cookies, GA4, etc.) |
| `scripts/gtm/` | 5 GTM audit scripts (ES6 detector, tag inventory, firing order, etc.) |
| `templates/` | Audit report and developer handoff templates |
| `clients/_template/` | Template for new client profiles |

## Prerequisites

1. **Claude Code CLI** installed and authenticated
2. **Chrome browser** with the Claude in Chrome extension installed
3. **Access granted** to this GitHub repo, the OFM Asana workspace, and relevant ad accounts

## Setup (one time per machine)

### Step 1: Clone the repo

```bash
git clone https://github.com/MichaelOmniFunnel/paid-media-tracking-expert.git
cd paid-media-tracking-expert
```

### Step 2: Install global skills

These skills live in your global Claude config, not in the repo. Run the installer:

```bash
# Install the claude-ads skill set (190 audit checks, 12 reference files, 11 industry templates)
irm https://raw.githubusercontent.com/AgriciDaniel/claude-ads/main/install.ps1 | iex
```

This installs to `~/.claude/skills/ads*/`, `~/.claude/agents/audit-*.md`, and reference data.

### Step 3: Configure global settings

Edit `~/.claude/settings.json` and ensure it contains:

```json
{
  "effortLevel": "high",
  "alwaysThinkingEnabled": true,
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "SLASH_COMMAND_TOOL_CHAR_BUDGET": "30000"
  }
}
```

### Step 4: Create local settings (hooks and permissions)

Create `.claude/settings.local.json` in the project root (this file is gitignored):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__meta-ads__update_*|mcp__meta-ads__create_*|mcp__meta-ads__bulk_update_*|mcp__meta-ads__bulk_upload_*|mcp__meta-ads__duplicate_*|mcp__meta-ads__upload_*",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"Write-Output '{\\\"hookSpecificOutput\\\":{\\\"hookEventName\\\":\\\"PreToolUse\\\",\\\"permissionDecision\\\":\\\"deny\\\",\\\"permissionDecisionReason\\\":\\\"SAFETY: This action modifies a live client system. Get explicit approval before any external changes.\\\"}}'\" "
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
            "command": "powershell -Command \"Start-Process powershell -ArgumentList '-Command', '[System.Reflection.Assembly]::LoadWithPartialName(''System.Windows.Forms'') | Out-Null; [System.Windows.Forms.MessageBox]::Show(''Claude has finished and needs your attention'', ''Claude Code'', ''OK'', ''Information'') | Out-Null' -WindowStyle Hidden\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"Write-Output 'CRITICAL CONTEXT (re-injected after compaction):
- NEVER modify client ad accounts, GTM, tracking, or external platforms without explicit approval
- Asana Claude project GID: 1213561988868639 | Workspace: 1206269095077183
- MCP servers: Chrome (browser automation), Meta Ads (Pipeboard), Asana. GTM/Stape via Chrome only.
- Client memory: check clients/ folder, read history.md and open-items.md before engaging.
- GTM Custom HTML is ES5 only, always.'\""
          }
        ]
      }
    ]
  },
  "permissions": {
    "deny": [
      "Edit(~/.ssh/**)", "Edit(~/.aws/**)", "Edit(~/.npmrc)",
      "Edit(~/.env)", "Edit(**/.env)", "Edit(**/.env.*)", "Edit(**/credentials*)",
      "Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.npmrc)",
      "Read(**/.env)", "Read(**/.env.*)", "Read(**/credentials*)", "Read(**/secrets*)"
    ]
  }
}
```

### Step 5: Configure MCP servers

Each team member needs these MCP servers connected in their Claude Code config:

1. **Chrome MCP** (claude-in-chrome): Install the Chrome extension from the Chrome Web Store. This gives Claude browser automation for GTM, Stape, Events Manager, and all platform UIs.

2. **Meta Ads MCP** (Pipeboard): Sign up at pipeboard.co, connect your Meta ad accounts, and add the MCP server config per their docs.

3. **Asana MCP**: Add the Asana MCP server with your personal access token. The project board GID is `1213561988868639`.

MCP server configs go in `~/.claude/settings.json` under the `mcpServers` key. Each person uses their own auth tokens.

## Usage

Open Claude Code in the project directory:

```bash
cd paid-media-tracking-expert
claude
```

### Key commands
- Mention a client name and Claude will check/create their folder in `clients/`
- Ask for any audit type: tracking, creative, budget, full, etc.
- Claude updates Asana automatically as work progresses
- All platform UIs are accessible via Chrome browser automation

### What NOT to do
- Never modify client ad accounts, GTM containers, or tracking without explicit approval
- Never commit `.claude/settings.local.json` (contains local config)
- Never commit files in `clients/*/` (contains real account data)
- Never use ES6 syntax in GTM Custom HTML tags

## Architecture

```
.claude/CLAUDE.md          Master instructions (82 lines)
.claude/frameworks/        11 methodology frameworks
.claude/rules/             3 rule sets (anomaly flagging, client memory, security)
agents/                    9 specialist agents
commands/                  9 workflow commands
skills/                    18 project skills
scripts/chrome/            11 browser automation scripts
scripts/gtm/               5 GTM audit scripts
templates/                 Report and handoff templates
clients/_template/         New client scaffolding
clients/[name]/            Per client data (gitignored)
.claude/settings.local.json  Local hooks and permissions (gitignored)
```
