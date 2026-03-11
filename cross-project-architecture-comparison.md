# Cross Project Architecture Comparison
## Paid Media & Tracking Expert vs SEO & Technical Dev Expert
Date: 2026-03-11

## Inventory Side by Side

| Component | Paid Media | SEO | Notes |
|---|---|---|---|
| Skills | 31 | 32 | Comparable |
| Agents | 9 | 9 | Same count, different tiering |
| Rules | 4 | 8 | PM is half |
| Frameworks | 11 | 10 | PM slightly ahead |
| Hooks (events) | 8 | 6 | PM ahead |
| Hook scripts | 7 | 5 | PM ahead |
| MCP servers | 7 | 10 | Different tools for different domains |
| Chrome scripts | 2 dirs | 8 scripts | SEO more built out |
| Eval checks | basic | 383 | Major PM gap |
| Templates | exists | 2 structured | PM less defined |
| Client folders | 0 active | 3 active | Both have _template |

## Critical Gaps (PM needs to fix)

### 1. No real eval/validation framework

SEO has 383 automated checks across 7 validators (skills, agents, rules, hooks, settings, refs, operational) orchestrated by validate-all.sh. Pre-commit hook blocks commits on validation failure. PM has a single validate-project.js that is nowhere near this. This is the single biggest architectural gap.

SEO validators:
- validate-skills.sh (160 checks)
- validate-agents.sh (54 checks)
- validate-rules.sh (11 checks)
- validate-hooks.sh (23 checks)
- validate-settings.sh (10 checks)
- validate-refs.sh (73 checks)
- validate-operational.sh (52 checks: CLAUDE.md budget, skill budgets, progressive disclosure, agent completeness, hooks, imports, permissions, MEMORY.md capacity, global settings)

PM has:
- validate-project.js (single file, basic checks)
- eval-skills-agents.js (skill/agent metadata)

### 2. No model tiering on agents

All 9 PM agents use model: sonnet. SEO tiers by complexity:

| Tier | Model | SEO Usage | PM Should Use For |
|---|---|---|---|
| Complex analysis | Opus | technical-seo-auditor, aeo-specialist, netsuite-seo-developer | signal-architect, tracking-auditor |
| Mid-complexity | Sonnet | content-strategist, pagespeed-optimizer, schema-architect | budget-optimizer, creative-analyst, platform-strategist, compliance-auditor |
| Fast lookups | Haiku | search-console-analyst, competitor-intelligence | keyword-strategist, landing-page-analyst |

PM should tier its agents similarly. Signal-architect and tracking-auditor deal with the most technically complex analysis (cross-platform data quality, event dedup verification) and warrant Opus. Budget-optimizer and creative-analyst are mid-complexity Sonnet work. Keyword-strategist and landing-page-analyst do structured lookups that Haiku handles well.

### 3. CLAUDE.md over budget

SEO enforces a 100 line budget on CLAUDE.md and validates it in their operational checks. PM is at 112 lines. SEO keeps it lean by:

- Extracting writing rules to .claude/rules/writing-style.md (not inline)
- Using @import to load frameworks on demand instead of describing them inline
- Moving context management details to a rules file

PM should extract the Writing Rules section (lines 39-60) and Context Management section (lines 101-106) to dedicated rules files, bringing CLAUDE.md well under 100 lines.

## High Priority Gaps

### 4. Missing rules files (PM has 4, SEO has 8)

PM currently has:
- anomaly-flagging.md
- client-memory.md
- security.md
- verification-comments.md

PM is missing these dedicated rule files that SEO has:

| Rule File | What It Covers | Why PM Needs It |
|---|---|---|
| context-management.md | Token efficiency, session structure, compaction protocol, subagent delegation, MCP token awareness | PM has some of this in CLAUDE.md but not as a dedicated rule. Keeps context management practices consistent. |
| agent-orchestration.md | Model tiering (Opus/Sonnet/Haiku), agent teams protocol, execution modes, swarm archetypes, delegation guidelines, subagent prompt quality, file conflict prevention | PM says "swarm mode is default" but has no detailed orchestration rules. SEO defines when to use delegate vs swarm, how to prompt subagents, how to prevent file conflicts. |
| self-learning.md | Instinct pipeline with confidence scoring, promotion criteria at 80%+, retirement process | PM has "create or update skills when learning" but no scoring system. Instincts capture patterns too small for a skill but too valuable to lose. |
| mcp-response-efficiency.md | Handling verbose MCP responses, tools most likely to produce large output, pagination and LIMIT strategies | PM has 7 MCP servers. Without this rule, large responses from GA4, Google Ads, or Meta Ads waste context tokens. |
| writing-style.md | Extracted from CLAUDE.md: banned words, structural tics, core style rules | PM has this content inline in CLAUDE.md. Extracting it saves 20+ lines from CLAUDE.md and makes it a proper rule that is auto-loaded. |

### 5. No @import syntax for frameworks

SEO's CLAUDE.md uses @import to load frameworks on demand:
```
@.claude/frameworks/seo-audit-methodology.md
@.claude/frameworks/cwv-remediation.md
```

PM lists frameworks in the Reference Architecture section but does not use @import. This means PM frameworks sit on disk but are not loaded into context unless explicitly read. SEO's approach makes frameworks automatically available when CLAUDE.md is processed.

PM has 11 frameworks that should be @import referenced:
- poas-methodology.md
- budget-pacing.md
- reporting-pipeline.md
- deliverable-recipes.md
- (and 7 others)

### 6. Hooks in gitignored file vs committed file

| Aspect | PM | SEO |
|---|---|---|
| Hook location | settings.local.json (gitignored) | settings.json (committed) |
| Versioned with code | No | Yes |
| Survives clone/new machine | No | Yes |
| Editable without commit | Yes | No |

PM's approach means if the repo is cloned or set up on a new machine, hooks do not come with it. For a single-user project, SEO's approach is better. Hooks should be committed so they are versioned and reproducible.

Recommendation: Move hook definitions from settings.local.json to settings.json. Keep settings.local.json for machine-specific overrides only (if any).

### 7. No structured instinct/learning pipeline

SEO has .claude/memory/instincts.md with:
- Scored discoveries (0 to 100% confidence)
- Promotion criteria (promote to skill/rule at 80%+ confidence after 3+ confirmations)
- Retirement process (remove instincts proven wrong)
- Categories: token management, compaction behavior, platform quirks, etc.

PM has "Self Learning Protocol" in CLAUDE.md that says "create or update skills when learning" but no structured pipeline with scoring. The gap is that PM has no intermediate storage between "noticed something" and "created a full skill." Small patterns get lost.

## Medium Priority Gaps

### 8. No catchup skill

SEO has a dedicated skill for restoring context after session breaks. It reads:
- Asana board state (open tasks, in-progress work)
- Client context (recent history.md entries)
- Recent session activity
- Presents a continuity summary before proceeding

PM relies on manual context gathering or the PreCompact hook (which only fires during compaction, not at session start when returning from a break).

### 9. No project-eval skill

SEO has a non-user-invocable skill that wraps the validation framework. Makes it easy to run structural checks from within a session without remembering the bash command. PM should have this once the eval framework is built.

### 10. No hook profile system

SEO supports OFM_HOOK_PROFILE env var with three modes:

| Profile | Behavior | Use Case |
|---|---|---|
| minimal | Safety hooks only (block-protected-files, block-gtm), skip validation and flag expansion | Simple tasks, reduce overhead |
| standard | All hooks run (default) | Normal operation |
| strict | Enhanced checks (future) | Audit mode, QA |

PM hooks always run at full weight. On simple tasks (quick question, single file edit), the full hook stack adds unnecessary overhead. A profile system lets you toggle this.

### 11. No per-client CLAUDE.md files

SEO has a CLAUDE.md inside each client folder (clients/verocious-motorsports/CLAUDE.md) containing client-specific instructions and context that gets loaded when working on that client.

PM client folders have profile.json, tracking-config.json, history.md, and open-items.md but no client-level CLAUDE.md for client-specific behavioral instructions.

### 12. Client template gaps

SEO template includes: CLAUDE.md, profile.json, seo-config.json, strategy.md

The strategy.md persists strategic decisions across sessions so they do not get lost (e.g., "client wants to focus on branded terms, not broad match" or "POAS target is 2.0x, agreed in Q1 QBR").

PM template should mirror this pattern with a tracking-strategy.md or media-strategy.md for persisting decisions like bidding targets, POAS goals, platform allocation rationale, and client-specific tracking architecture decisions.

### 13. Global settings not verified

SEO has these set globally:
- CLAUDE_CODE_EFFORT_LEVEL=high (env var)
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
- alwaysThinkingEnabled: true

PM should verify these are set. Agent Teams is especially important for swarm mode operations.

## Low Priority / Nice to Have

### 14. Pre-commit hook enforcement
SEO blocks commits on validation failure. Ensures structural integrity is maintained with every commit. PM does not have this.

### 15. Developer handoff template
SEO has templates/developer-handoff.md for when audit findings need to be handed to a developer. Useful for PM when handing off tracking implementation specs to client dev teams.

### 16. Smoke test checklist
SEO has scripts/eval/smoke-test.md for manual QA testing (10 skill trigger tests, 5 agent invocation tests, 6 hook behavior tests, 3 @import verification tests, 3 memory persistence tests). Provides a repeatable manual test suite.

### 17. Comprehensive project documentation
SEO has a 105KB Design Blueprint document and 83KB Infrastructure Document. PM has a draft (OFM-Claude-Agent-Infrastructure-DRAFT.md) that is not finalized.

## Things PM Does Better Than SEO

PM is not behind on everything. These are PM strengths:

1. **More hook events (8 vs 6)**: PM has SessionStart and a more developed UserPromptSubmit
2. **Planning with Files**: PM has the full Manus-style planning system with task_plan.md, findings.md, progress.md. SEO does not.
3. **Stop hook with phase completion check**: PM checks task_plan.md phases before session end
4. **More platform deny matchers**: PM blocks 4 categories of platform writes (Meta Ads, Google Ads via Zapier, ActiveCampaign, Outlook)
5. **PostToolUse validation is Node.js**: Works identically on Windows without bash/python dependency issues that SEO occasionally hits
6. **Firecrawl MCP**: PM has it connected, SEO still pending
7. **Verification comments rule**: PM has a dedicated rule for documenting verification evidence on Asana tasks. SEO does verification but does not have a dedicated rule for it.

## Recommended Action Plan

| Priority | Item | Effort | Impact |
|---|---|---|---|
| P1 | Build eval/validation framework (port SEO's 383 check approach) | Large | Structural integrity, prevents drift |
| P1 | Add model tiering to agents (Opus/Sonnet/Haiku) | Small | Better quality on complex analysis, faster on simple lookups |
| P1 | Extract writing rules to rules file, trim CLAUDE.md under 100 lines | Medium | Follows proven SEO pattern, reduces token overhead |
| P2 | Add 4 missing rules files (context-mgmt, agent-orch, self-learning, mcp-response) | Medium | Consistent behavior, structured learning |
| P2 | Move hooks from settings.local.json to settings.json | Small | Hooks versioned with code |
| P2 | Create instincts.md learning pipeline | Small | Captures small patterns without full skill creation |
| P2 | Build catchup skill | Small | Faster context restoration after session breaks |
| P3 | Add @import syntax for frameworks in CLAUDE.md | Small | Frameworks auto-loaded with CLAUDE.md |
| P3 | Hook profile system (minimal/standard/strict) | Medium | Reduce overhead on simple tasks |
| P3 | Per-client CLAUDE.md + strategy.md in template | Small | Client-specific instructions persist |
| P3 | Verify global settings alignment | Small | Agent Teams, Effort Level, Thinking enabled |
| P3 | Pre-commit hook enforcement | Small | Blocks commits on validation failure |
| P3 | Developer handoff template | Small | Standardized tracking implementation specs |
| P3 | Smoke test checklist | Small | Repeatable manual QA |
