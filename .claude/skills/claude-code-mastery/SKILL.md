---
name: claude-code-mastery
description: Advanced Claude Code configuration patterns, agent orchestration, MCP setup, CLAUDE.md best practices, skills and agents architecture, and marketing agency workflows. Use when optimizing Claude Code setup, configuring agents, building new skills, setting up hooks, or troubleshooting Claude Code configuration.
model: sonnet
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Claude Code Mastery Reference (2025/2026)

Compiled from official Anthropic documentation, community guides, and production implementations.

---

## 1. CLAUDE.md Best Practices

### Official Anthropic Guidance

CLAUDE.md is loaded every session. Only include things that apply broadly. For domain knowledge or workflows relevant only sometimes, use skills instead.

**Target length**: Under 60 lines per file (HumanLayer recommendation). Under 300 lines absolute maximum.

**The pruning test**: For each line, ask "Would removing this cause Claude to make mistakes?" If not, cut it.

**Emphasis for critical rules**: Adding "IMPORTANT" or "YOU MUST" improves adherence.

### What to Include

- Bash commands Claude cannot guess
- Code style rules that differ from defaults
- Testing instructions and preferred test runners
- Repository etiquette (branch naming, PR conventions)
- Architectural decisions specific to the project
- Developer environment quirks

### What to Exclude

- Anything Claude can figure out by reading code
- Standard language conventions Claude already knows
- Detailed API documentation (link instead)
- Information that changes frequently
- File by file descriptions of the codebase

### Structure Pattern: WHY, WHAT, HOW

- **WHAT**: Tech stack, project structure, codebase map
- **WHY**: Purpose of the project, what everything does
- **HOW**: Build tools, testing, verification processes, workflow rules

### Progressive Disclosure Pattern

Keep CLAUDE.md lean. Move detailed docs to separate directories and reference them.

### Import Syntax

CLAUDE.md files support `@path/to/import` syntax for referencing other files.

### Location Hierarchy

- `~/.claude/CLAUDE.md` applies globally
- `./CLAUDE.md` or `.claude/CLAUDE.md` applies to the project (check into git)
- `CLAUDE.local.md` for personal overrides (gitignore it)
- Parent/child directories: pulled in hierarchically

### Anti Patterns

1. Do not auto generate. Think about every line.
2. Claude is not a linter. Use linters and formatters.
3. Do not overload. ~150 to 200 instructions max with consistency.
4. Skip task specific instructions that will not apply universally.

---

## 2. Skills Architecture

### File Structure

```
.claude/skills/my-skill/
  SKILL.md           # Main instructions (required)
  template.md        # Template for Claude to fill in
  examples/
  scripts/
```

### Key Frontmatter Fields

| Field | Purpose |
|-------|---------|
| name | Display name and /slash-command (lowercase, hyphens, max 64 chars) |
| description | When to use. Claude uses this for auto discovery |
| allowed-tools | Tools Claude can use without permission prompts |
| model | Model override when skill is active |
| context | Set to fork to run in isolated subagent context |
| agent | Subagent type when context: fork is set |
| disable-model-invocation | true = only manual /slash invocation |
| user-invocable | false = hidden from / menu, only Claude can invoke |
| argument-hint | Shown during autocomplete for expected arguments |

### Invocation Control Matrix

| Setting | User can invoke | Claude can invoke |
|---------|:-:|:-:|
| (default) | Yes | Yes |
| disable-model-invocation: true | Yes | No |
| user-invocable: false | No | Yes |

### Dynamic Context Injection

Use `!`command`` to run shell commands before skill content is sent to Claude.

### Storage Locations

| Location | Path | Applies to |
|----------|------|------------|
| Enterprise | managed settings | All users in org |
| Personal | ~/.claude/skills/ | All your projects |
| Project | .claude/skills/ | This project only |

Priority: enterprise > personal > project.

### Bundled Skills

- `/simplify` reviews recently changed files. Spawns 3 parallel review agents.
- `/batch <instruction>` orchestrates large scale changes in parallel worktrees.
- `/debug [description]` troubleshoots by reading debug log.
- `/claude-api` loads Claude API reference material.

### Keep SKILL.md Under 500 Lines

Move detailed reference material to separate files and reference them from SKILL.md.

---

## 3. Subagent Configuration

### File Format

Location: `.claude/agents/`

Agents are flat .md files with YAML frontmatter: name, description, tools, model, color. The markdown body contains the agent's instructions.

### Auto Trigger via Description

Make descriptions rich with examples of when to delegate to improve auto-discovery.

### Subagents vs Skills vs Agent Teams

| Feature | CLAUDE.md | Slash Command | Subagent | Skill |
|---------|:-:|:-:|:-:|:-:|
| Main Context | Yes | Yes | No | Yes |
| Separate Window | No | No | Yes | No |
| Manual Invocation | No | Yes | Delegated | Via description |
| Auto Discovery | Auto loaded | Via description | Via description | Via description |

**When to use what:**
- CLAUDE.md: Always true project conventions
- Slash Command: Explicit, on demand workflows
- Subagent: Research heavy tasks (separate context window)
- Skill: Rich, reusable workflows with supporting files

---

## 4. Agent Teams (Swarm Mode)

### Key Concepts

Agent teams provide independent Claude instances with shared task lists and messaging.

### Built in Agent Types

| Type | Tools | Best For |
|------|-------|----------|
| Bash | Bash only | Git operations, system tasks |
| Explore | Read only | Codebase exploration, file searches |
| Plan | Read only | Architecture planning |
| general-purpose | All tools | Multi step tasks, implementation |

### Subagents vs Agent Teams Decision

| Factor | Subagents | Agent Teams |
|--------|-----------|-------------|
| Context | Own window, results return to caller | Fully independent |
| Communication | Report back to main only | Message each other directly |
| Coordination | Main agent manages | Shared task list, self coordination |
| Best for | Focused tasks | Complex work requiring discussion |
| Token cost | Lower | Higher (each is separate instance) |

For detailed team config format, orchestration patterns, and environment variables, read references/agent-teams-config.md

---

## 5. MCP Server Configuration

### Three Transport Types

HTTP (recommended for remote), SSE (deprecated), and Stdio (local processes).

### Scope Levels

Local (default, per project per user) > project (.mcp.json, version controlled) > user (~/.claude.json).

For detailed setup commands, .mcp.json format, authentication, and token management, read references/mcp-setup-patterns.md

---

## 6. Hooks

Hooks run scripts automatically at specific points in Claude's workflow. Unlike CLAUDE.md instructions (advisory), hooks are deterministic and guaranteed.

Types: PreToolUse, PostToolUse, TeammateIdle, TaskCompleted, Stop.

For hook examples, security configuration, and Trail of Bits recommendations, read references/hooks-and-security.md

---

## 7. Marketing Agency Patterns

### Agent Team Structure for Marketing

1. **Research Agent** conducts market, competitor, and audience analysis
2. **Positioning Agent** develops messaging architecture
3. **SEO Agent** structures keyword clusters and content outlines
4. **Copywriting Agent** produces longform content, ads, landing pages
5. **Social Repurposing Agent** adapts content across platforms
6. **Analytics Agent** generates performance reports and anomaly detection
7. **Compliance/QC Agent** verifies brand voice and validates claims

### Performance Marketing Specific

- Use MCP connections (Meta Ads, Google Ads, GTM) for live data access
- Keep MCP configurations read only by default
- Use Plan Mode (Shift+Tab) before execution to preview AI commands
- Verify conversion pixel health before trusting AI analysis outputs

### Safety Protocol

No agent should publish, send, spend, or delete without explicit human approval.

---

## 8. Performance and Cost Optimization

### Context Management

- Run /clear between unrelated tasks
- Use subagents for investigation to keep main context clean
- Custom compaction: /compact Focus on the API changes

### Token Reduction

- Agent teams use 4x to 15x more tokens than single sessions
- 3 to 5 teammates is optimal
- Prefer targeted Teammate write messages over broadcast

### Session Management

- `claude --continue` resumes most recent conversation
- `claude --resume` selects from recent sessions
- Double tap Escape or /rewind for checkpoint restoration

### Anti Patterns

- **Kitchen Sink**: Mixed unrelated tasks fill context. Fix: /clear between tasks.
- **Correction Loop**: After two failed corrections, /clear and write a better initial prompt.

---

## Key Resources

- Official docs: https://code.claude.com/docs/en/overview
- Agent teams: https://code.claude.com/docs/en/agent-teams
- Skills: https://code.claude.com/docs/en/skills
- MCP: https://code.claude.com/docs/en/mcp
- Best practices: https://code.claude.com/docs/en/best-practices
- Trail of Bits config: https://github.com/trailofbits/claude-code-config
