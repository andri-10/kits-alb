import StripeHandler from './StripeHandler.js';
import { cart } from '../../data/cart.js';
import { orders } from '../../data/orders.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class PaymentSummary extends ComponentV2 {
  constructor(selector, publishableKey) {
    super(selector);
    this.stripeHandler = new StripeHandler(publishableKey);
  }

  async create() {
    await this.stripeHandler.initialize();
    await this.render();
    return this;
  }

  async render() {
    try {
      const { productCostCents, shippingCostCents, taxCents, totalCents } = await cart.calculateCosts();
      const quantity = await cart.calculateTotalQuantity();

      this.element.innerHTML = `
        <div class="payment-summary">
          <div class="payment-summary-title">Order Summary</div>
          
          <div class="payment-summary-row">
            <div>Items (${quantity}):</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(productCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Shipping & handling:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Tax:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(taxCents)}</div>
          </div>
          
          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(totalCents)}</div>
          </div>

          <div class="payment-form">
            <form id="payment-form">
              <div id="card-element" class="stripe-element"></div>
              <div id="card-errors" class="stripe-errors" role="alert"></div>
              
              <button type="submit" id="submit-payment" class="button-primary payment-button">
                Pay ${MoneyUtils.formatMoney(totalCents)}
              </button>
            </form>
          </div>
        </div>
      `;

      this.stripeHandler.createCardElement('card-element');
      this.attachEventListeners();
    } catch (error) {
      console.error('Error rendering payment summary:', error);
      this.showError('Unable to load payment information');
    }
  }

  attachEventListeners() {
    const form = this.element.querySelector('#payment-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(event) {
    event.preventDefault();
    const submitButton = this.element.querySelector('#submit-payment');
    submitButton.disabled = true;

    try {
      let { totalCents } = await cart.calculateCosts();
      totalCents = Math.ceil(totalCents);

      console.log('Total cents to charge:', totalCents); // Debug log for totalCents

      // Validate that the cart is not empty
      const cartItems = cart.items; // Accessing cart items
      console.log('Cart Items:', cartItems); // Log cart items for inspection

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }

      // Fetch the user ID from the backend
      const userId = await this.fetchUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      // Create payment intent (though we'll only charge after the order is placed)
      const paymentIntentResponse = await this.stripeHandler.createPaymentIntent(totalCents);
      console.log('PaymentIntent Response:', paymentIntentResponse); // Debug log for response

      if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
        throw new Error('Failed to initialize payment');
      }

      const { clientSecret } = paymentIntentResponse;

      // Now, process the payment
      const paymentResult = await this.stripeHandler.processPayment(clientSecret);
      console.log('Payment Result:', paymentResult); // Debug log for payment result

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Payment failed');
      }

      // Proceed to create the order only after successful payment
      const orderData = {
        user_id: userId, // Use the fetched user ID
        total_price: totalCents / 100,
        status: 'pending', // Initial status
        delivery_date: new Date().toISOString().split('T')[0] // Default delivery date
      };

      const orderResponse = await this.createOrder(orderData);
      console.log('Order Response:', orderResponse); // Debug log for create order response

      if (!orderResponse || !orderResponse.order_id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.order_id;

      // Add items to the order
      const addItemsResponse = await this.addItemsToOrder(orderId, userId); // Pass orderId and userId to the backend
      console.log('Add Items Response:', addItemsResponse); // Debug log for adding items response

      if (!addItemsResponse || addItemsResponse.error) {
        throw new Error('Failed to add items to the order');
      }

      // Log payment after order creation and item insertion
      await this.logPayment({
        order_id: orderId,
        payment_gateway: 'stripe',
        amount: totalCents / 100,
        status: 'success',
        created_at: new Date().toISOString()
      });

      // Redirect to orders page
      window.location.href = 'orders.php';
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(error.message || 'Payment failed. Please try again.');
      submitButton.disabled = false;
    }
  }

  async addItemsToOrder(orderId, userId) {
    try {
      const response = await fetch('backend/add-items-to-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, user_id: userId })
      });

      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.error || 'Failed to add items to order');
      }
      return responseBody;
    } catch (error) {
      console.error('Error adding items to order:', error);
      throw error;
    }
  }

  async fetchUserId() {
    try {
      const response = await fetch('backend/get-user-id.php');
      const data = await response.json();

      if (response.ok && data.userId) {
        return data.userId; // Return the user ID if it exists
      } else {
        console.error('Failed to fetch user ID:', data.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch('backend/create-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.error || 'Failed to create order');
      }
      return responseBody;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  showError(message) {
    const errorElement = this.element.querySelector('#card-errors');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  async logPayment(paymentData) {
    try {
      const response = await fetch('backend/log-payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const responseBody = await response.text();
      console.log('Log Payment Response:', responseBody); // Debug log for log payment response

      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }
}
