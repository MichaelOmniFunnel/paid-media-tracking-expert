---
name: claude-code-mastery
description: Advanced Claude Code configuration patterns, agent orchestration, MCP setup, CLAUDE.md best practices, skills and agents architecture, and marketing agency workflows. Use when optimizing Claude Code setup, configuring agents, building new skills, setting up hooks, or troubleshooting Claude Code configuration.
---

# Claude Code Mastery Reference (2025/2026)

Compiled from official Anthropic documentation, community guides, and production implementations. This skill captures actionable patterns for advanced Claude Code usage.

## Table of Contents

1. CLAUDE.md Best Practices
2. Skills Architecture
3. Subagent Configuration
4. Agent Teams (Swarm Mode)
5. MCP Server Configuration
6. Hooks
7. Marketing Agency Patterns
8. Performance and Cost Optimization
9. Security Best Practices

---

## 1. CLAUDE.md Best Practices

### Official Anthropic Guidance

CLAUDE.md is loaded every session. Only include things that apply broadly. For domain knowledge or workflows relevant only sometimes, use skills instead.

**Target length**: Under 60 lines per file (HumanLayer recommendation). Under 300 lines absolute maximum. Anthropic says "keep it short and human readable."

**The pruning test**: For each line, ask "Would removing this cause Claude to make mistakes?" If not, cut it. Bloated CLAUDE.md files cause Claude to ignore actual instructions.

**Emphasis for critical rules**: Adding "IMPORTANT" or "YOU MUST" improves adherence for high priority instructions.

### What to Include

- Bash commands Claude cannot guess
- Code style rules that differ from defaults
- Testing instructions and preferred test runners
- Repository etiquette (branch naming, PR conventions)
- Architectural decisions specific to the project
- Developer environment quirks (required env vars)
- Common gotchas or non obvious behaviors

### What to Exclude

- Anything Claude can figure out by reading code
- Standard language conventions Claude already knows
- Detailed API documentation (link to docs instead)
- Information that changes frequently
- Long explanations or tutorials
- File by file descriptions of the codebase
- Self evident practices like "write clean code"

### Structure Pattern: WHY, WHAT, HOW

- **WHAT**: Tech stack, project structure, codebase map
- **WHY**: Purpose of the project, what everything does
- **HOW**: Build tools, testing, verification processes, workflow rules

### Progressive Disclosure Pattern

Keep CLAUDE.md lean. Move detailed docs to a separate directory and reference them:

```
agent_docs/
  building_the_project.md
  running_tests.md
  code_conventions.md
  service_architecture.md
```

Then in CLAUDE.md use file references: `@docs/git-instructions.md`

### Import Syntax

CLAUDE.md files support `@path/to/import` syntax:

```markdown
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

### Location Hierarchy

- `~/.claude/CLAUDE.md` applies to all sessions globally
- `./CLAUDE.md` or `.claude/CLAUDE.md` applies to the project (check into git)
- `CLAUDE.local.md` for personal overrides (gitignore it)
- Parent directories: useful for monorepos where both root and nested are pulled in
- Child directories: pulled in on demand when working with files in those directories

### Anti Patterns

1. Do not auto generate. Spend time thinking about every single line.
2. Claude is not a linter. Use linters and code formatters.
3. Do not overload. Frontier LLMs follow ~150 to 200 instructions with reasonable consistency, but Claude Code's system prompt already contains ~50 instructions.
4. Skip irrelevant content. Exclude task specific instructions that will not apply universally.

---

## 2. Skills Architecture

### File Structure

```
.claude/skills/my-skill/
  SKILL.md           # Main instructions (required)
  template.md        # Template for Claude to fill in
  examples/
    sample.md        # Example output showing expected format
  scripts/
    validate.sh      # Script Claude can execute
```

### SKILL.md Format

```yaml
---
name: my-skill
description: What this skill does and when to use it
allowed-tools: Read, Grep, Glob, WebFetch
model: opus
context: fork
agent: Explore
disable-model-invocation: true
user-invocable: false
argument-hint: [issue-number]
---

# Skill Instructions

Your markdown instructions here. Use $ARGUMENTS for passed arguments.
Use $ARGUMENTS[0], $ARGUMENTS[1] or $0, $1 for positional args.
Use ${CLAUDE_SESSION_ID} for session ID.
Use ${CLAUDE_SKILL_DIR} for the skill's directory path.
```

### Key Frontmatter Fields

| Field | Purpose |
|-------|---------|
| `name` | Display name and /slash-command (lowercase, hyphens, max 64 chars) |
| `description` | When to use. Claude uses this for auto discovery |
| `allowed-tools` | Tools Claude can use without permission prompts |
| `model` | Model override when skill is active |
| `context` | Set to `fork` to run in isolated subagent context |
| `agent` | Subagent type when context: fork is set (Explore, Plan, general-purpose) |
| `disable-model-invocation` | true = only manual /slash invocation, not auto triggered |
| `user-invocable` | false = hidden from / menu, only Claude can invoke |
| `argument-hint` | Shown during autocomplete for expected arguments |

### Invocation Control Matrix

| Setting | User can invoke | Claude can invoke |
|---------|:-:|:-:|
| (default) | Yes | Yes |
| disable-model-invocation: true | Yes | No |
| user-invocable: false | No | Yes |

### Dynamic Context Injection

Use `!`command`` to run shell commands before skill content is sent to Claude:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`
```

### Storage Locations

| Location | Path | Applies to |
|----------|------|------------|
| Enterprise | managed settings | All users in org |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |

Priority: enterprise > personal > project.

### Bundled Skills (Ship with Claude Code)

- `/simplify` reviews recently changed files for code reuse, quality, efficiency. Spawns 3 parallel review agents.
- `/batch <instruction>` orchestrates large scale changes across codebase in parallel. Decomposes work into 5 to 30 independent units, spawns one background agent per unit in isolated git worktrees.
- `/debug [description]` troubleshoots current session by reading debug log.
- `/claude-api` loads Claude API reference material for your language.

### Keep SKILL.md Under 500 Lines

Move detailed reference material to separate files and reference them from SKILL.md.

---

## 3. Subagent Configuration

### File Format

Location: `.claude/agents/`

```yaml
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
color: orange
---

You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```

### Auto Trigger via Description

Make the description rich with examples of when to delegate:

```yaml
description: |
  Use this agent when the task involves Dexie.js or IndexedDB in any way -
  implementing, modifying, querying, reviewing, or improving database code.
  Examples:
  - "What can I improve on this Dexie codebase?"
  - "I need to add a new goals table"
```

### Subagents vs Skills vs Commands

| Feature | CLAUDE.md | Slash Command | Subagent | Skill |
|---------|:-:|:-:|:-:|:-:|
| Main Context | Yes | Yes | No | Yes |
| Separate Window | No | No | Yes | No |
| Manual Invocation | No | Yes | Delegated | Via description match |
| Auto Discovery | Auto loaded | Via description | Via description | Via description |

**When to use what:**
- CLAUDE.md: Always true project conventions
- Slash Command: Explicit, on demand workflows
- Subagent: Research heavy tasks requiring document fetching/synthesis (separate context window)
- Skill: Rich, reusable workflows with supporting reference files

### Preloading Skills into Subagents

Subagents can have skills preloaded at startup. The skill content is injected at startup rather than loaded on demand.

---

## 4. Agent Teams (Swarm Mode)

### Enabling

Agent teams are experimental and disabled by default.

**settings.json:**
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Or environment variable:**
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Architecture Components

| Component | Role |
|-----------|------|
| Team lead | Main session that creates team, spawns teammates, coordinates |
| Teammates | Separate Claude instances with independent context windows |
| Task list | Shared work items teammates claim and complete |
| Mailbox | Messaging system for inter agent communication |

### File Locations

```
~/.claude/teams/{team-name}/
  config.json
  inboxes/
    team-lead.json
    worker-1.json
    worker-2.json

~/.claude/tasks/{team-name}/
  1.json
  2.json
  3.json
```

### Team Config Format

```json
{
  "name": "my-project",
  "description": "Feature implementation",
  "leadAgentId": "team-lead@my-project",
  "createdAt": 1706000000000,
  "members": [
    {
      "agentId": "team-lead@my-project",
      "name": "team-lead",
      "agentType": "team-lead",
      "color": "#4A90D9",
      "backendType": "in-process",
      "joinedAt": 1706000000000
    },
    {
      "agentId": "worker-1@my-project",
      "name": "worker-1",
      "agentType": "Explore",
      "model": "haiku",
      "prompt": "Analyze codebase structure...",
      "color": "#D94A4A",
      "planModeRequired": false,
      "backendType": "in-process",
      "cwd": "/Users/me/project"
    }
  ]
}
```

### Display Modes

| Mode | Description | Requirement |
|------|-------------|-------------|
| in-process | All teammates in main terminal. Shift+Down to cycle. | Any terminal |
| split panes | Each teammate gets own pane. | tmux or iTerm2 |
| auto (default) | Uses split if already in tmux, otherwise in-process | |

Force mode: `claude --teammate-mode in-process`

Or in settings.json: `{ "teammateMode": "in-process" }`

### Built in Agent Types

| Type | Tools | Best For |
|------|-------|----------|
| Bash | Bash only | Git operations, system tasks |
| Explore | Read only | Codebase exploration, file searches |
| Plan | Read only | Architecture planning |
| general-purpose | All tools | Multi step tasks, implementation |

### Orchestration Patterns

**Pattern 1: Parallel Specialists**
Multiple reviewers work simultaneously on same code from different lenses (security, performance, simplicity).

**Pattern 2: Sequential Pipeline**
Tasks with dependencies auto unblock when blockers complete.

**Pattern 3: Self Organizing Swarm**
Workers poll TaskList, claim pending tasks with no owner, complete them, repeat until no tasks available.

**Pattern 4: Research then Implementation**
Research agent produces findings, implementation agent uses those findings.

**Pattern 5: Plan Approval**
Teammate works in read only plan mode until leader approves approach.

**Pattern 6: Competing Hypotheses**
Multiple agents investigate different theories in parallel and challenge each other. Fights anchoring bias.

### Task System

Tasks have three states: pending, in_progress, completed. Dependencies auto unblock when blocking tasks complete. File locking prevents race conditions.

### Key Constraints

- One team per session
- No nested teams (teammates cannot spawn their own teams)
- Lead is fixed for team lifetime
- Token costs scale linearly with teammate count
- 3 to 5 teammates is the sweet spot for most workflows
- 5 to 6 tasks per teammate keeps everyone productive
- Teammates load CLAUDE.md, MCP servers, and skills but NOT lead's conversation history
- No session resumption with in-process teammates

### Subagents vs Agent Teams Decision

| Factor | Subagents | Agent Teams |
|--------|-----------|-------------|
| Context | Own window, results return to caller | Own window, fully independent |
| Communication | Report back to main only | Teammates message each other directly |
| Coordination | Main agent manages all work | Shared task list with self coordination |
| Best for | Focused tasks where only result matters | Complex work requiring discussion |
| Token cost | Lower (results summarized back) | Higher (each is separate instance) |

### Environment Variables (Auto Set for Teammates)

```
CLAUDE_CODE_TEAM_NAME="my-project"
CLAUDE_CODE_AGENT_ID="worker-1@my-project"
CLAUDE_CODE_AGENT_NAME="worker-1"
CLAUDE_CODE_AGENT_TYPE="Explore"
CLAUDE_CODE_AGENT_COLOR="#4A90D9"
CLAUDE_CODE_PLAN_MODE_REQUIRED="false"
CLAUDE_CODE_PARENT_SESSION_ID="session-xyz"
```

### Quality Gates via Hooks

- `TeammateIdle`: runs when teammate is about to go idle. Exit code 2 sends feedback and keeps teammate working.
- `TaskCompleted`: runs when task is being marked complete. Exit code 2 prevents completion and sends feedback.

---

## 5. MCP Server Configuration

### Three Transport Types

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

### Windows Specific

On native Windows (not WSL), local MCP servers using npx require the `cmd /c` wrapper:
```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

### Scope Levels

| Scope | Storage | Applies to |
|-------|---------|------------|
| local (default) | `~/.claude.json` under project path | You, this project only |
| project | `.mcp.json` in project root (version controlled) | Team shared |
| user | `~/.claude.json` | You, all projects |

Precedence: local > project > user

### .mcp.json Format (Project Scope)

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

### Management Commands

```bash
claude mcp list                          # List all configured servers
claude mcp get github                    # Details for specific server
claude mcp remove github                 # Remove a server
claude mcp add-from-claude-desktop       # Import from Claude Desktop
claude mcp add-json name '{"type":"http","url":"..."}' # Add from JSON
claude mcp reset-project-choices         # Reset project approval choices
```

In session: `/mcp` for status and authentication.

### Authentication

OAuth 2.0 supported for remote servers:
```bash
# Add server
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
# Then authenticate in session
/mcp
```

Pre configured OAuth credentials:
```bash
claude mcp add --transport http \
  --client-id your-client-id --client-secret --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

### Token Budget Management

- Warning at 10,000 tokens per MCP tool output
- Default max: 25,000 tokens
- Override: `export MAX_MCP_OUTPUT_TOKENS=50000`
- Keep under 10 MCPs enabled with under 80 tools active
- Context window can shrink from 200K to 70K with too many tools

### Tool Search (Auto Scales)

When MCP tool descriptions exceed 10% of context window, Tool Search activates automatically. Tools load on demand instead of preloading all.

```bash
ENABLE_TOOL_SEARCH=auto:5 claude    # Custom 5% threshold
ENABLE_TOOL_SEARCH=false claude     # Disable entirely
```

---

## 6. Hooks

### Purpose

Hooks run scripts automatically at specific points in Claude's workflow. Unlike CLAUDE.md instructions (advisory), hooks are deterministic and guaranteed.

### Hook Types

- **PreToolUse**: Before a tool executes. Exit code 2 blocks execution.
- **PostToolUse**: After a tool executes. For audit logging.
- **TeammateIdle**: When teammate is about to go idle in agent teams.
- **TaskCompleted**: When task is marked complete in agent teams.
- **Stop**: When Claude finishes a turn. Can reject completion.

### Configuration Location

`.claude/settings.json` or interactive via `/hooks`

### Example: Block Sensitive File Commits

```bash
# .claude/hooks/pre-commit.sh
if git diff --cached --name-only | grep -qE '\.(env|key|pem)$|creds\.md'; then
  echo "BLOCKED: Attempting to commit sensitive files"
  exit 1
fi
```

### Example: Block rm -rf

PreToolUse hook that parses Bash stdin via jq, matches `rm -rf` pattern, outputs error message, exits code 2 to block.

### Example: Anti Rationalization Gate (Stop Hook)

Prompt based hook that rejects if Claude declares victory while leaving work undone (claiming issues are "pre existing," deferring to unrequested follow ups, skipping test failures with excuses).

---

## 7. Marketing Agency Patterns

### Agent Team Structure for Marketing

Recommended specialist agents for agency workflows:

1. **Research Agent** conducts market, competitor, and audience analysis
2. **Positioning Agent** develops messaging architecture and differentiation
3. **SEO Agent** structures keyword clusters and content outlines
4. **Copywriting Agent** produces longform content, ads, landing pages
5. **Social Repurposing Agent** adapts content across platforms
6. **Analytics Agent** generates performance reports and anomaly detection
7. **Compliance/QC Agent** verifies brand voice and validates claims

### Content Engine Workflow (Pillar to Omnichannel)

Research identifies topic/sources > SEO builds outline > Copy drafts pillar > Repurposing creates variants > QC checks compliance > Analytics tracks results

### Campaign in a Box Template

Single input (offer + ICP + channels) generates: landing page, email nurture, ad copy sets, LinkedIn plans, and KPI dashboards

### Performance Marketing Specific

- Use MCP connections (Meta Ads, Google Ads, GTM) for live data access
- Keep MCP configurations read only by default to prevent accidental changes
- Use Plan Mode (Shift+Tab) before execution to preview AI commands
- Verify conversion pixel health before trusting AI analysis outputs

### Safety Protocol for Agencies

No agent should publish, send, spend, or delete without explicit human approval. Key governance:
- Shared context files (Brand OS) containing voice rules, positioning, forbidden claims, audience segments
- Approval gates before any external execution
- All external actions require explicit human confirmation

### Efficiency Benchmarks (Reported)

- SEO audits: 8 hours to 1.5 hours (81% reduction)
- Keyword research: 6 hours to 1.5 hours (75% reduction)
- Competitor analysis: 10+ hours to 2.5 hours (75% reduction)
- PPC audits: 5 hours to 1.5 hours (70% reduction)
- Mid sized agency (15 clients): ~$18,000/month in recovered billable time

---

## 8. Performance and Cost Optimization

### Context Management

- Run `/clear` between unrelated tasks
- Use subagents for investigation to keep main context clean
- Auto compaction triggers when approaching context limits
- Custom compaction: `/compact Focus on the API changes`
- Track context usage with custom status line

### Token Reduction Strategies

- Agent teams use 4x to 15x more tokens than single sessions. Reserve for high value tasks.
- 3 to 5 teammates is optimal. Diminishing returns beyond that.
- Prefer targeted `Teammate write` messages over `broadcast` (broadcast costs scale with team size).
- Use subagents for focused tasks where only the result matters.

### Session Management

- `claude --continue` resumes most recent conversation
- `claude --resume` selects from recent sessions
- `/rename` gives sessions descriptive names for later retrieval
- Double tap Escape or `/rewind` for checkpoint restoration

### Cost Saving via Routing

Trail of Bits documents a cc-copilot-bridge tool that routes Claude Code through GitHub Copilot Pro+ for flat rate access ($10/month vs per token billing). Commands: `ccc` for Copilot mode, `ccd` for direct Anthropic, `cco` for offline/Ollama.

### The Kitchen Sink Anti Pattern

Starting with one task then asking something unrelated then going back. Context fills with irrelevant information. Fix: `/clear` between unrelated tasks.

### The Correction Loop Anti Pattern

After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned. A clean session with a better prompt almost always outperforms a long session with accumulated corrections.

---

## 9. Security Best Practices

### Trail of Bits Defaults

```json
{
  "env": {
    "DISABLE_TELEMETRY": "true",
    "DISABLE_ERROR_REPORTING": "true"
  }
}
```

### Permission Deny Rules (Sensitive Paths)

Block read/edit on:
- SSH/GPG: `~/.ssh/**`, `~/.gnupg/**`
- Cloud credentials: `~/.aws/**`, `~/.azure/**`, `~/.kube/**`
- Package tokens: `~/.npmrc`, `~/.pypirc`
- Git credentials: `~/.git-credentials`
- Shell configs: `~/.bashrc`, `~/.zshrc` (prevent backdoors)

### MCP Security

- `enableAllProjectMcpServers: false` prevents malicious MCP servers in git repos
- Never auto approve MCPs from unknown sources
- 24 CVE mapped vulnerabilities documented in community (prompt injection, data exfiltration)
- 5 minute audit checklist: source verification, permission scope, code review, community safe list

### Three Layer Sandboxing (Trail of Bits)

1. Built in sandbox (`/sandbox` command) using OS level isolation
2. Devcontainer for full filesystem isolation
3. Remote disposable cloud instances

### Claude Code Error Rate

ACM 2025 research: Claude Code can generate 1.75x more logic errors than human code. Always provide verification (tests, scripts, screenshots). Never ship unverified code.

---

## Key Resources

- Official docs: https://code.claude.com/docs/en/overview
- Agent teams: https://code.claude.com/docs/en/agent-teams
- Skills: https://code.claude.com/docs/en/skills
- MCP: https://code.claude.com/docs/en/mcp
- Best practices: https://code.claude.com/docs/en/best-practices
- Trail of Bits config: https://github.com/trailofbits/claude-code-config
- Ultimate Guide: https://github.com/FlorianBruniaux/claude-code-ultimate-guide
- Swarm Skill Gist: https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea
