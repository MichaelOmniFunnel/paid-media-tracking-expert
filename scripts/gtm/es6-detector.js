// =============================================================
// GTM ES6+ Syntax Detector
// =============================================================
// Run this via mcp__claude-in-chrome__javascript_tool when
// viewing a Custom HTML tag in GTM. Scans the code editor for
// ES6+ syntax that can break in older browsers: const, let,
// arrow functions, template literals, destructuring, spread,
// Promise/async/await, optional chaining, nullish coalescing.
// Returns structured JSON with flagged instances and context.
// =============================================================
(function() {
  var result = {
    audit_type: "ES6+ Syntax Detection",
    timestamp: new Date().toISOString(),
    tag_name: null,
    es6_compatible: true,
    total_issues: 0,
    findings: [],
    summary: {}
  };

  // Try to get the tag name from the page
  var tagNameEl = document.querySelector("[class*='tag-name'], [class*='entity-name'], input[name*='name'], [class*='header'] [class*='title'], h2, h3");
  if (tagNameEl) {
    result.tag_name = (tagNameEl.value || tagNameEl.textContent || "").trim();
  }

  // Extract code from the code editor
  var codeContent = "";

  // Try CodeMirror instances
  var cmElements = document.querySelectorAll(".CodeMirror");
  for (var c = 0; c < cmElements.length; c++) {
    if (cmElements[c].CodeMirror) {
      codeContent += cmElements[c].CodeMirror.getValue() + "\n";
    }
  }

  // Try Monaco editor instances
  if (!codeContent) {
    var monacoEditors = document.querySelectorAll("[class*='monaco-editor'], [class*='editor-container']");
    for (var m = 0; m < monacoEditors.length; m++) {
      var lines = monacoEditors[m].querySelectorAll("[class*='view-line'], .line-content");
      for (var l = 0; l < lines.length; l++) {
        codeContent += lines[l].textContent + "\n";
      }
    }
  }

  // Try plain textareas or contenteditable areas
  if (!codeContent) {
    var textareas = document.querySelectorAll("textarea, [contenteditable='true']");
    for (var t = 0; t < textareas.length; t++) {
      var val = textareas[t].value || textareas[t].textContent || "";
      if (val.length > 20) {
        codeContent += val + "\n";
      }
    }
  }

  // Try visible code lines in the GTM editor
  if (!codeContent) {
    var codeLines = document.querySelectorAll("[class*='code'] [class*='line'], pre, code");
    for (var cl = 0; cl < codeLines.length; cl++) {
      codeContent += codeLines[cl].textContent + "\n";
    }
  }

  if (!codeContent || codeContent.trim().length === 0) {
    result.findings.push({
      type: "error",
      message: "Could not extract code content from the editor. Make sure you are viewing a Custom HTML tag with the code editor visible."
    });
    return JSON.stringify(result, null, 2);
  }

  var lines = codeContent.split("\n");
  var patterns = [
    { name: "const_declaration", regex: /\bconst\s+/,        severity: "high",   description: "const declaration (use var instead)" },
    { name: "let_declaration",   regex: /\blet\s+/,          severity: "high",   description: "let declaration (use var instead)" },
    { name: "arrow_function",    regex: /=>/ ,                severity: "high",   description: "Arrow function (use function() instead)" },
    { name: "template_literal",  regex: /`/,                  severity: "high",   description: "Template literal / backtick string" },
    { name: "destructuring",     regex: /(?:var|let|const)\s*[{\[]/,  severity: "medium", description: "Destructuring assignment" },
    { name: "spread_operator",   regex: /\.\.\.\w/,        severity: "medium", description: "Spread operator" },
    { name: "promise",           regex: /\bnew\s+Promise\b/, severity: "medium", description: "Promise constructor" },
    { name: "async_keyword",     regex: /\basync\s+function|\basync\s*\(/, severity: "high", description: "async function" },
    { name: "await_keyword",     regex: /\bawait\s+/,        severity: "high",   description: "await expression" },
    { name: "optional_chaining", regex: /\?\.\w/,           severity: "high",   description: "Optional chaining (?.)" },
    { name: "nullish_coalescing",regex: /\?\?/,              severity: "high",   description: "Nullish coalescing operator (??)" }
  ];

  var categoryCounts = {};

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // Skip HTML comment lines and empty lines
    if (line.trim().length === 0) { continue; }
    // Skip lines that are purely inside HTML comments or strings referencing these terms
    var isComment = /^\s*(\/\/|<!--|\*)/.test(line);

    for (var p = 0; p < patterns.length; p++) {
      var pattern = patterns[p];
      if (pattern.regex.test(line)) {
        result.findings.push({
          type: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          line_number: i + 1,
          line_content: line.trim().substring(0, 120),
          in_comment: isComment
        });
        if (!categoryCounts[pattern.name]) {
          categoryCounts[pattern.name] = 0;
        }
        categoryCounts[pattern.name]++;
      }
    }
  }

  result.total_issues = result.findings.length;
  result.es6_compatible = result.total_issues === 0;
  result.summary = categoryCounts;

  if (result.es6_compatible) {
    result.findings.push({
      type: "info",
      message: "No ES6+ syntax detected. Code appears ES5-compatible."
    });
  }

  return JSON.stringify(result, null, 2);
})();