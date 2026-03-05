# X Post

We’re turning Todos into Tasks in Claude Code  
Today, we're upgrading Todos in Claude Code to Tasks. Tasks are a new primitive that help Claude Code track and complete more complicated projects and collaborate on them across multiple sessions or subagents.  
As model capabilities grow, one of the most important things we can do is “unhobble” Claude and allow it to use its new capabilities effectively. Compared to previous models, Opus 4.5 is able to run autonomously for longer and keep track of its state better. We found that the TodoWrite Tool was no longer necessary because Claude already knew what it needed to do for smaller tasks.  
At the same time, we found ourselves using Claude Code to complete longer projects, sometimes across multiple subagents, context windows or sessions. But projects are more complex, tasks have dependencies and blockers and require coordination when using it across sessions.  
It was clear we needed to evolve Todos to help Claude work on longer projects. This need was also emerging in the community and we took inspiration from projects like Beads by Steve Yegge.  
Tasks are our new abstraction for coordinating many pieces of work  across projects, Claude can create Tasks with dependencies on each other that are stored in the metadata, which mirrors more how projects work. Additionally, Tasks are stored in the file system so that multiple subagents or sessions can collaborate on them. When one session updates a Task, that is broadcasted to all sessions currently working on the same Task List.  
You can ask Claude to create tasks right now, it’s especially useful when creating when spinning up subagents. Tasks are stored in \~/.claude/tasks, you can use this to build additional utilities on top of tasks as well.  
To make sessions collaborate on a single Task List, you can set the TaskList as an environment variable and start Claude like so:  
CLAUDE\_CODE\_TASK\_LIST\_ID=groceries claude  
This also works for claude \-p and the AgentSDK.  
Tasks are a key building block for allowing Claude to build more complex projects. We’re looking forward to seeing how you use it.

# Venture Beat Article

Claude Code's 'Tasks' update lets agents work longer and coordinate across sessions

One of the biggest constraints currently facing AI builders who want to deploy agents in service of their individual or enterprise goals is the "working memory" required to manage complex, multi-stage engineering projects.

Typically, when a AI agent operates purely on a stream of text or voice-based conversation, it lacks the structural permanence to handle dependencies. It knows what to do, but it often forgets why it is doing it, or in what order.

With the release of Tasks for Claude Code (introduced in v2.1.16) last week, Anthropic has introduced a solution that is less about "AI magic" and more about sound software engineering principles. 

By moving from ephemeral "To-dos" to persistent "Tasks," the company is fundamentally re-architecting how the model interacts with time, complexity, and system resources.

This update transforms the tool from a reactive coding assistant into a state-aware project manager, creating the infrastructure necessary to execute the sophisticated workflows outlined in Anthropic's just-released Best Practices guide, while recent changelog updates (v2.1.19) signal a focus on the stability required for enterprise adoption.

The architecture of agency: from ephemeral to persistent  
To understand the significance of this release for engineering teams, we must look at the mechanical differences between the old "To-do" system and the new "Task" primitive.

Previously, Claude Code utilized a "To-do" list—a lightweight, chat-resident checklist. 

As Anthropic engineer Thariq Shihipar wrote in an article on X: "Todos (orange) \= 'help Claude remember what to do'." These were effective for single-session scripts but fragile for actual engineering. If the session ended, the terminal crashed, or the context window drifted, the plan evaporated.

Tasks (Green) introduce a new layer of abstraction designed for "coordinating work across sessions, subagents, and context windows." This is achieved through three key architectural decisions:

Dependency Graphs vs. Linear Lists: Unlike a flat Todo list, Tasks support directed acyclic graphs (DAGs). A task can explicitly "block" another. As seen in community demonstrations, the system can determine that Task 3 (Run Tests) cannot start until Task 1 (Build API) and Task 2 (Configure Auth) are complete. This enforcement prevents the "hallucinated completion" errors common in LLM workflows, where a model attempts to test code it hasn't written yet.

Filesystem Persistence & Durability: Anthropic chose a "UNIX-philosophy" approach to state management. Rather than locking project state inside a proprietary cloud database, Claude Code writes tasks directly to the user's local filesystem (\~/.claude/tasks). This creates durable state. A developer can shut down their terminal, switch machines, or recover from a system crash, and the agent reloads the exact state of the project. For enterprise teams, this persistence is critical—it means the "plan" is now an artifact that can be audited, backed up, or version-controlled, independent of the active session.

Orchestration via Environment Variables: The most potent technical unlock is the ability to share state across sessions. By setting the CLAUDE\_CODE\_TASK\_LIST\_ID environment variable, developers can point multiple instances of Claude at the same task list. This allows updates to be "broadcast" to all active sessions, enabling a level of coordination that was previously impossible without external orchestration tools.

Enabling the 'swarm': parallelism and subagents  
The release of Tasks makes the "Parallel Sessions" described in Anthropic's Best Practices guide practical. The documentation suggests a Writer/Reviewer pattern that leverages this shared state:

Session A (Writer) picks up Task \#1 ("Implement Rate Limiter").

Session A marks it complete.

Session B (Reviewer), observing the shared state update, sees Task \#2 ("Review Rate Limiter") is now unblocked.

Session B begins the review in a clean context, unbiased by the generation process.

This aligns with the guide's advice to "fan out" work across files, using scripts to loop through tasks and call Claude in parallel. Crucially, patch v2.1.17 fixed "out-of-memory crashes when resuming sessions with heavy subagent usage," indicating that Anthropic is actively optimizing the runtime for these high-load, multi-agent scenarios.

Enterprise readiness: stability, CI/CD, and control  
For decision-makers evaluating Claude Code for production pipelines, the recent changelogs (v2.1.16–v2.1.19) reveal a focus on reliability and integration.

The Best Practices guide explicitly endorses running Claude in Headless Mode (claude \-p). This allows engineering teams to integrate the agent into CI/CD pipelines, pre-commit hooks, or data processing scripts.

For example, a nightly cron job could instantiate a Claude session to "Analyze the day's log files for anomalies," using a Task list to track progress through different log shards.

The move to autonomous agents introduces new failure modes, which recent patches have addressed:

Dangling Processes: v2.1.19 fixed an issue where Claude Code processes would hang when the terminal closed; the system now catches EIO errors and ensures a clean exit (using SIGKILL as a fallback).

Hardware Compatibility: Fixes for crashes on processors without AVX support ensure broader deployment compatibility.

Git Worktrees: Fixes for resume functionality when working across different directories or git worktrees ensure that the "state" follows the code, not just the shell session.

Recognizing that enterprise workflows cannot turn on a dime, Anthropic introduced the CLAUDE\_CODE\_ENABLE\_TASKS environment variable (v2.1.19). Setting this to false allows teams to opt-out of the new system temporarily, preserving existing workflows while they migrate to the Task-based architecture.

The builder's workflow: managing the context economy  
For the individual developer, the Task system solves the "context economy" problem. Anthropic's documentation warns that "Claude's context window... is the most important resource to manage," and that performance degrades as it fills.

Before Tasks, clearing the context was dangerous—you wiped the agent's memory of the overall plan. Now, because the plan is stored on disk, users can follow the best practice of "aggressive context management." Developers can run /clear or /compact to free up tokens for the model's reasoning, without losing the project roadmap.

The changelog also highlights quality-of-life improvements for power users building complex scripts:

Shorthand Arguments: Users can now access custom command arguments via $0, $1, etc., making it easier to script reusable "Skills" (e.g., a /refactor command that takes a filename as an argument).

Keybindings: Fully customizable keyboard shortcuts (/keybindings) allow for faster interaction loops.

What Tasks means for Claude Code users  
With the introduction of Tasks, Anthropic is signaling that the future of coding agents is a project management.

By giving Claude Code a persistent memory, a way to understand dependency, and the stability fixes required for long-running processes, they have moved the tool from a "copilot" that sits next to you to a "subagent" that can be trusted to run in the background — especially when powered by Anthropic's most performant model, Claude Opus 4.5.

It is a technical evolution that acknowledges a simple truth: in the enterprise, the code is cheap; it is the context, the plan, and the reliability that are precious.

# Agent teams

[https://code.claude.com/docs/en/agent-teams\#set-up-agent-teams](https://code.claude.com/docs/en/agent-teams#set-up-agent-teams)

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Orchestrate teams of Claude Code sessions

\> Coordinate multiple Claude Code instances working together as a team, with shared tasks, inter-agent messaging, and centralized management.

\<Warning\>  
  Agent teams are experimental and disabled by default. Enable them by adding \`CLAUDE\_CODE\_EXPERIMENTAL\_AGENT\_TEAMS\` to your \[settings.json\](/en/settings) or environment. Agent teams have \[known limitations\](\#limitations) around session resumption, task coordination, and shutdown behavior.  
\</Warning\>

Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

Unlike \[subagents\](/en/sub-agents), which run within a single session and can only report back to the main agent, you can also interact with individual teammates directly without going through the lead.

This page covers:

\* \[When to use agent teams\](\#when-to-use-agent-teams), including best use cases and how they compare with subagents  
\* \[Starting a team\](\#start-your-first-agent-team)  
\* \[Controlling teammates\](\#control-your-agent-team), including display modes, task assignment, and delegation  
\* \[Best practices for parallel work\](\#best-practices)

\#\# When to use agent teams

Agent teams are most effective for tasks where parallel exploration adds real value. See \[use case examples\](\#use-case-examples) for full scenarios. The strongest use cases are:

\* \*\*Research and review\*\*: multiple teammates can investigate different aspects of a problem simultaneously, then share and challenge each other's findings  
\* \*\*New modules or features\*\*: teammates can each own a separate piece without stepping on each other  
\* \*\*Debugging with competing hypotheses\*\*: teammates test different theories in parallel and converge on the answer faster  
\* \*\*Cross-layer coordination\*\*: changes that span frontend, backend, and tests, each owned by a different teammate

Agent teams add coordination overhead and use significantly more tokens than a single session. They work best when teammates can operate independently. For sequential tasks, same-file edits, or work with many dependencies, a single session or \[subagents\](/en/sub-agents) are more effective.

\#\#\# Compare with subagents

Both agent teams and \[subagents\](/en/sub-agents) let you parallelize work, but they operate differently. Choose based on whether your workers need to communicate with each other:

\<Frame caption="Subagents only report results back to the main agent and never talk to each other. In agent teams, teammates share a task list, claim work, and communicate directly with each other."\>  
  \<img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=2f8db9b4f3705dd3ab931fbe2d96e42a" className="dark:hidden" alt="Diagram comparing subagent and agent team architectures. Subagents are spawned by the main agent, do work, and report results back. Agent teams coordinate through a shared task list, with teammates communicating directly with each other." data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-light.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=280\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=a2cfe413c2084b477be40ac8723d9d40 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=560\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=c642c09a4c211b10b35eee7d7d0d149f 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=840\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=40d286f77c8a4075346b4fcaa2b36248 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1100\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=923986caa23c0ef2c27d7e45f4dce6d1 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1650\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=17a730a070db6d71d029a98b074c68e8 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=2500\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=e402533fc9e8b5e8d26a835cc4aa1742 2500w" /\>

  \<img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=d573a037540f2ada6a9ae7d8285b46fd" className="hidden dark:block" alt="Diagram comparing subagent and agent team architectures. Subagents are spawned by the main agent, do work, and report results back. Agent teams coordinate through a shared task list, with teammates communicating directly with each other." data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=280\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=06ca5b18b232855acc488357d8d01fa7 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=560\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=3d34daee83994781eb74b74d1ed511c4 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=840\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=82ea35ac837de7d674002de69689b9cf 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1100\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=3653085214a9fc65d1f589044894a296 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1650\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=8e74b42694e428570e876d34f29e6ad6 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=2500\&fit=max\&auto=format\&n=nsvRFSDNfpSU5nT7\&q=85\&s=3be00c56c6a0dcccbe15640020be0128 2500w" /\>  
\</Frame\>

|                   | Subagents                                        | Agent teams                                         |  
| :---------------- | :----------------------------------------------- | :-------------------------------------------------- |  
| \*\*Context\*\*       | Own context window; results return to the caller | Own context window; fully independent               |  
| \*\*Communication\*\* | Report results back to the main agent only       | Teammates message each other directly               |  
| \*\*Coordination\*\*  | Main agent manages all work                      | Shared task list with self-coordination             |  
| \*\*Best for\*\*      | Focused tasks where only the result matters      | Complex work requiring discussion and collaboration |  
| \*\*Token cost\*\*    | Lower: results summarized back to main context   | Higher: each teammate is a separate Claude instance |

Use subagents when you need quick, focused workers that report back. Use agent teams when teammates need to share findings, challenge each other, and coordinate on their own.

\#\# Enable agent teams

Agent teams are disabled by default. Enable them by setting the \`CLAUDE\_CODE\_EXPERIMENTAL\_AGENT\_TEAMS\` environment variable to \`1\`, either in your shell environment or through \[settings.json\](/en/settings):

\`\`\`json settings.json theme={null}  
{  
  "env": {  
    "CLAUDE\_CODE\_EXPERIMENTAL\_AGENT\_TEAMS": "1"  
  }  
}  
\`\`\`

\#\# Start your first agent team

After enabling agent teams, tell Claude to create an agent team and describe the task and the team structure you want in natural language. Claude creates the team, spawns teammates, and coordinates work based on your prompt.

This example works well because the three roles are independent and can explore the problem without waiting on each other:

\`\`\`text  theme={null}  
I'm designing a CLI tool that helps developers track TODO comments across  
their codebase. Create an agent team to explore this from different angles: one  
teammate on UX, one on technical architecture, one playing devil's advocate.  
\`\`\`

From there, Claude creates a team with a \[shared task list\](/en/interactive-mode\#task-list), spawns teammates for each perspective, has them explore the problem, synthesizes findings, and attempts to \[clean up the team\](\#clean-up-the-team) when finished.

The lead's terminal lists all teammates and what they're working on. Use Shift+Down to cycle through teammates and message them directly. After the last teammate, Shift+Down wraps back to the lead.

If you want each teammate in its own split pane, see \[Choose a display mode\](\#choose-a-display-mode).

\#\# Control your agent team

Tell the lead what you want in natural language. It handles team coordination, task assignment, and delegation based on your instructions.

\#\#\# Choose a display mode

Agent teams support two display modes:

\* \*\*In-process\*\*: all teammates run inside your main terminal. Use Shift+Down to cycle through teammates and type to message them directly. Works in any terminal, no extra setup required.  
\* \*\*Split panes\*\*: each teammate gets its own pane. You can see everyone's output at once and click into a pane to interact directly. Requires tmux, or iTerm2.

\<Note\>  
  \`tmux\` has known limitations on certain operating systems and traditionally works best on macOS. Using \`tmux \-CC\` in iTerm2 is the suggested entrypoint into \`tmux\`.  
\</Note\>

The default is \`"auto"\`, which uses split panes if you're already running inside a tmux session, and in-process otherwise. The \`"tmux"\` setting enables split-pane mode and auto-detects whether to use tmux or iTerm2 based on your terminal. To override, set \`teammateMode\` in your \[settings.json\](/en/settings):

\`\`\`json  theme={null}  
{  
  "teammateMode": "in-process"  
}  
\`\`\`

To force in-process mode for a single session, pass it as a flag:

\`\`\`bash  theme={null}  
claude \--teammate-mode in-process  
\`\`\`

Split-pane mode requires either \[tmux\](https://github.com/tmux/tmux/wiki) or iTerm2 with the \[\`it2\` CLI\](https://github.com/mkusaka/it2). To install manually:

\* \*\*tmux\*\*: install through your system's package manager. See the \[tmux wiki\](https://github.com/tmux/tmux/wiki/Installing) for platform-specific instructions.  
\* \*\*iTerm2\*\*: install the \[\`it2\` CLI\](https://github.com/mkusaka/it2), then enable the Python API in \*\*iTerm2 → Settings → General → Magic → Enable Python API\*\*.

\#\#\# Specify teammates and models

Claude decides the number of teammates to spawn based on your task, or you can specify exactly what you want:

\`\`\`text  theme={null}  
Create a team with 4 teammates to refactor these modules in parallel.  
Use Sonnet for each teammate.  
\`\`\`

\#\#\# Require plan approval for teammates

For complex or risky tasks, you can require teammates to plan before implementing. The teammate works in read-only plan mode until the lead approves their approach:

\`\`\`text  theme={null}  
Spawn an architect teammate to refactor the authentication module.  
Require plan approval before they make any changes.  
\`\`\`

When a teammate finishes planning, it sends a plan approval request to the lead. The lead reviews the plan and either approves it or rejects it with feedback. If rejected, the teammate stays in plan mode, revises based on the feedback, and resubmits. Once approved, the teammate exits plan mode and begins implementation.

The lead makes approval decisions autonomously. To influence the lead's judgment, give it criteria in your prompt, such as "only approve plans that include test coverage" or "reject plans that modify the database schema."

\#\#\# Talk to teammates directly

Each teammate is a full, independent Claude Code session. You can message any teammate directly to give additional instructions, ask follow-up questions, or redirect their approach.

\* \*\*In-process mode\*\*: use Shift+Down to cycle through teammates, then type to send them a message. Press Enter to view a teammate's session, then Escape to interrupt their current turn. Press Ctrl+T to toggle the task list.  
\* \*\*Split-pane mode\*\*: click into a teammate's pane to interact with their session directly. Each teammate has a full view of their own terminal.

\#\#\# Assign and claim tasks

The shared task list coordinates work across the team. The lead creates tasks and teammates work through them. Tasks have three states: pending, in progress, and completed. Tasks can also depend on other tasks: a pending task with unresolved dependencies cannot be claimed until those dependencies are completed.

The lead can assign tasks explicitly, or teammates can self-claim:

\* \*\*Lead assigns\*\*: tell the lead which task to give to which teammate  
\* \*\*Self-claim\*\*: after finishing a task, a teammate picks up the next unassigned, unblocked task on its own

Task claiming uses file locking to prevent race conditions when multiple teammates try to claim the same task simultaneously.

\#\#\# Shut down teammates

To gracefully end a teammate's session:

\`\`\`text  theme={null}  
Ask the researcher teammate to shut down  
\`\`\`

The lead sends a shutdown request. The teammate can approve, exiting gracefully, or reject with an explanation.

\#\#\# Clean up the team

When you're done, ask the lead to clean up:

\`\`\`text  theme={null}  
Clean up the team  
\`\`\`

This removes the shared team resources. When the lead runs cleanup, it checks for active teammates and fails if any are still running, so shut them down first.

\<Warning\>  
  Always use the lead to clean up. Teammates should not run cleanup because their team context may not resolve correctly, potentially leaving resources in an inconsistent state.  
\</Warning\>

\#\#\# Enforce quality gates with hooks

Use \[hooks\](/en/hooks) to enforce rules when teammates finish work or tasks complete:

\* \[\`TeammateIdle\`\](/en/hooks\#teammateidle): runs when a teammate is about to go idle. Exit with code 2 to send feedback and keep the teammate working.  
\* \[\`TaskCompleted\`\](/en/hooks\#taskcompleted): runs when a task is being marked complete. Exit with code 2 to prevent completion and send feedback.

\#\# How agent teams work

This section covers the architecture and mechanics behind agent teams. If you want to start using them, see \[Control your agent team\](\#control-your-agent-team) above.

\#\#\# How Claude starts agent teams

There are two ways agent teams get started:

\* \*\*You request a team\*\*: give Claude a task that benefits from parallel work and explicitly ask for an agent team. Claude creates one based on your instructions.  
\* \*\*Claude proposes a team\*\*: if Claude determines your task would benefit from parallel work, it may suggest creating a team. You confirm before it proceeds.

In both cases, you stay in control. Claude won't create a team without your approval.

\#\#\# Architecture

An agent team consists of:

| Component     | Role                                                                                       |  
| :------------ | :----------------------------------------------------------------------------------------- |  
| \*\*Team lead\*\* | The main Claude Code session that creates the team, spawns teammates, and coordinates work |  
| \*\*Teammates\*\* | Separate Claude Code instances that each work on assigned tasks                            |  
| \*\*Task list\*\* | Shared list of work items that teammates claim and complete                                |  
| \*\*Mailbox\*\*   | Messaging system for communication between agents                                          |

See \[Choose a display mode\](\#choose-a-display-mode) for display configuration options. Teammate messages arrive at the lead automatically.

The system manages task dependencies automatically. When a teammate completes a task that other tasks depend on, blocked tasks unblock without manual intervention.

Teams and tasks are stored locally:

\* \*\*Team config\*\*: \`\~/.claude/teams/{team-name}/config.json\`  
\* \*\*Task list\*\*: \`\~/.claude/tasks/{team-name}/\`

The team config contains a \`members\` array with each teammate's name, agent ID, and agent type. Teammates can read this file to discover other team members.

\#\#\# Permissions

Teammates start with the lead's permission settings. If the lead runs with \`--dangerously-skip-permissions\`, all teammates do too. After spawning, you can change individual teammate modes, but you can't set per-teammate modes at spawn time.

\#\#\# Context and communication

Each teammate has its own context window. When spawned, a teammate loads the same project context as a regular session: CLAUDE.md, MCP servers, and skills. It also receives the spawn prompt from the lead. The lead's conversation history does not carry over.

\*\*How teammates share information:\*\*

\* \*\*Automatic message delivery\*\*: when teammates send messages, they're delivered automatically to recipients. The lead doesn't need to poll for updates.  
\* \*\*Idle notifications\*\*: when a teammate finishes and stops, they automatically notify the lead.  
\* \*\*Shared task list\*\*: all agents can see task status and claim available work.

\*\*Teammate messaging:\*\*

\* \*\*message\*\*: send a message to one specific teammate  
\* \*\*broadcast\*\*: send to all teammates simultaneously. Use sparingly, as costs scale with team size.

\#\#\# Token usage

Agent teams use significantly more tokens than a single session. Each teammate has its own context window, and token usage scales with the number of active teammates. For research, review, and new feature work, the extra tokens are usually worthwhile. For routine tasks, a single session is more cost-effective. See \[agent team token costs\](/en/costs\#agent-team-token-costs) for usage guidance.

\#\# Use case examples

These examples show how agent teams handle tasks where parallel exploration adds value.

\#\#\# Run a parallel code review

A single reviewer tends to gravitate toward one type of issue at a time. Splitting review criteria into independent domains means security, performance, and test coverage all get thorough attention simultaneously. The prompt assigns each teammate a distinct lens so they don't overlap:

\`\`\`text  theme={null}  
Create an agent team to review PR \#142. Spawn three reviewers:  
\- One focused on security implications  
\- One checking performance impact  
\- One validating test coverage  
Have them each review and report findings.  
\`\`\`

Each reviewer works from the same PR but applies a different filter. The lead synthesizes findings across all three after they finish.

\#\#\# Investigate with competing hypotheses

When the root cause is unclear, a single agent tends to find one plausible explanation and stop looking. The prompt fights this by making teammates explicitly adversarial: each one's job is not only to investigate its own theory but to challenge the others'.

\`\`\`text  theme={null}  
Users report the app exits after one message instead of staying connected.  
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to  
each other to try to disprove each other's theories, like a scientific  
debate. Update the findings doc with whatever consensus emerges.  
\`\`\`

The debate structure is the key mechanism here. Sequential investigation suffers from anchoring: once one theory is explored, subsequent investigation is biased toward it.

With multiple independent investigators actively trying to disprove each other, the theory that survives is much more likely to be the actual root cause.

\#\# Best practices

\#\#\# Give teammates enough context

Teammates load project context automatically, including CLAUDE.md, MCP servers, and skills, but they don't inherit the lead's conversation history. See \[Context and communication\](\#context-and-communication) for details. Include task-specific details in the spawn prompt:

\`\`\`text  theme={null}  
Spawn a security reviewer teammate with the prompt: "Review the authentication module  
at src/auth/ for security vulnerabilities. Focus on token handling, session  
management, and input validation. The app uses JWT tokens stored in  
httpOnly cookies. Report any issues with severity ratings."  
\`\`\`

\#\#\# Choose an appropriate team size

There's no hard limit on the number of teammates, but practical constraints apply:

\* \*\*Token costs scale linearly\*\*: each teammate has its own context window and consumes tokens independently. See \[agent team token costs\](/en/costs\#agent-team-token-costs) for details.  
\* \*\*Coordination overhead increases\*\*: more teammates means more communication, task coordination, and potential for conflicts  
\* \*\*Diminishing returns\*\*: beyond a certain point, additional teammates don't speed up work proportionally

Start with 3-5 teammates for most workflows. This balances parallel work with manageable coordination. The examples in this guide use 3-5 teammates because that range works well across different task types.

Having 5-6 \[tasks\](/en/agent-teams\#architecture) per teammate keeps everyone productive without excessive context switching. If you have 15 independent tasks, 3 teammates is a good starting point.

Scale up only when the work genuinely benefits from having teammates work simultaneously. Three focused teammates often outperform five scattered ones.

\#\#\# Size tasks appropriately

\* \*\*Too small\*\*: coordination overhead exceeds the benefit  
\* \*\*Too large\*\*: teammates work too long without check-ins, increasing risk of wasted effort  
\* \*\*Just right\*\*: self-contained units that produce a clear deliverable, such as a function, a test file, or a review

\<Tip\>  
  The lead breaks work into tasks and assigns them to teammates automatically. If it isn't creating enough tasks, ask it to split the work into smaller pieces. Having 5-6 tasks per teammate keeps everyone productive and lets the lead reassign work if someone gets stuck.  
\</Tip\>

\#\#\# Wait for teammates to finish

Sometimes the lead starts implementing tasks itself instead of waiting for teammates. If you notice this:

\`\`\`text  theme={null}  
Wait for your teammates to complete their tasks before proceeding  
\`\`\`

\#\#\# Start with research and review

If you're new to agent teams, start with tasks that have clear boundaries and don't require writing code: reviewing a PR, researching a library, or investigating a bug. These tasks show the value of parallel exploration without the coordination challenges that come with parallel implementation.

\#\#\# Avoid file conflicts

Two teammates editing the same file leads to overwrites. Break the work so each teammate owns a different set of files.

\#\#\# Monitor and steer

Check in on teammates' progress, redirect approaches that aren't working, and synthesize findings as they come in. Letting a team run unattended for too long increases the risk of wasted effort.

\#\# Troubleshooting

\#\#\# Teammates not appearing

If teammates aren't appearing after you ask Claude to create a team:

\* In in-process mode, teammates may already be running but not visible. Press Shift+Down to cycle through active teammates.  
\* Check that the task you gave Claude was complex enough to warrant a team. Claude decides whether to spawn teammates based on the task.  
\* If you explicitly requested split panes, ensure tmux is installed and available in your PATH:  
  \`\`\`bash  theme={null}  
  which tmux  
  \`\`\`  
\* For iTerm2, verify the \`it2\` CLI is installed and the Python API is enabled in iTerm2 preferences.

\#\#\# Too many permission prompts

Teammate permission requests bubble up to the lead, which can create friction. Pre-approve common operations in your \[permission settings\](/en/permissions) before spawning teammates to reduce interruptions.

\#\#\# Teammates stopping on errors

Teammates may stop after encountering errors instead of recovering. Check their output using Shift+Down in in-process mode or by clicking the pane in split mode, then either:

\* Give them additional instructions directly  
\* Spawn a replacement teammate to continue the work

\#\#\# Lead shuts down before work is done

The lead may decide the team is finished before all tasks are actually complete. If this happens, tell it to keep going. You can also tell the lead to wait for teammates to finish before proceeding if it starts doing work instead of delegating.

\#\#\# Orphaned tmux sessions

If a tmux session persists after the team ends, it may not have been fully cleaned up. List sessions and kill the one created by the team:

\`\`\`bash  theme={null}  
tmux ls  
tmux kill-session \-t \<session-name\>  
\`\`\`

\#\# Limitations

Agent teams are experimental. Current limitations to be aware of:

\* \*\*No session resumption with in-process teammates\*\*: \`/resume\` and \`/rewind\` do not restore in-process teammates. After resuming a session, the lead may attempt to message teammates that no longer exist. If this happens, tell the lead to spawn new teammates.  
\* \*\*Task status can lag\*\*: teammates sometimes fail to mark tasks as completed, which blocks dependent tasks. If a task appears stuck, check whether the work is actually done and update the task status manually or tell the lead to nudge the teammate.  
\* \*\*Shutdown can be slow\*\*: teammates finish their current request or tool call before shutting down, which can take time.  
\* \*\*One team per session\*\*: a lead can only manage one team at a time. Clean up the current team before starting a new one.  
\* \*\*No nested teams\*\*: teammates cannot spawn their own teams or teammates. Only the lead can manage the team.  
\* \*\*Lead is fixed\*\*: the session that creates the team is the lead for its lifetime. You can't promote a teammate to lead or transfer leadership.  
\* \*\*Permissions set at spawn\*\*: all teammates start with the lead's permission mode. You can change individual teammate modes after spawning, but you can't set per-teammate modes at spawn time.  
\* \*\*Split panes require tmux or iTerm2\*\*: the default in-process mode works in any terminal. Split-pane mode isn't supported in VS Code's integrated terminal, Windows Terminal, or Ghostty.

\<Tip\>  
  \*\*\`CLAUDE.md\` works normally\*\*: teammates read \`CLAUDE.md\` files from their working directory. Use this to provide project-specific guidance to all teammates.  
\</Tip\>

\#\# Next steps

Explore related approaches for parallel work and delegation:

\* \*\*Lightweight delegation\*\*: \[subagents\](/en/sub-agents) spawn helper agents for research or verification within your session, better for tasks that don't need inter-agent coordination  
\* \*\*Manual parallel sessions\*\*: \[Git worktrees\](/en/common-workflows\#run-parallel-claude-code-sessions-with-git-worktrees) let you run multiple Claude Code sessions yourself without automated team coordination  
\* \*\*Compare approaches\*\*: see the \[subagent vs agent team\](/en/features-overview\#compare-similar-features) comparison for a side-by-side breakdown

# Claude Code Chrome

https://code.claude.com/docs/en/chrome

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Use Claude Code with Chrome (beta)

\> Connect Claude Code to your Chrome browser to test web apps, debug with console logs, automate form filling, and extract data from web pages.

Claude Code integrates with the Claude in Chrome browser extension to give you browser automation capabilities from the CLI or the \[VS Code extension\](/en/vs-code\#automate-browser-tasks-with-chrome). Build your code, then test and debug in the browser without switching contexts.

Claude opens new tabs for browser tasks and shares your browser's login state, so it can access any site you're already signed into. Browser actions run in a visible Chrome window in real time. When Claude encounters a login page or CAPTCHA, it pauses and asks you to handle it manually.

\<Note\>  
  Chrome integration is in beta and currently works with Google Chrome and Microsoft Edge. It is not yet supported on Brave, Arc, or other Chromium-based browsers. WSL (Windows Subsystem for Linux) is also not supported.  
\</Note\>

\#\# Capabilities

With Chrome connected, you can chain browser actions with coding tasks in a single workflow:

\* \*\*Live debugging\*\*: read console errors and DOM state directly, then fix the code that caused them  
\* \*\*Design verification\*\*: build a UI from a Figma mock, then open it in the browser to verify it matches  
\* \*\*Web app testing\*\*: test form validation, check for visual regressions, or verify user flows  
\* \*\*Authenticated web apps\*\*: interact with Google Docs, Gmail, Notion, or any app you're logged into without API connectors  
\* \*\*Data extraction\*\*: pull structured information from web pages and save it locally  
\* \*\*Task automation\*\*: automate repetitive browser tasks like data entry, form filling, or multi-site workflows  
\* \*\*Session recording\*\*: record browser interactions as GIFs to document or share what happened

\#\# Prerequisites

Before using Claude Code with Chrome, you need:

\* \[Google Chrome\](https://www.google.com/chrome/) or \[Microsoft Edge\](https://www.microsoft.com/edge) browser  
\* \[Claude in Chrome extension\](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) version 1.0.36 or higher, available in the Chrome Web Store for both browsers  
\* \[Claude Code\](/en/quickstart\#step-1-install-claude-code) version 2.0.73 or higher  
\* A direct Anthropic plan (Pro, Max, Teams, or Enterprise)

\<Note\>  
  Chrome integration is not available through third-party providers like Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry. If you access Claude exclusively through a third-party provider, you need a separate claude.ai account to use this feature.  
\</Note\>

\#\# Get started in the CLI

\<Steps\>  
  \<Step title="Launch Claude Code with Chrome"\>  
    Start Claude Code with the \`--chrome\` flag:

    \`\`\`bash  theme={null}  
    claude \--chrome  
    \`\`\`

    You can also enable Chrome from within an existing session by running \`/chrome\`.  
  \</Step\>

  \<Step title="Ask Claude to use the browser"\>  
    This example navigates to a page, interacts with it, and reports what it finds, all from your terminal or editor:

    \`\`\`text  theme={null}  
    Go to code.claude.com/docs, click on the search box,  
    type "hooks", and tell me what results appear  
    \`\`\`  
  \</Step\>  
\</Steps\>

Run \`/chrome\` at any time to check the connection status, manage permissions, or reconnect the extension.

For VS Code, see \[browser automation in VS Code\](/en/vs-code\#automate-browser-tasks-with-chrome).

\#\#\# Enable Chrome by default

To avoid passing \`--chrome\` each session, run \`/chrome\` and select "Enabled by default".

In the \[VS Code extension\](/en/vs-code\#automate-browser-tasks-with-chrome), Chrome is available whenever the Chrome extension is installed. No additional flag is needed.

\<Note\>  
  Enabling Chrome by default in the CLI increases context usage since browser tools are always loaded. If you notice increased context consumption, disable this setting and use \`--chrome\` only when needed.  
\</Note\>

\#\#\# Manage site permissions

Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on.

\#\# Example workflows

These examples show common ways to combine browser actions with coding tasks. Run \`/mcp\` and select \`claude-in-chrome\` to see the full list of available browser tools.

\#\#\# Test a local web application

When developing a web app, ask Claude to verify your changes work correctly:

\`\`\`text  theme={null}  
I just updated the login form validation. Can you open localhost:3000,  
try submitting the form with invalid data, and check if the error  
messages appear correctly?  
\`\`\`

Claude navigates to your local server, interacts with the form, and reports what it observes.

\#\#\# Debug with console logs

Claude can read console output to help diagnose problems. Tell Claude what patterns to look for rather than asking for all console output, since logs can be verbose:

\`\`\`text  theme={null}  
Open the dashboard page and check the console for any errors when  
the page loads.  
\`\`\`

Claude reads the console messages and can filter for specific patterns or error types.

\#\#\# Automate form filling

Speed up repetitive data entry tasks:

\`\`\`text  theme={null}  
I have a spreadsheet of customer contacts in contacts.csv. For each row,  
go to the CRM at crm.example.com, click "Add Contact", and fill in the  
name, email, and phone fields.  
\`\`\`

Claude reads your local file, navigates the web interface, and enters the data for each record.

\#\#\# Draft content in Google Docs

Use Claude to write directly in your documents without API setup:

\`\`\`text  theme={null}  
Draft a project update based on the recent commits and add it to my  
Google Doc at docs.google.com/document/d/abc123  
\`\`\`

Claude opens the document, clicks into the editor, and types the content. This works with any web app you're logged into: Gmail, Notion, Sheets, and more.

\#\#\# Extract data from web pages

Pull structured information from websites:

\`\`\`text  theme={null}  
Go to the product listings page and extract the name, price, and  
availability for each item. Save the results as a CSV file.  
\`\`\`

Claude navigates to the page, reads the content, and compiles the data into a structured format.

\#\#\# Run multi-site workflows

Coordinate tasks across multiple websites:

\`\`\`text  theme={null}  
Check my calendar for meetings tomorrow, then for each meeting with  
an external attendee, look up their company website and add a note  
about what they do.  
\`\`\`

Claude works across tabs to gather information and complete the workflow.

\#\#\# Record a demo GIF

Create shareable recordings of browser interactions:

\`\`\`text  theme={null}  
Record a GIF showing how to complete the checkout flow, from adding  
an item to the cart through to the confirmation page.  
\`\`\`

Claude records the interaction sequence and saves it as a GIF file.

\#\# Troubleshooting

\#\#\# Extension not detected

If Claude Code shows "Chrome extension not detected":

1\. Verify the Chrome extension is installed and enabled in \`chrome://extensions\`  
2\. Verify Claude Code is up to date by running \`claude \--version\`  
3\. Check that Chrome is running  
4\. Run \`/chrome\` and select "Reconnect extension" to re-establish the connection  
5\. If the issue persists, restart both Claude Code and Chrome

The first time you enable Chrome integration, Claude Code installs a native messaging host configuration file. Chrome reads this file on startup, so if the extension isn't detected on your first attempt, restart Chrome to pick up the new configuration.

If the connection still fails, verify the host configuration file exists at:

For Chrome:

\* \*\*macOS\*\*: \`\~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude\_code\_browser\_extension.json\`  
\* \*\*Linux\*\*: \`\~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude\_code\_browser\_extension.json\`  
\* \*\*Windows\*\*: check \`HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\\` in the Windows Registry

For Edge:

\* \*\*macOS\*\*: \`\~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude\_code\_browser\_extension.json\`  
\* \*\*Linux\*\*: \`\~/.config/microsoft-edge/NativeMessagingHosts/com.anthropic.claude\_code\_browser\_extension.json\`  
\* \*\*Windows\*\*: check \`HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\\` in the Windows Registry

\#\#\# Browser not responding

If Claude's browser commands stop working:

1\. Check if a modal dialog (alert, confirm, prompt) is blocking the page. JavaScript dialogs block browser events and prevent Claude from receiving commands. Dismiss the dialog manually, then tell Claude to continue.  
2\. Ask Claude to create a new tab and try again  
3\. Restart the Chrome extension by disabling and re-enabling it in \`chrome://extensions\`

\#\#\# Connection drops during long sessions

The Chrome extension's service worker can go idle during extended sessions, which breaks the connection. If browser tools stop working after a period of inactivity, run \`/chrome\` and select "Reconnect extension".

\#\#\# Windows-specific issues

On Windows, you may encounter:

\* \*\*Named pipe conflicts (EADDRINUSE)\*\*: if another process is using the same named pipe, restart Claude Code. Close any other Claude Code sessions that might be using Chrome.  
\* \*\*Native messaging host errors\*\*: if the native messaging host crashes on startup, try reinstalling Claude Code to regenerate the host configuration.

\#\#\# Common error messages

These are the most frequently encountered errors and how to resolve them:

| Error                                | Cause                                            | Fix                                                             |  
| \------------------------------------ | \------------------------------------------------ | \--------------------------------------------------------------- |  
| "Browser extension is not connected" | Native messaging host cannot reach the extension | Restart Chrome and Claude Code, then run \`/chrome\` to reconnect |  
| "Extension not detected"             | Chrome extension is not installed or is disabled | Install or enable the extension in \`chrome://extensions\`        |  
| "No tab available"                   | Claude tried to act before a tab was ready       | Ask Claude to create a new tab and retry                        |  
| "Receiving end does not exist"       | Extension service worker went idle               | Run \`/chrome\` and select "Reconnect extension"                  |

\#\# See also

\* \[Use Claude Code in VS Code\](/en/vs-code\#automate-browser-tasks-with-chrome): browser automation in the VS Code extension  
\* \[CLI reference\](/en/cli-reference): command-line flags including \`--chrome\`  
\* \[Common workflows\](/en/common-workflows): more ways to use Claude Code  
\* \[Data and privacy\](/en/data-usage): how Claude Code handles your data  
\* \[Getting started with Claude in Chrome\](https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome): full documentation for the Chrome extension, including shortcuts, scheduling, and permissions

