# MCP Server Setup Patterns

## Three Transport Types

**HTTP (recommended for remote):**
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**SSE (deprecated, use HTTP instead):**
```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

**Stdio (local processes):**
```bash
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

## Windows Specific

On native Windows (not WSL), local MCP servers using npx require the cmd /c wrapper:
```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

## Scope Levels

| Scope | Storage | Applies to |
|-------|---------|------------|
| local (default) | ~/.claude.json under project path | You, this project only |
| project | .mcp.json in project root | Team shared |
| user | ~/.claude.json | You, all projects |

Precedence: local > project > user

## .mcp.json Format (Project Scope)

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    },
    "local-tool": {
      "command": "npx",
      "args": ["-y", "@some/package"],
      "env": {
        "SECRET": "${MY_SECRET}"
      }
    }
  }
}
```

Environment variable expansion: `${VAR}` or `${VAR:-default}` in command, args, env, url, and headers.

## Management Commands

```bash
claude mcp list                          # List all configured servers
claude mcp get github                    # Details for specific server
claude mcp remove github                 # Remove a server
claude mcp add-from-claude-desktop       # Import from Claude Desktop
claude mcp add-json name '{"type":"http","url":"..."}' # Add from JSON
claude mcp reset-project-choices         # Reset project approval choices
```

In session: `/mcp` for status and authentication.

## Authentication

OAuth 2.0 supported for remote servers. Pre configured OAuth credentials:
```bash
claude mcp add --transport http \
  --client-id your-client-id --client-secret --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

## Token Budget Management

- Warning at 10,000 tokens per MCP tool output
- Default max: 25,000 tokens
- Override: `export MAX_MCP_OUTPUT_TOKENS=50000`
- Keep under 10 MCPs enabled with under 80 tools active
- Context window can shrink from 200K to 70K with too many tools

## Tool Search (Auto Scales)

When MCP tool descriptions exceed 10% of context window, Tool Search activates automatically.
```bash
ENABLE_TOOL_SEARCH=auto:5 claude    # Custom 5% threshold
ENABLE_TOOL_SEARCH=false claude     # Disable entirely
```

## MCP Security

- enableAllProjectMcpServers: false prevents malicious MCP servers in git repos
- Never auto approve MCPs from unknown sources
- 24 CVE mapped vulnerabilities documented in community
- 5 minute audit checklist: source verification, permission scope, code review, community safe list
