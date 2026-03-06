/**
 * extract-pixels.js
 * Extracts all tracking pixels from the current page.
 * Scans script tags and page HTML for GTM, Google Ads, GA4, Meta, TikTok,
 * LinkedIn, Pinterest, Bing, Snapchat pixels and related configurations.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    pixels: {
      gtm: [],
      google_ads: [],
      ga4: [],
      gtag_js: false,
      meta: {
        detected: false,
        pixel_ids: [],
        advanced_matching: false,
        advanced_matching_params: []
      },
      tiktok: {
        detected: false,
        pixel_ids: []
      },
      linkedin: { detected: false },
      pinterest: { detected: false },
      bing: { detected: false },
      snapchat: { detected: false }
    },
    warnings: []
  };

  var html = document.documentElement.outerHTML || "";
  var scripts = document.querySelectorAll("script");
  var headScripts = document.querySelectorAll("head script");
  var scriptSrcs = [];
  var scriptContents = [];

  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute("src") || "";
    var text = scripts[i].textContent || "";
    scriptSrcs.push(src);
    scriptContents.push(text);
  }

  var allText = html;
  for (var j = 0; j < scriptContents.length; j++) {
    allText += " " + scriptContents[j];
  }

  // GTM containers
  var gtmPattern = /GTM-[A-Z0-9]{4,8}/g;
  var gtmMatches = allText.match(gtmPattern);
  if (gtmMatches) {
    var gtmSeen = {};
    for (var g = 0; g < gtmMatches.length; g++) {
      if (!gtmSeen[gtmMatches[g]]) {
        gtmSeen[gtmMatches[g]] = true;
        result.pixels.gtm.push(gtmMatches[g]);
      }
    }
  }

  // Check if GTM is in head
  if (result.pixels.gtm.length > 0) {
    var gtmInHead = false;
    for (var h = 0; h < headScripts.length; h++) {
      var headSrc = headScripts[h].getAttribute("src") || "";
      var headText = headScripts[h].textContent || "";
      if (headSrc.indexOf("googletagmanager.com") !== -1 || headText.indexOf("googletagmanager.com") !== -1) {
        gtmInHead = true;
        break;
      }
    }
    if (!gtmInHead) {
      result.warnings.push("GTM script not found in <head> - may cause delayed firing");
    }
  }

  if (result.pixels.gtm.length > 1) {
    result.warnings.push("Multiple GTM containers detected: " + result.pixels.gtm.join(", ") + " - verify this is intentional");
  }

  // Google Ads IDs
  var awPattern = /AW-[0-9]{7,12}/g;
  var awMatches = allText.match(awPattern);
  if (awMatches) {
    var awSeen = {};
    for (var a = 0; a < awMatches.length; a++) {
      if (!awSeen[awMatches[a]]) {
        awSeen[awMatches[a]] = true;
        result.pixels.google_ads.push(awMatches[a]);
      }
    }
  }

  // GA4 measurement IDs
  var ga4Pattern = /G-[A-Z0-9]{6,12}/g;
  var ga4Matches = allText.match(ga4Pattern);
  if (ga4Matches) {
    var ga4Seen = {};
    for (var m = 0; m < ga4Matches.length; m++) {
      if (!ga4Seen[ga4Matches[m]]) {
        ga4Seen[ga4Matches[m]] = true;
        result.pixels.ga4.push(ga4Matches[m]);
      }
    }
  }

  // gtag.js detection
  for (var s = 0; s < scriptSrcs.length; s++) {
    if (scriptSrcs[s].indexOf("gtag/js") !== -1 || scriptSrcs[s].indexOf("googletagmanager.com/gtag") !== -1) {
      result.pixels.gtag_js = true;
      break;
    }
  }
  if (!result.pixels.gtag_js && allText.indexOf("gtag(") !== -1) {
    result.pixels.gtag_js = true;
  }

  // Meta Pixel
  for (var ms = 0; ms < scriptSrcs.length; ms++) {
    if (scriptSrcs[ms].indexOf("fbevents.js") !== -1 || scriptSrcs[ms].indexOf("connect.facebook.net") !== -1) {
      result.pixels.meta.detected = true;
      break;
    }
  }
  if (!result.pixels.meta.detected && (allText.indexOf("fbevents.js") !== -1 || allText.indexOf("fbq(") !== -1)) {
    result.pixels.meta.detected = true;
  }

  // Extract Meta pixel IDs from fbq('init', 'PIXEL_ID') calls
  var fbqInitPattern = /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/g;
  var fbqMatch;
  var fbqSeen = {};
  while ((fbqMatch = fbqInitPattern.exec(allText)) !== null) {
    if (!fbqSeen[fbqMatch[1]]) {
      fbqSeen[fbqMatch[1]] = true;
      result.pixels.meta.pixel_ids.push(fbqMatch[1]);
    }
  }

  if (result.pixels.meta.pixel_ids.length > 1) {
    result.warnings.push("Multiple Meta pixel inits detected: " + result.pixels.meta.pixel_ids.join(", ") + " - verify this is intentional");
  }

  // Advanced Matching detection for Meta
  // Look for fbq('init', 'ID', { em: ..., ph: ... })
  var advMatchPattern = /fbq\s*\(\s*['"]init['"]\s*,\s*['"][^'"]+['"]\s*,\s*\{([^}]+)\}/g;
  var advMatch;
  while ((advMatch = advMatchPattern.exec(allText)) !== null) {
    var paramBlock = advMatch[1];
    var advParams = ["em", "ph", "fn", "ln", "ge", "db", "ct", "st", "zp", "country", "external_id"];
    for (var ap = 0; ap < advParams.length; ap++) {
      if (paramBlock.indexOf(advParams[ap]) !== -1) {
        result.pixels.meta.advanced_matching = true;
        if (result.pixels.meta.advanced_matching_params.indexOf(advParams[ap]) === -1) {
          result.pixels.meta.advanced_matching_params.push(advParams[ap]);
        }
      }
    }
  }

  // TikTok Pixel
  for (var ts = 0; ts < scriptSrcs.length; ts++) {
    if (scriptSrcs[ts].indexOf("analytics.tiktok.com") !== -1) {
      result.pixels.tiktok.detected = true;
      break;
    }
  }
  if (!result.pixels.tiktok.detected && allText.indexOf("analytics.tiktok.com") !== -1) {
    result.pixels.tiktok.detected = true;
  }
  if (!result.pixels.tiktok.detected && allText.indexOf("ttq.load") !== -1) {
    result.pixels.tiktok.detected = true;
  }

  // Extract TikTok pixel IDs from ttq.load('PIXEL_ID')
  var ttqPattern = /ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/g;
  var ttqMatch;
  var ttqSeen = {};
  while ((ttqMatch = ttqPattern.exec(allText)) !== null) {
    if (!ttqSeen[ttqMatch[1]]) {
      ttqSeen[ttqMatch[1]] = true;
      result.pixels.tiktok.pixel_ids.push(ttqMatch[1]);
    }
  }

  // LinkedIn
  if (allText.indexOf("snap.licdn.com") !== -1 || allText.indexOf("linkedin.com/px") !== -1 || allText.indexOf("_linkedin_partner_id") !== -1 || allText.indexOf("linkedin.com/collect") !== -1) {
    result.pixels.linkedin.detected = true;
  }

  // Pinterest
  if (allText.indexOf("ct.pinterest.com") !== -1 || allText.indexOf("pintrk(") !== -1 || allText.indexOf("s.pinimg.com/ct/core.js") !== -1) {
    result.pixels.pinterest.detected = true;
  }

  // Bing / Microsoft Ads
  if (allText.indexOf("bat.bing.com") !== -1 || allText.indexOf("uetq") !== -1 || allText.indexOf("clarity.ms") !== -1) {
    result.pixels.bing.detected = true;
  }

  // Snapchat
  if (allText.indexOf("sc-static.net/scevent.min.js") !== -1 || allText.indexOf("snaptr(") !== -1 || allText.indexOf("tr.snapchat.com") !== -1) {
    result.pixels.snapchat.detected = true;
  }

  return JSON.stringify(result, null, 2);
})();
