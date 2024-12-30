import '../packages/uuid.js';
import {MoneyUtils} from '../utils/MoneyUtils.js';
import {deliveryOptions} from './deliveryOptions.js';
import {products} from './products.js';

export class Cart {
  #items;

  constructor() {
    this.#items = []; // Initialize an empty cart
    this.loadFromBackend(); // Load cart from backend
  }

  // Fetch cart data from backend and load it
  async loadFromBackend() {
    try {
      const response = await fetch('backend/get-cart-products.php'); // Update the PHP endpoint
      const data = await response.json();
      
      if (Array.isArray(data)) {
        this.#items = data.map(item => ({
          id: item.productId,
          productId: item.productId,
          name: item.product_name,
          image: item.product_image,
          priceCents: item.priceCents,
          quantity: item.quantity,
          sizes: item.sizes
        }));
      } else {
        console.error('Error fetching cart products:', data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  // Add an item to the cart by making a POST request to the backend
  async addToCart(productId, quantity) {
    console.log('Adding to cart:', { productId, quantity });
  
    try {
      const response = await fetch('backend/add-to-cart.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId.toString(), // Ensure productId is a string
          quantity: parseInt(quantity),
        })
      });

      const data = await response.json();
      console.log('Response:', data);

      // If successful, reload cart from backend to reflect changes
      if (data.success) {
        await this.loadFromBackend();
      }

      return data.cart_count || 0;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return 0;
    }
  }

  // Fetch total cart quantity from the backend
  async calculateTotalQuantity() {
    try {
      const response = await fetch('backend/get-cart-count.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})  // No product_id needed, just calculate the total quantity
      });

      const data = await response.json();
      console.log('Cart count data:', data);

      // Return the total cart count or 0 if not found
      return data.cart_count || 0;
    } catch (error) {
      console.error('Cart count error:', error);
      return 0;
    }
  }

  // Update the delivery option for a cart item
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

      // Reload cart to reflect updated delivery options
      if (data.success) {
        await this.loadFromBackend();
      }
    } catch (error) {
      console.error('Error updating delivery option:', error);
    }
  }

  // Calculate the total costs (product, shipping, and taxes) by fetching from the backend
  async calculateCosts() {
    try {
      const response = await fetch('backend/get-cart-costs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_items: this.#items }) // Send current cart items to backend
      });

      const data = await response.json();
      console.log('Cart costs data:', data);

      return data.costs || { productCostCents: 0, shippingCostCents: 0, taxCents: 0, totalCents: 0 };
    } catch (error) {
      return { productCostCents: 0, shippingCostCents: 0, taxCents: 0, totalCents: 0 };
    }
  }

  // Remove an item from the cart (call backend to remove)
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

      // Reload cart to reflect item removal
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
        // Update the UI or re-fetch cart data here
    } else {
        console.error('Failed to decrease quantity:', data.error);
    }
}

isEmpty() {
  return this.#items.length === 0;
}
  
  // Get the current items in the cart
  get items() {
    return this.#items;
  }
}

export const cart = new Cart();