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

      console.log('Total cents to charge:', totalCents);  // Debug log for totalCents

      // Create payment intent
      const paymentIntentResponse = await this.stripeHandler.createPaymentIntent(totalCents);
      console.log('PaymentIntent Response:', paymentIntentResponse);  // Debug log for response

      if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
        throw new Error('Failed to initialize payment');
      }

      const { clientSecret } = paymentIntentResponse;

      // Process payment
      const paymentResult = await this.stripeHandler.processPayment(clientSecret);
      console.log('Payment Result:', paymentResult);  // Debug log for payment result

      // Log payment
      await this.logPayment({
        order_id: paymentResult.id,
        payment_gateway: 'stripe',
        amount: totalCents / 100,
        status: 'success',
        created_at: new Date().toISOString()
      });

      // Create order and redirect
      await orders.createNewOrder();
      window.location.href = 'orders.php';
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(error.message || 'Payment failed. Please try again.');
      submitButton.disabled = false;
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

  async refreshPaymentDetails() {
    await this.render();
  }

  async logPayment(paymentData) {
    try {
      const response = await fetch('backend/log-payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const responseBody = await response.text();
      console.log('Log Payment Response:', responseBody);  // Debug log for log payment response

      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }
}
