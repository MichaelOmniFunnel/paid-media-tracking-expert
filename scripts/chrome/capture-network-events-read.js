/**
 * capture-network-events-read.js
 * Reads the results from window.__ofm_pixel_fires set up by
 * capture-network-events.js. Summarizes total fires, count by platform,
 * and lists all captured tracking requests.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 * Must run capture-network-events.js first to set up the observer.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    status: "error",
    data: null,
    summary: null
  };

  if (!window.__ofm_pixel_fires) {
    result.status = "not_initialized";
    result.message = "No pixel fire data found. Run capture-network-events.js first to set up the observer.";
    return JSON.stringify(result, null, 2);
  }

  var data = window.__ofm_pixel_fires;
  result.status = "success";

  // Build summary
  var summary = {
    observer_started: data.started,
    read_at: new Date().toISOString(),
    total_fires: data.total,
    by_platform: data.by_platform,
    platforms_detected: Object.keys(data.by_platform),
    platform_count: Object.keys(data.by_platform).length
  };

  // Truncate URLs for readability in the fire list
  var fires = [];
  for (var i = 0; i < data.fires.length; i++) {
    var fire = data.fires[i];
    var shortUrl = fire.url;
    if (shortUrl.length > 200) {
      shortUrl = shortUrl.substring(0, 200) + "...";
    }
    fires.push({
      index: i + 1,
      platform: fire.platform,
      url: shortUrl,
      timestamp: fire.timestamp,
      duration_ms: fire.duration_ms,
      transfer_size: fire.transfer_size,
      source: fire.source
    });
  }

  result.summary = summary;
  result.data = {
    fires: fires
  };

  return JSON.stringify(result, null, 2);
})();
