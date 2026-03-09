# Hooks and Security Configuration

## Hook Types

- **PreToolUse**: Before a tool executes. Exit code 2 blocks execution.
- **PostToolUse**: After a tool executes. For audit logging.
- **TeammateIdle**: When teammate is about to go idle in agent teams.
- **TaskCompleted**: When task is marked complete in agent teams.
- **Stop**: When Claude finishes a turn. Can reject completion.

## Configuration Location

`.claude/settings.json` or interactive via `/hooks`

## Example: Block Sensitive File Commits

```bash
# .claude/hooks/pre-commit.sh
if git diff --cached --name-only | grep -qE '\.(env|key|pem)$|creds\.md'; then
  echo "BLOCKED: Attempting to commit sensitive files"
  exit 1
fi
```

## Example: Block rm -rf

PreToolUse hook that parses Bash stdin via jq, matches rm -rf pattern, outputs error message, exits code 2 to block.

## Example: Anti Rationalization Gate (Stop Hook)

Prompt based hook that rejects if Claude declares victory while leaving work undone.

## Trail of Bits Security Defaults

```json
{
  "env": {
    "DISABLE_TELEMETRY": "true",
    "DISABLE_ERROR_REPORTING": "true"
  }
}
```

## Permission Deny Rules (Sensitive Paths)

Block read/edit on:
- SSH/GPG: ~/.ssh/**, ~/.gnupg/**
- Cloud credentials: ~/.aws/**, ~/.azure/**, ~/.kube/**
- Package tokens: ~/.npmrc, ~/.pypirc
- Git credentials: ~/.git-credentials
- Shell configs: ~/.bashrc, ~/.zshrc (prevent backdoors)

## Three Layer Sandboxing

1. Built in sandbox (/sandbox command) using OS level isolation
2. Devcontainer for full filesystem isolation
3. Remote disposable cloud instances

## Claude Code Error Rate

ACM 2025 research: Claude Code can generate 1.75x more logic errors than human code. Always provide verification (tests, scripts, screenshots). Never ship unverified code.
