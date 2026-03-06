/**
 * check-consent-mode.js
 * Audits Google Consent Mode v2 implementation on the current page.
 * Checks dataLayer for consent default/update commands, v2 parameters,
 * and detects popular consent banner tools.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    consent_mode: {
      detected: false,
      version: null,
      default_command: null,
      update_commands: [],
      parameters_found: [],
      v2_params_present: false,
      missing_v2_params: []
    },
    consent_banner: {
      detected: false,
      tool: null,
      tools_found: []
    },
    warnings: [],
    recommendations: []
  };

  var html = document.documentElement.outerHTML || "";
  var scripts = document.querySelectorAll("script");
  var allText = html;
  for (var i = 0; i < scripts.length; i++) {
    allText += " " + (scripts[i].textContent || "");
  }

  // Consent banner tool detection
  var bannerTools = [
    { name: "Cookiebot", patterns: ["cookiebot.com", "CookieConsent", "Cookiebot"] },
    { name: "OneTrust", patterns: ["onetrust.com", "OneTrust", "optanon", "OptanonConsent"] },
    { name: "CookieYes", patterns: ["cookieyes.com", "CookieYes", "cky-consent"] },
    { name: "Termly", patterns: ["termly.io", "termly"] },
    { name: "Iubenda", patterns: ["iubenda.com", "iubenda"] },
    { name: "Quantcast", patterns: ["quantcast.com", "quantcast", "__cmpapi"] },
    { name: "TrustArc", patterns: ["trustarc.com", "TrustArc", "truste.com"] },
    { name: "Osano", patterns: ["osano.com", "Osano"] },
    { name: "Complianz", patterns: ["complianz", "cmplz"] }
  ];

  for (var b = 0; b < bannerTools.length; b++) {
    var tool = bannerTools[b];
    var toolFound = false;
    for (var p = 0; p < tool.patterns.length; p++) {
      if (allText.indexOf(tool.patterns[p]) !== -1) {
        toolFound = true;
        break;
      }
    }
    if (toolFound) {
      result.consent_banner.detected = true;
      result.consent_banner.tools_found.push(tool.name);
      if (!result.consent_banner.tool) {
        result.consent_banner.tool = tool.name;
      }
    }
  }

  // Check dataLayer for consent commands
  var v2Params = ["ad_user_data", "ad_personalization"];
  var allConsentParams = ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization", "functionality_storage", "personalization_storage", "security_storage"];

  if (typeof window.dataLayer !== "undefined" && window.dataLayer) {
    for (var d = 0; d < window.dataLayer.length; d++) {
      var entry = window.dataLayer[d];

      // Check array-style consent commands: ['consent', 'default', {...}]
      if (Array.isArray(entry) && entry[0] === "consent") {
        result.consent_mode.detected = true;
        var consentAction = entry[1];
        var consentParams = entry[2] || {};

        if (consentAction === "default") {
          result.consent_mode.default_command = {};
          try {
            result.consent_mode.default_command = JSON.parse(JSON.stringify(consentParams));
          } catch (e) {
            result.consent_mode.default_command = { _error: "Could not serialize" };
          }
        }

        if (consentAction === "update") {
          var updateCopy = {};
          try {
            updateCopy = JSON.parse(JSON.stringify(consentParams));
          } catch (e) {
            updateCopy = { _error: "Could not serialize" };
          }
          result.consent_mode.update_commands.push(updateCopy);
        }

        // Check which consent params are present
        for (var cp = 0; cp < allConsentParams.length; cp++) {
          if (consentParams[allConsentParams[cp]] !== undefined) {
            if (result.consent_mode.parameters_found.indexOf(allConsentParams[cp]) === -1) {
              result.consent_mode.parameters_found.push(allConsentParams[cp]);
            }
          }
        }
      }

      // Check object-style with event
      if (entry.event && entry.event === "consent_update") {
        result.consent_mode.detected = true;
      }
    }
  }

  // Also check for gtag consent calls in script text
  if (!result.consent_mode.detected) {
    var consentDefaultPattern = /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]default['"]/;
    if (consentDefaultPattern.test(allText)) {
      result.consent_mode.detected = true;
    }
  }
  if (!result.consent_mode.detected) {
    var consentSetPattern = /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]update['"]/;
    if (consentSetPattern.test(allText)) {
      result.consent_mode.detected = true;
    }
  }

  // Also scan script text for consent params if dataLayer didn't have them
  for (var sp = 0; sp < allConsentParams.length; sp++) {
    if (allText.indexOf(allConsentParams[sp]) !== -1) {
      if (result.consent_mode.parameters_found.indexOf(allConsentParams[sp]) === -1) {
        result.consent_mode.parameters_found.push(allConsentParams[sp]);
      }
    }
  }

  // Determine version
  if (result.consent_mode.detected) {
    var hasV2 = false;
    for (var v = 0; v < v2Params.length; v++) {
      if (result.consent_mode.parameters_found.indexOf(v2Params[v]) !== -1) {
        hasV2 = true;
      } else {
        result.consent_mode.missing_v2_params.push(v2Params[v]);
      }
    }

    if (hasV2 && result.consent_mode.missing_v2_params.length === 0) {
      result.consent_mode.version = "v2";
      result.consent_mode.v2_params_present = true;
    } else if (hasV2) {
      result.consent_mode.version = "v2_partial";
      result.consent_mode.v2_params_present = true;
      result.warnings.push("Consent Mode v2 partially implemented - missing: " + result.consent_mode.missing_v2_params.join(", "));
    } else {
      result.consent_mode.version = "v1";
      result.consent_mode.missing_v2_params = v2Params.slice();
      result.warnings.push("Consent Mode v1 detected - missing v2 parameters: " + v2Params.join(", ") + ". Google requires v2 for EU ad personalization signals.");
    }

    if (!result.consent_mode.default_command && allText.indexOf("consent") !== -1) {
      result.warnings.push("No consent 'default' command found in dataLayer - consent mode should set defaults before GTM loads");
    }
  }

  // Warnings and recommendations
  if (!result.consent_mode.detected) {
    result.warnings.push("No Google Consent Mode detected - required for EU compliance and optimal Google Ads performance");
    result.recommendations.push("Implement Google Consent Mode v2 with default denied state for EU users");
  }

  if (result.consent_banner.detected && !result.consent_mode.detected) {
    result.warnings.push("Consent banner (" + result.consent_banner.tools_found.join(", ") + ") detected but no Consent Mode integration found - banner may not be communicating consent state to Google tags");
    result.recommendations.push("Integrate " + result.consent_banner.tool + " with Google Consent Mode v2");
  }

  if (!result.consent_banner.detected) {
    result.recommendations.push("No consent banner detected - consider implementing one for GDPR/privacy compliance");
  }

  if (result.consent_mode.detected && result.consent_mode.version === "v1") {
    result.recommendations.push("Upgrade from Consent Mode v1 to v2 by adding ad_user_data and ad_personalization parameters");
  }

  return JSON.stringify(result, null, 2);
})();
