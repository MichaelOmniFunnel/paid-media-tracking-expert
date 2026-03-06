/**
 * validate-server-side.js
 * Server-side tracking validation script. Monitors network requests to
 * identify SGTM endpoints (Stape.io domains, custom SGTM domains).
 * Captures endpoint URL, payload contents, event type, event_id for
 * deduplication verification, and user data parameters. Compares client-side
 * pixel fires to server-side requests to verify deduplication is working.
 * Flags events firing without corresponding server-side or client-side pairs.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    sgtm: {
      detected: false,
      endpoints: [],
      request_count: 0
    },
    client_side_events: {
      ga4: [],
      meta: [],
      tiktok: [],
      google_ads: []
    },
    server_side_events: {
      ga4: [],
      meta: [],
      tiktok: [],
      google_ads: [],
      unknown: []
    },
    deduplication: {
      events_with_event_id: [],
      events_without_event_id: [],
      matched_pairs: [],
      unmatched_client_side: [],
      unmatched_server_side: [],
      dedup_health: "unknown"
    },
    user_data_in_requests: {
      detected: false,
      parameters_found: [],
      hashed_data_detected: false
    },
    warnings: [],
    recommendations: []
  };

  // ---- Known SGTM / server-side endpoint patterns ----
  var sgtmPatterns = [
    { pattern: "stape.io", type: "Stape.io managed SGTM" },
    { pattern: "stape.net", type: "Stape.io managed SGTM" },
    { pattern: "/g/collect", type: "GA4 collect endpoint (possible SGTM proxy)" },
    { pattern: "sgtm.", type: "Custom SGTM subdomain" },
    { pattern: "gtm.", type: "Custom GTM server-side subdomain" },
    { pattern: "tagging.", type: "Custom tagging subdomain" },
    { pattern: "tracking.", type: "Custom tracking subdomain" },
    { pattern: "data.", type: "Custom data collection subdomain" },
    { pattern: "collect.", type: "Custom collection subdomain" },
    { pattern: "ss.", type: "Server-side subdomain" }
  ];

  // Known client-side pixel endpoint patterns
  var clientSidePatterns = {
    ga4: [
      "google-analytics.com/g/collect",
      "analytics.google.com/g/collect"
    ],
    meta: [
      "facebook.com/tr",
      "facebook.net/tr",
      "www.facebook.com/tr"
    ],
    tiktok: [
      "analytics.tiktok.com/api/v2/pixel",
      "analytics.tiktok.com/api/v1/pixel"
    ],
    google_ads: [
      "googleads.g.doubleclick.net/pagead/conversion",
      "google.com/pagead/1p-conversion",
      "googleadservices.com/pagead/conversion"
    ]
  };

  // User data parameter names to look for in request payloads
  var userDataParams = [
    "em", "ph", "fn", "ln", "ge", "db", "ct", "st", "zp", "country",
    "external_id", "email", "phone", "first_name", "last_name",
    "sha256_email", "sha256_phone", "user_data", "ud",
    "hashed_email", "hashed_phone_number"
  ];

  // ---- Scan performance entries for network requests ----
  var resources = [];
  if (window.performance && window.performance.getEntriesByType) {
    resources = window.performance.getEntriesByType("resource");
  }

  // Also scan script sources for SGTM endpoint configuration
  var html = document.documentElement.outerHTML || "";
  var scriptEls = document.querySelectorAll("script");
  var allText = html;
  for (var si = 0; si < scriptEls.length; si++) {
    allText += " " + (scriptEls[si].textContent || "");
    var scriptSrc = scriptEls[si].getAttribute("src") || "";
    allText += " " + scriptSrc;
  }

  // Detect SGTM endpoints from script configuration
  // Look for gtag config with server_container_url or transport_url
  var serverContainerPattern = /server_container_url['"]*\s*:\s*['"]([^'"]+)['"]/g;
  var scMatch;
  while ((scMatch = serverContainerPattern.exec(allText)) !== null) {
    var scEndpoint = scMatch[1];
    if (result.sgtm.endpoints.indexOf(scEndpoint) === -1) {
      result.sgtm.endpoints.push(scEndpoint);
      result.sgtm.detected = true;
    }
  }

  var transportUrlPattern = /transport_url['"]*\s*:\s*['"]([^'"]+)['"]/g;
  var tuMatch;
  while ((tuMatch = transportUrlPattern.exec(allText)) !== null) {
    var tuEndpoint = tuMatch[1];
    if (result.sgtm.endpoints.indexOf(tuEndpoint) === -1) {
      result.sgtm.endpoints.push(tuEndpoint);
      result.sgtm.detected = true;
    }
  }

  // Also look for first_party_collection or gtm server-side loader
  var gtmSSPattern = /googletagmanager\.com\/gtag\/js\?id=[^&]+&l=[^'"&\s]+/g;
  if (allText.indexOf("first_party_collection") !== -1) {
    result.sgtm.detected = true;
  }

  // ---- Categorize network requests ----
  var allEventIds = {};
  var clientSideEventIds = {};
  var serverSideEventIds = {};

  for (var ri = 0; ri < resources.length; ri++) {
    var resUrl = resources[ri].name || "";
    if (!resUrl) { continue; }

    // ---- Check for SGTM / server-side endpoints ----
    var isServerSide = false;
    var ssType = "unknown";

    // Check if request goes to a known SGTM endpoint
    for (var ep = 0; ep < result.sgtm.endpoints.length; ep++) {
      if (resUrl.indexOf(result.sgtm.endpoints[ep]) !== -1) {
        isServerSide = true;
        ssType = "SGTM proxy";
        break;
      }
    }

    // Check against known SGTM patterns
    if (!isServerSide) {
      for (var sp = 0; sp < sgtmPatterns.length; sp++) {
        if (resUrl.indexOf(sgtmPatterns[sp].pattern) !== -1) {
          // Exclude known client-side GA4 endpoints
          var isKnownClientSide = false;
          for (var csp = 0; csp < clientSidePatterns.ga4.length; csp++) {
            if (resUrl.indexOf(clientSidePatterns.ga4[csp]) !== -1) {
              isKnownClientSide = true;
              break;
            }
          }
          if (!isKnownClientSide) {
            // Check if this is a first-party domain proxying to SGTM
            var urlDomain = "";
            try {
              var urlParts = resUrl.split("/");
              urlDomain = urlParts[2] || "";
            } catch (e) {
              urlDomain = "";
            }

            // If the domain matches the site domain or a subdomain, likely SGTM
            var siteBaseDomain = window.location.hostname.replace(/^www\./, "");
            if (urlDomain.indexOf(siteBaseDomain) !== -1 && resUrl.indexOf("/g/collect") !== -1) {
              isServerSide = true;
              ssType = "First-party SGTM proxy";
              if (result.sgtm.endpoints.indexOf(urlDomain) === -1) {
                result.sgtm.endpoints.push(urlDomain);
              }
              result.sgtm.detected = true;
            }
          }
        }
      }
    }

    // ---- Parse request details ----
    var eventInfo = {
      url: resUrl.substring(0, 300),
      platform: "unknown",
      event_name: null,
      event_id: null,
      is_server_side: isServerSide,
      user_data_params: []
    };

    // Determine platform and extract event details
    var isTrackingRequest = false;

    // GA4 collect requests
    if (resUrl.indexOf("/g/collect") !== -1) {
      isTrackingRequest = true;
      eventInfo.platform = "ga4";

      var enMatch = resUrl.match(/[?&]en=([^&]+)/);
      if (enMatch) {
        eventInfo.event_name = decodeURIComponent(enMatch[1]);
      }

      var tidMatch = resUrl.match(/[?&]tid=([^&]+)/);
      if (tidMatch) {
        eventInfo.measurement_id = decodeURIComponent(tidMatch[1]);
      }

      // Check for event_id in the URL (epn.event_id or ep.event_id)
      var eidMatch = resUrl.match(/[?&](?:epn?\.|ep\.)event_id=([^&]+)/);
      if (eidMatch) {
        eventInfo.event_id = decodeURIComponent(eidMatch[1]);
      }
    }

    // Meta pixel requests
    for (var mp = 0; mp < clientSidePatterns.meta.length; mp++) {
      if (resUrl.indexOf(clientSidePatterns.meta[mp]) !== -1) {
        isTrackingRequest = true;
        eventInfo.platform = "meta";

        var metaEvMatch = resUrl.match(/[?&]ev=([^&]+)/);
        if (metaEvMatch) {
          eventInfo.event_name = decodeURIComponent(metaEvMatch[1]);
        }

        var metaEidMatch = resUrl.match(/[?&]eid=([^&]+)/);
        if (metaEidMatch) {
          eventInfo.event_id = decodeURIComponent(metaEidMatch[1]);
        }
        break;
      }
    }

    // TikTok pixel requests
    for (var tp = 0; tp < clientSidePatterns.tiktok.length; tp++) {
      if (resUrl.indexOf(clientSidePatterns.tiktok[tp]) !== -1) {
        isTrackingRequest = true;
        eventInfo.platform = "tiktok";

        var ttEvMatch = resUrl.match(/[?&]event=([^&]+)/);
        if (ttEvMatch) {
          eventInfo.event_name = decodeURIComponent(ttEvMatch[1]);
        }

        var ttEidMatch = resUrl.match(/[?&]event_id=([^&]+)/);
        if (ttEidMatch) {
          eventInfo.event_id = decodeURIComponent(ttEidMatch[1]);
        }
        break;
      }
    }

    // Google Ads conversion requests
    for (var gp = 0; gp < clientSidePatterns.google_ads.length; gp++) {
      if (resUrl.indexOf(clientSidePatterns.google_ads[gp]) !== -1) {
        isTrackingRequest = true;
        eventInfo.platform = "google_ads";
        eventInfo.event_name = "conversion";

        var awLabelMatch = resUrl.match(/[?&]label=([^&]+)/);
        if (awLabelMatch) {
          eventInfo.conversion_label = decodeURIComponent(awLabelMatch[1]);
        }
        break;
      }
    }

    // Check for Stape.io or custom SGTM domains specifically
    if (!isTrackingRequest) {
      if (resUrl.indexOf("stape.io") !== -1 || resUrl.indexOf("stape.net") !== -1) {
        isTrackingRequest = true;
        isServerSide = true;
        eventInfo.is_server_side = true;
        eventInfo.platform = "sgtm";
        result.sgtm.detected = true;
      }
    }

    if (!isTrackingRequest) { continue; }

    // ---- Check for user data parameters in URL ----
    for (var ud = 0; ud < userDataParams.length; ud++) {
      var udPattern = new RegExp("[?&]" + userDataParams[ud] + "=", "i");
      if (udPattern.test(resUrl)) {
        eventInfo.user_data_params.push(userDataParams[ud]);
        result.user_data_in_requests.detected = true;
        if (result.user_data_in_requests.parameters_found.indexOf(userDataParams[ud]) === -1) {
          result.user_data_in_requests.parameters_found.push(userDataParams[ud]);
        }
      }
    }

    // Check for hashed data (SHA-256 patterns: 64 hex chars)
    if (/[?&][a-z_]+=([a-f0-9]{64})(&|$)/i.test(resUrl)) {
      result.user_data_in_requests.hashed_data_detected = true;
    }

    // ---- Categorize into client-side or server-side ----
    if (isServerSide) {
      result.server_side_events[eventInfo.platform] = result.server_side_events[eventInfo.platform] || [];
      result.server_side_events[eventInfo.platform].push(eventInfo);
      result.sgtm.request_count++;

      if (eventInfo.event_id) {
        serverSideEventIds[eventInfo.platform + ":" + eventInfo.event_name + ":" + eventInfo.event_id] = eventInfo;
      }
    } else {
      result.client_side_events[eventInfo.platform] = result.client_side_events[eventInfo.platform] || [];
      result.client_side_events[eventInfo.platform].push(eventInfo);

      if (eventInfo.event_id) {
        clientSideEventIds[eventInfo.platform + ":" + eventInfo.event_name + ":" + eventInfo.event_id] = eventInfo;
      }
    }

    // Track event_id presence
    if (eventInfo.event_id) {
      result.deduplication.events_with_event_id.push({
        platform: eventInfo.platform,
        event_name: eventInfo.event_name,
        event_id: eventInfo.event_id,
        side: isServerSide ? "server" : "client"
      });
    } else if (eventInfo.event_name) {
      result.deduplication.events_without_event_id.push({
        platform: eventInfo.platform,
        event_name: eventInfo.event_name,
        side: isServerSide ? "server" : "client"
      });
    }
  }

  // ---- Deduplication analysis ----
  // Match client-side event_ids with server-side event_ids
  var csKeys = Object.keys(clientSideEventIds);
  var ssKeys = Object.keys(serverSideEventIds);

  for (var csk = 0; csk < csKeys.length; csk++) {
    var csKey = csKeys[csk];
    if (serverSideEventIds[csKey]) {
      result.deduplication.matched_pairs.push({
        key: csKey,
        client_side: clientSideEventIds[csKey].url.substring(0, 150),
        server_side: serverSideEventIds[csKey].url.substring(0, 150),
        status: "Deduplication verified: matching event_id found on both sides"
      });
    } else {
      result.deduplication.unmatched_client_side.push({
        key: csKey,
        platform: clientSideEventIds[csKey].platform,
        event_name: clientSideEventIds[csKey].event_name,
        event_id: clientSideEventIds[csKey].event_id,
        status: "Client-side event has event_id but no matching server-side request found"
      });
    }
  }

  for (var ssk = 0; ssk < ssKeys.length; ssk++) {
    var ssKey = ssKeys[ssk];
    if (!clientSideEventIds[ssKey]) {
      result.deduplication.unmatched_server_side.push({
        key: ssKey,
        platform: serverSideEventIds[ssKey].platform,
        event_name: serverSideEventIds[ssKey].event_name,
        event_id: serverSideEventIds[ssKey].event_id,
        status: "Server-side event has event_id but no matching client-side request found"
      });
    }
  }

  // Determine deduplication health
  if (result.deduplication.events_with_event_id.length === 0 && result.sgtm.detected) {
    result.deduplication.dedup_health = "no_event_ids";
    result.warnings.push("SGTM detected but no event_id parameters found in any requests. Deduplication cannot function without matching event_ids on client-side and server-side events.");
  } else if (result.deduplication.matched_pairs.length > 0 && result.deduplication.events_without_event_id.length === 0) {
    result.deduplication.dedup_health = "healthy";
  } else if (result.deduplication.matched_pairs.length > 0) {
    result.deduplication.dedup_health = "partial";
    result.warnings.push("Some events have matching event_ids for deduplication but " + result.deduplication.events_without_event_id.length + " event(s) are missing event_id. These may cause duplicate counting.");
  } else if (result.sgtm.detected) {
    result.deduplication.dedup_health = "not_verified";
    result.warnings.push("SGTM is detected but deduplication could not be verified from current network requests. Trigger conversion events and re-run to validate.");
  } else {
    result.deduplication.dedup_health = "not_applicable";
  }

  // ---- Warnings and recommendations ----
  if (!result.sgtm.detected) {
    result.warnings.push("No server-side GTM endpoint detected. All tracking is running client-side only.");
    result.recommendations.push("Implement server-side GTM via Stape.io for improved data accuracy, reduced ad-blocker impact, and better match quality for Meta CAPI and TikTok Events API.");
  }

  if (result.sgtm.detected && result.sgtm.endpoints.length > 0) {
    // Check if SGTM is on a first-party domain
    var hasFirstParty = false;
    var siteBase = window.location.hostname.replace(/^www\./, "");
    for (var fpe = 0; fpe < result.sgtm.endpoints.length; fpe++) {
      if (result.sgtm.endpoints[fpe].indexOf(siteBase) !== -1) {
        hasFirstParty = true;
        break;
      }
    }
    if (!hasFirstParty) {
      result.recommendations.push("SGTM endpoint does not appear to use a first-party subdomain. Configure a custom subdomain (e.g., sgtm." + siteBase + ") for improved cookie persistence and reduced ad-blocker impact.");
    }
  }

  if (result.deduplication.events_without_event_id.length > 0 && result.sgtm.detected) {
    var platformsMissingEid = {};
    for (var mei = 0; mei < result.deduplication.events_without_event_id.length; mei++) {
      var pf = result.deduplication.events_without_event_id[mei].platform;
      platformsMissingEid[pf] = true;
    }
    var missingPlatforms = Object.keys(platformsMissingEid).join(", ");
    result.recommendations.push("Add event_id parameter to all conversion events on these platforms: " + missingPlatforms + ". The same event_id must be sent in both client-side pixel and server-side CAPI/Events API calls for deduplication.");
  }

  if (!result.user_data_in_requests.detected && result.sgtm.detected) {
    result.recommendations.push("No user data parameters detected in server-side requests. Sending hashed email, phone, and other match keys via SGTM improves Meta Event Match Quality and Google Enhanced Conversions signal strength.");
  }

  if (result.user_data_in_requests.detected && !result.user_data_in_requests.hashed_data_detected) {
    result.warnings.push("User data parameters detected in requests but no SHA-256 hashed values found. User data should always be hashed before transmission for privacy compliance.");
  }

  return JSON.stringify(result, null, 2);
})();
