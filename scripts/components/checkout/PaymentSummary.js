import {cart} from '../../data/cart.js';
import {MoneyUtils} from '../../utils/MoneyUtils.js';
import {orders} from '../../data/orders.js';
import {Component} from '../Component.js';
import {PayPalButtons} from './PayPalButtons.js';
import {WindowUtils} from '../../utils/WindowUtils.js';

export class PaymentSummary extends Component {
  element;
  events = {
    'click .js-paypal-toggle':
      (event) => this.#togglePaypal(event)
  };

  #usePaypal;
  #loadedPaypal = false;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
    this.#usePaypal = localStorage.getItem('exercises-kits-use-paypal') === 'true';
  }

  #showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'payment-error';
    errorContainer.style.color = 'red';
    errorContainer.style.marginTop = '10px';
    errorContainer.textContent = message;
    
    const existingError = document.querySelector('.payment-error');
    if (existingError) {
      existingError.remove();
    }
    
    const buttonsContainer = this.element.querySelector('.js-payment-buttons-container');
    buttonsContainer.parentNode.insertBefore(errorContainer, buttonsContainer);
  }

  async #logPayment(paymentData) {
    try {
      const response = await fetch('/backend/log-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }

  async #validateDeliveryOptions() {
    const cartItems = await cart.getItems();
    return cartItems.every(item => item.selectedDelivery);
  }

  async #performCheckout() {
    // Validate delivery options first
    const isValid = await this.#validateDeliveryOptions();
    if (!isValid) {
      this.#showError('Please select a delivery option for all products');
      return;
    }

    try {
      const costs = await cart.calculateCosts();

      // Log payment initiation
      await this.#logPayment({
        payment_method: 'card',
        status: 'initiated',
        amount: costs.totalCents,
        timestamp: new Date().toISOString()
      });

      await orders.createNewOrder(cart);
      
      // Log successful payment
      await this.#logPayment({
        payment_method: 'card',
        status: 'success',
        amount: costs.totalCents,
        timestamp: new Date().toISOString()
      });

      WindowUtils.setHref('orders.php');
    } catch (error) {
      console.error('Checkout error:', error);
      this.#showError('An error occurred during checkout. Please try again.');
      
      // Log failed payment
      await this.#logPayment({
        payment_method: 'card',
        status: 'error',
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async #getUserId() {
    const basePath = '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();

    console.log(data.userId);
    return data.userId || null;
    
  }

  async render() {
    
    this.element.innerHTML = `
      <div class="js-payment-info"></div>

      <div class="paypal-toggle">
        Use PayPal <input type="checkbox" class="js-paypal-toggle"
          ${this.#usePaypal && 'checked'}>
      </div>

      <div class="js-payment-buttons-container ${this.#usePaypal && 'use-paypal'}"
        data-testid="payment-buttons-container">

        <div class="js-paypal-button-container paypal-button-container"
          data-testid="paypal-button-container"></div>

        <button class="js-place-order-button place-order-button button-primary"
          data-testid="place-order-button">
          Place your order
        </button>
      </div>
    `;

    this.refreshPaymentDetails();

    if (this.#usePaypal && !this.#loadedPaypal) {
      new PayPalButtons('.js-paypal-button-container').create();
      this.#loadedPaypal = true;
    }

    this.events['click .js-place-order-button'] =
      (event) => this.#performCheckout(event);
  }

  async refreshPaymentDetails() {
    const userId = this.#getUserId();
    const {
      productCostCents,
      shippingCostCents,
      taxCents,
      totalCents
    } = await cart.calculateCosts(userId);

    const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
    const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
    const quantity = await cart.calculateTotalQuantity();

    this.element.querySelector('.js-payment-info').innerHTML = `
      <div class="payment-summary-title">
        Order Summary
      </div>

      <div class="payment-summary-row">
        <div>Items (${quantity}):</div>
        <div class="payment-summary-money"
          data-testid="product-cost">
          ${MoneyUtils.formatMoney(productCostCents)}
        </div>
      </div>

      <div class="payment-summary-row">
        <div>Shipping & handling:</div>
        <div class="payment-summary-money"
          data-testid="shipping-cost">
          ${MoneyUtils.formatMoney(shippingCostCents)}
        </div>
      </div>

      <div class="payment-summary-row subtotal-row">
        <div>Total before tax:</div>
        <div class="payment-summary-money"
          data-testid="sub-total">
          ${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}
        </div>
      </div>

      <div class="payment-summary-row">
        <div>Estimated tax (10%):</div>
        <div class="payment-summary-money"
          data-testid="final-tax-cost">
          ${MoneyUtils.formatMoney(finalTaxCents)}
        </div>
      </div>

      <div class="payment-summary-row total-row">
        <div>Final total:</div>
        <div class="payment-summary-money"
          data-testid="final-total-cost">
          ${MoneyUtils.formatMoney(finalTotalCents)}
        </div>
      </div>
    `;

    if (cart.isEmpty()) {
      this.element.querySelector('.js-payment-buttons-container')
        .classList.add('payment-buttons-disabled');
    }
  }

  #performCheckout() {
    orders.createNewOrder(cart);
    WindowUtils.setHref('orders.php');
  }

  #togglePaypal() {
    this.#usePaypal = !this.#usePaypal;

    if (this.#usePaypal) {
      this.element.querySelector('.js-payment-buttons-container')
        .classList.add('use-paypal');

      if (!this.#loadedPaypal) {
        new PayPalButtons('.js-paypal-button-container').create();
        this.#loadedPaypal = true;
      }

    } else {
      this.element.querySelector('.js-payment-buttons-container')
        .classList.remove('use-paypal');
    }

    localStorage.setItem('exercises-kits-use-paypal', this.#usePaypal);
  }
}