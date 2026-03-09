# WooCommerce DataLayer Examples

## GTM4WP Standard DataLayer Format

GTM4WP generates a dataLayer that follows Google's GA4 ecommerce schema.

### Product Page: view_item

```javascript
{
  event: 'view_item',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'SKU-12345',
      item_name: 'Product Name',
      item_brand: '',
      item_category: 'Category Name',
      item_variant: '',
      price: 29.99,
      quantity: 1
    }]
  }
}
```

### Category Page: view_item_list

```javascript
{
  event: 'view_item_list',
  ecommerce: {
    item_list_id: 'category-slug',
    item_list_name: 'Category Name',
    items: [
      {
        item_id: 'SKU-12345',
        item_name: 'Product Name',
        price: 29.99,
        index: 1,
        item_category: 'Category Name',
        quantity: 1
      }
    ]
  }
}
```

### Add to Cart: add_to_cart

```javascript
{
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'SKU-12345',
      item_name: 'Product Name',
      price: 29.99,
      quantity: 1
    }]
  }
}
```

**AJAX cart troubleshooting:** Some themes override WooCommerce AJAX cart behavior. If add_to_cart does not fire:

1. Check that the theme uses WooCommerce's standard AJAX add-to-cart (look for wc-add-to-cart.js).
2. If the theme uses a custom AJAX handler, add a custom event listener that pushes to the dataLayer.
3. Ensure "Enable AJAX add to cart buttons on archives" is checked in WooCommerce > Settings > Products.

### Checkout Steps

```javascript
// begin_checkout
{ event: 'begin_checkout', ecommerce: { currency: 'USD', value: 59.98, items: [/* cart items */] } }

// add_shipping_info
{ event: 'add_shipping_info', ecommerce: { currency: 'USD', value: 59.98, shipping_tier: 'Flat Rate', items: [/* cart items */] } }

// add_payment_info
{ event: 'add_payment_info', ecommerce: { currency: 'USD', value: 59.98, payment_type: 'Credit Card', items: [/* cart items */] } }
```

### Purchase: order-received page

```javascript
{
  event: 'purchase',
  ecommerce: {
    transaction_id: '12345',
    value: 59.98,
    tax: 4.80,
    shipping: 5.00,
    currency: 'USD',
    coupon: 'SAVE10',
    items: [
      { item_id: 'SKU-12345', item_name: 'Product A', price: 29.99, quantity: 1, item_category: 'Category' },
      { item_id: 'SKU-67890', item_name: 'Product B', price: 29.99, quantity: 1, item_category: 'Category' }
    ]
  }
}
```

## User Data Layer for Enhanced Conversions

```php
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    ?>
    <script>
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'user_data_ready',
      user_data: {
        email: '<?php echo strtolower(trim($order->get_billing_email())); ?>',
        phone_number: '<?php echo preg_replace("/[^0-9+]/", "", $order->get_billing_phone()); ?>',
        address: {
          first_name: '<?php echo esc_js($order->get_billing_first_name()); ?>',
          last_name: '<?php echo esc_js($order->get_billing_last_name()); ?>',
          street: '<?php echo esc_js($order->get_billing_address_1()); ?>',
          city: '<?php echo esc_js($order->get_billing_city()); ?>',
          region: '<?php echo esc_js($order->get_billing_state()); ?>',
          postal_code: '<?php echo esc_js($order->get_billing_postcode()); ?>',
          country: '<?php echo esc_js($order->get_billing_country()); ?>'
        }
      }
    });
    </script>
    <?php
}, 10, 1);
```

## Variable Product Custom Listener

```javascript
jQuery(document).on('found_variation', function(event, variation) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: jQuery('.woocommerce-Price-currencySymbol').length ?
        (document.querySelector('meta[property="og:price:currency"]')?.content || 'USD') : 'USD',
      value: parseFloat(variation.display_price),
      items: [{
        item_id: variation.sku || variation.variation_id.toString(),
        item_name: jQuery('.product_title').text().trim(),
        item_variant: variation.attributes ?
          Object.values(variation.attributes).join(' / ') : '',
        price: parseFloat(variation.display_price),
        quantity: 1
      }]
    }
  });
});
```

## Checkout Field Data Capture

```javascript
jQuery(document).on('change', '#billing_email, #billing_phone, #billing_first_name, #billing_last_name', function() {
  window.dataLayer.push({
    event: 'checkout_user_data',
    user_data: {
      email: jQuery('#billing_email').val().toLowerCase().trim(),
      phone: jQuery('#billing_phone').val().replace(/[^0-9+]/g, ''),
      first_name: jQuery('#billing_first_name').val().trim(),
      last_name: jQuery('#billing_last_name').val().trim()
    }
  });
});
```
