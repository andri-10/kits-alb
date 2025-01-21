import '../packages/uuid.js';
import {MoneyUtils} from '../utils/MoneyUtils.js';
import {deliveryOptions} from './deliveryOptions.js';
import {products} from './products.js';

export class Cart {
  #items;

  constructor() {
    this.#items = [];
    this.loadFromBackend();
  }

  async loadFromBackend() {
    try {
      const response = await fetch('backend/get-cart-products.php');
      const data = await response.json();

      if (Array.isArray(data)) {
        this.#items = data.map(item => ({
          id: item.productId,
          productId: item.productId,
          name: item.product_name,
          image: item.product_image,
          priceCents: item.priceCents,
          quantity: item.quantity,
          sizes: item.sizes,
          selectedDelivery: item.deliveryOption
        }));
      } else {
        console.error('Error fetching cart products:', data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  // Method to group cart items by delivery option
  groupByDeliveryOption() {
    const groupedItems = {
      0: [],
      1: [],
      2: [],
      3: []
    };

    this.#items.forEach(item => {
      if (groupedItems.hasOwnProperty(item.selectedDelivery)) {
        groupedItems[item.selectedDelivery].push(item);
      } else {
        console.warn('Invalid delivery option:', item.selectedDelivery);
      }
    });

    return groupedItems;
  }

  async addToCart(productId, quantity) {
    console.log('Adding to cart:', { productId, quantity });

    try {
      const response = await fetch('backend/add-to-cart.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId.toString(),
          quantity: parseInt(quantity),
        })
      });

      const data = await response.json();
      console.log('Response:', data);
      if (data.success) {
        await this.loadFromBackend();
      }

      return data.cart_count || 0;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return 0;
    }
  }

  async calculateTotalQuantity() {
    try {
      const response = await fetch('backend/get-cart-count.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ })
      });

      const data = await response.json();
      console.log('Cart count data:', data);
      return data.cart_count || 0;
    } catch (error) {
      console.error('Cart count error:', error);
      return 0;
    }
  }

  async updateDeliveryOption(cartItemId, deliveryOptionId) {
    try {
      const response = await fetch('backend/update-delivery-option.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_item_id: cartItemId,
          delivery_option_id: deliveryOptionId
        })
      });

      const data = await response.json();
      console.log('Delivery option update response:', data);
      if (data.success) {
        await this.loadFromBackend();
      }
    } catch (error) {
      console.error('Error updating delivery option:', error);
    }
  }

  async calculateCosts(userId) {
    try {
      const response = await fetch('backend/get-cart-costs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cart costs:', errorText);
        throw new Error('Failed to fetch cart costs');
      }

      const data = await response.json();
      console.log('Cart costs data:', data);

      return data.costs || { productCostCents: 0, shippingCostCents: 0, taxCents: 0, totalCents: 0 };
    } catch (error) {
      console.error('Error calculating cart costs:', error);
      return { productCostCents: 0, shippingCostCents: 0, taxCents: 0, totalCents: 0 };
    }
  }

  async removeFromCart(cartItemId) {
    try {
      const response = await fetch('backend/remove-from-cart.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_item_id: cartItemId })
      });

      const data = await response.json();
      console.log('Remove from cart response:', data);
      if (data.success) {
        await this.loadFromBackend();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }

  async decreaseQuantity(productId) {
    const response = await fetch('backend/remove-from-cart.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId })
    });

    const data = await response.json();

    if (data.success) {
      if (data.quantity === 0) {
        console.log('Product removed from cart');
      } else {
        console.log(`Quantity decreased, new quantity: ${data.quantity}`);
      }
    } else {
      console.error('Failed to decrease quantity:', data.error);
    }
  }

  isEmpty() {
    return this.#items.length === 0;
  }

  get items() {
    return this.#items;
  }
}

export const cart = new Cart();
