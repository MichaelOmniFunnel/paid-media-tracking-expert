# Project Optimization Research Findings (2026-03-06)

## Summary
6 parallel research agents deployed for final optimization sweep. All completed.

## Agent Results

### Agent 1: CLAUDE.md and Rules Best Practices
- Optimal instruction budget: 150-200 lines (we achieved 162)
- paths: vs globs: frontmatter has documented bugs
- Subdirectory CLAUDE.md auto-loading is unreliable, skip for now

### Agent 2: Hooks Best Practices
- exit 2 has documented bug (#24327) where Claude stops responding
- Correct pattern: JSON with hookSpecificOutput.permissionDecision: "deny" on exit 0
- IMPLEMENTED: PreToolUse now uses this pattern

### Agent 3: MCP and Skills
- Tool Search auto-activates at 10% context threshold
- Skills description budget: 15K default
- SLASH_COMMAND_TOOL_CHAR_BUDGET env var doubles it
- IMPLEMENTED: Set to 30000

### Agent 4: Agent Teams
- Delegate mode bug (#25037) NOT fixed as of March 2026
- Parallel Specialists pattern is ideal for audits
- Task dependency patterns documented

### Agent 5: Power Features
- SessionStart hook with matcher "compact" can re-inject context after compaction (not implemented, needs validation)
- Comprehensive permission patterns documented
- IMPLEMENTED: Read denials added to permissions

### Agent 6: Paid Media AI Patterns
- Our setup is ahead of published community configurations
- claude-ads (AgriciDaniel): 190 checks, 12 RAG reference files, 11 industry templates
- We already have claude-ads installed as our root-level ads-* skills
- Google Ads MCP gap: cohnen/mcp-google-ads is free/open source for read-only GAQL queries
- Adspirer MCP covers Google + Meta + LinkedIn + TikTok (paid, 100+ tools)
- Vibe Querying pattern (natural language to GAQL) is dominant workflow trend
- Paid AEO (Agent Engine Optimization) is emerging concept for 2026

## Recommendations Not Yet Implemented

### High Value
1. Add Google Ads MCP server (cohnen/mcp-google-ads for read-only, or Adspirer for full access)
2. Pull claude-ads benchmark/reference data files (12 files with 2026 current benchmarks)
3. Pull claude-ads industry templates (11 templates vs our 4)

### Medium Value
4. SessionStart compact re-injection hook (needs testing)
5. Paid AEO service offering (monitor and evaluate)

### Already Implemented This Session
- PreToolUse hook fix (JSON permissionDecision:deny)
- Stop hook fix (non-blocking Start-Process)
- Read denials added to permissions
- Rules condensed (security 114->24, client-memory 102->19)
- Skills budget cleanup (91->42 global, 34K->14K chars)
- SLASH_COMMAND_TOOL_CHAR_BUDGET=30000
- .claudeignore created

## Key Sources
- claude-ads: github.com/AgriciDaniel/claude-ads
- Stormy AI playbooks: stormy.ai/blog/
- Adspirer MCP: adspirer.com
- cohnen/mcp-google-ads: github.com/cohnen/mcp-google-ads
- Flyweel: flyweel.co (free Google+Meta read-only)
- Trail of Bits config: github.com/trailofbits/claude-code-config
