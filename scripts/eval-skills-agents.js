#!/usr/bin/env node
/**
 * Skill & Agent Evaluation Framework
 * Validates frontmatter, naming, descriptions, cross-references, and structure
 * for all skills and agents in the project.
 *
 * Usage: node scripts/eval-skills-agents.js [--json] [--verbose]
 */

var fs = require("fs");
var path = require("path");

var projectRoot = path.resolve(__dirname, "..");
var skillsDir = path.join(projectRoot, ".claude", "skills");
var agentsDir = path.join(projectRoot, ".claude", "agents");

var args = process.argv.slice(2);
var outputJson = args.indexOf("--json") !== -1;
var verbose = args.indexOf("--verbose") !== -1;

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
    // List item (indented with -)
    if (/^\s+-\s+/.test(line) && currentKey) {
      listItems.push(line.replace(/^\s+-\s+/, "").trim());
      fm[currentKey] = listItems;
      continue;
    }
    // Key: value
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
  return fm;
}

// --- Collect skills ---
function getSkills() {
  var results = [];
  if (!fs.existsSync(skillsDir)) return results;
  var dirs = fs.readdirSync(skillsDir);
  dirs.forEach(function(d) {
    var skillFile = path.join(skillsDir, d, "SKILL.md");
    if (!fs.existsSync(skillFile)) return;
    var content = fs.readFileSync(skillFile, "utf8");
    var fm = parseFrontmatter(content);
    results.push({
      dirName: d,
      filePath: skillFile,
      frontmatter: fm,
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
  var files = fs.readdirSync(agentsDir).filter(function(f) { return f.endsWith(".md"); });
  files.forEach(function(f) {
    var agentFile = path.join(agentsDir, f);
    var content = fs.readFileSync(agentFile, "utf8");
    var fm = parseFrontmatter(content);
    results.push({
      fileName: f,
      baseName: f.replace(".md", ""),
      filePath: agentFile,
      frontmatter: fm,
      contentLength: content.length,
      lineCount: content.split("\n").length
    });
  });
  return results;
}

// --- Validation checks ---
function validateSkill(skill) {
  var issues = [];
  var warnings = [];
  var fm = skill.frontmatter;

  if (!fm) {
    issues.push("CRITICAL: No valid YAML frontmatter found");
    return { issues: issues, warnings: warnings, type: "unknown" };
  }

  // Name checks
  if (!fm.name) {
    issues.push("Missing required field: name");
  } else if (fm.name !== skill.dirName) {
    issues.push("Name mismatch: frontmatter name \"" + fm.name + "\" != directory \"" + skill.dirName + "\"");
  }

  // Description checks
  if (!fm.description) {
    issues.push("Missing required field: description");
  } else {
    if (fm.description.length < 50) {
      issues.push("Description too short (" + fm.description.length + " chars, minimum 50)");
    }
    var hasTrigger = /use when|use whenever|use this|trigger/i.test(fm.description);
    if (!hasTrigger) {
      warnings.push("Description lacks trigger phrases (should contain \"Use when...\")");
    }
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
  }

  // Reference skill checks
  if (!isWorkflow && !fm.context) {
    if (!fm.model && !fm["disable-model-invocation"]) {
      warnings.push("Reference skill has no model field or disable-model-invocation (will use default expensive model for lookups)");
    }
  }

  // Content depth check
  if (fm._bodyLineCount < 20) {
    warnings.push("Skill body very short (" + fm._bodyLineCount + " lines). May lack useful content.");
  }

  return { issues: issues, warnings: warnings, type: type };
}

function validateAgent(agent, allSkillDirNames) {
  var issues = [];
  var warnings = [];
  var fm = agent.frontmatter;

  if (!fm) {
    issues.push("CRITICAL: No valid YAML frontmatter found");
    return { issues: issues, warnings: warnings };
  }

  // Name checks
  if (!fm.name) {
    issues.push("Missing required field: name");
  } else if (fm.name !== agent.baseName) {
    issues.push("Name mismatch: frontmatter name \"" + fm.name + "\" != filename \"" + agent.baseName + "\"");
  }

  // Required fields
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

  if (!fm.tools) {
    issues.push("Missing required field: tools");
  }

  // Recommended fields
  if (!fm.maxTurns) {
    warnings.push("Missing recommended field: maxTurns");
  } else {
    var turns = parseInt(fm.maxTurns, 10);
    if (turns < 10) warnings.push("maxTurns unusually low (" + turns + ")");
    if (turns > 100) warnings.push("maxTurns unusually high (" + turns + ")");
  }

  if (!fm.memory) {
    warnings.push("Missing recommended field: memory");
  }

  // Skills preloading validation
  if (fm.skills && Array.isArray(fm.skills)) {
    fm.skills.forEach(function(s) {
      if (allSkillDirNames.indexOf(s) === -1) {
        issues.push("Preloaded skill \"" + s + "\" does not exist in .claude/skills/");
      }
    });
  } else if (!fm.skills) {
    warnings.push("No skills preloading configured");
  }

  // Content depth
  if (agent.lineCount < 30) {
    warnings.push("Agent file is short (" + agent.lineCount + " lines). May lack sufficient methodology.");
  }

  return { issues: issues, warnings: warnings };
}

// --- Cross-reference checks ---
function crossReferenceChecks(skills, agents) {
  var issues = [];
  var skillNames = skills.map(function(s) { return s.dirName; });

  // Check for duplicate skill names
  var seen = {};
  skillNames.forEach(function(n) {
    if (seen[n]) issues.push("Duplicate skill directory: " + n);
    seen[n] = true;
  });

  // Check for duplicate agent names
  var agentSeen = {};
  agents.forEach(function(a) {
    if (agentSeen[a.baseName]) issues.push("Duplicate agent file: " + a.baseName);
    agentSeen[a.baseName] = true;
  });

  return issues;
}

// --- Main ---
function main() {
  var skills = getSkills();
  var agents = getAgents();
  var skillDirNames = skills.map(function(s) { return s.dirName; });

  var report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSkills: skills.length,
      totalAgents: agents.length,
      skillsPassing: 0,
      skillsWithIssues: 0,
      skillsWithWarnings: 0,
      agentsPassing: 0,
      agentsWithIssues: 0,
      agentsWithWarnings: 0,
      crossRefIssues: 0,
      overallScore: 0
    },
    skillTypes: { workflow: 0, reference: 0, unknown: 0 },
    skills: [],
    agents: [],
    crossReferences: []
  };

  // Validate skills
  skills.forEach(function(skill) {
    var result = validateSkill(skill);
    var entry = {
      name: skill.dirName,
      type: result.type,
      lines: skill.lineCount,
      issues: result.issues,
      warnings: result.warnings,
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
      status: result.issues.length === 0 ? (result.warnings.length === 0 ? "PASS" : "WARN") : "FAIL"
    };
    report.agents.push(entry);
    if (entry.status === "PASS") report.summary.agentsPassing++;
    if (result.issues.length > 0) report.summary.agentsWithIssues++;
    if (result.warnings.length > 0) report.summary.agentsWithWarnings++;
  });

  // Cross-reference checks
  report.crossReferences = crossReferenceChecks(skills, agents);
  report.summary.crossRefIssues = report.crossReferences.length;

  // Calculate overall score
  var totalItems = report.summary.totalSkills + report.summary.totalAgents;
  var passingItems = report.summary.skillsPassing + report.summary.agentsPassing;
  report.summary.overallScore = totalItems > 0 ? Math.round((passingItems / totalItems) * 100) : 0;

  // Output
  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Human-readable output
  console.log("");
  console.log("=== SKILL & AGENT EVALUATION REPORT ===");
  console.log("Generated: " + report.timestamp);
  console.log("");

  console.log("SUMMARY");
  console.log("  Skills:  " + report.summary.totalSkills + " total (" + report.skillTypes.workflow + " workflow, " + report.skillTypes.reference + " reference + " + (report.skillTypes.unknown || 0) + " unknown)");
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
  });
  console.log("");

  // Cross-reference issues
  if (report.crossReferences.length > 0) {
    console.log("CROSS-REFERENCE ISSUES");
    report.crossReferences.forEach(function(i) { console.log("  ERROR: " + i); });
    console.log("");
  }

  // Final summary
  var issueCount = report.summary.skillsWithIssues + report.summary.agentsWithIssues + report.summary.crossRefIssues;
  var warnCount = report.summary.skillsWithWarnings + report.summary.agentsWithWarnings;
  if (issueCount === 0 && warnCount === 0) {
    console.log("RESULT: ALL CHECKS PASSED");
  } else {
    console.log("RESULT: " + issueCount + " items with errors, " + warnCount + " items with warnings");
  }
  console.log("");
}

main();
