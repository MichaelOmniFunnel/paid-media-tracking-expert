#!/bin/bash
# Stop hook: shows macOS notification when Claude finishes
# Mac only. For Windows, use stop-notify.ps1 instead.
osascript -e 'display notification "Claude has finished and needs your attention" with title "Claude Code"'
