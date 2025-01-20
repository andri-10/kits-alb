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
  cartData = [];

  async fetchCartData() {
    try {
      console.log('Fetching cart data from backend...');
      const response = await fetch('backend/get-cart-products.php');

      if (!response.ok) {
        throw new Error(`Failed to fetch cart data. Status: ${response.status}`);
      }

      const cartData = await response.json();
      console.log('Cart data:', cartData);

      this.cartData = cartData;
      this.renderCartItems(cartData);
    } catch (error) {
      console.error('Error fetching cart data:', error);
      
    }
  }

  updateValidationStatus(isValid) {
    const warningElement = document.querySelector('.payment-summary-warning');
    const submitButton = document.querySelector('#submit-payment');

    if (!isValid) {
      // Show warning and disable submit button
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      // Hide warning and enable submit button
      if (warningElement) {
        warningElement.remove();
      }
      submitButton.disabled = false;
    }
  }


  async create() {
    await this.stripeHandler.initialize();
    await this.render();
    return this;
  }

  

  async #getUserId() {
    const basePath = '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();

    console.log(data.userId);
    return data.userId || null;
    
  }
  async refreshPaymentDetails() {
    const userId = await this.#getUserId();
    const {
      productCostCents,
      shippingCostCents,
      taxCents,
      totalCents
    } = await cart.calculateCosts(userId);

    const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
    const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
    const quantity = await cart.calculateTotalQuantity();

    // Get validation status from CartSummary
    const cartItems = document.querySelectorAll('.js-cart-item');
    let allValid = true;

    cartItems.forEach(item => {
      const productId = item.getAttribute('data-cart-item-id');
      const deliveryOption = item.querySelector(`input[name="delivery-option-${productId}"]:checked`);

      if (!deliveryOption) {
        allValid = false;
      }
    });

    // Update the payment details dynamically
    document.getElementById("quantity-holder").textContent = `Items (${quantity}):`;
    document.getElementById("items-cost").textContent = `${MoneyUtils.formatMoney(productCostCents)}`;
    document.getElementById("shipping-money").textContent = `${MoneyUtils.formatMoney(shippingCostCents)}`;
    document.getElementById("before-tax-money").textContent = `${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}`;
    document.getElementById("tax-money").textContent = `${MoneyUtils.formatMoney(finalTaxCents)}`;
    document.getElementById("total-money").textContent = `${MoneyUtils.formatMoney(finalTotalCents)}`;

    // Update warning and button based on validation
    const warningElement = document.querySelector('.payment-summary-warning');
    const submitButton = document.querySelector('#submit-payment');

    if (!allValid) {
      // Show warning and disable submit button
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      // Hide warning and enable submit button
      if (warningElement) {
        warningElement.remove();
      }
      submitButton.disabled = false;
    }
  }
  async render() {
    try {
      const { productCostCents, shippingCostCents, taxCents, totalCents } = await cart.calculateCosts();
      const quantity = await cart.calculateTotalQuantity();
      const cartItems = cart.items;
      console.log(cart.items);

      const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
      const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
      // Check if any items have no delivery option selected
      const hasInvalidDelivery = cartItems.some(item => item.selectedDelivery === 0);
      console.log(hasInvalidDelivery)
      this.element.innerHTML = `
        
          <div class="payment-summary-title">Order Summary</div>
          
          ${hasInvalidDelivery ? `
            <div class="payment-summary-warning">
              ⚠️ Please select delivery options for all items before proceeding
            </div>
          ` : ''}
          
          <div class="payment-summary-row">
            <div id="quantity-holder" >Items (${quantity}):</div>
            <div id="items-cost" class="payment-summary-money">${MoneyUtils.formatMoney(productCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Shipping & handling:</div>
            <div id="shipping-money" class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents)}</div>
          </div>

           <div class="payment-summary-row ">
            <div class="before-tax-header" >Total before tax:</div>
            <div id="before-tax-money" class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents+productCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Estimated Tax (10%):</div>
            <div id="tax-money" class="payment-summary-money">${MoneyUtils.formatMoney(finalTaxCents)}</div>
          </div>
          
          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div id="total-money" class="payment-summary-money">${MoneyUtils.formatMoney(finalTotalCents)}</div>
          </div>

          <div class="payment-form">
            <form id="payment-form">
              <div id="card-element" class="stripe-element"></div>
              <div id="card-errors" class="stripe-errors" role="alert"></div>
              
              <button type="submit" 
                      id="submit-payment" 
                      class="button-primary payment-button"
                      ${hasInvalidDelivery ? 'disabled' : ''}>
                Pay ${MoneyUtils.formatMoney(totalCents)}
              </button>
            </form>
          </div>
       
      `;

      // Add style for the warning
      const style = document.createElement('style');
      style.textContent = `
        .payment-summary-warning {
          background-color: #fff3cd;
          color: #856404;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          border: 1px solid #ffeeba;
        }
        
        .button-primary:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);

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

      // Validate that the cart is not empty
      const cartItems =  cart.items;
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }

      // Fetch the user ID from the backend
      const userId = await this.fetchUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }

      // Create payment intent
      const paymentIntentResponse = await this.stripeHandler.createPaymentIntent(totalCents);
      if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
        throw new Error('Failed to initialize payment');
      }

      const { clientSecret } = paymentIntentResponse;

      // Process the payment
      const paymentResult = await this.stripeHandler.processPayment(clientSecret);
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Payment failed');
      }

      // Create the order
      const orderData = {
        user_id: userId,
        total_price: totalCents / 100,
        status: 'pending',
        delivery_date: new Date().toISOString().split('T')[0]
      };

      const orderResponse = await this.createOrder(orderData);
      if (!orderResponse || !orderResponse.order_id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.order_id;

      // Log payment before adding items
      await this.logPayment({
        order_id: orderId,
        payment_gateway: 'stripe',
        amount: totalCents / 100,
        created_at: new Date().toISOString()
      });

      // Add items to the order
      const addItemsResponse = await this.addItemsToOrder(orderId, userId);
      if (!addItemsResponse || addItemsResponse.error) {
        throw new Error('Failed to add items to the order');
      }

      // Redirect to orders page on success
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
