// Project Health Validation Script v3
// Run: node scripts/validate-project.js
// Comprehensive structural validation: 100+ checks across 7 categories
// Categories: CLAUDE.md, Agents, Skills, Rules, Hooks, Settings, Operational

const fs = require('fs');
const path = require('path');

var base = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop', 'ClaudeCode', 'Paid Media & Tracking Expert');
var results = { pass: 0, fail: 0, warn: 0, details: [] };
var category = '';

function log(status, msg) {
  results[status]++;
  var icon = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'WARN';
  results.details.push({ status: icon, category: category, message: msg });
}

function fileExists(p) { try { return fs.existsSync(p); } catch(e) { return false; } }
function readFile(p) { try { return fs.readFileSync(p, 'utf8'); } catch(e) { return ''; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch(e) { return false; } }
function listDir(p) { try { return fs.readdirSync(p); } catch(e) { return []; } }

// ============================================================
// CATEGORY 1: CLAUDE.md (15 checks)
// ============================================================
category = 'CLAUDE.md';

var claudePath = path.join(base, '.claude', 'CLAUDE.md');
var claudeMd = readFile(claudePath);
var claudeLines = claudeMd.split('\n').length;

// C1.1: Line budget
if (claudeLines <= 100) log('pass', 'Line count: ' + claudeLines + '/100');
else log('fail', 'Line count: ' + claudeLines + '/100 (over budget)');

// C1.2: No hardcoded date
if (claudeMd.includes('currentDate')) log('fail', 'Contains hardcoded currentDate');
else log('pass', 'No hardcoded date');

// C1.3: Required sections
var requiredSections = ['NEVER without', 'ALWAYS automatic', 'Client Memory Protocol', 'How Michael Works', 'Agency and Stack', 'Key Standards', 'Orchestration Model', 'Platform Detection', 'Reference Architecture', 'Verification & Git'];
for (var i = 0; i < requiredSections.length; i++) {
  if (claudeMd.includes(requiredSections[i])) log('pass', 'Has section: ' + requiredSections[i]);
  else log('fail', 'Missing section: ' + requiredSections[i]);
}

// C1.4: Writing rules extracted (full section should NOT be inline, brief mention in How Michael Works is OK)
if (claudeMd.includes('## Writing Rules') || claudeMd.includes('Prohibited patterns')) log('fail', 'Writing rules section still inline (should be in .claude/rules/writing-style.md)');
else log('pass', 'Writing rules extracted to rules file');

// C1.5: Context management extracted
if (claudeMd.includes('Target manual /compact at 50%')) log('fail', 'Context management still inline (should be in .claude/rules/context-management.md)');
else log('pass', 'Context management extracted to rules file');

// C1.6: References agent orchestration rule
if (claudeMd.includes('agent-orchestration')) log('pass', 'References agent-orchestration.md');
else log('warn', 'Does not reference agent-orchestration.md');

// C1.7: References writing style rule
if (claudeMd.includes('writing-style')) log('pass', 'References writing-style.md');
else log('warn', 'Does not reference writing-style.md');

// ============================================================
// CATEGORY 2: Agents (54 checks for 9 agents)
// ============================================================
category = 'Agents';

var agentsDir = path.join(base, '.claude', 'agents');
var agents = listDir(agentsDir).filter(function(f) { return f.endsWith('.md'); });
log(agents.length === 9 ? 'pass' : 'fail', agents.length + ' agent files found (expected 9)');

var opusAgents = ['signal-architect', 'tracking-auditor'];
var haikuAgents = ['keyword-strategist', 'landing-page-analyst'];
var sonnetAgents = ['budget-optimizer', 'creative-analyst', 'platform-strategist', 'compliance-auditor', 'attribution-analyst'];
var agentsWithModel = 0;
var correctTier = 0;

for (var a = 0; a < agents.length; a++) {
  var agentContent = readFile(path.join(agentsDir, agents[a]));
  var agentName = agents[a].replace('.md', '');

  // Frontmatter checks
  if (!agentContent.startsWith('---')) {
    log('fail', agentName + ': missing YAML frontmatter');
    continue;
  }

  var fmEnd = agentContent.indexOf('---', 4);
  if (fmEnd === -1) { log('fail', agentName + ': unclosed frontmatter'); continue; }
  var fm = agentContent.substring(3, fmEnd);

  // Required fields
  if (fm.includes('name:')) log('pass', agentName + ': has name field');
  else log('fail', agentName + ': missing name field');

  if (fm.includes('description:')) log('pass', agentName + ': has description field');
  else log('fail', agentName + ': missing description field');

  // Model tiering
  if (fm.includes('model:')) {
    agentsWithModel++;
    var modelMatch = fm.match(/model:\s*(\w+)/);
    var model = modelMatch ? modelMatch[1] : 'unknown';
    var expectedModel = 'sonnet';
    if (opusAgents.indexOf(agentName) >= 0) expectedModel = 'opus';
    if (haikuAgents.indexOf(agentName) >= 0) expectedModel = 'haiku';

    if (model === expectedModel) {
      log('pass', agentName + ': correct model tier (' + model + ')');
      correctTier++;
    } else {
      log('fail', agentName + ': wrong model tier (has ' + model + ', expected ' + expectedModel + ')');
    }
  } else {
    log('fail', agentName + ': missing model field');
  }

  // Permission mode
  if (fm.includes('permissionMode: plan')) log('pass', agentName + ': has permissionMode: plan');
  else if (fm.includes('permissionMode:')) log('warn', agentName + ': has non-plan permissionMode');
  else log('fail', agentName + ': missing permissionMode');

  // Tools (read-only check)
  if (fm.includes('tools:')) {
    var toolsMatch = fm.match(/tools:\s*(.+)/);
    if (toolsMatch) {
      var tools = toolsMatch[1];
      if (tools.includes('Bash') || tools.includes('Write') || tools.includes('Edit')) {
        log('fail', agentName + ': has write tools (' + tools.trim().substring(0, 50) + ')');
      } else {
        log('pass', agentName + ': tools are read-only');
      }
    }
  } else {
    log('fail', agentName + ': missing tools field');
  }

  // Background field
  if (fm.includes('background:')) log('pass', agentName + ': has background field');
  else log('warn', agentName + ': missing background field');
}

// ============================================================
// CATEGORY 3: Skills (variable, ~80+ checks)
// ============================================================
category = 'Skills';

var skillsDir = path.join(base, '.claude', 'skills');
var skills = listDir(skillsDir).filter(function(f) { return isDir(path.join(skillsDir, f)); });
if (skills.length >= 30) log('pass', skills.length + ' skill directories found');
else log('fail', skills.length + ' skill directories found (expected 30+)');

var totalRefs = 0;
var brokenRefs = 0;
var orphanedRefs = 0;
var oversize = 0;
var totalDescChars = 0;
var skillsMissingFrontmatter = 0;

for (var s = 0; s < skills.length; s++) {
  var skill = skills[s];
  var skillFile = path.join(skillsDir, skill, 'SKILL.md');
  if (!fileExists(skillFile)) {
    log('fail', skill + ': missing SKILL.md');
    continue;
  }

  var content = readFile(skillFile);
  var lines = content.split('\n');

  // Size check
  if (lines.length > 500) {
    log('fail', skill + ': ' + lines.length + ' lines (over 500 limit)');
    oversize++;
  }

  // Frontmatter
  if (!content.startsWith('---')) {
    log('fail', skill + ': missing YAML frontmatter');
    skillsMissingFrontmatter++;
    continue;
  }

  var sfmEnd = content.indexOf('---', 4);
  if (sfmEnd === -1) { log('fail', skill + ': unclosed frontmatter'); continue; }
  var sfm = content.substring(3, sfmEnd);

  // Required frontmatter fields
  if (!sfm.includes('name:')) log('fail', skill + ': missing name field');
  if (!sfm.includes('description:')) log('fail', skill + ': missing description field');
  if (!sfm.includes('allowed-tools:')) log('fail', skill + ': missing allowed-tools field');

  // Description budget tracking
  var descMatch = sfm.match(/description:\s*(.+)/);
  if (descMatch) totalDescChars += descMatch[1].trim().length;

  // ES5 check for any code blocks (skip comments and "WRONG" examples)
  var codeBlocks = content.match(/```javascript[\s\S]*?```/g) || [];
  for (var cb = 0; cb < codeBlocks.length; cb++) {
    var codeLines = codeBlocks[cb].split('\n');
    var es6Found = false;
    for (var cl = 0; cl < codeLines.length; cl++) {
      var line = codeLines[cl].trim();
      // Skip comments and lines showing what NOT to do
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
      if (line.match(/\bconst\s/) || line.match(/\blet\s/) || line.match(/=>\s*{/) || line.match(/=>\s*[^=]/)) {
        // Also skip template literal check
        es6Found = true;
        break;
      }
    }
    if (es6Found) {
      log('fail', skill + ': ES6 syntax in code block (const/let/arrow)');
      break;
    }
  }

  // Reference integrity (handles both local refs and cross-skill refs)
  var refMatches = content.match(/\.claude\/skills\/[\w-]+\/references\/[\w-]+\.md|references\/[\w-]+\.md/g) || [];
  var refsDir = path.join(skillsDir, skill, 'references');
  var seen = {};

  for (var r = 0; r < refMatches.length; r++) {
    if (seen[refMatches[r]]) continue;
    seen[refMatches[r]] = true;
    totalRefs++;
    var refFullPath;
    if (refMatches[r].startsWith('.claude/')) {
      // Cross-skill reference: resolve from project base
      refFullPath = path.join(base, refMatches[r]);
    } else {
      // Local reference: resolve from this skill's directory
      refFullPath = path.join(skillsDir, skill, refMatches[r]);
    }
    if (!fileExists(refFullPath)) {
      log('fail', skill + ': broken ref ' + refMatches[r]);
      brokenRefs++;
    }
  }

  // Orphaned reference files
  if (fileExists(refsDir) && isDir(refsDir)) {
    var refFiles = listDir(refsDir).filter(function(f) { return f.endsWith('.md'); });
    for (var rf = 0; rf < refFiles.length; rf++) {
      if (!content.includes(refFiles[rf])) {
        log('warn', skill + ': orphaned ref file ' + refFiles[rf]);
        orphanedRefs++;
      }
    }
  }
}

// Workflow skills must have Output Verification
var workflowSkills = ['full-audit', 'monthly-report', 'quarterly-review', 'new-client', 'tracking-audit', 'audience-audit', 'bidding-strategy-audit', 'creative-audit', 'landing-page-audit'];
var verifiedWorkflows = 0;
for (var w = 0; w < workflowSkills.length; w++) {
  var wsPath = path.join(skillsDir, workflowSkills[w], 'SKILL.md');
  if (fileExists(wsPath)) {
    var wsContent = readFile(wsPath);
    if (wsContent.includes('Output Verification') || wsContent.includes('## Output')) {
      log('pass', workflowSkills[w] + ': has Output Verification');
      verifiedWorkflows++;
    } else {
      log('fail', workflowSkills[w] + ': missing Output Verification');
    }
  }
}

// Description budget
var descPct = Math.round(totalDescChars / 30000 * 100);
if (descPct <= 50) log('pass', 'Description budget: ' + totalDescChars + '/30000 (' + descPct + '%)');
else if (descPct <= 75) log('warn', 'Description budget: ' + totalDescChars + '/30000 (' + descPct + '%)');
else log('fail', 'Description budget: ' + totalDescChars + '/30000 (' + descPct + '%)');

// ============================================================
// CATEGORY 4: Rules (20+ checks)
// ============================================================
category = 'Rules';

var rulesDir = path.join(base, '.claude', 'rules');
var expectedRules = [
  'anomaly-flagging.md',
  'client-memory.md',
  'security.md',
  'verification-comments.md',
  'writing-style.md',
  'context-management.md',
  'agent-orchestration.md',
  'self-learning.md',
  'mcp-response-efficiency.md'
];

var rulesFound = 0;
var ruleChars = 0;
for (var ru = 0; ru < expectedRules.length; ru++) {
  var rp = path.join(rulesDir, expectedRules[ru]);
  if (fileExists(rp)) {
    log('pass', expectedRules[ru] + ' exists');
    rulesFound++;
    var ruleContent = readFile(rp);
    ruleChars += ruleContent.length;

    // Check for heading
    if (ruleContent.startsWith('#')) log('pass', expectedRules[ru] + ': has heading');
    else log('warn', expectedRules[ru] + ': missing heading');
  } else {
    log('fail', expectedRules[ru] + ' missing');
  }
}
log(rulesFound === expectedRules.length ? 'pass' : 'fail', rulesFound + '/' + expectedRules.length + ' expected rules present');

// Content checks on key rules
var securityRule = readFile(path.join(rulesDir, 'security.md'));
if (securityRule.includes('NEVER') && securityRule.includes('.env')) log('pass', 'security.md: has credential protection rules');
else log('fail', 'security.md: missing credential protection');

if (securityRule.includes('ES5')) log('pass', 'security.md: has ES5 requirement');
else log('warn', 'security.md: missing ES5 requirement');

var writingRule = readFile(path.join(rulesDir, 'writing-style.md'));
if (writingRule.includes('hyphens') || writingRule.includes('dashes')) log('pass', 'writing-style.md: has dash prohibition');
else log('fail', 'writing-style.md: missing dash prohibition');

var agentOrch = readFile(path.join(rulesDir, 'agent-orchestration.md'));
if (agentOrch.includes('Opus') && agentOrch.includes('Haiku')) log('pass', 'agent-orchestration.md: has model tiering table');
else log('fail', 'agent-orchestration.md: missing model tiering');

var selfLearn = readFile(path.join(rulesDir, 'self-learning.md'));
if (selfLearn.includes('80%') || selfLearn.includes('Promotion')) log('pass', 'self-learning.md: has promotion criteria');
else log('fail', 'self-learning.md: missing promotion criteria');

var mcpEff = readFile(path.join(rulesDir, 'mcp-response-efficiency.md'));
if (mcpEff.includes('LIMIT') || mcpEff.includes('filter')) log('pass', 'mcp-response-efficiency.md: has query optimization rules');
else log('fail', 'mcp-response-efficiency.md: missing query optimization');

// ============================================================
// CATEGORY 5: Hooks (25+ checks)
// ============================================================
category = 'Hooks';

var hooksDir = path.join(base, '.claude', 'hooks');
var expectedHookFiles = [
  'deny-platform-writes.js',
  'compact-context.js',
  'stop-notify.ps1',
  'post-tool-validate.js',
  'pre-compact-preserve.js',
  'user-prompt-flags.js'
];

for (var h = 0; h < expectedHookFiles.length; h++) {
  var hookPath = path.join(hooksDir, expectedHookFiles[h]);
  if (fileExists(hookPath)) {
    var size = fs.statSync(hookPath).size;
    log(size > 0 ? 'pass' : 'fail', expectedHookFiles[h] + ' exists (' + size + ' bytes)');
  } else {
    log('fail', expectedHookFiles[h] + ' missing');
  }
}

// Deny pattern check
var denyHook = readFile(path.join(hooksDir, 'deny-platform-writes.js'));
if (denyHook.includes('deny')) log('pass', 'deny-platform-writes.js: has deny pattern');
else log('fail', 'deny-platform-writes.js: missing deny pattern');

// UserPromptSubmit hook check
var upfHook = readFile(path.join(hooksDir, 'user-prompt-flags.js'));
if (upfHook.includes('-meta') && upfHook.includes('-gads')) log('pass', 'user-prompt-flags.js: has OFM flags');
else log('fail', 'user-prompt-flags.js: missing OFM flags');

// PreCompact hook check
var pcHook = readFile(path.join(hooksDir, 'pre-compact-preserve.js'));
if (pcHook.includes('client') || pcHook.includes('Asana') || pcHook.includes('preserve')) log('pass', 'pre-compact-preserve.js: has context preservation logic');
else log('fail', 'pre-compact-preserve.js: missing context preservation');

// ============================================================
// CATEGORY 6: Settings (20+ checks)
// ============================================================
category = 'Settings';

// settings.json (committed, should have hooks + permissions)
var settingsSharedPath = path.join(base, '.claude', 'settings.json');
if (fileExists(settingsSharedPath)) {
  try {
    var settingsShared = JSON.parse(readFile(settingsSharedPath));
    log('pass', 'settings.json is valid JSON');

    // Permissions
    if (settingsShared.permissions && settingsShared.permissions.deny) {
      var deny = settingsShared.permissions.deny;
      log(deny.length > 0 ? 'pass' : 'fail', deny.length + ' deny permissions configured');

      var hasEnvDeny = deny.some(function(d) { return d.includes('.env'); });
      log(hasEnvDeny ? 'pass' : 'fail', '.env file protection ' + (hasEnvDeny ? 'configured' : 'missing'));

      var hasSshDeny = deny.some(function(d) { return d.includes('.ssh'); });
      log(hasSshDeny ? 'pass' : 'fail', '.ssh protection ' + (hasSshDeny ? 'configured' : 'missing'));

      var hasRmDeny = deny.some(function(d) { return d.includes('rm -rf'); });
      log(hasRmDeny ? 'pass' : 'fail', 'rm -rf protection ' + (hasRmDeny ? 'configured' : 'missing'));
    } else {
      log('fail', 'No deny permissions in settings.json');
    }

    // Hooks in settings.json (should be here after migration)
    var sharedHooks = settingsShared.hooks || {};
    var sharedHookEvents = Object.keys(sharedHooks);

    var expectedEvents = ['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart', 'PreCompact', 'UserPromptSubmit', 'TaskCompleted'];
    for (var se = 0; se < expectedEvents.length; se++) {
      if (sharedHookEvents.indexOf(expectedEvents[se]) >= 0) {
        var eventHooks = sharedHooks[expectedEvents[se]];
        log(eventHooks.length > 0 ? 'pass' : 'warn', expectedEvents[se] + ' hook event: ' + eventHooks.length + ' matcher(s)');
      } else {
        log('fail', expectedEvents[se] + ' hook event missing from settings.json');
      }
    }

    // Platform write blockers
    var preToolUse = sharedHooks.PreToolUse || [];
    var metaBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('meta-ads'); });
    log(metaBlocker ? 'pass' : 'fail', 'Meta Ads write blocker ' + (metaBlocker ? 'configured' : 'missing'));

    var googleBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('google_ads'); });
    log(googleBlocker ? 'pass' : 'fail', 'Google Ads write blocker ' + (googleBlocker ? 'configured' : 'missing'));

    var acBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('activecampaign'); });
    log(acBlocker ? 'pass' : 'fail', 'ActiveCampaign write blocker ' + (acBlocker ? 'configured' : 'missing'));

    var outlookBlocker = preToolUse.find(function(h) { return h.matcher && h.matcher.includes('outlook'); });
    log(outlookBlocker ? 'pass' : 'fail', 'Outlook write blocker ' + (outlookBlocker ? 'configured' : 'missing'));

    // TaskCompleted quality gate
    var taskCompleted = sharedHooks.TaskCompleted || [];
    if (taskCompleted.length > 0) {
      var hasPromptHook = taskCompleted.some(function(h) { return h.hooks && h.hooks.some(function(hk) { return hk.type === 'prompt'; }); });
      log(hasPromptHook ? 'pass' : 'warn', 'TaskCompleted has prompt-type quality gate');
    }

  } catch(e) {
    log('fail', 'settings.json invalid JSON: ' + e.message);
  }
} else {
  log('fail', 'settings.json missing');
}

// settings.local.json (should be empty or minimal after hook migration)
var settingsLocalPath = path.join(base, '.claude', 'settings.local.json');
if (fileExists(settingsLocalPath)) {
  try {
    var settingsLocal = JSON.parse(readFile(settingsLocalPath));
    log('pass', 'settings.local.json is valid JSON');

    var localHooks = settingsLocal.hooks || {};
    var localHookCount = 0;
    Object.keys(localHooks).forEach(function(k) {
      if (localHooks[k] && localHooks[k].length > 0) localHookCount += localHooks[k].length;
    });
    if (localHookCount === 0) log('pass', 'settings.local.json hooks migrated to settings.json (clean)');
    else log('warn', 'settings.local.json still has ' + localHookCount + ' hook matchers (should be in settings.json)');

  } catch(e) {
    log('fail', 'settings.local.json invalid JSON: ' + e.message);
  }
}

// ============================================================
// CATEGORY 7: Operational (25+ checks)
// ============================================================
category = 'Operational';

// MEMORY.md
var memDir = path.join(process.env.USERPROFILE, '.claude', 'projects', 'C--Users-mtate-OneDrive-Desktop-ClaudeCode-Paid-Media---Tracking-Expert', 'memory');
var memFile = path.join(memDir, 'MEMORY.md');
if (fileExists(memFile)) {
  var memLines = readFile(memFile).split('\n').length;
  if (memLines <= 160) log('pass', 'MEMORY.md: ' + memLines + ' lines (under 160 safe ceiling)');
  else if (memLines <= 180) log('warn', 'MEMORY.md: ' + memLines + ' lines (approaching 200 truncation)');
  else log('fail', 'MEMORY.md: ' + memLines + ' lines (critical: near 200 truncation)');
} else {
  log('fail', 'MEMORY.md not found');
}

// Instincts pipeline
var instinctsFile = path.join(base, '.claude', 'memory', 'instincts.md');
if (fileExists(instinctsFile)) {
  var instContent = readFile(instinctsFile);
  if (instContent.includes('Confidence') || instContent.includes('confidence')) log('pass', 'instincts.md: has confidence scoring');
  else log('warn', 'instincts.md: exists but missing confidence scoring');
} else {
  log('fail', 'instincts.md not found (.claude/memory/)');
}

// Systemic patterns
var patternsFile = path.join(base, '.claude', 'memory', 'systemic-patterns.md');
if (fileExists(patternsFile)) log('pass', 'systemic-patterns.md exists');
else log('warn', 'systemic-patterns.md missing (referenced by client-memory rules)');

// Frameworks
var fwDir = path.join(base, '.claude', 'frameworks');
var fws = listDir(fwDir).filter(function(f) { return f.endsWith('.md'); });
if (fws.length >= 11) log('pass', fws.length + ' frameworks found');
else log('warn', fws.length + ' frameworks found (expected 11)');

// Key directories
var keyDirs = ['clients', 'templates', 'scripts/chrome', 'scripts/gtm', 'scripts/planning'];
for (var kd = 0; kd < keyDirs.length; kd++) {
  var dp = path.join(base, keyDirs[kd]);
  if (fileExists(dp) && isDir(dp)) {
    log('pass', keyDirs[kd] + '/ exists');
  } else {
    log('warn', keyDirs[kd] + '/ not found');
  }
}

// Client template completeness
var templateDir = path.join(base, 'clients', '_template');
var expectedTemplateFiles = ['profile.json', 'tracking-config.json', 'media-strategy.md', 'history.md', 'open-items.md', 'CLAUDE.md'];
for (var tf = 0; tf < expectedTemplateFiles.length; tf++) {
  var tfp = path.join(templateDir, expectedTemplateFiles[tf]);
  if (fileExists(tfp)) log('pass', 'Client template: ' + expectedTemplateFiles[tf]);
  else log('fail', 'Client template missing: ' + expectedTemplateFiles[tf]);
}

// Planning scripts
var planningScripts = ['scripts/planning/init-session.sh', 'scripts/planning/init-session.ps1', 'scripts/planning/check-complete.sh', 'scripts/planning/check-complete.ps1'];
for (var ps = 0; ps < planningScripts.length; ps++) {
  var psp = path.join(base, planningScripts[ps]);
  if (fileExists(psp)) log('pass', planningScripts[ps] + ' exists');
  else log('warn', planningScripts[ps] + ' missing');
}

// Total instruction budget
var claudeChars = claudeMd.length;
var totalInstructionChars = claudeChars + ruleChars + totalDescChars;
if (totalInstructionChars <= 25000) log('pass', 'Instruction budget: ' + totalInstructionChars + ' chars (healthy)');
else if (totalInstructionChars <= 35000) log('warn', 'Instruction budget: ' + totalInstructionChars + ' chars (monitor)');
else log('fail', 'Instruction budget: ' + totalInstructionChars + ' chars (exceeding threshold)');

// .gitignore check for planning files
var gitignorePath = path.join(base, '.gitignore');
if (fileExists(gitignorePath)) {
  var gitignore = readFile(gitignorePath);
  if (gitignore.includes('task_plan.md')) log('pass', '.gitignore includes task_plan.md');
  else log('warn', '.gitignore missing task_plan.md');
  if (gitignore.includes('findings.md')) log('pass', '.gitignore includes findings.md');
  else log('warn', '.gitignore missing findings.md');
} else {
  log('warn', '.gitignore not found');
}

// Catchup skill exists
if (fileExists(path.join(skillsDir, 'catchup', 'SKILL.md'))) log('pass', 'Catchup skill exists');
else log('fail', 'Catchup skill missing');

// POAS optimization skill exists
if (fileExists(path.join(skillsDir, 'poas-optimization', 'SKILL.md'))) log('pass', 'POAS optimization skill exists');
else log('fail', 'POAS optimization skill missing');

// SGTM health monitor skill exists
if (fileExists(path.join(skillsDir, 'sgtm-health-monitor', 'SKILL.md'))) log('pass', 'SGTM health monitor skill exists');
else log('fail', 'SGTM health monitor skill missing');

// Planning with files skill exists
if (fileExists(path.join(skillsDir, 'planning-with-files', 'SKILL.md'))) log('pass', 'Planning with files skill exists');
else log('fail', 'Planning with files skill missing');

// Templates
var templatesDir = path.join(base, 'templates');
var expectedTemplates = ['audit-report.md', 'developer-handoff.md', 'tracking-implementation-handoff.md'];
for (var et = 0; et < expectedTemplates.length; et++) {
  var etp = path.join(templatesDir, expectedTemplates[et]);
  if (fileExists(etp)) log('pass', 'Template: ' + expectedTemplates[et]);
  else log('warn', 'Template missing: ' + expectedTemplates[et]);
}

// ============================================================
// PRINT RESULTS
// ============================================================
console.log('');
console.log('========================================');
console.log('  PROJECT VALIDATION v3');
console.log('  ' + new Date().toISOString().split('T')[0]);
console.log('========================================');
console.log('');

var categories = ['CLAUDE.md', 'Agents', 'Skills', 'Rules', 'Hooks', 'Settings', 'Operational'];
for (var ci = 0; ci < categories.length; ci++) {
  var catResults = results.details.filter(function(d) { return d.category === categories[ci]; });
  var catFails = catResults.filter(function(d) { return d.status === 'FAIL'; });
  var catWarns = catResults.filter(function(d) { return d.status === 'WARN'; });
  var catPasses = catResults.filter(function(d) { return d.status === 'PASS'; });

  var catIcon = catFails.length === 0 ? (catWarns.length === 0 ? 'CLEAN' : 'WARN') : 'ISSUES';
  console.log('[' + catIcon + '] ' + categories[ci] + ' (' + catPasses.length + ' pass, ' + catFails.length + ' fail, ' + catWarns.length + ' warn)');

  if (catFails.length > 0) {
    for (var cf = 0; cf < catFails.length; cf++) {
      console.log('  FAIL: ' + catFails[cf].message);
    }
  }
  if (catWarns.length > 0) {
    for (var cw = 0; cw < catWarns.length; cw++) {
      console.log('  WARN: ' + catWarns[cw].message);
    }
  }
}

console.log('');
console.log('--- SUMMARY ---');
console.log('  PASS: ' + results.pass);
console.log('  FAIL: ' + results.fail);
console.log('  WARN: ' + results.warn);
console.log('  Total checks: ' + (results.pass + results.fail + results.warn));
console.log('');
console.log('  Skills: ' + skills.length);
console.log('  Agents: ' + agents.length + ' (' + correctTier + '/' + agents.length + ' correctly tiered)');
console.log('  Rules: ' + rulesFound + '/' + expectedRules.length);
console.log('  Frameworks: ' + fws.length);
console.log('  Ref pointers: ' + totalRefs + ' (' + brokenRefs + ' broken, ' + orphanedRefs + ' orphaned)');
console.log('  Workflow skills with Output Verification: ' + verifiedWorkflows + '/' + workflowSkills.length);
console.log('  Skill description budget: ' + totalDescChars + '/30000 (' + descPct + '%)');
console.log('  Instruction budget: ' + totalInstructionChars + ' chars');
console.log('');
if (results.fail === 0) console.log('  >>> ALL CHECKS PASSED <<<');
else console.log('  >>> ' + results.fail + ' ISSUE(S) NEED ATTENTION <<<');
console.log('');

// Write results to JSON for programmatic consumption
var outputPath = path.join(base, 'scripts', 'eval-results.json');
fs.writeFileSync(outputPath, JSON.stringify({
  date: new Date().toISOString(),
  version: 3,
  pass: results.pass,
  fail: results.fail,
  warn: results.warn,
  total: results.pass + results.fail + results.warn,
  details: results.details
}, null, 2));

process.exit(results.fail > 0 ? 1 : 0);
