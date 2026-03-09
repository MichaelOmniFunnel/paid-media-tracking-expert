// SessionStart hook: re-injects critical context after compaction
// Cross-platform (Node.js). Referenced from settings.local.json.
process.stdout.write([
  'CRITICAL CONTEXT (re-injected after compaction):',
  '- NEVER modify client ad accounts, GTM, tracking, or external platforms without explicit approval',
  '- Asana Claude project GID: 1213561988868639 | Workspace: 1206269095077183',
  '- MCP servers: Chrome (browser), Meta Ads (Pipeboard), Asana, Google Ads (read only, 19 accts), GA4 (read only, 34 properties), GSC (read only, 24 sites). GTM/Stape via Chrome only.',
  '- Client memory: check clients/ folder, read history.md and open-items.md before engaging.',
  '- GTM Custom HTML is ES5 only, always.'
].join('
'));
