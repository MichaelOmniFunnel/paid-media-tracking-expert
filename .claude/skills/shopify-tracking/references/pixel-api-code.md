# Shopify Pixel API and GTM Code Examples

## Method A: theme.liquid GTM Injection (Legacy)

Place in the <head> section of theme.liquid:

```liquid
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

And noscript after <body>:

```liquid
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

## Method B: Shopify Custom Pixels (Modern, Post-2023)

Via Settings > Customer events > Add custom pixel:

```javascript
const GTMID = 'GTM-XXXXXXX';
const script = document.createElement('script');
script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTMID;
script.async = true;
document.head.appendChild(script);

window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

analytics.subscribe('page_viewed', (event) => {
  window.dataLayer.push({
    event: 'page_view',
    page_location: event.context.document.location.href,
    page_title: event.context.document.title
  });
});

analytics.subscribe('product_viewed', (event) => {
  const product = event.data.productVariant;
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: product.price.currencyCode,
      value: parseFloat(product.price.amount),
      items: [{
        item_id: product.sku || product.id,
        item_name: product.title,
        price: parseFloat(product.price.amount),
        item_variant: product.title,
        quantity: 1
      }]
    }
  });
});

analytics.subscribe('product_added_to_cart', (event) => {
  const item = event.data.cartLine;
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: item.merchandise.price.currencyCode,
      value: parseFloat(item.merchandise.price.amount) * item.quantity,
      items: [{
        item_id: item.merchandise.sku || item.merchandise.id,
        item_name: item.merchandise.title,
        price: parseFloat(item.merchandise.price.amount),
        quantity: item.quantity
      }]
    }
  });
});

analytics.subscribe('checkout_started', (event) => {
  const checkout = event.data.checkout;
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: checkout.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      items: checkout.lineItems.map(item => ({
        item_id: item.variant.sku || item.variant.id,
        item_name: item.title,
        price: parseFloat(item.variant.price.amount),
        quantity: item.quantity
      }))
    }
  });
});

analytics.subscribe('checkout_completed', (event) => {
  const checkout = event.data.checkout;
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: checkout.order?.id || checkout.token,
      currency: checkout.currencyCode,
      value: parseFloat(checkout.totalPrice.amount),
      tax: parseFloat(checkout.totalTax?.amount || '0'),
      shipping: parseFloat(checkout.shippingLine?.price?.amount || '0'),
      items: checkout.lineItems.map(item => ({
        item_id: item.variant.sku || item.variant.id,
        item_name: item.title,
        price: parseFloat(item.variant.price.amount),
        quantity: item.quantity
      }))
    }
  });
});
```

## DataLayer for Product Pages (theme.liquid)

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: '{{ shop.currency }}',
    value: {{ product.price | money_without_currency | remove: ',' }},
    items: [{
      item_id: '{{ product.variants.first.sku | default: product.id }}',
      item_name: '{{ product.title | escape }}',
      item_brand: '{{ product.vendor | escape }}',
      item_category: '{{ product.type | escape }}',
      item_variant: '{{ product.variants.first.title | escape }}',
      price: {{ product.price | money_without_currency | remove: ',' }},
      quantity: 1
    }]
  }
});
```

## Collection Page DataLayer

```javascript
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'view_item_list',
  ecommerce: {
    item_list_id: '{{ collection.handle }}',
    item_list_name: '{{ collection.title | escape }}',
    items: [
      {% for product in collection.products limit: 20 %}
      {
        item_id: '{{ product.variants.first.sku | default: product.id }}',
        item_name: '{{ product.title | escape }}',
        item_brand: '{{ product.vendor | escape }}',
        item_category: '{{ product.type | escape }}',
        price: {{ product.price | money_without_currency | remove: ',' }},
        index: {{ forloop.index }},
        quantity: 1
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  }
});
```

## AJAX Add to Cart Interceptor

```javascript
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/cart/add')) {
      return originalFetch.apply(this, arguments).then(response => {
        response.clone().json().then(data => {
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              currency: window.Shopify?.currency?.active || 'USD',
              value: (data.final_price || data.price) / 100,
              items: [{
                item_id: data.sku || data.variant_id?.toString(),
                item_name: data.product_title,
                item_variant: data.variant_title,
                price: (data.final_price || data.price) / 100,
                quantity: data.quantity
              }]
            }
          });
        });
        return response;
      });
    }
    return originalFetch.apply(this, arguments);
  };
})();
```

## Order Status Page Purchase DataLayer

```liquid
{% if first_time_accessed %}
<script>
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: '{{ order.name }}',
    value: {{ checkout.total_price | money_without_currency | remove: ',' }},
    tax: {{ checkout.tax_price | money_without_currency | remove: ',' }},
    shipping: {{ checkout.shipping_price | money_without_currency | remove: ',' }},
    currency: '{{ checkout.currency }}',
    coupon: '{{ checkout.discount_applications.first.title | escape }}',
    items: [
      {% for line_item in checkout.line_items %}
      {
        item_id: '{{ line_item.sku | default: line_item.variant_id }}',
        item_name: '{{ line_item.product.title | escape }}',
        item_variant: '{{ line_item.variant.title | escape }}',
        item_brand: '{{ line_item.vendor | escape }}',
        item_category: '{{ line_item.product.type | escape }}',
        price: {{ line_item.final_price | money_without_currency | remove: ',' }},
        quantity: {{ line_item.quantity }}
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  }
});
</script>
{% endif %}
```
