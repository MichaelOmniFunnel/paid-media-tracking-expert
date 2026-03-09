// Project Health Validation Script
// Run: node scripts/validate-project.js
// Checks all structural requirements: agents, skills, hooks, settings, references, frameworks, rules

const fs = require('fs');
const path = require('path');

const base = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop', 'ClaudeCode', 'Paid Media & Tracking Expert');
const results = { pass: 0, fail: 0, warn: 0, details: [] };

function log(status, msg) {
  results[status]++;
  var icon = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'WARN';
  results.details.push(icon + ': ' + msg);
}

// === 1. CLAUDE.md checks ===
var claudeMd = fs.readFileSync(path.join(base, '.claude', 'CLAUDE.md'), 'utf8');
var claudeLines = claudeMd.split('\n').length;
if (claudeLines <= 100) log('pass', 'CLAUDE.md is ' + claudeLines + ' lines (under 100)');
else log('fail', 'CLAUDE.md is ' + claudeLines + ' lines (over 100)');

if (claudeMd.includes('currentDate')) log('fail', 'CLAUDE.md still has hardcoded date');
else log('pass', 'CLAUDE.md has no hardcoded date');

if (claudeMd.includes('Verification')) log('pass', 'CLAUDE.md has Verification section');
else log('fail', 'CLAUDE.md missing Verification section');

// === 2. Agent checks ===
var agentsDir = path.join(base, '.claude', 'agents');
var agents = fs.readdirSync(agentsDir).filter(function(f) { return f.endsWith('.md'); });
log(agents.length === 9 ? 'pass' : 'fail', agents.length + ' agent files found (expected 9)');

for (var a = 0; a < agents.length; a++) {
  var agentContent = fs.readFileSync(path.join(agentsDir, agents[a]), 'utf8');
  var agentName = agents[a].replace('.md', '');

  if (!agentContent.includes('permissionMode:')) log('fail', 'Agent ' + agentName + ' missing permissionMode');
  else if (agentContent.includes('permissionMode: plan')) log('pass', 'Agent ' + agentName + ' has permissionMode: plan');
  else log('warn', 'Agent ' + agentName + ' has non-plan permissionMode');

  if (!agentContent.includes('tools:')) log('fail', 'Agent ' + agentName + ' missing tools field');
  else {
    var toolsMatch = agentContent.match(/tools:\s*(.+)/);
    if (toolsMatch) {
      var tools = toolsMatch[1];
      if (tools.includes('Bash') || tools.includes('Write')) log('fail', 'Agent ' + agentName + ' has write tools: ' + tools.trim());
      else log('pass', 'Agent ' + agentName + ' tools are read-only');
    }
  }

  if (agentContent.includes('background:')) log('pass', 'Agent ' + agentName + ' has background field');
  else log('warn', 'Agent ' + agentName + ' missing background field');
}

// === 3. Skill checks ===
var skillsDir = path.join(base, '.claude', 'skills');
var skills = fs.readdirSync(skillsDir).filter(function(f) {
  return fs.statSync(path.join(skillsDir, f)).isDirectory();
});
log(skills.length === 27 ? 'pass' : 'fail', skills.length + ' skill directories found (expected 27)');

var totalRefs = 0;
var brokenRefs = 0;
var orphanedRefs = 0;
var oversize = 0;

for (var s = 0; s < skills.length; s++) {
  var skill = skills[s];
  var skillFile = path.join(skillsDir, skill, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    log('fail', 'Skill ' + skill + ' missing SKILL.md');
    continue;
  }

  var content = fs.readFileSync(skillFile, 'utf8');
  var lines = content.split('\n');

  if (lines.length > 500) {
    log('fail', 'Skill ' + skill + ' is ' + lines.length + ' lines (over 500)');
    oversize++;
  }

  if (!content.startsWith('---')) {
    log('fail', 'Skill ' + skill + ' missing YAML frontmatter');
    continue;
  }

  var fmEnd = content.indexOf('---', 4);
  if (fmEnd === -1) {
    log('fail', 'Skill ' + skill + ' unclosed YAML frontmatter');
    continue;
  }
  var frontmatter = content.substring(3, fmEnd);

  if (!frontmatter.includes('name:')) log('fail', 'Skill ' + skill + ' frontmatter missing name');
  if (!frontmatter.includes('description:')) log('fail', 'Skill ' + skill + ' frontmatter missing description');
  if (!frontmatter.includes('allowed-tools:')) log('fail', 'Skill ' + skill + ' frontmatter missing allowed-tools');

  var refPointers = content.match(/references\/[\w-]+\.md/g) || [];
  var refsDir2 = path.join(skillsDir, skill, 'references');

  if (refPointers.length > 0) {
    var seen = {};
    for (var r = 0; r < refPointers.length; r++) {
      if (seen[refPointers[r]]) continue;
      seen[refPointers[r]] = true;
      var refPath = path.join(skillsDir, skill, refPointers[r]);
      totalRefs++;
      if (!fs.existsSync(refPath)) {
        log('fail', 'Skill ' + skill + ' broken ref: ' + refPointers[r]);
        brokenRefs++;
      }
    }
  }

  if (fs.existsSync(refsDir2)) {
    var refFiles = fs.readdirSync(refsDir2).filter(function(f) { return f.endsWith('.md'); });
    for (var rf = 0; rf < refFiles.length; rf++) {
      if (!content.includes(refFiles[rf])) {
        log('warn', 'Skill ' + skill + ' orphaned ref file: ' + refFiles[rf]);
        orphanedRefs++;
      }
    }
  }
}

// === 4. Workflow skills: Output Verification check ===
var workflowSkills = [
  'full-audit', 'monthly-report', 'quarterly-review', 'new-client',
  'tracking-audit', 'audience-audit', 'bidding-strategy-audit',
  'creative-audit', 'landing-page-audit'
];
var verifiedWorkflows = 0;
for (var w = 0; w < workflowSkills.length; w++) {
  var wsPath = path.join(skillsDir, workflowSkills[w], 'SKILL.md');
  if (fs.existsSync(wsPath)) {
    var wsContent = fs.readFileSync(wsPath, 'utf8');
    if (wsContent.includes('Output Verification') || wsContent.includes('## Output Verification')) {
      log('pass', 'Workflow skill ' + workflowSkills[w] + ' has Output Verification');
      verifiedWorkflows++;
    } else {
      log('fail', 'Workflow skill ' + workflowSkills[w] + ' missing Output Verification section');
    }
  }
}

// === 5. Hook checks ===
var hooksDir = path.join(base, '.claude', 'hooks');
var expectedHooks = ['deny-meta-writes.js', 'deny-platform-writes.js', 'compact-context.js', 'stop-notify.ps1', 'stop-notify.sh'];
for (var h = 0; h < expectedHooks.length; h++) {
  var hookPath = path.join(hooksDir, expectedHooks[h]);
  if (fs.existsSync(hookPath)) {
    var size = fs.statSync(hookPath).size;
    log(size > 0 ? 'pass' : 'fail', 'Hook ' + expectedHooks[h] + ' exists (' + size + ' bytes)');
  } else {
    log('fail', 'Hook ' + expectedHooks[h] + ' missing');
  }
}

var denyHooks = ['deny-meta-writes.js', 'deny-platform-writes.js'];
for (var dh = 0; dh < denyHooks.length; dh++) {
  var dhPath = path.join(hooksDir, denyHooks[dh]);
  if (fs.existsSync(dhPath)) {
    var hc = fs.readFileSync(dhPath, 'utf8');
    if (hc.includes('permissionDecision') && hc.includes('deny')) log('pass', denyHooks[dh] + ' has correct deny pattern');
    else log('fail', denyHooks[dh] + ' missing deny pattern');
  }
}

// === 6. Settings checks ===
var settingsLocal = path.join(base, '.claude', 'settings.local.json');
if (fs.existsSync(settingsLocal)) {
  try {
    var settings = JSON.parse(fs.readFileSync(settingsLocal, 'utf8'));
    log('pass', 'settings.local.json is valid JSON');

    var hooks = settings.hooks || {};
    var preToolUse = hooks.PreToolUse || [];
    log(preToolUse.length > 0 ? 'pass' : 'fail', preToolUse.length + ' PreToolUse hook matchers configured');

    var metaBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('meta-ads'); });
    log(metaBlocker ? 'pass' : 'fail', 'Meta Ads write blocker ' + (metaBlocker ? 'configured' : 'missing'));

    var googleBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('google_ads'); });
    log(googleBlocker ? 'pass' : 'fail', 'Google Ads write blocker ' + (googleBlocker ? 'configured' : 'missing'));
  } catch(e) {
    log('fail', 'settings.local.json invalid JSON: ' + e.message);
  }
} else {
  log('fail', 'settings.local.json missing');
}

var settingsShared = path.join(base, '.claude', 'settings.json');
if (fs.existsSync(settingsShared)) {
  try {
    JSON.parse(fs.readFileSync(settingsShared, 'utf8'));
    log('pass', 'settings.json (shared) is valid JSON');
  } catch(e) {
    log('fail', 'settings.json invalid JSON: ' + e.message);
  }
} else {
  log('warn', 'settings.json (shared) not found');
}

// === 7. Frameworks check ===
var fwDir = path.join(base, '.claude', 'frameworks');
if (fs.existsSync(fwDir)) {
  var fws = fs.readdirSync(fwDir).filter(function(f) { return f.endsWith('.md'); });
  log(fws.length >= 10 ? 'pass' : 'warn', fws.length + ' framework files found (expected 11)');
} else {
  log('fail', 'Frameworks directory missing');
}

// === 8. Rules check ===
var rulesDir = path.join(base, '.claude', 'rules');
var expectedRules = ['anomaly-flagging.md', 'client-memory.md', 'security.md'];
for (var ru = 0; ru < expectedRules.length; ru++) {
  var rp = path.join(rulesDir, expectedRules[ru]);
  log(fs.existsSync(rp) ? 'pass' : 'fail', 'Rule ' + expectedRules[ru] + ' ' + (fs.existsSync(rp) ? 'exists' : 'missing'));
}

// === 9. Key directories ===
var keyDirs = ['clients', 'templates', 'scripts/chrome', 'scripts/gtm'];
for (var kd = 0; kd < keyDirs.length; kd++) {
  var dp = path.join(base, keyDirs[kd]);
  if (fs.existsSync(dp)) {
    var count = fs.readdirSync(dp).length;
    log('pass', keyDirs[kd] + '/ exists (' + count + ' items)');
  } else {
    log('warn', keyDirs[kd] + '/ not found');
  }
}

// === 10. MEMORY.md check ===
var memDir = path.join(process.env.USERPROFILE, '.claude', 'projects', 'C--Users-mtate-OneDrive-Desktop-ClaudeCode-Paid-Media---Tracking-Expert', 'memory');
var memFile = path.join(memDir, 'MEMORY.md');
if (fs.existsSync(memFile)) {
  var memLines = fs.readFileSync(memFile, 'utf8').split('\n').length;
  if (memLines <= 160) log('pass', 'MEMORY.md is ' + memLines + ' lines (under 160 safe ceiling)');
  else if (memLines <= 180) log('warn', 'MEMORY.md is ' + memLines + ' lines (approaching 200 truncation limit, prune soon)');
  else log('fail', 'MEMORY.md is ' + memLines + ' lines (critical: near 200 truncation limit)');
} else {
  log('fail', 'MEMORY.md not found');
}

// === 11. systemic-patterns.md check ===
var patternsFile = path.join(base, '.claude', 'memory', 'systemic-patterns.md');
if (fs.existsSync(patternsFile)) {
  log('pass', 'systemic-patterns.md exists');
} else {
  log('fail', 'systemic-patterns.md missing (referenced by client-memory rules)');
}

// === 12. Skill description budget check ===
var totalDescChars = 0;
for (var dc = 0; dc < skills.length; dc++) {
  var dcFile = path.join(skillsDir, skills[dc], 'SKILL.md');
  if (fs.existsSync(dcFile)) {
    var dcContent = fs.readFileSync(dcFile, 'utf8');
    var dcFmEnd = dcContent.indexOf('---', 4);
    if (dcFmEnd > -1) {
      var dcFm = dcContent.substring(3, dcFmEnd);
      var dcMatch = dcFm.match(/description:\s*(.+)/);
      if (dcMatch) totalDescChars += dcMatch[1].trim().length;
    }
  }
}
var descPct = Math.round(totalDescChars / 30000 * 100);
if (descPct <= 50) log('pass', 'Skill description budget: ' + totalDescChars + '/30000 chars (' + descPct + '%)');
else if (descPct <= 75) log('warn', 'Skill description budget: ' + totalDescChars + '/30000 chars (' + descPct + '%) approaching limit');
else log('fail', 'Skill description budget: ' + totalDescChars + '/30000 chars (' + descPct + '%) near or over limit');

// === 13. Instruction budget check ===
var claudeChars = fs.readFileSync(path.join(base, '.claude', 'CLAUDE.md'), 'utf8').length;
var ruleChars = 0;
var rDir = path.join(base, '.claude', 'rules');
fs.readdirSync(rDir).filter(function(f) { return f.endsWith('.md'); }).forEach(function(f) {
  ruleChars += fs.readFileSync(path.join(rDir, f), 'utf8').length;
});
var totalInstructionChars = claudeChars + ruleChars + totalDescChars;
if (totalInstructionChars <= 25000) log('pass', 'Total instruction load: ' + totalInstructionChars + ' chars (healthy)');
else if (totalInstructionChars <= 35000) log('warn', 'Total instruction load: ' + totalInstructionChars + ' chars (monitor for adherence degradation)');
else log('fail', 'Total instruction load: ' + totalInstructionChars + ' chars (likely exceeding adherence threshold)');

// === 14. Hook event coverage check ===
if (fs.existsSync(settingsLocal)) {
  var hkSettings = JSON.parse(fs.readFileSync(settingsLocal, 'utf8'));
  var hkHooks = hkSettings.hooks || {};
  var hasTaskCompleted = hkHooks.TaskCompleted && hkHooks.TaskCompleted.length > 0;
  var hasPreCompact = hkHooks.PreCompact && hkHooks.PreCompact.length > 0;
  log(hasTaskCompleted ? 'pass' : 'warn', 'TaskCompleted quality gate ' + (hasTaskCompleted ? 'configured' : 'not configured'));
  log(hasPreCompact ? 'pass' : 'warn', 'PreCompact context preservation ' + (hasPreCompact ? 'configured' : 'not configured'));
}

// === 15. Agent model routing check ===
var agentsWithModel = 0;
for (var am = 0; am < agents.length; am++) {
  var amContent = fs.readFileSync(path.join(agentsDir, agents[am]), 'utf8');
  if (amContent.includes('model:')) agentsWithModel++;
}
if (agentsWithModel === agents.length) log('pass', 'All ' + agents.length + ' agents have model field set');
else if (agentsWithModel === 0) log('fail', 'No agents have model field (defaulting to Opus, expensive in swarm)');
else log('warn', agentsWithModel + '/' + agents.length + ' agents have model field set');

// === PRINT RESULTS ===
console.log('');
console.log('========================================');
console.log('  PROJECT VALIDATION RESULTS');
console.log('========================================');
console.log('');

var fails = results.details.filter(function(d) { return d.startsWith('FAIL'); });
if (fails.length > 0) {
  console.log('--- FAILURES ---');
  fails.forEach(function(f) { console.log('  ' + f); });
  console.log('');
}

var warns = results.details.filter(function(d) { return d.startsWith('WARN'); });
if (warns.length > 0) {
  console.log('--- WARNINGS ---');
  warns.forEach(function(w) { console.log('  ' + w); });
  console.log('');
}

console.log('--- SUMMARY ---');
console.log('  PASS: ' + results.pass);
console.log('  FAIL: ' + results.fail);
console.log('  WARN: ' + results.warn);
console.log('  Total checks: ' + (results.pass + results.fail + results.warn));
console.log('');
console.log('  Skills: ' + skills.length + '/27');
console.log('  Agents: ' + agents.length + '/9');
console.log('  Ref pointers verified: ' + totalRefs + ' (' + brokenRefs + ' broken)');
console.log('  Orphaned ref files: ' + orphanedRefs);
console.log('  Oversize skills (>500 lines): ' + oversize);
console.log('  Workflow skills with Output Verification: ' + verifiedWorkflows + '/' + workflowSkills.length);
console.log('  Agents with model routing: ' + agentsWithModel + '/' + agents.length);
console.log('  Skill description budget: ' + totalDescChars + '/30000 (' + descPct + '%)');
console.log('  Total instruction load: ' + totalInstructionChars + ' chars');
console.log('');
if (results.fail === 0) console.log('  >>> ALL CHECKS PASSED <<<');
else console.log('  >>> ' + results.fail + ' ISSUE(S) NEED ATTENTION <<<');
