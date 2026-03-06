/**
 * full-site-scan.js
 * Combined quick audit that runs all key checks in a single pass.
 * Detects tracking pixels, analyzes dataLayer, checks consent mode,
 * evaluates performance, and audits forms.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    tracking: {
      gtm_ids: [],
      google_ads_ids: [],
      ga4_ids: [],
      gtag_js: false,
      meta_pixel: { detected: false, pixel_ids: [], advanced_matching: false },
      tiktok_pixel: { detected: false },
      linkedin: false,
      pinterest: false,
      bing: false,
      snapchat: false
    },
    datalayer: {
      exists: false,
      entry_count: 0,
      has_ecommerce: false,
      has_user_data: false,
      events: []
    },
    consent_mode: {
      detected: false,
      v2_present: false
    },
    performance: {
      ttfb_ms: 0,
      load_time_ms: 0,
      request_count: 0,
      page_weight_bytes: 0,
      page_weight_human: ""
    },
    forms: {
      count: 0,
      gclid_capture: false,
      fbclid_capture: false
    },
    critical_issues: [],
    high_issues: [],
    medium_issues: []
  };

  var html = document.documentElement.outerHTML || "";
  var scripts = document.querySelectorAll("script");
  var allText = html;
  for (var i = 0; i < scripts.length; i++) {
    allText += " " + (scripts[i].textContent || "");
    var src = scripts[i].getAttribute("src") || "";
    if (src.indexOf("gtag/js") !== -1 || src.indexOf("googletagmanager.com/gtag") !== -1) {
      result.tracking.gtag_js = true;
    }
    if (src.indexOf("fbevents.js") !== -1 || src.indexOf("connect.facebook.net") !== -1) {
      result.tracking.meta_pixel.detected = true;
    }
    if (src.indexOf("analytics.tiktok.com") !== -1) {
      result.tracking.tiktok_pixel.detected = true;
    }
  }

  // GTM IDs
  var gtmMatches = allText.match(/GTM-[A-Z0-9]{4,8}/g);
  if (gtmMatches) {
    var gtmSeen = {};
    for (var g = 0; g < gtmMatches.length; g++) {
      if (!gtmSeen[gtmMatches[g]]) { gtmSeen[gtmMatches[g]] = true; result.tracking.gtm_ids.push(gtmMatches[g]); }
    }
  }

  // Google Ads IDs
  var awMatches = allText.match(/AW-[0-9]{7,12}/g);
  if (awMatches) {
    var awSeen = {};
    for (var a = 0; a < awMatches.length; a++) {
      if (!awSeen[awMatches[a]]) { awSeen[awMatches[a]] = true; result.tracking.google_ads_ids.push(awMatches[a]); }
    }
  }

  // GA4 IDs
  var ga4Matches = allText.match(/G-[A-Z0-9]{6,12}/g);
  if (ga4Matches) {
    var ga4Seen = {};
    for (var m = 0; m < ga4Matches.length; m++) {
      if (!ga4Seen[ga4Matches[m]]) { ga4Seen[ga4Matches[m]] = true; result.tracking.ga4_ids.push(ga4Matches[m]); }
    }
  }

  // Meta pixel IDs
  if (!result.tracking.meta_pixel.detected && (allText.indexOf("fbevents.js") !== -1 || allText.indexOf("fbq(") !== -1)) {
    result.tracking.meta_pixel.detected = true;
  }
  var fbqPattern = /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/g;
  var fbqM;
  var fbqSeen = {};
  while ((fbqM = fbqPattern.exec(allText)) !== null) {
    if (!fbqSeen[fbqM[1]]) { fbqSeen[fbqM[1]] = true; result.tracking.meta_pixel.pixel_ids.push(fbqM[1]); }
  }

  // Advanced matching detection
  var advPattern = /fbq\s*\(\s*['"]init['"]\s*,\s*['"][^'"]+['"]\s*,\s*\{([^}]+)\}/g;
  var advM;
  while ((advM = advPattern.exec(allText)) !== null) {
    if (advM[1].indexOf("em") !== -1 || advM[1].indexOf("ph") !== -1) {
      result.tracking.meta_pixel.advanced_matching = true;
    }
  }

  // TikTok
  if (!result.tracking.tiktok_pixel.detected && (allText.indexOf("analytics.tiktok.com") !== -1 || allText.indexOf("ttq.load") !== -1)) {
    result.tracking.tiktok_pixel.detected = true;
  }

  // Other platforms
  if (allText.indexOf("snap.licdn.com") !== -1 || allText.indexOf("_linkedin_partner_id") !== -1) { result.tracking.linkedin = true; }
  if (allText.indexOf("ct.pinterest.com") !== -1 || allText.indexOf("pintrk(") !== -1) { result.tracking.pinterest = true; }
  if (allText.indexOf("bat.bing.com") !== -1 || allText.indexOf("uetq") !== -1) { result.tracking.bing = true; }
  if (allText.indexOf("sc-static.net/scevent") !== -1 || allText.indexOf("snaptr(") !== -1) { result.tracking.snapchat = true; }

  // dataLayer analysis
  if (typeof window.dataLayer !== "undefined" && window.dataLayer) {
    result.datalayer.exists = true;
    result.datalayer.entry_count = window.dataLayer.length;
    var evSeen = {};
    for (var d = 0; d < window.dataLayer.length; d++) {
      var entry = window.dataLayer[d];
      if (entry.event && !evSeen[entry.event]) { evSeen[entry.event] = true; result.datalayer.events.push(entry.event); }
      if (entry.ecommerce || (entry.items && Array.isArray(entry.items))) { result.datalayer.has_ecommerce = true; }
      if (entry.user_data || entry.user_properties) { result.datalayer.has_user_data = true; }
      // Consent mode check
      if (Array.isArray(entry) && entry[0] === "consent") {
        result.consent_mode.detected = true;
        var cParams = entry[2] || {};
        if (cParams.ad_user_data !== undefined || cParams.ad_personalization !== undefined) {
          result.consent_mode.v2_present = true;
        }
      }
    }
  }

  // Also check script text for consent mode
  if (!result.consent_mode.detected) {
    if (allText.indexOf("gtag") !== -1 && allText.indexOf("consent") !== -1 && allText.indexOf("default") !== -1) {
      result.consent_mode.detected = true;
    }
  }
  if (!result.consent_mode.v2_present && allText.indexOf("ad_user_data") !== -1 && allText.indexOf("ad_personalization") !== -1) {
    result.consent_mode.v2_present = true;
  }

  // Performance
  var navEntries = performance.getEntriesByType("navigation");
  if (navEntries.length > 0) {
    var nav = navEntries[0];
    result.performance.ttfb_ms = Math.round(nav.responseStart - nav.requestStart);
    result.performance.load_time_ms = Math.round(nav.loadEventEnd);
  } else if (performance.timing) {
    var pt = performance.timing;
    result.performance.ttfb_ms = pt.responseStart - pt.requestStart;
    result.performance.load_time_ms = pt.loadEventEnd - pt.navigationStart;
  }
  var resources = performance.getEntriesByType("resource");
  result.performance.request_count = resources.length;
  var totalBytes = 0;
  for (var rr = 0; rr < resources.length; rr++) {
    totalBytes += resources[rr].transferSize || resources[rr].encodedBodySize || 0;
  }
  result.performance.page_weight_bytes = totalBytes;
  result.performance.page_weight_human = (totalBytes / (1024 * 1024)).toFixed(2) + " MB";

  // Forms analysis
  var forms = document.querySelectorAll("form");
  result.forms.count = forms.length;
  for (var ff = 0; ff < forms.length; ff++) {
    var formInputs = forms[ff].querySelectorAll("input[type=\"hidden\"]");
    for (var fi = 0; fi < formInputs.length; fi++) {
      var fname = (formInputs[fi].name || "").toLowerCase();
      if (fname.indexOf("gclid") !== -1) { result.forms.gclid_capture = true; }
      if (fname.indexOf("fbclid") !== -1) { result.forms.fbclid_capture = true; }
    }
  }

  // Compile issues
  // Critical issues
  if (result.tracking.gtm_ids.length === 0 && !result.tracking.gtag_js) {
    result.critical_issues.push("No GTM or gtag.js detected - no Google tracking infrastructure found");
  }
  if (result.tracking.google_ads_ids.length === 0 && result.tracking.gtm_ids.length > 0) {
    result.critical_issues.push("GTM installed but no Google Ads conversion tracking ID found");
  }
  if (!result.datalayer.exists && result.tracking.gtm_ids.length > 0) {
    result.critical_issues.push("GTM container found but dataLayer does not exist");
  }

  // High issues
  if (result.tracking.meta_pixel.detected && !result.tracking.meta_pixel.advanced_matching) {
    result.high_issues.push("Meta pixel detected without Advanced Matching - signal quality is degraded");
  }
  if (!result.consent_mode.detected) {
    result.high_issues.push("No Google Consent Mode detected - required for EU compliance and impacts ad signal quality");
  }
  if (result.consent_mode.detected && !result.consent_mode.v2_present) {
    result.high_issues.push("Consent Mode v1 only - missing v2 parameters (ad_user_data, ad_personalization) required by Google");
  }
  if (!result.datalayer.has_user_data && result.tracking.google_ads_ids.length > 0) {
    result.high_issues.push("No user_data in dataLayer - Enhanced Conversions for Google Ads not configured");
  }
  if (result.forms.count > 0 && !result.forms.gclid_capture) {
    result.high_issues.push("Forms found but no GCLID capture - offline conversion tracking will not work for Google Ads");
  }
  if (result.forms.count > 0 && !result.forms.fbclid_capture && result.tracking.meta_pixel.detected) {
    result.high_issues.push("Forms found with Meta pixel but no FBCLID capture - offline attribution will not work for Meta");
  }

  // Medium issues
  if (result.performance.ttfb_ms > 600) {
    result.medium_issues.push("TTFB is " + result.performance.ttfb_ms + "ms (over 600ms threshold)");
  }
  if (result.performance.load_time_ms > 3000) {
    result.medium_issues.push("Page load time is " + result.performance.load_time_ms + "ms (over 3s threshold)");
  }
  if (result.performance.page_weight_bytes > 3 * 1024 * 1024) {
    result.medium_issues.push("Page weight is " + result.performance.page_weight_human + " (over 3MB threshold)");
  }
  if (result.tracking.gtm_ids.length > 1) {
    result.medium_issues.push("Multiple GTM containers: " + result.tracking.gtm_ids.join(", "));
  }
  if (result.tracking.ga4_ids.length === 0) {
    result.medium_issues.push("No GA4 measurement ID detected");
  }
  if (!result.tracking.meta_pixel.detected) {
    result.medium_issues.push("No Meta pixel detected");
  }
  if (result.forms.count === 0) {
    result.medium_issues.push("No forms detected on this page");
  }

  return JSON.stringify(result, null, 2);
})();
