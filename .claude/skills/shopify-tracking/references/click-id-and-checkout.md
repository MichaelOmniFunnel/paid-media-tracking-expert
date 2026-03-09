# Shopify Click ID Capture and Checkout Code

## Click ID Capture Script

Place in theme.liquid or a Custom Pixel:

```javascript
(function() {
  function getParam(name) {
    const match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;domain=.' + window.location.hostname + ';SameSite=Lax';
  }

  const params = {
    gclid: getParam('gclid'),
    fbclid: getParam('fbclid'),
    ttclid: getParam('ttclid'),
    msclkid: getParam('msclkid'),
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign')
  };

  Object.keys(params).forEach(key => {
    if (params[key]) {
      setCookie('_ofm_' + key, params[key], 90);
    }
  });

  // Construct fbc cookie format for Meta if fbclid present
  if (params.fbclid) {
    const fbc = 'fb.1.' + Date.now() + '.' + params.fbclid;
    setCookie('_fbc', fbc, 90);
  }
})();
```

## Passing Click IDs Through Checkout via Cart Attributes

```javascript
fetch('/cart/update.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attributes: {
      gclid: getCookie('_ofm_gclid') || '',
      fbclid: getCookie('_ofm_fbclid') || '',
      ttclid: getCookie('_ofm_ttclid') || ''
    }
  })
});
```

These attributes persist through checkout and appear on the order in Shopify Admin.

## Reading Cart/Order Attributes on Thank-You Page

```liquid
{% if first_time_accessed %}
<script>
  var orderAttributes = {
    {% for attr in checkout.attributes %}
      '{{ attr.first }}': '{{ attr.last }}'{% unless forloop.last %},{% endunless %}
    {% endfor %}
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'order_attributes',
    gclid: orderAttributes.gclid || '',
    fbclid: orderAttributes.fbclid || '',
    ttclid: orderAttributes.ttclid || ''
  });
</script>
{% endif %}
```

## Shopify Plus vs Standard Limitations

| Capability | Standard | Plus |
|---|---|---|
| Theme.liquid editing | Yes | Yes |
| Checkout script injection | No | Checkout Extensibility only |
| Cart attributes | Yes | Yes |
| Additional scripts (thank you) | Yes | Yes |
| Checkout UI extensions | No | Yes |
| Custom pixel (Customer Events) | Yes | Yes |
