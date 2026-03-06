// PreToolUse hook: blocks Meta Ads write operations
// Cross-platform (Node.js). Referenced from settings.local.json.
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "SAFETY: This action modifies a live client system. Get explicit approval before any external changes."
  }
}));
