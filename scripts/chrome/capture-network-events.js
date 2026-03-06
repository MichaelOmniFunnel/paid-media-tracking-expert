/**
 * capture-network-events.js
 * Sets up a PerformanceObserver to capture all tracking-related network
 * requests. Results are stored in window.__ofm_pixel_fires for later
 * retrieval via capture-network-events-read.js.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 * Run this BEFORE triggering actions (page loads, form submits, etc.),
 * then use capture-network-events-read.js to read the results.
 */
(function() {
  var platformPatterns = [
    { platform: "meta", patterns: ["facebook.com/tr", "connect.facebook.net"] },
    { platform: "google_analytics", patterns: ["google-analytics.com", "analytics.google.com"] },
    { platform: "google_ads", patterns: ["googleads.g.doubleclick.net", "googleadservices.com"] },
    { platform: "tiktok", patterns: ["analytics.tiktok.com"] },
    { platform: "bing", patterns: ["bat.bing.com"] },
    { platform: "linkedin", patterns: ["snap.licdn.com"] },
    { platform: "pinterest", patterns: ["ct.pinterest.com"] },
    { platform: "snapchat", patterns: ["tr.snapchat.com", "sc-static.net"] },
    { platform: "gtm", patterns: ["googletagmanager.com"] }
  ];

  function classifyUrl(url) {
    for (var i = 0; i < platformPatterns.length; i++) {
      var pp = platformPatterns[i];
      for (var j = 0; j < pp.patterns.length; j++) {
        if (url.indexOf(pp.patterns[j]) !== -1) {
          return pp.platform;
        }
      }
    }
    return null;
  }

  // Initialize storage
  window.__ofm_pixel_fires = {
    started: new Date().toISOString(),
    fires: [],
    total: 0,
    by_platform: {}
  };

  // Capture existing resource entries first
  var existingEntries = performance.getEntriesByType("resource");
  for (var e = 0; e < existingEntries.length; e++) {
    var existingUrl = existingEntries[e].name;
    var existingPlatform = classifyUrl(existingUrl);
    if (existingPlatform) {
      var existingFire = {
        platform: existingPlatform,
        url: existingUrl,
        timestamp: new Date(performance.timeOrigin + existingEntries[e].startTime).toISOString(),
        duration_ms: Math.round(existingEntries[e].duration),
        transfer_size: existingEntries[e].transferSize || 0,
        source: "existing"
      };
      window.__ofm_pixel_fires.fires.push(existingFire);
      window.__ofm_pixel_fires.total++;
      if (!window.__ofm_pixel_fires.by_platform[existingPlatform]) {
        window.__ofm_pixel_fires.by_platform[existingPlatform] = 0;
      }
      window.__ofm_pixel_fires.by_platform[existingPlatform]++;
    }
  }

  // Set up PerformanceObserver for new requests
  var observer = new PerformanceObserver(function(list) {
    var entries = list.getEntries();
    for (var i = 0; i < entries.length; i++) {
      var url = entries[i].name;
      var platform = classifyUrl(url);
      if (platform) {
        var fire = {
          platform: platform,
          url: url,
          timestamp: new Date(performance.timeOrigin + entries[i].startTime).toISOString(),
          duration_ms: Math.round(entries[i].duration),
          transfer_size: entries[i].transferSize || 0,
          source: "observed"
        };
        window.__ofm_pixel_fires.fires.push(fire);
        window.__ofm_pixel_fires.total++;
        if (!window.__ofm_pixel_fires.by_platform[platform]) {
          window.__ofm_pixel_fires.by_platform[platform] = 0;
        }
        window.__ofm_pixel_fires.by_platform[platform]++;
      }
    }
  });

  observer.observe({ type: "resource", buffered: false });

  // Store observer reference for potential cleanup
  window.__ofm_pixel_observer = observer;

  var result = {
    status: "active",
    message: "PerformanceObserver is now capturing tracking pixel network requests. Existing requests have been captured. Navigate or interact with the page, then run capture-network-events-read.js to view results.",
    existing_fires_captured: window.__ofm_pixel_fires.total,
    platforms_monitored: [
      "meta (facebook.com/tr, connect.facebook.net)",
      "google_analytics (google-analytics.com, analytics.google.com)",
      "google_ads (googleads.g.doubleclick.net, googleadservices.com)",
      "tiktok (analytics.tiktok.com)",
      "bing (bat.bing.com)",
      "linkedin (snap.licdn.com)",
      "pinterest (ct.pinterest.com)",
      "snapchat (tr.snapchat.com, sc-static.net)",
      "gtm (googletagmanager.com)"
    ]
  };

  return JSON.stringify(result, null, 2);
})();
