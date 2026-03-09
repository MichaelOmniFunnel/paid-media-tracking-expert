// PreToolUse hook: blocks write operations on all ad platform MCP tools
// Cross-platform (Node.js). Referenced from settings.local.json.
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "SAFETY: This action modifies a live client system. Get explicit approval before any external changes."
  }
}));
