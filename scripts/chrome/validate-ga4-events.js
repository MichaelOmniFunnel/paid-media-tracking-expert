/**
 * validate-ga4-events.js
 * Captures all GA4 events firing on the page, validates their structure
 * against GA4 ecommerce event specifications, checks for required parameters
 * (currency, value, items array for ecommerce), identifies custom events vs
 * recommended events, checks for user_id passthrough, validates enhanced
 * measurement configuration, and compares GA4 events to platform conversion
 * events (Meta, Google Ads, TikTok).
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    ga4: {
      measurement_ids: [],
      gtag_detected: false,
      dataLayer_events: [],
      gtag_events: [],
      network_events: []
    },
    event_validation: {
      total_events: 0,
      recommended_events: [],
      custom_events: [],
      ecommerce_events: [],
      ecommerce_issues: []
    },
    user_id: {
      detected: false,
      user_id_set: false,
      user_properties_found: []
    },
    enhanced_measurement: {
      detected: false,
      signals: []
    },
    cross_platform: {
      meta_events: [],
      google_ads_events: [],
      tiktok_events: [],
      missing_platform_coverage: []
    },
    warnings: [],
    recommendations: []
  };

  // GA4 recommended event names per Google documentation
  var recommendedEvents = [
    "add_payment_info", "add_shipping_info", "add_to_cart", "add_to_wishlist",
    "begin_checkout", "earn_virtual_currency", "generate_lead", "join_group",
    "level_end", "level_start", "level_up", "login", "page_view", "post_score",
    "purchase", "refund", "remove_from_cart", "search", "select_content",
    "select_item", "select_promotion", "share", "sign_up", "spend_virtual_currency",
    "tutorial_begin", "tutorial_complete", "unlock_achievement", "view_cart",
    "view_item", "view_item_list", "view_promotion", "view_search_results",
    "first_visit", "session_start", "user_engagement", "scroll",
    "click", "file_download", "form_start", "form_submit", "video_start",
    "video_progress", "video_complete"
  ];

  // Ecommerce events and their required parameters
  var ecommerceEventReqs = {
    "add_to_cart":       { required: ["currency", "value", "items"], recommended: [] },
    "remove_from_cart":  { required: ["currency", "value", "items"], recommended: [] },
    "view_item":         { required: ["currency", "value", "items"], recommended: [] },
    "view_item_list":    { required: ["items"], recommended: ["item_list_id", "item_list_name"] },
    "select_item":       { required: ["items"], recommended: ["item_list_id", "item_list_name"] },
    "view_cart":         { required: ["currency", "value", "items"], recommended: [] },
    "begin_checkout":    { required: ["currency", "value", "items"], recommended: ["coupon"] },
    "add_shipping_info": { required: ["currency", "value", "items"], recommended: ["shipping_tier"] },
    "add_payment_info":  { required: ["currency", "value", "items"], recommended: ["payment_type"] },
    "purchase":          { required: ["currency", "value", "transaction_id", "items"], recommended: ["tax", "shipping", "coupon"] },
    "refund":            { required: ["currency", "value", "transaction_id"], recommended: ["items"] },
    "view_promotion":    { required: ["items"], recommended: [] },
    "select_promotion":  { required: ["items"], recommended: ["promotion_id", "promotion_name"] }
  };

  // Required item-level parameters for ecommerce items
  var requiredItemParams = ["item_id", "item_name"];

  // Enhanced measurement event names (auto-tracked by GA4)
  var enhancedMeasurementEvents = ["page_view", "scroll", "click", "view_search_results", "video_start", "video_progress", "video_complete", "file_download", "form_start", "form_submit"];

  // ---- Detect GA4 measurement IDs ----
  var html = document.documentElement.outerHTML || "";
  var scripts = document.querySelectorAll("script");
  var allText = html;
  for (var si = 0; si < scripts.length; si++) {
    allText += " " + (scripts[si].textContent || "");
  }

  var ga4Pattern = /G-[A-Z0-9]{6,12}/g;
  var ga4Matches = allText.match(ga4Pattern);
  if (ga4Matches) {
    var seen = {};
    for (var gi = 0; gi < ga4Matches.length; gi++) {
      if (!seen[ga4Matches[gi]]) {
        seen[ga4Matches[gi]] = true;
        result.ga4.measurement_ids.push(ga4Matches[gi]);
      }
    }
  }

  // Detect gtag.js
  for (var ss = 0; ss < scripts.length; ss++) {
    var src = scripts[ss].getAttribute("src") || "";
    if (src.indexOf("gtag/js") !== -1 || src.indexOf("googletagmanager.com/gtag") !== -1) {
      result.ga4.gtag_detected = true;
      break;
    }
  }
  if (!result.ga4.gtag_detected && allText.indexOf("gtag(") !== -1) {
    result.ga4.gtag_detected = true;
  }

  if (result.ga4.measurement_ids.length === 0) {
    result.warnings.push("No GA4 measurement ID (G-XXXXXXX) found on this page");
  }

  // ---- Extract events from dataLayer ----
  var allEventNames = [];
  var allEventData = [];

  if (typeof window.dataLayer !== "undefined" && window.dataLayer) {
    for (var di = 0; di < window.dataLayer.length; di++) {
      var entry = window.dataLayer[di];
      if (!entry || !entry.event) { continue; }

      // Skip internal GTM events
      if (entry.event.indexOf("gtm.") === 0) { continue; }

      var eventRecord = {
        event_name: entry.event,
        source: "dataLayer",
        parameters: {}
      };

      // Capture all top-level parameters (excluding event itself)
      var entryKeys = Object.keys(entry);
      for (var ek = 0; ek < entryKeys.length; ek++) {
        if (entryKeys[ek] !== "event" && entryKeys[ek] !== "gtm.uniqueEventId") {
          try {
            eventRecord.parameters[entryKeys[ek]] = JSON.parse(JSON.stringify(entry[entryKeys[ek]]));
          } catch (e) {
            eventRecord.parameters[entryKeys[ek]] = "[unable to serialize]";
          }
        }
      }

      // Merge ecommerce object parameters to top level for validation
      if (entry.ecommerce) {
        var ecomKeys = Object.keys(entry.ecommerce);
        for (var ec = 0; ec < ecomKeys.length; ec++) {
          try {
            eventRecord.parameters[ecomKeys[ec]] = JSON.parse(JSON.stringify(entry.ecommerce[ecomKeys[ec]]));
          } catch (e) {
            eventRecord.parameters[ecomKeys[ec]] = "[unable to serialize]";
          }
        }
      }

      result.ga4.dataLayer_events.push(eventRecord);
      if (allEventNames.indexOf(entry.event) === -1) {
        allEventNames.push(entry.event);
        allEventData.push(eventRecord);
      }
    }
  }

  // ---- Extract gtag() calls from script text ----
  var gtagEventPattern = /gtag\s*\(\s*['"]event['"]\s*,\s*['"]([^'"]+)['"]/g;
  var gtagMatch;
  while ((gtagMatch = gtagEventPattern.exec(allText)) !== null) {
    var gtagEvtName = gtagMatch[1];
    if (allEventNames.indexOf(gtagEvtName) === -1) {
      allEventNames.push(gtagEvtName);
    }
    result.ga4.gtag_events.push(gtagEvtName);
  }

  // ---- Scan network requests for GA4 collect calls ----
  if (window.performance && window.performance.getEntriesByType) {
    var resources = window.performance.getEntriesByType("resource");
    for (var ri = 0; ri < resources.length; ri++) {
      var resName = resources[ri].name || "";
      if (resName.indexOf("google-analytics.com/g/collect") !== -1 ||
          resName.indexOf("analytics.google.com/g/collect") !== -1 ||
          (resName.indexOf("/g/collect") !== -1 && resName.indexOf("en=") !== -1)) {
        var networkEvt = { url: resName.substring(0, 300) };

        // Parse event name from URL
        var enMatch = resName.match(/[?&]en=([^&]+)/);
        if (enMatch) {
          networkEvt.event_name = decodeURIComponent(enMatch[1]);
          if (allEventNames.indexOf(networkEvt.event_name) === -1) {
            allEventNames.push(networkEvt.event_name);
          }
        }

        // Parse measurement ID
        var tidMatch = resName.match(/[?&]tid=([^&]+)/);
        if (tidMatch) {
          networkEvt.measurement_id = decodeURIComponent(tidMatch[1]);
        }

        result.ga4.network_events.push(networkEvt);
      }
    }
  }

  // ---- Classify and validate all events ----
  result.event_validation.total_events = allEventNames.length;

  for (var ei = 0; ei < allEventNames.length; ei++) {
    var evtName = allEventNames[ei];
    var isRecommended = recommendedEvents.indexOf(evtName) !== -1;
    var isEcommerce = ecommerceEventReqs.hasOwnProperty(evtName);

    if (isRecommended) {
      result.event_validation.recommended_events.push(evtName);
    } else {
      result.event_validation.custom_events.push(evtName);
    }

    if (isEcommerce) {
      result.event_validation.ecommerce_events.push(evtName);

      // Find the event data to validate parameters
      var evtData = null;
      for (var ed = 0; ed < allEventData.length; ed++) {
        if (allEventData[ed].event_name === evtName) {
          evtData = allEventData[ed];
          break;
        }
      }

      if (evtData) {
        var reqs = ecommerceEventReqs[evtName];
        var params = evtData.parameters || {};

        // Check required parameters
        for (var rp = 0; rp < reqs.required.length; rp++) {
          var reqParam = reqs.required[rp];
          if (reqParam === "items") {
            if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
              result.event_validation.ecommerce_issues.push({
                event: evtName,
                severity: "critical",
                issue: "Missing or empty items array (required for ecommerce events)"
              });
            } else {
              // Validate item-level parameters
              for (var ii = 0; ii < params.items.length; ii++) {
                var item = params.items[ii];
                for (var rip = 0; rip < requiredItemParams.length; rip++) {
                  if (!item[requiredItemParams[rip]]) {
                    result.event_validation.ecommerce_issues.push({
                      event: evtName,
                      severity: "high",
                      issue: "Item " + ii + " missing required parameter: " + requiredItemParams[rip]
                    });
                  }
                }
                // Check for missing recommended item params
                if (!item.price && item.price !== 0) {
                  result.event_validation.ecommerce_issues.push({
                    event: evtName,
                    severity: "medium",
                    issue: "Item " + ii + " missing recommended parameter: price"
                  });
                }
                if (!item.quantity && item.quantity !== 0) {
                  result.event_validation.ecommerce_issues.push({
                    event: evtName,
                    severity: "medium",
                    issue: "Item " + ii + " missing recommended parameter: quantity"
                  });
                }
              }
            }
          } else if (params[reqParam] === undefined) {
            result.event_validation.ecommerce_issues.push({
              event: evtName,
              severity: "critical",
              issue: "Missing required parameter: " + reqParam
            });
          }
        }

        // Check currency format (should be 3-letter ISO 4217)
        if (params.currency) {
          if (typeof params.currency !== "string" || params.currency.length !== 3) {
            result.event_validation.ecommerce_issues.push({
              event: evtName,
              severity: "high",
              issue: "Currency value is not a valid 3-letter ISO 4217 code: " + params.currency
            });
          }
        }

        // Check value is numeric
        if (params.value !== undefined && typeof params.value !== "number") {
          result.event_validation.ecommerce_issues.push({
            event: evtName,
            severity: "high",
            issue: "Value parameter should be a number, found: " + typeof params.value
          });
        }

        // Check transaction_id for purchase/refund
        if ((evtName === "purchase" || evtName === "refund") && params.transaction_id) {
          if (typeof params.transaction_id !== "string" || params.transaction_id.trim() === "") {
            result.event_validation.ecommerce_issues.push({
              event: evtName,
              severity: "critical",
              issue: "transaction_id is empty or not a string"
            });
          }
        }
      } else {
        result.event_validation.ecommerce_issues.push({
          event: evtName,
          severity: "medium",
          issue: "Ecommerce event detected in gtag/network but no dataLayer push found for parameter validation"
        });
      }
    }
  }

  // ---- Check user_id passthrough ----
  if (typeof window.dataLayer !== "undefined" && window.dataLayer) {
    for (var ui = 0; ui < window.dataLayer.length; ui++) {
      var ue = window.dataLayer[ui];
      if (ue.user_id) {
        result.user_id.detected = true;
        result.user_id.user_id_set = true;
      }
      if (ue.user_properties) {
        result.user_id.detected = true;
        var upKeys = Object.keys(ue.user_properties);
        for (var uk = 0; uk < upKeys.length; uk++) {
          if (result.user_id.user_properties_found.indexOf(upKeys[uk]) === -1) {
            result.user_id.user_properties_found.push(upKeys[uk]);
          }
        }
      }
    }
  }

  // Check for gtag set user_id
  var userIdSetPattern = /gtag\s*\(\s*['"]set['"]\s*,\s*['"]user_id['"]/;
  if (userIdSetPattern.test(allText)) {
    result.user_id.detected = true;
    result.user_id.user_id_set = true;
  }

  var configUserIdPattern = /gtag\s*\(\s*['"]config['"][^)]*user_id/;
  if (configUserIdPattern.test(allText)) {
    result.user_id.detected = true;
    result.user_id.user_id_set = true;
  }

  if (!result.user_id.user_id_set) {
    result.recommendations.push("No user_id passthrough detected. Set user_id on gtag config or dataLayer for cross-device and cross-session stitching in GA4.");
  }

  // ---- Check enhanced measurement signals ----
  for (var emi = 0; emi < enhancedMeasurementEvents.length; emi++) {
    if (allEventNames.indexOf(enhancedMeasurementEvents[emi]) !== -1) {
      result.enhanced_measurement.detected = true;
      result.enhanced_measurement.signals.push(enhancedMeasurementEvents[emi]);
    }
  }

  // Check for enhanced measurement configuration in gtag config
  if (allText.indexOf("send_page_view") !== -1 || allText.indexOf("enhanced_measurement") !== -1) {
    result.enhanced_measurement.detected = true;
  }

  // ---- Cross-platform event comparison ----

  // Meta events: look for fbq() track calls
  var fbqTrackPattern = /fbq\s*\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/g;
  var fbqTrackMatch;
  var metaSeen = {};
  while ((fbqTrackMatch = fbqTrackPattern.exec(allText)) !== null) {
    if (!metaSeen[fbqTrackMatch[1]]) {
      metaSeen[fbqTrackMatch[1]] = true;
      result.cross_platform.meta_events.push(fbqTrackMatch[1]);
    }
  }
  // Also check trackCustom
  var fbqCustomPattern = /fbq\s*\(\s*['"]trackCustom['"]\s*,\s*['"]([^'"]+)['"]/g;
  var fbqCustomMatch;
  while ((fbqCustomMatch = fbqCustomPattern.exec(allText)) !== null) {
    if (!metaSeen[fbqCustomMatch[1]]) {
      metaSeen[fbqCustomMatch[1]] = true;
      result.cross_platform.meta_events.push(fbqCustomMatch[1] + " (custom)");
    }
  }

  // Google Ads conversion events
  var awConvPattern = /gtag\s*\(\s*['"]event['"]\s*,\s*['"]conversion['"]/g;
  if (awConvPattern.test(allText)) {
    result.cross_platform.google_ads_events.push("conversion");
  }
  var awSendToPattern = /send_to['"]?\s*:\s*['"](AW-[^'"\/]+\/[^'"]+)['"]/g;
  var awSendMatch;
  while ((awSendMatch = awSendToPattern.exec(allText)) !== null) {
    result.cross_platform.google_ads_events.push("conversion: " + awSendMatch[1]);
  }

  // TikTok events
  var ttqTrackPattern = /ttq\.track\s*\(\s*['"]([^'"]+)['"]/g;
  var ttqTrackMatch;
  var ttSeen = {};
  while ((ttqTrackMatch = ttqTrackPattern.exec(allText)) !== null) {
    if (!ttSeen[ttqTrackMatch[1]]) {
      ttSeen[ttqTrackMatch[1]] = true;
      result.cross_platform.tiktok_events.push(ttqTrackMatch[1]);
    }
  }

  // Cross-platform coverage analysis
  // Map GA4 ecommerce events to their platform equivalents
  var eventMapping = {
    "purchase": { meta: "Purchase", tiktok: "CompletePayment" },
    "add_to_cart": { meta: "AddToCart", tiktok: "AddToCart" },
    "begin_checkout": { meta: "InitiateCheckout", tiktok: "InitiateCheckout" },
    "view_item": { meta: "ViewContent", tiktok: "ViewContent" },
    "generate_lead": { meta: "Lead", tiktok: "SubmitForm" },
    "add_payment_info": { meta: "AddPaymentInfo", tiktok: "AddPaymentInfo" },
    "sign_up": { meta: "CompleteRegistration", tiktok: "CompleteRegistration" },
    "search": { meta: "Search", tiktok: "Search" }
  };

  var mappingKeys = Object.keys(eventMapping);
  for (var mk = 0; mk < mappingKeys.length; mk++) {
    var ga4Evt = mappingKeys[mk];
    var mapping = eventMapping[ga4Evt];
    if (allEventNames.indexOf(ga4Evt) !== -1) {
      // GA4 has this event, check if Meta and TikTok do too
      if (result.cross_platform.meta_events.length > 0 && result.cross_platform.meta_events.indexOf(mapping.meta) === -1) {
        result.cross_platform.missing_platform_coverage.push({
          ga4_event: ga4Evt,
          platform: "Meta",
          expected_event: mapping.meta,
          status: "GA4 fires this event but no corresponding Meta event detected"
        });
      }
      if (result.cross_platform.tiktok_events.length > 0 && result.cross_platform.tiktok_events.indexOf(mapping.tiktok) === -1) {
        result.cross_platform.missing_platform_coverage.push({
          ga4_event: ga4Evt,
          platform: "TikTok",
          expected_event: mapping.tiktok,
          status: "GA4 fires this event but no corresponding TikTok event detected"
        });
      }
    }
  }

  // ---- Summary warnings and recommendations ----
  if (result.event_validation.ecommerce_events.length > 0 && result.event_validation.ecommerce_issues.length > 0) {
    var critCount = 0;
    for (var ci = 0; ci < result.event_validation.ecommerce_issues.length; ci++) {
      if (result.event_validation.ecommerce_issues[ci].severity === "critical") {
        critCount++;
      }
    }
    if (critCount > 0) {
      result.warnings.push(critCount + " critical ecommerce validation issue(s) found. These will impact revenue and conversion reporting in GA4.");
    }
  }

  if (result.event_validation.custom_events.length > 0) {
    result.warnings.push(result.event_validation.custom_events.length + " custom event(s) detected: " + result.event_validation.custom_events.join(", ") + ". Verify these are intentional and not misspelled recommended event names.");
  }

  if (result.cross_platform.missing_platform_coverage.length > 0) {
    result.warnings.push(result.cross_platform.missing_platform_coverage.length + " cross-platform event gap(s) detected. GA4 events exist without matching platform conversion events.");
  }

  if (!result.enhanced_measurement.detected) {
    result.recommendations.push("No enhanced measurement signals detected. Verify enhanced measurement is enabled in GA4 property settings.");
  }

  if (result.ga4.measurement_ids.length > 1) {
    result.warnings.push("Multiple GA4 measurement IDs found: " + result.ga4.measurement_ids.join(", ") + ". Verify this is intentional and not causing duplicate data.");
  }

  if (result.event_validation.total_events === 0) {
    result.warnings.push("No GA4 events detected on this page. Either no events have fired yet or GA4 is not implemented.");
  }

  return JSON.stringify(result, null, 2);
})();
