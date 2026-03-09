# WooCommerce Code Implementations

## Meta CAPI Manual PHP Implementation

```php
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || $order->get_meta('_meta_capi_sent')) return;

    $pixel_id = 'YOUR_PIXEL_ID';
    $access_token = 'YOUR_ACCESS_TOKEN';

    $user_data = [
        'em' => [hash('sha256', strtolower(trim($order->get_billing_email())))],
        'ph' => [hash('sha256', preg_replace('/[^0-9]/', '', $order->get_billing_phone()))],
        'fn' => [hash('sha256', strtolower(trim($order->get_billing_first_name())))],
        'ln' => [hash('sha256', strtolower(trim($order->get_billing_last_name())))],
        'ct' => [hash('sha256', strtolower(trim($order->get_billing_city())))],
        'st' => [hash('sha256', strtolower(trim($order->get_billing_state())))],
        'zp' => [hash('sha256', trim($order->get_billing_postcode()))],
        'country' => [hash('sha256', strtolower($order->get_billing_country()))],
        'external_id' => [hash('sha256', (string)$order->get_customer_id())],
        'client_ip_address' => $order->get_customer_ip_address(),
        'client_user_agent' => $order->get_customer_user_agent()
    ];

    $fbp = $order->get_meta('_fbp');
    $fbc = $order->get_meta('_fbc');
    if ($fbp) $user_data['fbp'] = $fbp;
    if ($fbc) $user_data['fbc'] = $fbc;

    $items = [];
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $items[] = $product ? $product->get_sku() : (string)$item->get_product_id();
    }

    $event_data = [
        'data' => [[
            'event_name' => 'Purchase',
            'event_time' => time(),
            'event_id' => 'purchase_' . $order_id,
            'event_source_url' => $order->get_checkout_order_received_url(),
            'action_source' => 'website',
            'user_data' => $user_data,
            'custom_data' => [
                'value' => (float)$order->get_total(),
                'currency' => $order->get_currency(),
                'content_ids' => $items,
                'content_type' => 'product',
                'num_items' => count($items),
                'order_id' => $order->get_order_number()
            ]
        ]]
    ];

    $url = "https://graph.facebook.com/v18.0/{$pixel_id}/events?access_token={$access_token}";
    wp_remote_post($url, [
        'body' => json_encode($event_data),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 15
    ]);

    $order->update_meta_data('_meta_capi_sent', true);
    $order->save();
}, 10, 1);
```

## Click ID Cookie Capture (JavaScript)

```javascript
(function() {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  var clickIds = ['gclid', 'fbclid', 'ttclid', 'msclkid'];
  clickIds.forEach(function(id) {
    var val = getParam(id);
    if (val) setCookie('_ofm_' + id, val, 90);
  });
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(param) {
    var val = getParam(param);
    if (val) setCookie('_ofm_' + param, val, 90);
  });
})();
```

## Hidden Checkout Fields for Click ID Persistence

```php
// Add hidden fields to WooCommerce checkout
add_action('woocommerce_after_order_notes', function($checkout) {
    echo '<div style="display:none">';
    woocommerce_form_field('_ofm_gclid', ['type' => 'hidden'], $checkout->get_value('_ofm_gclid'));
    woocommerce_form_field('_ofm_fbclid', ['type' => 'hidden'], $checkout->get_value('_ofm_fbclid'));
    woocommerce_form_field('_ofm_ttclid', ['type' => 'hidden'], $checkout->get_value('_ofm_ttclid'));
    woocommerce_form_field('_ofm_fbp', ['type' => 'hidden'], $checkout->get_value('_ofm_fbp'));
    woocommerce_form_field('_ofm_fbc', ['type' => 'hidden'], $checkout->get_value('_ofm_fbc'));
    echo '</div>';
});

// Populate hidden fields from cookies via JavaScript
add_action('wp_footer', function() {
    if (!is_checkout()) return;
    ?>
    <script>
    (function() {
      function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
      }
      var fields = {
        '_ofm_gclid': getCookie('_ofm_gclid'),
        '_ofm_fbclid': getCookie('_ofm_fbclid'),
        '_ofm_ttclid': getCookie('_ofm_ttclid'),
        '_ofm_fbp': getCookie('_fbp'),
        '_ofm_fbc': getCookie('_fbc')
      };
      Object.keys(fields).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && fields[id]) el.value = fields[id];
      });
    })();
    </script>
    <?php
});

// Save click IDs to order meta
add_action('woocommerce_checkout_update_order_meta', function($order_id) {
    $fields = ['_ofm_gclid', '_ofm_fbclid', '_ofm_ttclid', '_ofm_fbp', '_ofm_fbc'];
    foreach ($fields as $field) {
        if (!empty($_POST[$field])) {
            update_post_meta($order_id, $field, sanitize_text_field($_POST[$field]));
        }
    }
});
```

## WooCommerce Webhook Payload Example

```json
{
  "id": 12345,
  "status": "processing",
  "currency": "USD",
  "total": "59.98",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "city": "Denver",
    "state": "CO",
    "postcode": "80202",
    "country": "US"
  },
  "line_items": [
    { "product_id": 100, "sku": "SKU-12345", "name": "Product A", "quantity": 1, "price": 29.99 }
  ]
}
```

## Duplicate Purchase Prevention (GTM Custom JS Variable)

```javascript
function() {
  var transactionId = {{DL - ecommerce.transaction_id}};
  var sentKey = 'purchase_sent_' + transactionId;
  if (sessionStorage.getItem(sentKey)) return false;
  sessionStorage.setItem(sentKey, 'true');
  return true;
}
```

## Payment Gateway Redirect Backup

```php
add_action('woocommerce_order_status_processing', function($order_id) {
    // Send server-side conversion event
    // This fires regardless of whether the customer returns to the site
}, 10, 1);
```
