/**
 * tag-firing-order.js
 * GTM tag firing sequence analyzer. Designed for use in the GTM
 * preview/debug panel context. Analyzes tag firing order to identify
 * dependency chains, race conditions, triggers that fire before
 * dataLayer is populated, tags that fire after page unload (potential
 * data loss), consent-gated tags and their firing sequence relative
 * to consent signals. Outputs a timeline with dependencies mapped.
 *
 * Run via mcp__claude-in-chrome__javascript_tool in the GTM
 * preview/debug panel or on a page with GTM debug mode active.
 */
(function() {
  var result = {
    audit_type: "GTM Tag Firing Order Analysis",
    timestamp: new Date().toISOString(),
    url: window.location.href,
    gtm_debug: {
      detected: false,
      preview_mode: false,
      container_id: null
    },
    timeline: [],
    dependency_analysis: {
      chains: [],
      potential_race_conditions: [],
      early_triggers: [],
      late_fires: []
    },
    consent_analysis: {
      consent_events_found: [],
      consent_gated_tags: [],
      tags_before_consent: [],
      tags_after_consent: [],
      consent_timing: null
    },
    dataLayer_readiness: {
      datalayer_populated_at: null,
      tags_before_datalayer: [],
      ecommerce_data_timing: null
    },
    tag_inventory: {
      total_tags: 0,
      fired: 0,
      not_fired: 0,
      by_type: {},
      by_trigger: {}
    },
    warnings: [],
    recommendations: []
  };

  // ---- Detect GTM debug/preview mode ----
  var debugPanelDetected = false;

  // Check URL for debug parameters
  if (window.location.search.indexOf("gtm_debug") !== -1 ||
      window.location.search.indexOf("gtm_preview") !== -1) {
    result.gtm_debug.preview_mode = true;
    result.gtm_debug.detected = true;
  }

  // Check for GTM debug panel elements
  var debugSelectors = [
    "#summary", // GTM debug summary panel
    "[class*='gtm-debug']",
    "[class*='tag-assistant']",
    "[id*='gtm-debug']",
    "iframe[src*='googletagmanager.com/debug']"
  ];

  for (var ds = 0; ds < debugSelectors.length; ds++) {
    if (document.querySelector(debugSelectors[ds])) {
      debugPanelDetected = true;
      result.gtm_debug.detected = true;
      break;
    }
  }

  // Extract container ID from page
  var html = document.documentElement.outerHTML || "";
  var containerMatch = html.match(/GTM-[A-Z0-9]{4,8}/);
  if (containerMatch) {
    result.gtm_debug.container_id = containerMatch[0];
  }

  // ---- Extract tag firing data from dataLayer ----
  if (typeof window.dataLayer === "undefined" || !window.dataLayer) {
    result.warnings.push("No dataLayer found on page. Cannot analyze tag firing order.");
    return JSON.stringify(result, null, 2);
  }

  // Build timeline from dataLayer entries
  var timelineEntries = [];
  var gtmStartTime = null;
  var consentDefaultTime = null;
  var consentUpdateTime = null;
  var firstEcommerceTime = null;
  var domReadyTime = null;
  var windowLoadTime = null;
  var tagNames = {};

  for (var i = 0; i < window.dataLayer.length; i++) {
    var entry = window.dataLayer[i];
    if (!entry) { continue; }

    var timelineEntry = {
      index: i,
      timestamp: null,
      event: null,
      type: "unknown",
      details: {}
    };

    // Extract timestamp if available
    if (entry["gtm.start"]) {
      timelineEntry.timestamp = entry["gtm.start"];
      gtmStartTime = entry["gtm.start"];
    }

    // Classify the entry
    if (entry.event) {
      timelineEntry.event = entry.event;

      // GTM lifecycle events
      if (entry.event === "gtm.js") {
        timelineEntry.type = "gtm_init";
        timelineEntry.details.description = "GTM container initialized";
      } else if (entry.event === "gtm.dom") {
        timelineEntry.type = "dom_ready";
        timelineEntry.details.description = "DOM ready event";
        domReadyTime = i;
      } else if (entry.event === "gtm.load") {
        timelineEntry.type = "window_load";
        timelineEntry.details.description = "Window load event";
        windowLoadTime = i;
      } else if (entry.event === "gtm.historyChange" || entry.event === "gtm.historyChange-v2") {
        timelineEntry.type = "history_change";
        timelineEntry.details.description = "SPA navigation / history change";
      }

      // Consent events
      else if (entry.event.indexOf("consent") !== -1 ||
               entry.event.indexOf("cookie") !== -1 ||
               entry.event.indexOf("gdpr") !== -1 ||
               entry.event.indexOf("privacy") !== -1) {
        timelineEntry.type = "consent_event";
        timelineEntry.details.description = "Consent-related event";
        result.consent_analysis.consent_events_found.push({
          event: entry.event,
          index: i
        });
        if (consentUpdateTime === null) {
          consentUpdateTime = i;
        }
      }

      // Ecommerce events
      else if (entry.ecommerce ||
               entry.event === "purchase" ||
               entry.event === "add_to_cart" ||
               entry.event === "view_item" ||
               entry.event === "begin_checkout" ||
               entry.event === "view_item_list") {
        timelineEntry.type = "ecommerce";
        timelineEntry.details.description = "Ecommerce event";
        if (firstEcommerceTime === null) {
          firstEcommerceTime = i;
        }
      }

      // Tag firing events (from GTM debug)
      else if (entry.event.indexOf("gtm.") === 0) {
        timelineEntry.type = "gtm_internal";
      }

      // Custom events
      else {
        timelineEntry.type = "custom_event";
      }
    }

    // Check for consent command format: ['consent', 'default', {...}]
    if (Array.isArray(entry) && entry[0] === "consent") {
      timelineEntry.event = "consent:" + (entry[1] || "unknown");
      timelineEntry.type = "consent_command";
      timelineEntry.details.action = entry[1];
      if (entry[2]) {
        try {
          timelineEntry.details.params = JSON.parse(JSON.stringify(entry[2]));
        } catch (e) {
          timelineEntry.details.params = "[unable to serialize]";
        }
      }

      if (entry[1] === "default") {
        consentDefaultTime = i;
        result.consent_analysis.consent_timing = {
          default_index: i,
          position: i === 0 ? "first_entry" : "entry_" + i
        };
      }
      if (entry[1] === "update") {
        consentUpdateTime = i;
      }

      result.consent_analysis.consent_events_found.push({
        event: "consent:" + entry[1],
        index: i
      });
    }

    timelineEntries.push(timelineEntry);
  }

  result.timeline = timelineEntries;

  // ---- Analyze tag firing data from google_tag_manager object ----
  var gtmData = null;
  if (typeof window.google_tag_manager !== "undefined") {
    var gtmKeys = Object.keys(window.google_tag_manager);
    for (var gk = 0; gk < gtmKeys.length; gk++) {
      var gtmKey = gtmKeys[gk];
      if (gtmKey.indexOf("GTM-") === 0 || gtmKey.indexOf("G-") === 0) {
        gtmData = window.google_tag_manager[gtmKey];
        if (!result.gtm_debug.container_id) {
          result.gtm_debug.container_id = gtmKey;
        }
        break;
      }
    }
  }

  // ---- Extract tag information from the debug panel DOM ----
  // GTM Tag Assistant / debug panel exposes tag data in the DOM
  var tagElements = document.querySelectorAll("[class*='tag-'], [data-tag-name], [class*='TagSummary'], [class*='tag_summary']");
  var summaryItems = document.querySelectorAll("[class*='summary-item'], [class*='SummaryItem'], li[class*='event']");

  // Try to extract tag firing info from the debug panel
  var debugTags = [];

  // Method 1: Look for tag names and statuses in common debug panel structures
  var firedTagEls = document.querySelectorAll("[class*='fired'], [class*='Fired'], [data-status='fired']");
  var notFiredTagEls = document.querySelectorAll("[class*='not-fired'], [class*='NotFired'], [data-status='not_fired']");

  for (var ft = 0; ft < firedTagEls.length; ft++) {
    var tagText = (firedTagEls[ft].textContent || "").trim().substring(0, 100);
    if (tagText) {
      debugTags.push({ name: tagText, status: "fired", index: ft });
      result.tag_inventory.fired++;
    }
  }

  for (var nft = 0; nft < notFiredTagEls.length; nft++) {
    var nfText = (notFiredTagEls[nft].textContent || "").trim().substring(0, 100);
    if (nfText) {
      debugTags.push({ name: nfText, status: "not_fired", index: nft });
      result.tag_inventory.not_fired++;
    }
  }

  result.tag_inventory.total_tags = debugTags.length;

  // ---- Analyze dependency chains ----
  // Look for common dependency patterns in the dataLayer sequence

  // Pattern 1: Tags that depend on dataLayer values set by other events
  var dataLayerSetEvents = [];
  var dataLayerConsumeEvents = [];

  for (var dli = 0; dli < window.dataLayer.length; dli++) {
    var dlEntry = window.dataLayer[dli];
    if (!dlEntry) { continue; }

    if (dlEntry.event && dlEntry.event.indexOf("gtm.") !== 0) {
      var dlKeys = Object.keys(dlEntry);
      var hasData = false;
      for (var dk = 0; dk < dlKeys.length; dk++) {
        if (dlKeys[dk] !== "event" && dlKeys[dk] !== "gtm.uniqueEventId") {
          hasData = true;
          break;
        }
      }
      if (hasData) {
        dataLayerSetEvents.push({
          index: dli,
          event: dlEntry.event,
          keys: dlKeys.filter(function(k) { return k !== "event" && k !== "gtm.uniqueEventId"; })
        });
      } else {
        dataLayerConsumeEvents.push({
          index: dli,
          event: dlEntry.event
        });
      }
    }
  }

  // ---- Identify potential race conditions ----
  // Check for async tag patterns: multiple events with similar timing
  var eventTimings = [];
  for (var eti = 0; eti < window.dataLayer.length; eti++) {
    var etEntry = window.dataLayer[eti];
    if (etEntry && etEntry.event && etEntry.event.indexOf("gtm.") !== 0) {
      eventTimings.push({
        index: eti,
        event: etEntry.event,
        has_callback: !!(etEntry.eventCallback || etEntry.eventTimeout)
      });
    }
  }

  // Events firing in rapid succession without callbacks are potential race conditions
  for (var rc = 1; rc < eventTimings.length; rc++) {
    var prev = eventTimings[rc - 1];
    var curr = eventTimings[rc];

    // If two non-GTM events fire consecutively and the first has no callback
    if (curr.index - prev.index === 1 && !prev.has_callback) {
      // Check if they might depend on each other
      var prevEntry = window.dataLayer[prev.index];
      var currEntry = window.dataLayer[curr.index];

      if (prevEntry && currEntry) {
        var prevKeys = Object.keys(prevEntry);
        var currKeys = Object.keys(currEntry);
        var sharedKeys = [];
        for (var sk = 0; sk < currKeys.length; sk++) {
          if (prevKeys.indexOf(currKeys[sk]) !== -1 && currKeys[sk] !== "event" && currKeys[sk] !== "gtm.uniqueEventId") {
            sharedKeys.push(currKeys[sk]);
          }
        }
        if (sharedKeys.length > 0) {
          result.dependency_analysis.potential_race_conditions.push({
            event_a: prev.event + " (index " + prev.index + ")",
            event_b: curr.event + " (index " + curr.index + ")",
            shared_keys: sharedKeys,
            issue: "These events fire consecutively and share data keys. If Event B depends on tags fired by Event A, a race condition may occur since Event A has no eventCallback."
          });
        }
      }
    }
  }

  // ---- Check for triggers firing before dataLayer is populated ----
  // Events that fire before any data-setting events
  for (var ef = 0; ef < eventTimings.length; ef++) {
    var earlyEvt = eventTimings[ef];
    if (earlyEvt.index < 2 && earlyEvt.event !== "gtm.js") {
      // Check if this event expects data that has not been set yet
      var earlyEntry = window.dataLayer[earlyEvt.index];
      if (earlyEntry && !earlyEntry.ecommerce && !earlyEntry.user_data) {
        result.dependency_analysis.early_triggers.push({
          event: earlyEvt.event,
          index: earlyEvt.index,
          note: "This event fires very early in the dataLayer sequence (index " + earlyEvt.index + "). Verify that any tags triggered by this event do not depend on data pushed later."
        });
      }
    }
  }

  // ---- Check for tags that fire after page unload signals ----
  if (windowLoadTime !== null) {
    for (var lf = 0; lf < eventTimings.length; lf++) {
      if (eventTimings[lf].index > windowLoadTime + 5) {
        // Events firing well after window.load
        result.dependency_analysis.late_fires.push({
          event: eventTimings[lf].event,
          index: eventTimings[lf].index,
          note: "This event fires significantly after window load (index " + eventTimings[lf].index + ", window.load at index " + windowLoadTime + "). Tags triggered by this event may not complete before the user navigates away."
        });
      }
    }
  }

  // ---- Consent timing analysis ----
  if (consentDefaultTime !== null) {
    // Check if consent default fires before GTM init
    if (consentDefaultTime > 0) {
      result.warnings.push("Consent default command is not the first dataLayer entry (found at index " + consentDefaultTime + "). Consent default should be pushed before the GTM container script loads to ensure all tags respect consent state from the start.");
    }

    // Categorize events as before or after consent
    for (var ca = 0; ca < eventTimings.length; ca++) {
      var consentRef = consentUpdateTime !== null ? consentUpdateTime : consentDefaultTime;
      if (eventTimings[ca].index < consentRef) {
        result.consent_analysis.tags_before_consent.push({
          event: eventTimings[ca].event,
          index: eventTimings[ca].index
        });
      } else {
        result.consent_analysis.tags_after_consent.push({
          event: eventTimings[ca].event,
          index: eventTimings[ca].index
        });
      }
    }
  }

  // Check for consent-gated trigger patterns in the dataLayer
  for (var cg = 0; cg < window.dataLayer.length; cg++) {
    var cgEntry = window.dataLayer[cg];
    if (cgEntry && cgEntry.event) {
      // Look for events that mention consent in their name
      if (cgEntry.event.indexOf("consent") !== -1 ||
          cgEntry.event.indexOf("accepted") !== -1 ||
          cgEntry.event.indexOf("granted") !== -1 ||
          cgEntry.event.indexOf("cookie_consent") !== -1) {
        result.consent_analysis.consent_gated_tags.push({
          event: cgEntry.event,
          index: cg,
          note: "This event appears to be a consent grant signal. Tags triggered by this event are consent-gated."
        });
      }
    }
  }

  // ---- Build dependency chains from event sequence ----
  // Identify logical dependencies based on data flow
  if (dataLayerSetEvents.length > 1) {
    for (var dc = 1; dc < dataLayerSetEvents.length; dc++) {
      var prevSet = dataLayerSetEvents[dc - 1];
      var currSet = dataLayerSetEvents[dc];

      // Check if current event uses data set by previous event
      var dependencies = [];
      for (var dck = 0; dck < currSet.keys.length; dck++) {
        if (prevSet.keys.indexOf(currSet.keys[dck]) !== -1) {
          dependencies.push(currSet.keys[dck]);
        }
      }

      if (dependencies.length > 0) {
        result.dependency_analysis.chains.push({
          upstream: prevSet.event + " (index " + prevSet.index + ")",
          downstream: currSet.event + " (index " + currSet.index + ")",
          shared_data: dependencies,
          note: "Event '" + currSet.event + "' may depend on data set by '" + prevSet.event + "' via shared keys: " + dependencies.join(", ")
        });
      }
    }
  }

  // ---- Summary warnings and recommendations ----
  if (!result.gtm_debug.detected && !result.gtm_debug.preview_mode) {
    result.recommendations.push("GTM debug/preview mode not detected. For the most accurate tag firing analysis, enable GTM preview mode via Tag Assistant and re-run this script.");
  }

  if (result.dependency_analysis.potential_race_conditions.length > 0) {
    result.warnings.push(result.dependency_analysis.potential_race_conditions.length + " potential race condition(s) detected. Events firing in rapid succession with shared data keys may cause tags to fire with incomplete data.");
  }

  if (result.dependency_analysis.late_fires.length > 0) {
    result.warnings.push(result.dependency_analysis.late_fires.length + " event(s) fire significantly after window load. Tags triggered by these events risk data loss if the user navigates away before the request completes. Consider using navigator.sendBeacon or the Transport URL feature.");
  }

  if (result.consent_analysis.consent_events_found.length === 0) {
    result.warnings.push("No consent events or commands found in the dataLayer. If this site serves EU users, consent signals should be present to gate tracking tags.");
  }

  if (consentDefaultTime !== null && consentDefaultTime > 0) {
    result.recommendations.push("Move the consent default command to index 0 in the dataLayer, before the GTM container script. This ensures all tags respect consent state from the moment they initialize.");
  }

  if (result.dependency_analysis.early_triggers.length > 0) {
    result.recommendations.push("Review early-firing events (before index 2) to confirm that tags they trigger do not depend on data pushed later in the page lifecycle.");
  }

  if (result.tag_inventory.total_tags === 0 && debugTags.length === 0) {
    result.recommendations.push("No tag firing data could be extracted from the DOM. This script works best when run inside the GTM preview/debug panel. Open GTM, click Preview, load the target page, then run this script in the debug panel context.");
  }

  return JSON.stringify(result, null, 2);
})();
