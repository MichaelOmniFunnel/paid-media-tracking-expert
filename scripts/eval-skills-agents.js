#!/usr/bin/env node
/**
 * Skill & Agent Evaluation Framework v2
 * Validates frontmatter, naming, descriptions, cross-references, structure,
 * ES6 compliance in GTM contexts, and known field validation.
 *
 * Usage: node scripts/eval-skills-agents.js [--json] [--verbose]
 * Exit code: 0 if no errors, 1 if errors found
 */

var fs = require("fs");
var path = require("path");

var projectRoot = path.resolve(__dirname, "..");
var skillsDir = path.join(projectRoot, ".claude", "skills");
var agentsDir = path.join(projectRoot, ".claude", "agents");
var frameworksDir = path.join(projectRoot, ".claude", "frameworks");

var args = process.argv.slice(2);
var outputJson = args.indexOf("--json") !== -1;
var verbose = args.indexOf("--verbose") !== -1;

// Known valid frontmatter fields
var KNOWN_SKILL_FIELDS = [
  "name", "description", "allowed-tools", "model", "context",
  "agent", "disable-model-invocation", "user-invocable", "argument-hint",
  "_bodyLineCount"
];
var KNOWN_AGENT_FIELDS = [
  "name", "description", "tools", "maxTurns", "memory", "skills",
  "_bodyLineCount"
];
var VALID_MODELS = ["opus", "sonnet", "haiku"];
var VALID_TOOLS = ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "Agent", "WebFetch", "WebSearch"];

// --- Frontmatter parser ---
function parseFrontmatter(content) {
  var lines = content.split("\n");
  if (lines[0].trim() !== "---") return null;
  var end = -1;
  for (var i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { end = i; break; }
  }
  if (end === -1) return null;

  var fm = {};
  var currentKey = null;
  var listItems = [];
  for (var j = 1; j < end; j++) {
    var line = lines[j];
    if (/^\s+-\s+/.test(line) && currentKey) {
      listItems.push(line.replace(/^\s+-\s+/, "").trim());
      fm[currentKey] = listItems;
      continue;
    }
    var match = line.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*(.*)/);
    if (match) {
      currentKey = match[1];
      var val = match[2].trim();
      if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (val === "") { listItems = []; }
      else { fm[currentKey] = val; listItems = []; }
    }
  }
  fm._bodyLineCount = lines.length - end - 1;
  fm._body = lines.slice(end + 1).join("\n");
  return fm;
}

// --- Collect skills ---
function getSkills() {
  var results = [];
  if (!fs.existsSync(skillsDir)) return results;
  var dirs = fs.readdirSync(skillsDir);
  dirs.forEach(function(d) {
    var fullPath = path.join(skillsDir, d);
    var stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) return;
    var skillFile = path.join(fullPath, "SKILL.md");
    if (!fs.existsSync(skillFile)) {
      results.push({ dirName: d, filePath: null, frontmatter: null, orphaned: true, lineCount: 0 });
      return;
    }
    var content = fs.readFileSync(skillFile, "utf8");
    var fm = parseFrontmatter(content);
    results.push({
      dirName: d,
      filePath: skillFile,
      frontmatter: fm,
      orphaned: false,
      contentLength: content.length,
      lineCount: content.split("\n").length
    });
  });
  return results;
}

// --- Collect agents ---
function getAgents() {
  var results = [];
  if (!fs.existsSync(agentsDir)) return results;
  var entries = fs.readdirSync(agentsDir);
  var subdirs = [];
  entries.forEach(function(f) {
    var fullPath = path.join(agentsDir, f);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      subdirs.push(f);
      return;
    }
    if (!f.endsWith(".md")) return;
    var content = fs.readFileSync(fullPath, "utf8");
    var fm = parseFrontmatter(content);
    results.push({
      fileName: f,
      baseName: f.replace(".md", ""),
      filePath: fullPath,
      frontmatter: fm,
      contentLength: content.length,
      lineCount: content.split("\n").length
    });
  });
  // Track subdirectories as structural issues
  results._subdirs = subdirs;
  return results;
}

// --- ES6 detection in GTM context ---
function checkES6InGTMContext(body) {
  var issues = [];
  if (!body) return issues;

  // Extract fenced code blocks
  var codeBlockRegex = /```(?:javascript|js|html)?\n([\s\S]*?)```/g;
  var match;
  while ((match = codeBlockRegex.exec(body)) !== null) {
    var blockStart = body.lastIndexOf("\n", match.index);
    var contextBefore = body.substring(Math.max(0, blockStart - 300), match.index);

    // Only check blocks in GTM Custom HTML context or explicitly marked ES5
    var isGTMContext = /GTM Custom HTML|Custom HTML tag|Custom HTML Tag/i.test(contextBefore);
    var isES5Marked = /ES5 compatible|ES5 only|ES5 compliant/i.test(contextBefore) ||
                      /ES5 compatible|ES5 only|ES5 compliant/i.test(match[1]);

    if (isGTMContext || isES5Marked) {
      var code = match[1];
      if (/\bconst\s/.test(code)) issues.push("ES6 'const' in GTM/ES5 code block");
      if (/\blet\s/.test(code)) issues.push("ES6 'let' in GTM/ES5 code block");
      if (/=>/.test(code)) issues.push("ES6 arrow function in GTM/ES5 code block");
      if (/`[^`]*\$\{/.test(code)) issues.push("ES6 template literal in GTM/ES5 code block");
    }
  }
  return issues;
}

// --- Validation checks ---
function validateSkill(skill, allSkillDirNames) {
  var issues = [];
  var warnings = [];
  var info = [];
  var fm = skill.frontmatter;

  // Orphaned directory check
  if (skill.orphaned) {
    issues.push("Orphaned skill directory (no SKILL.md found)");
    return { issues: issues, warnings: warnings, info: info, type: "unknown" };
  }

  if (!fm) {
    issues.push("CRITICAL: No valid YAML frontmatter found");
    return { issues: issues, warnings: warnings, info: info, type: "unknown" };
  }

  // Name checks
  if (!fm.name) {
    issues.push("Missing required field: name");
  } else {
    if (fm.name !== skill.dirName) {
      issues.push("Name mismatch: frontmatter name \"" + fm.name + "\" != directory \"" + skill.dirName + "\"");
    }
    if (!/^[a-z0-9-]+$/.test(fm.name)) {
      warnings.push("Name should be lowercase hyphenated (got \"" + fm.name + "\")");
    }
  }

  // Description checks
  if (!fm.description) {
    issues.push("Missing required field: description");
  } else {
    if (fm.description.length < 50) {
      issues.push("Description too short (" + fm.description.length + " chars, minimum 50)");
    }
    var hasTrigger = /use when|use whenever|use this/i.test(fm.description);
    if (!hasTrigger) {
      warnings.push("Description lacks trigger phrases (should contain \"Use when...\")");
    }
  }

  // Known field validation
  var unknownFields = Object.keys(fm).filter(function(k) {
    return KNOWN_SKILL_FIELDS.indexOf(k) === -1 && k !== "_body";
  });
  if (unknownFields.length > 0) {
    warnings.push("Unknown frontmatter fields: " + unknownFields.join(", "));
  }

  // Model validation
  if (fm.model && VALID_MODELS.indexOf(fm.model) === -1) {
    warnings.push("Unknown model value: \"" + fm.model + "\" (expected: " + VALID_MODELS.join(", ") + ")");
  }

  // Context validation
  if (fm.context && fm.context !== "fork") {
    warnings.push("Unknown context value: \"" + fm.context + "\" (expected: fork)");
  }

  // Determine skill type
  var isWorkflow = !!fm["allowed-tools"];
  var type = isWorkflow ? "workflow" : "reference";

  // Workflow skill checks
  if (isWorkflow) {
    if (!fm["argument-hint"]) {
      warnings.push("Workflow skill missing argument-hint field");
    }
    if (fm["allowed-tools"].indexOf("Agent") === -1) {
      warnings.push("Workflow skill allowed-tools does not include Agent (cannot delegate)");
    }
    // Validate tool names
    var toolList = fm["allowed-tools"].split(",").map(function(t) { return t.trim(); });
    toolList.forEach(function(t) {
      if (VALID_TOOLS.indexOf(t) === -1) {
        warnings.push("Unknown tool in allowed-tools: \"" + t + "\"");
      }
    });
  }

  // Reference skill checks
  if (!isWorkflow && !fm.context) {
    if (!fm.model && !fm["disable-model-invocation"]) {
      warnings.push("Reference skill has no model field or disable-model-invocation (will use default expensive model for lookups)");
    }
  }

  // ES6 in GTM context
  var body = fm._body || "";
  var es6Issues = checkES6InGTMContext(body);
  es6Issues.forEach(function(e) { issues.push(e); });

  // Content depth check
  if (fm._bodyLineCount < 20) {
    info.push("Skill body very short (" + fm._bodyLineCount + " lines)");
  }

  return { issues: issues, warnings: warnings, info: info, type: type };
}

function validateAgent(agent, allSkillDirNames) {
  var issues = [];
  var warnings = [];
  var info = [];
  var fm = agent.frontmatter;

  if (!fm) {
    issues.push("CRITICAL: No valid YAML frontmatter found");
    return { issues: issues, warnings: warnings, info: info };
  }

  // Name checks
  if (!fm.name) {
    issues.push("Missing required field: name");
  } else if (fm.name !== agent.baseName) {
    issues.push("Name mismatch: frontmatter name \"" + fm.name + "\" != filename \"" + agent.baseName + "\"");
  }

  // Description
  if (!fm.description) {
    issues.push("Missing required field: description");
  } else {
    if (fm.description.length < 50) {
      issues.push("Description too short (" + fm.description.length + " chars, minimum 50)");
    }
    var hasTrigger = /use when/i.test(fm.description);
    if (!hasTrigger) {
      warnings.push("Description lacks \"Use when...\" trigger phrase");
    }
  }

  // Required fields
  if (!fm.tools) {
    issues.push("Missing required field: tools");
  } else {
    var toolList = fm.tools.split(",").map(function(t) { return t.trim(); });
    toolList.forEach(function(t) {
      if (VALID_TOOLS.indexOf(t) === -1) {
        warnings.push("Unknown tool: \"" + t + "\"");
      }
    });
  }

  if (!fm.maxTurns) {
    warnings.push("Missing recommended field: maxTurns");
  } else {
    var turns = parseInt(fm.maxTurns, 10);
    if (isNaN(turns)) warnings.push("maxTurns is not a number: \"" + fm.maxTurns + "\"");
    else if (turns < 10) warnings.push("maxTurns unusually low (" + turns + ")");
    else if (turns > 100) warnings.push("maxTurns unusually high (" + turns + ")");
  }

  if (!fm.memory) {
    warnings.push("Missing recommended field: memory");
  } else if (["project", "user", "none"].indexOf(fm.memory) === -1) {
    warnings.push("Unknown memory value: \"" + fm.memory + "\" (expected: project, user, none)");
  }

  // Known field validation
  var unknownFields = Object.keys(fm).filter(function(k) {
    return KNOWN_AGENT_FIELDS.indexOf(k) === -1 && k !== "_body";
  });
  if (unknownFields.length > 0) {
    warnings.push("Unknown frontmatter fields: " + unknownFields.join(", "));
  }

  // Skills preloading validation
  if (fm.skills && Array.isArray(fm.skills)) {
    fm.skills.forEach(function(s) {
      if (allSkillDirNames.indexOf(s) === -1) {
        issues.push("Preloaded skill \"" + s + "\" does not exist in .claude/skills/");
      }
    });
  } else if (!fm.skills) {
    info.push("No skills preloading configured");
  }

  // Content depth
  if (agent.lineCount < 30) {
    info.push("Agent file is short (" + agent.lineCount + " lines)");
  }

  return { issues: issues, warnings: warnings, info: info };
}

// --- Structural checks ---
function structuralChecks(skills, agents) {
  var issues = [];
  var warnings = [];
  var info = [];
  var skillNames = skills.map(function(s) { return s.dirName; });

  // Duplicate skill names
  var seen = {};
  skillNames.forEach(function(n) {
    if (seen[n]) issues.push("Duplicate skill directory: " + n);
    seen[n] = true;
  });

  // Duplicate agent names
  var agentSeen = {};
  agents.forEach(function(a) {
    if (agentSeen[a.baseName]) issues.push("Duplicate agent file: " + a.baseName);
    agentSeen[a.baseName] = true;
  });

  // Subdirectories in agents dir (should be flat)
  if (agents._subdirs && agents._subdirs.length > 0) {
    agents._subdirs.forEach(function(d) {
      issues.push("Subdirectory in agents/ (should be flat .md files): " + d);
    });
  }

  // Orphaned skill directories
  skills.forEach(function(s) {
    if (s.orphaned) {
      warnings.push("Orphaned skill directory (no SKILL.md): " + s.dirName);
    }
  });

  return { issues: issues, warnings: warnings, info: info };
}

// --- Main ---
function main() {
  var skills = getSkills();
  var agents = getAgents();
  var skillDirNames = skills.filter(function(s) { return !s.orphaned; }).map(function(s) { return s.dirName; });

  var report = {
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    summary: {
      totalSkills: skills.length,
      totalAgents: agents.length,
      skillsPassing: 0,
      skillsWithIssues: 0,
      skillsWithWarnings: 0,
      agentsPassing: 0,
      agentsWithIssues: 0,
      agentsWithWarnings: 0,
      structuralIssues: 0,
      overallScore: 0
    },
    skillTypes: { workflow: 0, reference: 0, unknown: 0 },
    skills: [],
    agents: [],
    structural: { issues: [], warnings: [], info: [] }
  };

  // Validate skills
  skills.forEach(function(skill) {
    var result = validateSkill(skill, skillDirNames);
    var entry = {
      name: skill.dirName,
      type: result.type,
      lines: skill.lineCount,
      issues: result.issues,
      warnings: result.warnings,
      info: result.info,
      status: result.issues.length === 0 ? (result.warnings.length === 0 ? "PASS" : "WARN") : "FAIL"
    };
    report.skills.push(entry);
    report.skillTypes[result.type] = (report.skillTypes[result.type] || 0) + 1;
    if (entry.status === "PASS") report.summary.skillsPassing++;
    if (result.issues.length > 0) report.summary.skillsWithIssues++;
    if (result.warnings.length > 0) report.summary.skillsWithWarnings++;
  });

  // Validate agents
  agents.forEach(function(agent) {
    var result = validateAgent(agent, skillDirNames);
    var entry = {
      name: agent.baseName,
      lines: agent.lineCount,
      issues: result.issues,
      warnings: result.warnings,
      info: result.info,
      status: result.issues.length === 0 ? (result.warnings.length === 0 ? "PASS" : "WARN") : "FAIL"
    };
    report.agents.push(entry);
    if (entry.status === "PASS") report.summary.agentsPassing++;
    if (result.issues.length > 0) report.summary.agentsWithIssues++;
    if (result.warnings.length > 0) report.summary.agentsWithWarnings++;
  });

  // Structural checks
  var structural = structuralChecks(skills, agents);
  report.structural = structural;
  report.summary.structuralIssues = structural.issues.length;

  // Calculate overall score
  var totalItems = report.summary.totalSkills + report.summary.totalAgents;
  var passingItems = report.summary.skillsPassing + report.summary.agentsPassing;
  report.summary.overallScore = totalItems > 0 ? Math.round((passingItems / totalItems) * 100) : 0;

  // Determine exit code
  var hasErrors = report.summary.skillsWithIssues > 0 ||
                  report.summary.agentsWithIssues > 0 ||
                  report.summary.structuralIssues > 0;

  // Output
  if (outputJson) {
    // Strip _body from output to keep JSON clean
    report.skills.forEach(function(s) { delete s._body; });
    report.agents.forEach(function(a) { delete a._body; });
    console.log(JSON.stringify(report, null, 2));
    process.exit(hasErrors ? 1 : 0);
    return;
  }

  // Human-readable output
  console.log("");
  console.log("=== SKILL & AGENT EVALUATION REPORT v2 ===");
  console.log("Generated: " + report.timestamp);
  console.log("");

  console.log("SUMMARY");
  console.log("  Skills:  " + report.summary.totalSkills + " total (" + report.skillTypes.workflow + " workflow, " + report.skillTypes.reference + " reference)");
  console.log("  Agents:  " + report.summary.totalAgents + " total");
  console.log("  Score:   " + report.summary.overallScore + "% (" + passingItems + "/" + totalItems + " fully passing)");
  console.log("");

  // Skills detail
  console.log("SKILLS");
  report.skills.forEach(function(s) {
    var icon = s.status === "PASS" ? "[PASS]" : (s.status === "WARN" ? "[WARN]" : "[FAIL]");
    console.log("  " + icon + " " + s.name + " (" + s.type + ", " + s.lines + " lines)");
    if (verbose || s.status === "FAIL") {
      s.issues.forEach(function(i) { console.log("         ERROR: " + i); });
    }
    if (verbose || s.status !== "PASS") {
      s.warnings.forEach(function(w) { console.log("         WARN:  " + w); });
    }
    if (verbose && s.info.length > 0) {
      s.info.forEach(function(i) { console.log("         INFO:  " + i); });
    }
  });
  console.log("");

  // Agents detail
  console.log("AGENTS");
  report.agents.forEach(function(a) {
    var icon = a.status === "PASS" ? "[PASS]" : (a.status === "WARN" ? "[WARN]" : "[FAIL]");
    console.log("  " + icon + " " + a.name + " (" + a.lines + " lines)");
    if (verbose || a.status === "FAIL") {
      a.issues.forEach(function(i) { console.log("         ERROR: " + i); });
    }
    if (verbose || a.status !== "PASS") {
      a.warnings.forEach(function(w) { console.log("         WARN:  " + w); });
    }
    if (verbose && a.info.length > 0) {
      a.info.forEach(function(i) { console.log("         INFO:  " + i); });
    }
  });
  console.log("");

  // Structural
  if (structural.issues.length > 0 || structural.warnings.length > 0) {
    console.log("STRUCTURAL");
    structural.issues.forEach(function(i) { console.log("  ERROR: " + i); });
    structural.warnings.forEach(function(w) { console.log("  WARN:  " + w); });
    if (verbose) {
      structural.info.forEach(function(i) { console.log("  INFO:  " + i); });
    }
    console.log("");
  }

  // Final summary
  var issueCount = report.summary.skillsWithIssues + report.summary.agentsWithIssues + report.summary.structuralIssues;
  var warnCount = report.summary.skillsWithWarnings + report.summary.agentsWithWarnings;
  if (issueCount === 0 && warnCount === 0) {
    console.log("RESULT: ALL CHECKS PASSED");
  } else {
    console.log("RESULT: " + issueCount + " items with errors, " + warnCount + " items with warnings");
  }
  console.log("");

  process.exit(hasErrors ? 1 : 0);
}

main();
