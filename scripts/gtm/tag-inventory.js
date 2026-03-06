// =============================================================
// GTM Tag Inventory Script
// =============================================================
// Run this via mcp__claude-in-chrome__javascript_tool when on
// the GTM Tags overview page. Extracts a complete inventory of
// all visible tags: names, types, firing triggers, status.
// Groups tags by platform (Google, Meta, TikTok, Analytics,
// Other). Returns structured JSON inventory.
// =============================================================
(function() {
  var result = {
    audit_type: "GTM Tag Inventory",
    timestamp: new Date().toISOString(),
    total_tags: 0,
    tags: [],
    by_platform: {
      google: [],
      meta: [],
      tiktok: [],
      analytics: [],
      advertising: [],
      other: []
    },
    platform_counts: {},
    status_summary: {
      active: 0,
      paused: 0
    }
  };

  // Platform classification rules
  var platformRules = [
    { platform: "google",      keywords: ["google ads", "google tag", "gtag", "google marketing", "google conversion", "google remarketing", "adwords", "floodlight", "campaign manager", "display & video", "dv360", "sa360", "search ads"] },
    { platform: "meta",        keywords: ["meta", "facebook", "fb pixel", "fb event", "instagram", "meta pixel", "facebook pixel", "conversions api", "capi"] },
    { platform: "tiktok",      keywords: ["tiktok", "tik tok", "tt pixel", "tiktok pixel"] },
    { platform: "analytics",   keywords: ["google analytics", "ga4", "universal analytics", "gtag - ga", "analytics -", "measurement id", "ga - ", "hotjar", "clarity", "heap", "mixpanel", "segment", "amplitude", "fullstory", "lucky orange"] },
    { platform: "advertising", keywords: ["linkedin", "pinterest", "twitter", "x pixel", "snapchat", "bing", "microsoft ads", "reddit", "quora", "criteo", "taboola", "outbrain", "the trade desk", "amazon ads"] }
  ];

  function classifyPlatform(tagName, tagType) {
    var combined = (tagName + " " + tagType).toLowerCase();
    for (var r = 0; r < platformRules.length; r++) {
      var rule = platformRules[r];
      for (var k = 0; k < rule.keywords.length; k++) {
        if (combined.indexOf(rule.keywords[k]) !== -1) {
          return rule.platform;
        }
      }
    }
    return "other";
  }

  // Extract tag rows from the visible table/list
  var tagRows = document.querySelectorAll("table tbody tr, [class*='entity-list'] [class*='row'], [class*='tag-list'] [class*='item'], .list-item, [role='row']");

  var i;
  for (i = 0; i < tagRows.length; i++) {
    var row = tagRows[i];
    var rowText = row.textContent.trim();
    if (rowText.length === 0 || rowText.length > 500) { continue; }

    var cells = row.querySelectorAll("td, [class*='cell'], [class*='col']");
    var tagName = "";
    var tagType = "";
    var firingTrigger = "";
    var tagStatus = "active";

    if (cells.length >= 1) {
      tagName = cells[0].textContent.trim();
    }
    if (cells.length >= 2) {
      tagType = cells[1].textContent.trim();
    }
    if (cells.length >= 3) {
      firingTrigger = cells[2].textContent.trim();
    }

    // Detect paused status
    var statusIcons = row.querySelectorAll("[class*='pause'], [class*='disabled'], [class*='inactive'], [aria-label*='pause'], [title*='pause']");
    if (statusIcons.length > 0) {
      tagStatus = "paused";
    }
    var rowLower = rowText.toLowerCase();
    if (rowLower.indexOf("paused") !== -1) {
      tagStatus = "paused";
    }

    // Skip header rows or very short entries
    if (tagName.length < 2) { continue; }

    // Determine tag type from known GTM type labels if not in a cell
    if (!tagType) {
      var typeIndicators = [
        { match: "custom html", label: "Custom HTML" },
        { match: "custom image", label: "Custom Image" },
        { match: "google ads", label: "Google Ads" },
        { match: "google analytics", label: "Google Analytics" },
        { match: "ga4", label: "GA4 Event" },
        { match: "conversion linker", label: "Conversion Linker" }
      ];
      for (var t = 0; t < typeIndicators.length; t++) {
        if (rowLower.indexOf(typeIndicators[t].match) !== -1) {
          tagType = typeIndicators[t].label;
          break;
        }
      }
    }

    var platform = classifyPlatform(tagName, tagType);

    var tagEntry = {
      name: tagName,
      type: tagType || "unknown",
      firing_trigger: firingTrigger || "not visible",
      status: tagStatus,
      platform: platform
    };

    result.tags.push(tagEntry);
    result.by_platform[platform].push(tagEntry.name);

    if (tagStatus === "paused") {
      result.status_summary.paused++;
    } else {
      result.status_summary.active++;
    }
  }

  result.total_tags = result.tags.length;

  // Build platform counts
  var platformKeys = ["google", "meta", "tiktok", "analytics", "advertising", "other"];
  for (i = 0; i < platformKeys.length; i++) {
    var key = platformKeys[i];
    result.platform_counts[key] = result.by_platform[key].length;
  }

  if (result.total_tags === 0) {
    result.tags.push({
      name: "No tags found",
      type: "info",
      firing_trigger: "N/A",
      status: "N/A",
      platform: "N/A",
      note: "Make sure you are on the GTM Tags overview page with tags visible in the list."
    });
  }

  return JSON.stringify(result, null, 2);
})();