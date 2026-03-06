// =============================================================
// GTM Consent Trigger Configuration Checker
// =============================================================
// Run this via mcp__claude-in-chrome__javascript_tool when
// viewing the GTM triggers list or a specific trigger.
// Checks for consent-based trigger conditions, All Pages
// triggers without consent gating, initialization triggers,
// and references to consent/cookie/GDPR in trigger names.
// Returns an analysis of consent-based triggering setup.
// =============================================================
(function() {
  var result = {
    audit_type: "Consent Trigger Check",
    timestamp: new Date().toISOString(),
    consent_setup: {
      has_consent_triggers: false,
      has_initialization_trigger: false,
      has_consent_default_command: false,
      all_pages_triggers_without_consent: [],
      consent_related_triggers: [],
      potential_issues: []
    },
    triggers_analyzed: [],
    recommendations: []
  };

  var consentKeywords = ["consent", "cookie", "gdpr", "ccpa", "privacy", "opt-in", "opt-out", "optin", "optout", "cmp", "tcf", "cookiebot", "onetrust", "usercentrics", "klaro", "complianz"];

  // Extract all visible trigger information from the page
  var triggerRows = document.querySelectorAll("table tbody tr, [class*='entity-list'] [class*='row'], [class*='trigger-list'] [class*='item'], .list-item, [role='row']");
  var allPagesTriggers = [];
  var consentTriggers = [];
  var initTriggers = [];
  var allTriggers = [];

  var i, j;
  for (i = 0; i < triggerRows.length; i++) {
    var row = triggerRows[i];
    var rowText = row.textContent.trim();
    var rowLower = rowText.toLowerCase();

    if (rowText.length === 0 || rowText.length > 500) { continue; }

    var cells = row.querySelectorAll("td, [class*='cell'], [class*='col']");
    var triggerName = cells.length > 0 ? cells[0].textContent.trim() : rowText.substring(0, 100);
    var triggerType = cells.length > 1 ? cells[1].textContent.trim() : "";

    var triggerInfo = {
      name: triggerName,
      type: triggerType,
      is_consent_related: false,
      is_all_pages: false,
      is_initialization: false
    };

    // Check if this trigger references consent
    for (j = 0; j < consentKeywords.length; j++) {
      if (rowLower.indexOf(consentKeywords[j]) !== -1) {
        triggerInfo.is_consent_related = true;
        consentTriggers.push(triggerName);
        break;
      }
    }

    // Check for All Pages triggers
    if (rowLower.indexOf("all pages") !== -1 || rowLower.indexOf("page view") !== -1 || rowLower.indexOf("pageview") !== -1) {
      triggerInfo.is_all_pages = true;
      if (!triggerInfo.is_consent_related) {
        allPagesTriggers.push(triggerName);
      }
    }

    // Check for Initialization triggers
    if (rowLower.indexOf("initialization") !== -1 || rowLower.indexOf("consent init") !== -1 || rowLower.indexOf("init -") !== -1) {
      triggerInfo.is_initialization = true;
      initTriggers.push(triggerName);
    }

    allTriggers.push(triggerInfo);
  }

  result.triggers_analyzed = allTriggers;

  // Also check the full page text for consent-related content
  var pageText = document.body ? document.body.textContent.toLowerCase() : "";

  // Check for consent default/update commands
  if (pageText.indexOf("consent") !== -1 && (pageText.indexOf("default") !== -1 || pageText.indexOf("update") !== -1)) {
    result.consent_setup.has_consent_default_command = true;
  }

  // Check for consent mode references
  if (pageText.indexOf("granted") !== -1 || pageText.indexOf("denied") !== -1) {
    if (pageText.indexOf("ad_storage") !== -1 || pageText.indexOf("analytics_storage") !== -1 || pageText.indexOf("ad_user_data") !== -1 || pageText.indexOf("ad_personalization") !== -1) {
      result.consent_setup.has_consent_default_command = true;
    }
  }

  // Populate results
  result.consent_setup.has_consent_triggers = consentTriggers.length > 0;
  result.consent_setup.has_initialization_trigger = initTriggers.length > 0;
  result.consent_setup.consent_related_triggers = consentTriggers;
  result.consent_setup.all_pages_triggers_without_consent = allPagesTriggers;

  // Generate recommendations
  if (consentTriggers.length === 0) {
    result.consent_setup.potential_issues.push("No consent-related triggers detected. If serving EU/UK users, consent-based triggering is required.");
    result.recommendations.push("Add a Consent Initialization trigger to set default consent state (denied) before any tags fire.");
    result.recommendations.push("Implement Google Consent Mode v2 with ad_storage, analytics_storage, ad_user_data, and ad_personalization signals.");
  }

  if (initTriggers.length === 0 && consentTriggers.length > 0) {
    result.consent_setup.potential_issues.push("Consent triggers exist but no Initialization trigger found for setting consent defaults.");
    result.recommendations.push("Add an Initialization trigger type to ensure consent defaults are set before any other tags fire.");
  }

  if (allPagesTriggers.length > 0) {
    result.consent_setup.potential_issues.push(allPagesTriggers.length + " All Pages / Page View trigger(s) found without apparent consent conditions. These may fire tags before consent is granted.");
    result.recommendations.push("Review All Pages triggers to ensure they have consent conditions or are used only with consent-aware tags.");
  }

  if (consentTriggers.length > 0 && initTriggers.length > 0 && allPagesTriggers.length === 0) {
    result.recommendations.push("Consent setup appears properly configured. Verify that consent default command runs on the Initialization trigger.");
  }

  return JSON.stringify(result, null, 2);
})();