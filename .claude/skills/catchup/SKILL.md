---
name: catchup
description: Restore context after a session break. Reads Asana board state, client context, recent history, and presents a continuity summary before proceeding. Use when returning from a break, starting a new session, or when someone says 'catch me up', 'where were we', 'what's open', or 'session start'.
allowed-tools: Read, Grep, Glob, Agent
---
# Session Catchup

Restore full working context after a session break. Reads all relevant state and presents a concise summary so Michael can confirm current priorities before new work begins.

## When to Use

- Start of any new session
- After a long break mid-conversation
- When Michael asks "where were we" or "what's open"
- After context compaction if significant state was lost

## Instructions

### Step 1: Read Asana Board (Parallel)

Pull current state from the Claude project board:

**Agent 1: Open/In Progress Tasks**
```
mcp__asana__asana_search_tasks
  workspace: 1206269095077183
  projects.any: 1213561988868639
  completed: false
  sort_by: modified_at
  sort_ascending: false
```

For each task found, note: title, section, status (in progress vs not started), last modified date, and any recent comments/stories.

**Agent 2: Recently Completed Tasks**
```
mcp__asana__asana_search_tasks
  workspace: 1206269095077183
  projects.any: 1213561988868639
  completed: true
  modified_at.after: [7 days ago]
  sort_by: modified_at
  sort_ascending: false
```

Shows what was finished recently for continuity.

### Step 2: Read Local Context (Parallel with Step 1)

Check for active working state:

1. **Planning files**: Read task_plan.md, findings.md, progress.md if they exist in the project root. These indicate an in-progress multi-step task.

2. **Recent client work**: Check clients/ for any history.md files modified in the last 7 days:
   ```
   Glob: clients/*/history.md
   ```
   Read the most recently modified ones to understand which clients were active.

3. **Open items**: Read clients/*/open-items.md for any client with recent activity. These contain unresolved items from previous sessions.

4. **Memory**: Read .claude/memory/MEMORY.md for any session-specific notes that were preserved.

### Step 3: Synthesize and Present

Compile everything into a concise summary:

```
## Session Catchup Summary
Date: [DATE]

### In Progress
[Tasks currently marked in progress on Asana, with brief context]

### Recently Completed (last 7 days)
[What was finished, so Michael knows what's already done]

### Open Items by Client
[Client name]: [count] open items
  - [Most urgent item]
  - [Second item]

### Active Planning
[If task_plan.md exists: current phase, % complete, next step]
[If no planning files: "No active multi-step plan"]

### Pending Blockers
[Any tasks blocked on external access, approvals, or dependencies]

### Suggested Priority
Based on urgency and recency, recommended focus:
1. [Most urgent item and why]
2. [Second priority]
3. [Third priority]
```

### Step 4: Confirm with Michael

Present the summary and ask: "Does this match where you want to pick up, or should we focus on something else?"

Do NOT proceed with any work until Michael confirms direction. The catchup is informational. Michael decides what to do next.

## Output

A concise continuity summary covering Asana state, client context, planning state, and recommended priorities. Designed to take less than 60 seconds to read.
