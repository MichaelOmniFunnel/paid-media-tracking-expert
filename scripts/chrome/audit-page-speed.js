/**
 * audit-page-speed.js
 * Analyzes page speed, resource loading, and Core Web Vitals signals.
 * Checks navigation timing, resource summary, third-party scripts,
 * above-fold image audit, and CLS indicators.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    navigation_timing: {
      ttfb_ms: 0,
      dom_interactive_ms: 0,
      dom_complete_ms: 0,
      load_event_ms: 0,
      total_transfer_size_bytes: 0
    },
    resources: {
      total_count: 0,
      total_size_bytes: 0,
      by_type: {
        scripts: { count: 0, size_bytes: 0 },
        styles: { count: 0, size_bytes: 0 },
        images: { count: 0, size_bytes: 0 },
        fonts: { count: 0, size_bytes: 0 },
        other: { count: 0, size_bytes: 0 }
      }
    },
    third_party_scripts: [],
    above_fold_images: [],
    cls_indicators: {
      images_without_dimensions: 0,
      iframes_without_dimensions: 0,
      videos_without_dimensions: 0,
      elements: []
    },
    warnings: []
  };

  // Navigation timing
  var navEntries = performance.getEntriesByType("navigation");
  if (navEntries.length > 0) {
    var nav = navEntries[0];
    result.navigation_timing.ttfb_ms = Math.round(nav.responseStart - nav.requestStart);
    result.navigation_timing.dom_interactive_ms = Math.round(nav.domInteractive);
    result.navigation_timing.dom_complete_ms = Math.round(nav.domComplete);
    result.navigation_timing.load_event_ms = Math.round(nav.loadEventEnd);
    result.navigation_timing.total_transfer_size_bytes = nav.transferSize || 0;
  } else if (performance.timing) {
    var t = performance.timing;
    result.navigation_timing.ttfb_ms = t.responseStart - t.requestStart;
    result.navigation_timing.dom_interactive_ms = t.domInteractive - t.navigationStart;
    result.navigation_timing.dom_complete_ms = t.domComplete - t.navigationStart;
    result.navigation_timing.load_event_ms = t.loadEventEnd - t.navigationStart;
  }

  // Resource summary
  var resources = performance.getEntriesByType("resource");
  var currentHost = window.location.hostname;
  var thirdPartyScripts = [];
  result.resources.total_count = resources.length;

  for (var r = 0; r < resources.length; r++) {
    var res = resources[r];
    var size = res.transferSize || res.encodedBodySize || 0;
    result.resources.total_size_bytes += size;
    var type = res.initiatorType || "";
    if (type === "script") {
      result.resources.by_type.scripts.count++;
      result.resources.by_type.scripts.size_bytes += size;
      try {
        var scriptUrl = new URL(res.name);
        if (scriptUrl.hostname !== currentHost && scriptUrl.hostname.indexOf(currentHost) === -1) {
          thirdPartyScripts.push({
            url: res.name.length > 150 ? res.name.substring(0, 150) + "..." : res.name,
            hostname: scriptUrl.hostname,
            size_bytes: size,
            duration_ms: Math.round(res.duration)
          });
        }
      } catch (e) {}
    } else if (type === "css" || type === "link") {
      result.resources.by_type.styles.count++;
      result.resources.by_type.styles.size_bytes += size;
    } else if (type === "img" || type === "image") {
      result.resources.by_type.images.count++;
      result.resources.by_type.images.size_bytes += size;
    } else if (type === "font" || (res.name && (res.name.indexOf(".woff") !== -1 || res.name.indexOf(".ttf") !== -1 || res.name.indexOf(".otf") !== -1))) {
      result.resources.by_type.fonts.count++;
      result.resources.by_type.fonts.size_bytes += size;
    } else {
      result.resources.by_type.other.count++;
      result.resources.by_type.other.size_bytes += size;
    }
  }

  thirdPartyScripts.sort(function(a, b) { return b.size_bytes - a.size_bytes; });
  result.third_party_scripts = thirdPartyScripts;

  // Above-fold image audit
  var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  var images = document.querySelectorAll("img");
  for (var im = 0; im < images.length; im++) {
    var img = images[im];
    var rect = img.getBoundingClientRect();
    if (rect.top < viewportHeight && rect.bottom > 0 && rect.width > 0) {
      var imgInfo = {
        src: (img.src || img.getAttribute("data-src") || "").substring(0, 120),
        natural_width: img.naturalWidth,
        natural_height: img.naturalHeight,
        display_width: Math.round(rect.width),
        display_height: Math.round(rect.height),
        issues: []
      };
      var imgSrc = (img.src || "").toLowerCase();
      var isModernFormat = imgSrc.indexOf(".webp") !== -1 || imgSrc.indexOf(".avif") !== -1;
      if (!isModernFormat && imgSrc.indexOf("data:image/svg") === -1 && img.src) {
        imgInfo.issues.push("Not using WebP/AVIF format");
      }
      if (img.naturalWidth > 0 && rect.width > 0) {
        var ratio = img.naturalWidth / rect.width;
        if (ratio > 2.5) {
          imgInfo.issues.push("Image is " + ratio.toFixed(1) + "x larger than displayed - consider resizing");
        }
      }
      var hasWidth = img.getAttribute("width") || (img.style && img.style.width);
      var hasHeight = img.getAttribute("height") || (img.style && img.style.height);
      if (!hasWidth || !hasHeight) {
        imgInfo.issues.push("Missing explicit width/height attributes (CLS risk)");
      }
      if (imgInfo.issues.length > 0) {
        result.above_fold_images.push(imgInfo);
      }
    }
  }

  // CLS indicators - images without dimensions
  for (var ci = 0; ci < images.length; ci++) {
    var cImg = images[ci];
    var cHasW = cImg.getAttribute("width") || (cImg.style && cImg.style.width);
    var cHasH = cImg.getAttribute("height") || (cImg.style && cImg.style.height);
    if (!cHasW || !cHasH) {
      result.cls_indicators.images_without_dimensions++;
      if (result.cls_indicators.elements.length < 10) {
        result.cls_indicators.elements.push({ tag: "img", src: (cImg.src || "").substring(0, 100) });
      }
    }
  }

  // CLS indicators - iframes without dimensions
  var iframes = document.querySelectorAll("iframe");
  for (var fi = 0; fi < iframes.length; fi++) {
    var iframe = iframes[fi];
    var iHasW = iframe.getAttribute("width") || (iframe.style && iframe.style.width);
    var iHasH = iframe.getAttribute("height") || (iframe.style && iframe.style.height);
    if (!iHasW || !iHasH) {
      result.cls_indicators.iframes_without_dimensions++;
      if (result.cls_indicators.elements.length < 10) {
        result.cls_indicators.elements.push({ tag: "iframe", src: (iframe.src || "").substring(0, 100) });
      }
    }
  }

  // CLS indicators - videos without dimensions
  var videos = document.querySelectorAll("video");
  for (var vi = 0; vi < videos.length; vi++) {
    var video = videos[vi];
    var vHasW = video.getAttribute("width") || (video.style && video.style.width);
    var vHasH = video.getAttribute("height") || (video.style && video.style.height);
    if (!vHasW || !vHasH) {
      result.cls_indicators.videos_without_dimensions++;
      if (result.cls_indicators.elements.length < 10) {
        result.cls_indicators.elements.push({ tag: "video", src: (video.src || "").substring(0, 100) });
      }
    }
  }

  // Warnings
  if (result.navigation_timing.ttfb_ms > 600) {
    result.warnings.push("TTFB is " + result.navigation_timing.ttfb_ms + "ms (threshold: 600ms) - consider server optimization or CDN");
  }
  if (result.navigation_timing.load_event_ms > 3000) {
    result.warnings.push("Page load time is " + result.navigation_timing.load_event_ms + "ms (threshold: 3000ms) - page is loading slowly");
  }
  var totalMB = (result.resources.total_size_bytes / (1024 * 1024)).toFixed(2);
  if (result.resources.total_size_bytes > 3 * 1024 * 1024) {
    result.warnings.push("Total page weight is " + totalMB + "MB (threshold: 3MB) - consider reducing resource sizes");
  }
  if (result.resources.by_type.scripts.count > 30) {
    result.warnings.push("Page loads " + result.resources.by_type.scripts.count + " scripts (threshold: 30) - consider reducing or deferring scripts");
  }

  // Add human-readable sizes
  result.resources.total_size_human = totalMB + " MB";
  result.resources.by_type.scripts.size_human = (result.resources.by_type.scripts.size_bytes / 1024).toFixed(1) + " KB";
  result.resources.by_type.styles.size_human = (result.resources.by_type.styles.size_bytes / 1024).toFixed(1) + " KB";
  result.resources.by_type.images.size_human = (result.resources.by_type.images.size_bytes / 1024).toFixed(1) + " KB";
  result.resources.by_type.fonts.size_human = (result.resources.by_type.fonts.size_bytes / 1024).toFixed(1) + " KB";

  return JSON.stringify(result, null, 2);
})();
