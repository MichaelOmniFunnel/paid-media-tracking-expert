# DataLayer Implementation for NetSuite SuiteCommerce

## 2. DataLayer for NetSuite

### Virtual Pageview Tracking

Every route change in SCA must push a virtual pageview event:

```javascript
define('DataLayer.Router', [
  'Backbone',
  'underscore'
], function(Backbone, _) {
  'use strict';

  return {
    mountToApp: function(application) {
      // Listen to route changes on all SCA applications
      var layout = application.getLayout();

      layout.on('afterAppendView', function(view) {
        window.dataLayer = window.dataLayer || [];

        // Determine page type from the current view/route
        var pageType = 'other';
        var pageTitle = document.title;
        var pagePath = Backbone.history.getFragment();

        if (view.attributes && view.attributes['data-type']) {
          pageType = view.attributes['data-type'];
        }

        window.dataLayer.push({
          event: 'virtual_pageview',
          page_path: '/' + pagePath,
          page_title: pageTitle,
          page_type: pageType
        });
      });
    }
  };
});
```

**In GTM:** Create a trigger on the custom event `virtual_pageview` and use it for your GA4 `page_view` event tag. Set the page location and title from the dataLayer variables.

### Product View: Hooking into ItemDetails

```javascript
define('DataLayer.ItemDetails', [
  'ItemDetails.View',
  'underscore'
], function(ItemDetailsView, _) {
  'use strict';

  // Extend the ItemDetails.View to push dataLayer on render
  var originalInit = ItemDetailsView.prototype.initialize;

  ItemDetailsView.prototype.initialize = function() {
    originalInit.apply(this, arguments);

    this.on('afterViewRender', function() {
      var model = this.model;
      if (!model) return;

      var item = model.toJSON ? model.toJSON() : model;

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          currency: SC.ENVIRONMENT.currencyCode || 'USD',
          value: parseFloat(item.onlinecustomerprice_detail ?
            item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0,
          items: [{
            item_id: item.itemid || item.internalid,  // Use SKU or internal ID
            item_name: item.storedisplayname2 || item.displayname || item.itemid,
            item_category: item.primarycategory || '',
            item_brand: item.custitem_brand || '',     // Custom field
            price: parseFloat(item.onlinecustomerprice_detail ?
              item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0,
            quantity: 1
          }]
        }
      });
    });
  };

  return ItemDetailsView;
});
```

**Important:** The field names (`storedisplayname2`, `onlinecustomerprice_detail`, `custitem_brand`) vary by NetSuite configuration. Inspect the model object in the browser console to find the correct field names for your implementation.

### Add to Cart: Hooking into Cart Module

```javascript
define('DataLayer.AddToCart', [
  'Cart.AddToCart.View',
  'LiveOrder.Model'
], function(CartAddToCartView, LiveOrderModel) {
  'use strict';

  // Listen for successful add-to-cart
  var originalSubmit = CartAddToCartView.prototype.submitHandler ||
                       CartAddToCartView.prototype.addToCart;

  if (originalSubmit) {
    var wrappedSubmit = function() {
      var self = this;
      var result = originalSubmit.apply(this, arguments);

      // If result is a promise (AJAX add to cart)
      if (result && result.then) {
        result.then(function() {
          var item = self.model ? self.model.toJSON() : {};
          var quantity = parseInt(self.$('[name="quantity"]').val()) || 1;
          var price = parseFloat(item.onlinecustomerprice_detail ?
            item.onlinecustomerprice_detail.onlinecustomerprice : item.price) || 0;

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              currency: SC.ENVIRONMENT.currencyCode || 'USD',
              value: price * quantity,
              items: [{
                item_id: item.itemid || item.internalid,
                item_name: item.storedisplayname2 || item.displayname || '',
                price: price,
                quantity: quantity
              }]
            }
          });
        });
      }

      return result;
    };

    if (CartAddToCartView.prototype.submitHandler) {
      CartAddToCartView.prototype.submitHandler = wrappedSubmit;
    } else {
      CartAddToCartView.prototype.addToCart = wrappedSubmit;
    }
  }

  return CartAddToCartView;
});
```

### Checkout: Hooking into Checkout Step Changes

SCA's checkout is a multi-step flow within the SPA. Each step renders a different Backbone view.

```javascript
define('DataLayer.Checkout', [
  'OrderWizard.Router',
  'LiveOrder.Model',
  'underscore'
], function(OrderWizardRouter, LiveOrderModel, _) {
  'use strict';

  return {
    mountToApp: function(application) {
      // Listen for checkout step changes
      var layout = application.getLayout();

      // Track begin_checkout when user enters checkout
      layout.on('afterAppendView', function(view) {
        var fragment = Backbone.history.getFragment();
        if (fragment.indexOf('checkout') === -1) return;

        var cart = LiveOrderModel.getInstance();
        var cartData = cart.toJSON ? cart.toJSON() : {};
        var lines = cartData.lines || [];

        if (lines.length === 0) return;

        var items = _.map(lines, function(line, index) {
          var itemDetail = line.item || {};
          return {
            item_id: itemDetail.itemid || itemDetail.internalid || '',
            item_name: itemDetail.storedisplayname2 || itemDetail.displayname || '',
            price: parseFloat(line.rate) || 0,
            quantity: parseInt(line.quantity) || 1,
            index: index
          };
        });

        var totalValue = parseFloat(cartData.summary ? cartData.summary.subtotal : 0) || 0;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: 'begin_checkout',
          ecommerce: {
            currency: SC.ENVIRONMENT.currencyCode || 'USD',
            value: totalValue,
            items: items
          }
        });
      });
    }
  };
});
```

### Purchase: Order Confirmation

The order confirmation page in SCA is rendered when the checkout wizard completes. Hook into the confirmation view:

```javascript
define('DataLayer.OrderConfirmation', [
  'OrderWizard.Module.Confirmation'
], function(ConfirmationModule) {
  'use strict';

  var originalRender = ConfirmationModule.prototype.render;

  ConfirmationModule.prototype.render = function() {
    var result = originalRender.apply(this, arguments);

    var confirmation = this.model ? this.model.toJSON() : {};
    var lines = confirmation.lines || [];
    var summary = confirmation.summary || {};

    if (!confirmation.tranid && !confirmation.internalid) return result;

    var items = lines.map(function(line, index) {
      var item = line.item || {};
      return {
        item_id: item.itemid || item.internalid || '',
        item_name: item.storedisplayname2 || item.displayname || '',
        price: parseFloat(line.rate) || 0,
        quantity: parseInt(line.quantity) || 1,
        index: index
      };
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: confirmation.tranid || confirmation.internalid,
        value: parseFloat(summary.total) || 0,
        tax: parseFloat(summary.taxtotal) || 0,
        shipping: parseFloat(summary.shippingcost) || 0,
        currency: SC.ENVIRONMENT.currencyCode || 'USD',
        coupon: confirmation.promocode || '',
        items: items
      }
    });

    return result;
  };

  return ConfirmationModule;
});
```

**Alternative: SuiteLet Approach**

If the SPA-based approach is unreliable, create a SuiteLet that renders the order confirmation as a standalone page:

1. Create a SuiteLet script that accepts an order ID parameter.
2. The SuiteLet loads the order record and renders a page with the purchase dataLayer.
3. Redirect the customer to this SuiteLet URL after checkout completion.
4. This gives you a traditional page load with a full GTM execution.

### Mapping NetSuite Internal IDs to Product Feed IDs

NetSuite uses internal IDs (numeric) for items. Product feeds for Google Merchant Center or Meta typically use SKU/item ID fields.

```
NetSuite Internal ID: 12345
Item ID (SKU): "WIDGET-001"
Feed ID: might be "WIDGET-001" or "netsuite_12345" depending on feed config
```

**Recommendation:**
- Use the `itemid` field (NetSuite's SKU equivalent) as `item_id` in the dataLayer.
- Ensure the product feed generator uses the same field.
- If the feed uses a transformed ID (e.g., prefixed), apply the same transformation in the dataLayer module.
- Create a mapping saved search in NetSuite if needed:
  - Columns: Internal ID, Item ID/Name, Display Name, custom fields
  - Use this to verify alignment between dataLayer and feed.

---
