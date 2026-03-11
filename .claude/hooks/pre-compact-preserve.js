// PreCompact hook v2: dynamic context preservation
// Reads working files (Planning with Files pattern) if they exist,
// plus static critical context. Outputs structured preservation block.
// Cross-platform (Node.js). Referenced from settings.local.json.

var fs = require('fs');
var path = require('path');

var sections = [];

// 1. Safety (always first, always preserved)
sections.push('## SAFETY (non negotiable)');
sections.push('NEVER modify client ad accounts, GTM, tracking, or external platforms without explicit approval from Michael.');

// 2. Infrastructure
sections.push('');
sections.push('## INFRASTRUCTURE');
sections.push('Asana Claude project GID: 1213561988868639 | Workspace: 1206269095077183');
sections.push('MCP servers: Chrome (browser), Meta Ads (Pipeboard, 27 accounts), Asana (2 workspaces), Google Ads (read only, 19 accts via MCC 677-900-1476), GA4 (read only, 34 properties), GSC (read only, 24 sites)');
sections.push('GTM and Stape: Chrome browser only, no MCP API');

// 3. Standards
sections.push('');
sections.push('## STANDARDS');
sections.push('ES5 only in GTM Custom HTML | POAS over platform ROAS | Swarm mode default');
sections.push('Audit order: tracking > structure > bidding > audiences > creative > LP > attribution > wasted spend');
sections.push('Client memory: check clients/ folder, read history.md before engaging');

// 4. Dynamic: read task_plan.md if it exists (Planning with Files support)
var taskPlanPaths = [
    path.join(process.cwd(), 'task_plan.md'),
    path.join(process.cwd(), '.planning', 'task_plan.md')
];
var taskPlan = null;
for (var i = 0; i < taskPlanPaths.length; i++) {
    try {
        taskPlan = fs.readFileSync(taskPlanPaths[i], 'utf8');
        break;
    } catch (e) { /* file does not exist, skip */ }
}
if (taskPlan) {
    // Extract first 1500 chars to stay within reasonable size
    var planSnippet = taskPlan.substring(0, 1500);
    sections.push('');
    sections.push('## ACTIVE TASK PLAN (from task_plan.md)');
    sections.push(planSnippet);
    if (taskPlan.length > 1500) {
        sections.push('... (truncated, re-read task_plan.md for full plan)');
    }
}

// 5. Dynamic: read findings.md if it exists
var findingsPaths = [
    path.join(process.cwd(), 'findings.md'),
    path.join(process.cwd(), '.planning', 'findings.md')
];
var findings = null;
for (var i = 0; i < findingsPaths.length; i++) {
    try {
        findings = fs.readFileSync(findingsPaths[i], 'utf8');
        break;
    } catch (e) { /* file does not exist, skip */ }
}
if (findings) {
    var findingsSnippet = findings.substring(0, 1000);
    sections.push('');
    sections.push('## FINDINGS SO FAR (from findings.md)');
    sections.push(findingsSnippet);
    if (findings.length > 1000) {
        sections.push('... (truncated, re-read findings.md for all findings)');
    }
}

// 6. Dynamic: read progress.md if it exists
var progressPaths = [
    path.join(process.cwd(), 'progress.md'),
    path.join(process.cwd(), '.planning', 'progress.md')
];
var progress = null;
for (var i = 0; i < progressPaths.length; i++) {
    try {
        progress = fs.readFileSync(progressPaths[i], 'utf8');
        break;
    } catch (e) { /* file does not exist, skip */ }
}
if (progress) {
    // Only take last 500 chars (most recent progress)
    var progressSnippet = progress.length > 500
        ? progress.substring(progress.length - 500)
        : progress;
    sections.push('');
    sections.push('## RECENT PROGRESS (from progress.md)');
    sections.push(progressSnippet);
}

process.stdout.write(sections.join('\n'));
