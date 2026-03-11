# Agent Orchestration Rules

## Model Tiering

Agents are tiered by task complexity. Always use the correct tier:

| Tier | Model | Agents | Use For |
|---|---|---|---|
| Complex analysis | Opus | signal-architect, tracking-auditor | Cross-platform data quality, event dedup verification, CAPI health, server-side tracking analysis |
| Mid complexity | Sonnet | budget-optimizer, creative-analyst, platform-strategist, compliance-auditor, attribution-analyst | Budget allocation, creative fatigue, campaign structure, policy review, attribution modeling |
| Fast lookups | Haiku | keyword-strategist, landing-page-analyst | Keyword research, QS optimization, page speed checks, UX audits |

## Execution Modes

**Swarm mode (default):** Launch all independent agents in parallel. Use when work streams do not depend on each other's output. Example: auditing tracking + creative + bidding simultaneously.

**Sequential mode:** Use only when one agent's output feeds the next. Example: tracking audit must complete before attribution analysis because attribution depends on knowing what data is actually being collected.

**Delegate mode:** Single agent handles a contained subtask. Use for focused questions like "check this client's Meta EMQ score."

## Prompt Quality for Subagents

When delegating to a subagent, the prompt must include:
1. Client name and relevant account IDs
2. Specific question to answer (not "audit everything")
3. Which MCP tools to prioritize
4. What format to return results in
5. Any client-specific context from history.md or open-items.md

Bad: "Audit the Google Ads account"
Good: "For Blessed Performance (Google Ads CID: 596-932-2299), pull the last 30 days of campaign performance via mcp__google-ads__get_campaign_performance. Flag any campaigns spending over $50/day with ROAS below 2.0. Return results as a table with campaign name, spend, conversions, ROAS."

## File Conflict Prevention

When multiple agents might write to the same file, designate one agent as the writer and others as readers. Never have two agents editing the same file simultaneously.

## Agent Output Synthesis

After all agents return, the orchestrator (main conversation) must:
1. Cross reference findings across agents (tracking issues found by tracking-auditor may explain attribution gaps found by attribution-analyst)
2. Deduplicate overlapping findings
3. Apply priority tiers (Critical/High/Medium/Low) using OFM audit order
4. Present unified findings to Michael, not raw agent outputs
