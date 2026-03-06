/**
 * dump-datalayer.js
 * Dumps and analyzes the entire dataLayer array.
 * Checks for events, ecommerce data, user_data for enhanced conversions,
 * consent commands, and GTM initialization.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    datalayer: {
      exists: false,
      entry_count: 0,
      events: [],
      ecommerce: {
        detected: false,
        has_items: false,
        has_transaction_id: false,
        has_value: false,
        has_currency: false,
        details: []
      },
      user_data: {
        detected: false,
        fields_found: []
      },
      consent: {
        commands_found: [],
        has_default: false,
        has_update: false
      },
      gtm_start: {
        detected: false,
        timestamp: null
      },
      raw_entries: []
    },
    warnings: []
  };

  if (typeof window.dataLayer === "undefined" || !window.dataLayer) {
    result.warnings.push("No dataLayer found on page - GTM may not be installed or not yet loaded");
    return JSON.stringify(result, null, 2);
  }

  result.datalayer.exists = true;
  result.datalayer.entry_count = window.dataLayer.length;

  var eventsSeen = {};

  for (var i = 0; i < window.dataLayer.length; i++) {
    var entry = window.dataLayer[i];
    var entrySummary = {};

    try {
      entrySummary = JSON.parse(JSON.stringify(entry));
    } catch (e) {
      entrySummary = { _parse_error: "Could not serialize entry " + i };
    }

    result.datalayer.raw_entries.push(entrySummary);

    // Detect events
    if (entry.event && !eventsSeen[entry.event]) {
      eventsSeen[entry.event] = true;
      result.datalayer.events.push(entry.event);
    }

    // Detect gtm.start
    if (entry.event === "gtm.js" && entry["gtm.start"]) {
      result.datalayer.gtm_start.detected = true;
      result.datalayer.gtm_start.timestamp = entry["gtm.start"];
    }

    // Detect ecommerce data
    if (entry.ecommerce) {
      result.datalayer.ecommerce.detected = true;
      var ecomDetail = { entry_index: i, event: entry.event || "(no event)" };

      if (entry.ecommerce.items && entry.ecommerce.items.length > 0) {
        result.datalayer.ecommerce.has_items = true;
        ecomDetail.item_count = entry.ecommerce.items.length;
      }
      if (entry.ecommerce.transaction_id) {
        result.datalayer.ecommerce.has_transaction_id = true;
        ecomDetail.transaction_id = entry.ecommerce.transaction_id;
      }
      if (entry.ecommerce.value !== undefined) {
        result.datalayer.ecommerce.has_value = true;
        ecomDetail.value = entry.ecommerce.value;
      }
      if (entry.ecommerce.currency) {
        result.datalayer.ecommerce.has_currency = true;
        ecomDetail.currency = entry.ecommerce.currency;
      }

      result.datalayer.ecommerce.details.push(ecomDetail);
    }

    // Also check for items/transaction_id at top level (GA4 style)
    if (entry.items && Array.isArray(entry.items) && entry.items.length > 0) {
      result.datalayer.ecommerce.detected = true;
      result.datalayer.ecommerce.has_items = true;
    }
    if (entry.transaction_id) {
      result.datalayer.ecommerce.detected = true;
      result.datalayer.ecommerce.has_transaction_id = true;
    }
    if (entry.value !== undefined && entry.currency) {
      result.datalayer.ecommerce.detected = true;
      result.datalayer.ecommerce.has_value = true;
      result.datalayer.ecommerce.has_currency = true;
    }

    // Detect user_data for enhanced conversions
    if (entry.user_data) {
      result.datalayer.user_data.detected = true;
      var udKeys = Object.keys(entry.user_data);
      for (var u = 0; u < udKeys.length; u++) {
        if (result.datalayer.user_data.fields_found.indexOf(udKeys[u]) === -1) {
          result.datalayer.user_data.fields_found.push(udKeys[u]);
        }
      }
    }

    // Also check for user_properties
    if (entry.user_properties) {
      result.datalayer.user_data.detected = true;
      var upKeys = Object.keys(entry.user_properties);
      for (var up = 0; up < upKeys.length; up++) {
        var upKey = "user_properties." + upKeys[up];
        if (result.datalayer.user_data.fields_found.indexOf(upKey) === -1) {
          result.datalayer.user_data.fields_found.push(upKey);
        }
      }
    }

    // Detect consent commands
    if (entry[0] === "consent") {
      var consentType = entry[1] || "unknown";
      result.datalayer.consent.commands_found.push(consentType);
      if (consentType === "default") {
        result.datalayer.consent.has_default = true;
      }
      if (consentType === "update") {
        result.datalayer.consent.has_update = true;
      }
    }

    // Also check for consent event-style pushes
    if (entry.event && entry.event.indexOf("consent") !== -1) {
      if (result.datalayer.consent.commands_found.indexOf("event:" + entry.event) === -1) {
        result.datalayer.consent.commands_found.push("event:" + entry.event);
      }
    }
  }

  // Warnings
  if (!result.datalayer.ecommerce.detected) {
    result.warnings.push("No ecommerce data found in dataLayer - ecommerce tracking may not be configured");
  }

  if (!result.datalayer.user_data.detected) {
    result.warnings.push("No user_data found in dataLayer - enhanced conversions may not be configured");
  }

  if (result.datalayer.consent.commands_found.length === 0) {
    result.warnings.push("No consent signals found in dataLayer - consent mode may not be implemented");
  }

  if (!result.datalayer.gtm_start.detected) {
    result.warnings.push("No gtm.start event found - GTM may not be properly initialized");
  }

  return JSON.stringify(result, null, 2);
})();
