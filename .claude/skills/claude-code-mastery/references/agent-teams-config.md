# Agent Teams Configuration Details

## Enabling

Agent teams are experimental and disabled by default.

settings.json:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or environment variable: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## Architecture Components

| Component | Role |
|-----------|------|
| Team lead | Main session that creates team, spawns teammates, coordinates |
| Teammates | Separate Claude instances with independent context windows |
| Task list | Shared work items teammates claim and complete |
| Mailbox | Messaging system for inter agent communication |

## Team Config Format

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

## File Locations

```
~/.claude/teams/{team-name}/
  config.json
  inboxes/
    team-lead.json
    worker-1.json

~/.claude/tasks/{team-name}/
  1.json
  2.json
```

## Display Modes

| Mode | Description | Requirement |
|------|-------------|-------------|
| in-process | All teammates in main terminal. Shift+Down to cycle. | Any terminal |
| split panes | Each teammate gets own pane. | tmux or iTerm2 |
| auto (default) | Uses split if already in tmux, otherwise in-process | |

Force mode: `claude --teammate-mode in-process`

## Environment Variables (Auto Set)

```
CLAUDE_CODE_TEAM_NAME="my-project"
CLAUDE_CODE_AGENT_ID="worker-1@my-project"
CLAUDE_CODE_AGENT_NAME="worker-1"
CLAUDE_CODE_AGENT_TYPE="Explore"
CLAUDE_CODE_AGENT_COLOR="#4A90D9"
CLAUDE_CODE_PLAN_MODE_REQUIRED="false"
CLAUDE_CODE_PARENT_SESSION_ID="session-xyz"
```

## Orchestration Patterns

**Pattern 1: Parallel Specialists** -- Multiple reviewers on same code from different lenses

**Pattern 2: Sequential Pipeline** -- Tasks with dependencies auto unblock

**Pattern 3: Self Organizing Swarm** -- Workers poll TaskList, claim and complete tasks

**Pattern 4: Research then Implementation** -- Research agent feeds implementation agent

**Pattern 5: Plan Approval** -- Read only plan mode until leader approves

**Pattern 6: Competing Hypotheses** -- Multiple agents investigate different theories in parallel

## Task System

Tasks have three states: pending, in_progress, completed. Dependencies auto unblock when blocking tasks complete. File locking prevents race conditions.

## Quality Gates via Hooks

- TeammateIdle: Exit code 2 sends feedback and keeps teammate working
- TaskCompleted: Exit code 2 prevents completion and sends feedback

## Key Constraints

- One team per session
- No nested teams
- Lead is fixed for team lifetime
- Token costs scale linearly with teammate count
- 3 to 5 teammates is the sweet spot
- Teammates load CLAUDE.md, MCP servers, and skills but NOT lead's conversation history
