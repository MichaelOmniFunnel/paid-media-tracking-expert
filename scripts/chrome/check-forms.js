/**
 * check-forms.js
 * Analyzes all forms on the page for conversion optimization.
 * Checks field types, hidden tracking fields, submit button text,
 * and flags common issues.
 *
 * Run via mcp__claude-in-chrome__javascript_tool on any client website.
 */
(function() {
  var result = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    forms: {
      total_count: 0,
      details: []
    },
    summary: {
      has_gclid_capture: false,
      has_fbclid_capture: false,
      has_ttclid_capture: false,
      has_utm_capture: false,
      total_visible_fields: 0
    },
    warnings: []
  };

  var forms = document.querySelectorAll("form");
  result.forms.total_count = forms.length;

  if (forms.length === 0) {
    // Also check for form-like structures (div-based forms)
    var formLike = document.querySelectorAll("[data-form], .form, .wpcf7, .gform_wrapper, .hs-form, .forminator-custom-form");
    if (formLike.length > 0) {
      result.warnings.push("No <form> elements found, but " + formLike.length + " form-like container(s) detected");
    } else {
      result.warnings.push("No forms found on this page");
    }
    return JSON.stringify(result, null, 2);
  }

  for (var f = 0; f < forms.length; f++) {
    var form = forms[f];
    var formInfo = {
      index: f + 1,
      id: form.id || null,
      name: form.getAttribute("name") || null,
      action: (form.action || "").substring(0, 120),
      method: form.method || "get",
      visible_field_count: 0,
      hidden_field_count: 0,
      fields: [],
      hidden_fields: [],
      submit_button: null,
      issues: []
    };

    var inputs = form.querySelectorAll("input, select, textarea");
    var hiddenTrackingFields = [];
    var hasGclid = false;
    var hasFbclid = false;
    var hasTtclid = false;
    var hasUtm = false;

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var inputType = (input.type || "text").toLowerCase();
      var inputName = (input.name || "").toLowerCase();
      var isHidden = inputType === "hidden" || input.style.display === "none" || input.offsetParent === null;

      if (isHidden) {
        formInfo.hidden_field_count++;
        formInfo.hidden_fields.push({
          name: input.name || "(no name)",
          type: inputType,
          value: (input.value || "").substring(0, 50)
        });

        // Check for tracking hidden fields
        if (inputName.indexOf("gclid") !== -1) { hasGclid = true; result.summary.has_gclid_capture = true; }
        if (inputName.indexOf("fbclid") !== -1) { hasFbclid = true; result.summary.has_fbclid_capture = true; }
        if (inputName.indexOf("ttclid") !== -1) { hasTtclid = true; result.summary.has_ttclid_capture = true; }
        if (inputName.indexOf("utm_") !== -1) { hasUtm = true; result.summary.has_utm_capture = true; }
        continue;
      }

      // Skip submit buttons in field count
      if (inputType === "submit" || inputType === "button") {
        continue;
      }

      formInfo.visible_field_count++;
      result.summary.total_visible_fields++;

      var fieldInfo = {
        name: input.name || "(no name)",
        type: inputType,
        tag: input.tagName.toLowerCase(),
        required: input.required || input.getAttribute("required") !== null,
        autocomplete: input.getAttribute("autocomplete") || null,
        placeholder: input.placeholder || null,
        issues: []
      };

      // Flag phone fields not using type="tel"
      if ((inputName.indexOf("phone") !== -1 || inputName.indexOf("tel") !== -1 || inputName.indexOf("mobile") !== -1) && inputType !== "tel") {
        fieldInfo.issues.push("Phone field should use type=\"tel\" for mobile keyboard optimization");
      }

      // Flag email fields not using type="email"
      if ((inputName.indexOf("email") !== -1 || inputName.indexOf("e-mail") !== -1) && inputType !== "email") {
        fieldInfo.issues.push("Email field should use type=\"email\" for validation and mobile keyboard");
      }

      // Flag zip fields not using inputmode="numeric"
      if ((inputName.indexOf("zip") !== -1 || inputName.indexOf("postal") !== -1) && input.getAttribute("inputmode") !== "numeric") {
        fieldInfo.issues.push("Zip/postal code field should use inputmode=\"numeric\" for mobile keyboard");
      }

      formInfo.fields.push(fieldInfo);
    }

    // Check submit button
    var submitBtn = form.querySelector("button[type=\"submit\"], input[type=\"submit\"], button:not([type])");
    if (submitBtn) {
      var btnText = (submitBtn.textContent || submitBtn.value || "").trim();
      formInfo.submit_button = {
        tag: submitBtn.tagName.toLowerCase(),
        text: btnText,
        type: submitBtn.type || "submit"
      };
      if (btnText.toLowerCase() === "submit") {
        formInfo.issues.push("Submit button uses generic \"Submit\" text - consider more descriptive CTA (e.g. \"Get Quote\", \"Schedule Now\")");
      }
    } else {
      formInfo.issues.push("No submit button found in form");
    }

    // Flag forms with 7+ visible fields
    if (formInfo.visible_field_count >= 7) {
      formInfo.issues.push("Form has " + formInfo.visible_field_count + " visible fields - consider reducing for better conversion rates (threshold: 7)");
    }

    // Flag missing tracking hidden fields
    if (!hasGclid) {
      formInfo.issues.push("Missing GCLID hidden field - needed for Google Ads offline conversion tracking");
    }
    if (!hasFbclid) {
      formInfo.issues.push("Missing FBCLID hidden field - needed for Meta offline conversion attribution");
    }

    result.forms.details.push(formInfo);
  }

  // Global warnings
  if (!result.summary.has_gclid_capture) {
    result.warnings.push("No forms capture GCLID - offline conversion tracking for Google Ads will not work");
  }
  if (!result.summary.has_fbclid_capture) {
    result.warnings.push("No forms capture FBCLID - offline conversion attribution for Meta will not work");
  }

  return JSON.stringify(result, null, 2);
})();
