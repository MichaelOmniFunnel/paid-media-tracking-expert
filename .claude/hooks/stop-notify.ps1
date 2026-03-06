# Stop hook: shows Windows notification when Claude finishes
# Windows only. For Mac, use osascript equivalent.
[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
[System.Windows.Forms.MessageBox]::Show('Claude has finished and needs your attention', 'Claude Code', 'OK', 'Information') | Out-Null
