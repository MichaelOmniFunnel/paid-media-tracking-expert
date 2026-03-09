// PreCompact hook: outputs critical context that must survive compaction
// Fires BEFORE context is compressed. Belt-and-suspenders with SessionStart compact hook.
// Cross-platform (Node.js). Referenced from settings.local.json.
process.stdout.write([
  "PRESERVE THROUGH COMPACTION:",
  "- Safety: NEVER modify client ad accounts, GTM, tracking, or external platforms without explicit approval",
  "- Asana Claude project GID: 1213561988868639 | Workspace: 1206269095077183",
  "- MCP: Chrome (browser), Meta Ads (Pipeboard, 27 accounts), Asana (2 workspaces), Google Ads (read only, 19 accts), GA4 (read only, 34 properties), GSC (read only, 24 sites). GTM/Stape via Chrome only.",
  "- Client memory: check clients/ folder, read history.md before engaging",
  "- Standards: ES5 only in GTM, POAS over platform ROAS, swarm mode default",
  "- Active task and client context should be preserved"
].join("
"));
