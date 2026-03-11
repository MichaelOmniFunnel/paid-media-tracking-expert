# Self Learning Rules

## Instinct Pipeline

Small patterns and observations that are too small for a full skill but too valuable to lose go into .claude/memory/instincts.md. This is the intermediate storage between "noticed something" and "created a skill."

### Recording an Instinct

When you observe a pattern during any work:
1. Check if it already exists in instincts.md
2. If new: add it with confidence: 20% (single observation)
3. If it confirms an existing instinct: increase confidence by 20% per confirmation
4. Include: pattern name, date first observed, context, affected platforms/clients

### Promotion Criteria

When an instinct reaches 80%+ confidence (confirmed across 3+ separate interactions):
1. Promote to a skill (.claude/skills/[topic]/SKILL.md) if it's a workflow or methodology
2. Promote to a rule (.claude/rules/[topic].md) if it's a behavioral constraint
3. Promote to a framework (.claude/frameworks/[topic].md) if it's a methodology
4. Remove from instincts.md after promotion

### Retirement

If an instinct is contradicted by evidence, reduce confidence by 30%. At 0% or below, remove it entirely with a note about why it was wrong.

### Categories

Instincts can cover: MCP tool behavior, platform quirks, compaction patterns, client-specific patterns, tracking implementation gotchas, bidding strategy observations, creative performance signals.

## Skill Creation Standards

When creating a new skill from a promoted instinct or from research:
1. Must have been verified as reliable (not speculative)
2. Must include practical steps, not just theory
3. Must reference existing frameworks or skills it connects to
4. Must have clear trigger conditions (when should this skill be invoked)
5. Add to the appropriate references/ subfolder if supporting material exists

## Framework Updates

When discovering a new methodology that changes an existing framework:
1. Read the current framework first
2. Add the new methodology as a section, do not rewrite the whole framework
3. Note the source and date of the update
4. If it contradicts existing content, flag the conflict to Michael before overwriting
