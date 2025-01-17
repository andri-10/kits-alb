import { cart } from '../../data/cart.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { orders } from '../../data/orders.js';
import { Component } from '../Component.js';
import { PayPalButtons } from './PayPalButtons.js';
import { WindowUtils } from '../../utils/WindowUtils.js';

export class PaymentSummary extends Component {
  element;
  events = {
    'click .js-paypal-button': (event) => this.#selectPaypal(event),
    'click .js-card-button': (event) => this.#selectCardPayment(event),
  };

  #usePaypal;
  #loadedPaypal = false;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
    this.#usePaypal = localStorage.getItem('exercises-kits-use-paypal') === 'true';
  }

  async #getUserId() {
    try {
      const basePath = '/backend';
      const response = await fetch(`${basePath}/get-user-id.php`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user ID: ${response.statusText}`);
      }
      const data = await response.json();
      return data.userId || null;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }

  async render() {
    this.element.innerHTML = `
      <div class="js-payment-info"></div>

      <div class="js-payment-buttons-container ${this.#usePaypal ? 'use-paypal' : ''} js-payment-summary">
        <div class="js-paypal-button-container paypal-button-container"></div>
        <button class="js-place-order-button place-order-button button-primary">Place your order</button>
      </div>
    `;

    await this.refreshPaymentDetails();

    if (this.#usePaypal && !this.#loadedPaypal) {
      this.#loadPayPalButtons();
    }

    this.events['click .js-place-order-button'] = (event) => this.#performCheckout(event);
  }

  async refreshPaymentDetails() {
    try {
      const userId = await this.#getUserId();
      const {
        productCostCents,
        shippingCostCents,
        taxCents,
        totalCents,
      } = await cart.calculateCosts(userId);

      const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.1);
      const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
      const quantity = await cart.calculateTotalQuantity();

      const paymentInfoElement = this.element.querySelector('.js-payment-info');
      if (paymentInfoElement) {
        paymentInfoElement.innerHTML = `
          <div class="payment-summary-title">Order Summary</div>
          <div class="payment-summary-row">
            <div>Items (${quantity}):</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(productCostCents)}</div>
          </div>
          <div class="payment-summary-row">
            <div>Shipping & handling:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents)}</div>
          </div>
          <div class="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}</div>
          </div>
          <div class="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(finalTaxCents)}</div>
          </div>
          <div class="payment-summary-row total-row">
            <div>Final total:</div>
            <div class="payment-summary-money">${MoneyUtils.formatMoney(finalTotalCents)}</div>
          </div>
        `;
      }

      if (cart.isEmpty()) {
        this.element.querySelector('.js-payment-buttons-container')
          ?.classList.add('payment-buttons-disabled');
      }
    } catch (error) {
      console.error('Error refreshing payment details:', error);
    }
  }

  #selectCardPayment() {
    this.#usePaypal = false;
    this.#updatePaymentMethod();
  }

  #selectPaypal() {
    this.#usePaypal = true;
    this.#updatePaymentMethod();
  }

  #updatePaymentMethod() {
    const container = this.element.querySelector('.js-payment-buttons-container');
    if (this.#usePaypal) {
      container?.classList.add('use-paypal');
      this.#loadPayPalButtons();
    } else {
      container?.classList.remove('use-paypal');
    }

    localStorage.setItem('exercises-kits-use-paypal', this.#usePaypal);
  }

  #performCheckout() {
    try {
      orders.createNewOrder(cart);
      WindowUtils.setHref('orders.php');
    } catch (error) {
      console.error('Error performing checkout:', error);
    }
  }

  #loadPayPalButtons() {
    if (!this.#loadedPaypal) {
      new PayPalButtons('.js-paypal-button-container').create();
      this.#loadedPaypal = true;
    }
  }
}
