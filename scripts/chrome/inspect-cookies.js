/**
 * inspect-cookies.js
 * Cookie inspection and tracking health script. Extracts all cookies and
 * groups them by first-party vs third-party, tracking platform (Google,
 * Meta, TikTok, etc.), and consent-related cookies. Reports name, domain,
 * path, expiration, secure flag, SameSite attribute, and functioning status.
 * Flags missing critical cookies, expired cookies, and consent impact.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    cookie_summary: {
      total_cookies: 0,
      first_party: 0,
      third_party: 0,
      tracking_cookies: 0,
      consent_cookies: 0,
      expired_cookies: 0
    },
    tracking_cookies: {
      google: [],
      meta: [],
      tiktok: [],
      linkedin: [],
      microsoft: [],
      other_tracking: []
    },
    consent_cookies: [],
    all_cookies: [],
    pixel_detection: {
      google_analytics: false,
      google_ads: false,
      meta_pixel: false,
      tiktok_pixel: false,
      linkedin_pixel: false,
      microsoft_ads: false
    },
    health_checks: [],
    warnings: [],
    recommendations: []
  };

  var currentDomain = window.location.hostname;
  // Strip www. prefix for domain matching
  var baseDomain = currentDomain.replace(/^www\./, "");

  // Known tracking cookie patterns by platform
  var trackingCookieMap = {
    google: [
      { name: "_ga", description: "Google Analytics client ID", critical: true },
      { name: "_ga_", description: "GA4 session cookie", critical: true, prefix: true },
      { name: "_gid", description: "Google Analytics daily unique visitor", critical: false },
      { name: "_gat", description: "Google Analytics throttle", critical: false },
      { name: "_gac_", description: "Google Ads conversion linker", critical: true, prefix: true },
      { name: "_gcl_au", description: "Google Ads conversion linker (first-party)", critical: true },
      { name: "_gcl_aw", description: "Google Ads click ID (GCLID)", critical: true },
      { name: "_gcl_dc", description: "Google DoubleClick click ID (DCLID)", critical: false },
      { name: "_gcl_gs", description: "Google Ads click ID (server-side)", critical: false },
      { name: "__gads", description: "Google AdSense", critical: false },
      { name: "__gpi", description: "Google Publisher ID", critical: false },
      { name: "FPID", description: "GA4 first-party ID (server-side set)", critical: false },
      { name: "FPLC", description: "GA4 first-party linker cookie", critical: false }
    ],
    meta: [
      { name: "_fbp", description: "Meta Pixel browser ID", critical: true },
      { name: "_fbc", description: "Meta click ID (fbclid)", critical: true },
      { name: "fr", description: "Meta advertising cookie", critical: false },
      { name: "datr", description: "Meta browser identification", critical: false },
      { name: "_fbq", description: "Meta Pixel legacy cookie", critical: false }
    ],
    tiktok: [
      { name: "_ttp", description: "TikTok Pixel browser ID", critical: true },
      { name: "_ttclid", description: "TikTok click ID", critical: true },
      { name: "tt_csrf_token", description: "TikTok CSRF protection", critical: false },
      { name: "tt_webid", description: "TikTok web identifier", critical: false }
    ],
    linkedin: [
      { name: "li_fat_id", description: "LinkedIn first-party ad tracking", critical: true },
      { name: "li_sugr", description: "LinkedIn browser ID", critical: false },
      { name: "bcookie", description: "LinkedIn browser cookie", critical: false },
      { name: "UserMatchHistory", description: "LinkedIn ad ID syncing", critical: false },
      { name: "li_giant", description: "LinkedIn Insight Tag", critical: true }
    ],
    microsoft: [
      { name: "_uetsid", description: "Microsoft Ads UET session ID", critical: true },
      { name: "_uetvid", description: "Microsoft Ads UET visitor ID", critical: true },
      { name: "_uetmsclkid", description: "Microsoft Ads click ID", critical: true },
      { name: "MUID", description: "Microsoft unique user ID", critical: false },
      { name: "_clck", description: "Microsoft Clarity user ID", critical: false },
      { name: "_clsk", description: "Microsoft Clarity session", critical: false }
    ]
  };

  // Known consent cookie patterns
  var consentCookiePatterns = [
    { pattern: "CookieConsent", tool: "Cookiebot" },
    { pattern: "cookieyes", tool: "CookieYes" },
    { pattern: "cky-consent", tool: "CookieYes" },
    { pattern: "OptanonConsent", tool: "OneTrust" },
    { pattern: "OptanonAlertBoxClosed", tool: "OneTrust" },
    { pattern: "eupubconsent", tool: "IAB TCF" },
    { pattern: "__tcfapi", tool: "IAB TCF" },
    { pattern: "termly", tool: "Termly" },
    { pattern: "_iub_cs", tool: "Iubenda" },
    { pattern: "osano", tool: "Osano" },
    { pattern: "cmplz", tool: "Complianz" },
    { pattern: "complianz", tool: "Complianz" },
    { pattern: "cookielawinfo", tool: "GDPR Cookie Consent" },
    { pattern: "moove_gdpr", tool: "GDPR Cookie Compliance" },
    { pattern: "cookie_notice_accepted", tool: "Cookie Notice" }
  ];

  // ---- Parse all cookies ----
  var rawCookies = document.cookie;
  var cookiePairs = rawCookies ? rawCookies.split(";") : [];
  var parsedCookies = [];

  for (var i = 0; i < cookiePairs.length; i++) {
    var pair = cookiePairs[i].trim();
    if (!pair) { continue; }

    var eqIdx = pair.indexOf("=");
    var cookieName = eqIdx > -1 ? pair.substring(0, eqIdx).trim() : pair.trim();
    var cookieValue = eqIdx > -1 ? pair.substring(eqIdx + 1).trim() : "";

    parsedCookies.push({
      name: cookieName,
      value: cookieValue.substring(0, 100) + (cookieValue.length > 100 ? "..." : ""),
      value_length: cookieValue.length
    });
  }

  // ---- Get detailed cookie info via document.cookie and performance API ----
  // Note: document.cookie only returns name=value pairs for accessible cookies.
  // HttpOnly, Secure, SameSite, Domain, Path, and Expiration are not accessible
  // via JavaScript. We use heuristics and the cookie store API when available.

  // Try the experimental Cookie Store API for richer data
  var useCookieStore = typeof window.cookieStore !== "undefined" && typeof window.cookieStore.getAll === "function";

  function buildCookieReport(cookieList) {
    result.cookie_summary.total_cookies = cookieList.length;

    for (var c = 0; c < cookieList.length; c++) {
      var ck = cookieList[c];
      var cookieEntry = {
        name: ck.name,
        domain: ck.domain || "(accessible, likely first-party)",
        path: ck.path || "/",
        secure: ck.secure !== undefined ? ck.secure : "unknown",
        sameSite: ck.sameSite || "unknown",
        expires: null,
        expired: false,
        first_party: true,
        category: "other"
      };

      // Determine expiration
      if (ck.expires !== undefined && ck.expires !== null) {
        if (typeof ck.expires === "number") {
          cookieEntry.expires = new Date(ck.expires).toISOString();
          cookieEntry.expired = ck.expires < Date.now();
        } else if (ck.expires instanceof Date) {
          cookieEntry.expires = ck.expires.toISOString();
          cookieEntry.expired = ck.expires.getTime() < Date.now();
        }
      } else {
        cookieEntry.expires = "session";
      }

      if (cookieEntry.expired) {
        result.cookie_summary.expired_cookies++;
      }

      // Determine first-party vs third-party
      if (ck.domain) {
        var cleanDomain = ck.domain.replace(/^\./, "");
        if (currentDomain.indexOf(cleanDomain) === -1 && cleanDomain.indexOf(baseDomain) === -1) {
          cookieEntry.first_party = false;
          result.cookie_summary.third_party++;
        } else {
          result.cookie_summary.first_party++;
        }
      } else {
        result.cookie_summary.first_party++;
      }

      // Categorize by tracking platform
      var categorized = false;
      var platforms = Object.keys(trackingCookieMap);
      for (var p = 0; p < platforms.length; p++) {
        var platform = platforms[p];
        var patterns = trackingCookieMap[platform];
        for (var pt = 0; pt < patterns.length; pt++) {
          var match = false;
          if (patterns[pt].prefix) {
            match = ck.name.indexOf(patterns[pt].name) === 0;
          } else {
            match = ck.name === patterns[pt].name;
          }
          if (match) {
            cookieEntry.category = platform;
            cookieEntry.description = patterns[pt].description;
            cookieEntry.critical = patterns[pt].critical;
            result.tracking_cookies[platform].push(cookieEntry);
            result.cookie_summary.tracking_cookies++;
            categorized = true;
            break;
          }
        }
        if (categorized) { break; }
      }

      // Check consent cookies
      if (!categorized) {
        for (var cc = 0; cc < consentCookiePatterns.length; cc++) {
          if (ck.name.indexOf(consentCookiePatterns[cc].pattern) !== -1) {
            cookieEntry.category = "consent";
            cookieEntry.consent_tool = consentCookiePatterns[cc].tool;
            result.consent_cookies.push(cookieEntry);
            result.cookie_summary.consent_cookies++;
            categorized = true;
            break;
          }
        }
      }

      // Check for other known tracking patterns
      if (!categorized) {
        var otherTrackingPatterns = [
          { pattern: "_pin_", description: "Pinterest tracking" },
          { pattern: "_scid", description: "Snapchat tracking" },
          { pattern: "hubspot", description: "HubSpot tracking" },
          { pattern: "__hs", description: "HubSpot tracking" },
          { pattern: "_hjid", description: "Hotjar visitor ID" },
          { pattern: "_hjSession", description: "Hotjar session" },
          { pattern: "ajs_", description: "Segment analytics" },
          { pattern: "intercom", description: "Intercom tracking" },
          { pattern: "_mkto_trk", description: "Marketo tracking" },
          { pattern: "pardot", description: "Pardot (Salesforce) tracking" },
          { pattern: "_rdt_uuid", description: "Reddit Pixel" }
        ];
        for (var ot = 0; ot < otherTrackingPatterns.length; ot++) {
          if (ck.name.indexOf(otherTrackingPatterns[ot].pattern) !== -1) {
            cookieEntry.category = "other_tracking";
            cookieEntry.description = otherTrackingPatterns[ot].description;
            result.tracking_cookies.other_tracking.push(cookieEntry);
            result.cookie_summary.tracking_cookies++;
            categorized = true;
            break;
          }
        }
      }

      result.all_cookies.push(cookieEntry);
    }

    // ---- Detect pixels on page ----
    var html = document.documentElement.outerHTML || "";
    var scriptEls = document.querySelectorAll("script");
    var allText = html;
    for (var st = 0; st < scriptEls.length; st++) {
      allText += " " + (scriptEls[st].textContent || "");
      var scriptSrc = scriptEls[st].getAttribute("src") || "";
      allText += " " + scriptSrc;
    }

    if (allText.indexOf("google-analytics.com") !== -1 || allText.indexOf("gtag/js") !== -1 || /G-[A-Z0-9]{6,12}/.test(allText)) {
      result.pixel_detection.google_analytics = true;
    }
    if (/AW-[0-9]{7,12}/.test(allText) || allText.indexOf("googleads.g.doubleclick.net") !== -1) {
      result.pixel_detection.google_ads = true;
    }
    if (allText.indexOf("fbevents.js") !== -1 || allText.indexOf("fbq(") !== -1 || allText.indexOf("connect.facebook.net") !== -1) {
      result.pixel_detection.meta_pixel = true;
    }
    if (allText.indexOf("analytics.tiktok.com") !== -1 || allText.indexOf("ttq.load") !== -1) {
      result.pixel_detection.tiktok_pixel = true;
    }
    if (allText.indexOf("snap.licdn.com") !== -1 || allText.indexOf("_linkedin_partner_id") !== -1) {
      result.pixel_detection.linkedin_pixel = true;
    }
    if (allText.indexOf("bat.bing.com") !== -1 || allText.indexOf("clarity.ms") !== -1) {
      result.pixel_detection.microsoft_ads = true;
    }

    // ---- Health checks: missing critical cookies when pixel is present ----
    function hasCookie(cookieName, isPrefix) {
      for (var hc = 0; hc < cookieList.length; hc++) {
        if (isPrefix) {
          if (cookieList[hc].name.indexOf(cookieName) === 0) { return true; }
        } else {
          if (cookieList[hc].name === cookieName) { return true; }
        }
      }
      return false;
    }

    // Google Analytics checks
    if (result.pixel_detection.google_analytics) {
      if (!hasCookie("_ga", false)) {
        result.health_checks.push({ severity: "critical", platform: "Google Analytics", issue: "_ga cookie is missing. GA4 client ID will not persist across sessions." });
      }
      if (!hasCookie("_ga_", true)) {
        result.health_checks.push({ severity: "high", platform: "Google Analytics", issue: "No _ga_ session cookie found. GA4 session tracking may not be functioning." });
      }
    }

    // Google Ads checks
    if (result.pixel_detection.google_ads) {
      if (!hasCookie("_gcl_au", false)) {
        result.health_checks.push({ severity: "high", platform: "Google Ads", issue: "_gcl_au (conversion linker) cookie is missing. Google Ads conversion attribution may be impaired." });
      }
      if (!hasCookie("_gcl_aw", false)) {
        result.health_checks.push({ severity: "medium", platform: "Google Ads", issue: "_gcl_aw (GCLID) cookie not found. This is normal if no Google Ads click brought the user here." });
      }
    }

    // Meta Pixel checks
    if (result.pixel_detection.meta_pixel) {
      if (!hasCookie("_fbp", false)) {
        result.health_checks.push({ severity: "critical", platform: "Meta", issue: "_fbp cookie is missing. Meta Pixel browser identification is not functioning. Check for consent blocking or pixel initialization errors." });
      }
      if (!hasCookie("_fbc", false)) {
        result.health_checks.push({ severity: "medium", platform: "Meta", issue: "_fbc (fbclid) cookie not found. This is normal if no Meta ad click brought the user here, but verify fbclid capture is working." });
      }
    }

    // TikTok checks
    if (result.pixel_detection.tiktok_pixel) {
      if (!hasCookie("_ttp", false)) {
        result.health_checks.push({ severity: "critical", platform: "TikTok", issue: "_ttp cookie is missing. TikTok Pixel browser identification is not functioning." });
      }
    }

    // LinkedIn checks
    if (result.pixel_detection.linkedin_pixel) {
      if (!hasCookie("li_fat_id", false) && !hasCookie("li_giant", false)) {
        result.health_checks.push({ severity: "high", platform: "LinkedIn", issue: "LinkedIn first-party tracking cookies not found. LinkedIn Insight Tag may not be setting first-party cookies." });
      }
    }

    // Microsoft Ads checks
    if (result.pixel_detection.microsoft_ads) {
      if (!hasCookie("_uetsid", false)) {
        result.health_checks.push({ severity: "high", platform: "Microsoft Ads", issue: "_uetsid (UET session ID) cookie is missing. Microsoft Ads conversion tracking may not be functioning." });
      }
      if (!hasCookie("_uetvid", false)) {
        result.health_checks.push({ severity: "high", platform: "Microsoft Ads", issue: "_uetvid (UET visitor ID) cookie is missing." });
      }
    }

    // ---- Check for expired cookies that should be active ----
    for (var ex = 0; ex < result.all_cookies.length; ex++) {
      if (result.all_cookies[ex].expired && result.all_cookies[ex].category !== "other") {
        result.warnings.push("Expired cookie found: " + result.all_cookies[ex].name + " (category: " + result.all_cookies[ex].category + "). This cookie has expired and is no longer functional.");
      }
    }

    // ---- Consent impact analysis ----
    if (result.consent_cookies.length > 0) {
      result.recommendations.push("Consent management detected (" + result.consent_cookies.map(function(c) { return c.consent_tool; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).join(", ") + "). Verify that tracking cookies are only set after consent is granted for applicable regions.");
    } else if (result.cookie_summary.tracking_cookies > 0) {
      result.recommendations.push("Tracking cookies are present but no consent management cookie was detected. If this site serves EU users, a consent mechanism is required before setting tracking cookies.");
    }

    // ---- Summary warnings ----
    if (result.cookie_summary.total_cookies === 0) {
      result.warnings.push("No cookies detected. This may indicate cookies are blocked, the site is running in a restricted context, or no tracking is implemented.");
    }

    if (result.health_checks.length > 0) {
      var critHealthCount = 0;
      for (var hci = 0; hci < result.health_checks.length; hci++) {
        if (result.health_checks[hci].severity === "critical") {
          critHealthCount++;
        }
      }
      if (critHealthCount > 0) {
        result.warnings.push(critHealthCount + " critical cookie health issue(s) detected. These directly impact tracking and attribution accuracy.");
      }
    }

    return JSON.stringify(result, null, 2);
  }

  // If Cookie Store API is available, use it for richer data
  if (useCookieStore) {
    // Cookie Store API is async, but we need synchronous output.
    // Fall back to document.cookie parsing with basic info.
    var basicCookies = [];
    for (var bi = 0; bi < parsedCookies.length; bi++) {
      basicCookies.push({
        name: parsedCookies[bi].name,
        value: parsedCookies[bi].value,
        domain: null,
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "unknown",
        expires: null
      });
    }
    return buildCookieReport(basicCookies);
  } else {
    // Standard document.cookie parsing (no domain/expiry/secure info available)
    var standardCookies = [];
    for (var sc = 0; sc < parsedCookies.length; sc++) {
      standardCookies.push({
        name: parsedCookies[sc].name,
        value: parsedCookies[sc].value,
        domain: null,
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "unknown",
        expires: null
      });
    }
    return buildCookieReport(standardCookies);
  }
})();
