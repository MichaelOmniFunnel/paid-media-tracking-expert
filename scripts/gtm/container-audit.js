// =============================================================
// GTM Container Audit Script
// =============================================================
// Run this via mcp__claude-in-chrome__javascript_tool when
// viewing a GTM container workspace page.
// Reads the visible DOM to extract container name, ID, and
// counts of tags, triggers, variables, and folders. Lists tag
// names/types and detects status indicators (paused, etc.).
// Returns a structured JSON overview.
// =============================================================
(function() {
  var result = {
    audit_type: "GTM Container Audit",
    timestamp: new Date().toISOString(),
    container: {
      name: null,
      id: null,
      workspace: null
    },
    counts: {
      tags: 0,
      triggers: 0,
      variables: 0,
      folders: 0
    },
    tags: [],
    issues: []
  };

  // Try to extract container name and ID from the page header or URL
  var url = window.location.href;
  var containerMatch = url.match(/accounts\/([^/]+)\/containers\/([^/]+)/);
  if (containerMatch) {
    result.container.id = containerMatch[2];
  }

  var workspaceMatch = url.match(/workspaces\/([^/?#]+)/);
  if (workspaceMatch) {
    result.container.workspace = workspaceMatch[1];
  }

  // Extract container name from the page title or header elements
  var titleEl = document.querySelector("[class*='container-name'], .gtm-header-title, header h1, [data-ng-bind*='container']");
  if (titleEl) {
    result.container.name = titleEl.textContent.trim();
  }
  if (!result.container.name) {
    var pageTitle = document.title || "";
    var titleParts = pageTitle.split("-");
    if (titleParts.length > 0) {
      result.container.name = titleParts[0].trim();
    }
  }

  // Count sidebar navigation items for tags, triggers, variables, folders
  var navItems = document.querySelectorAll("a[href], [role='listitem'], .gtm-sidebar-item, [class*='nav'] li");
  var i, text;
  for (i = 0; i < navItems.length; i++) {
    text = navItems[i].textContent.trim().toLowerCase();
    var countMatch = text.match(/(\d+)/);
    var count = countMatch ? parseInt(countMatch[1], 10) : 0;
    if (text.indexOf("tag") !== -1 && text.indexOf("trigger") === -1) {
      result.counts.tags = count || result.counts.tags;
    } else if (text.indexOf("trigger") !== -1) {
      result.counts.triggers = count || result.counts.triggers;
    } else if (text.indexOf("variable") !== -1) {
      result.counts.variables = count || result.counts.variables;
    } else if (text.indexOf("folder") !== -1) {
      result.counts.folders = count || result.counts.folders;
    }
  }

  // Extract tag information from visible list/table rows
  var tagRows = document.querySelectorAll("table tbody tr, [class*='entity-list'] [class*='row'], [class*='tag-list'] [class*='item'], .list-item, [role='row']");
  for (i = 0; i < tagRows.length; i++) {
    var row = tagRows[i];
    var cells = row.querySelectorAll("td, [class*='cell'], [class*='col']");
    var tagName = "";
    var tagType = "";
    var tagStatus = "active";

    // Attempt to read tag name from first meaningful cell
    if (cells.length > 0) {
      tagName = cells[0].textContent.trim();
    }
    if (cells.length > 1) {
      tagType = cells[1].textContent.trim();
    }

    // Detect paused or disabled status indicators
    var statusIcons = row.querySelectorAll("[class*='pause'], [class*='disabled'], [class*='inactive'], [aria-label*='pause'], [title*='pause']");
    if (statusIcons.length > 0) {
      tagStatus = "paused";
    }
    var rowText = row.textContent.toLowerCase();
    if (rowText.indexOf("paused") !== -1) {
      tagStatus = "paused";
    }

    if (tagName && tagName.length > 0 && tagName.length < 200) {
      result.tags.push({
        name: tagName,
        type: tagType || "unknown",
        status: tagStatus
      });
    }
  }

  // Update tag count from actual list if we found tags
  if (result.tags.length > 0 && result.counts.tags === 0) {
    result.counts.tags = result.tags.length;
  }

  // Detect common issues
  var pausedCount = 0;
  for (i = 0; i < result.tags.length; i++) {
    if (result.tags[i].status === "paused") {
      pausedCount++;
    }
  }
  if (pausedCount > 0) {
    result.issues.push(pausedCount + " tag(s) are currently paused");
  }

  return JSON.stringify(result, null, 2);
})();