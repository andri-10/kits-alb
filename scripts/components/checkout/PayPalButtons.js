import { cart } from '../../data/cart.js';
import { orders } from '../../data/orders.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { Component } from '../Component.js';

export class PayPalButtons extends Component {
  element;
  #selector;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
    this.#selector = selector;
  }

  async #validateDeliveryOptions() {
    const cartItems = await cart.getItems();
    return cartItems.every(item => item.selectedDelivery);
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

    const buttonsContainer = document.querySelector(this.#selector);
    buttonsContainer.parentNode.insertBefore(errorContainer, buttonsContainer);
  }

  async #logPayment(paymentData) {
    try {
      const response = await fetch('/backend/log-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }

  render() {
    paypal.Buttons({
      onInit: (data, actions) => {
        if (cart.isEmpty()) {
          actions.disable();
        }
      },

      createOrder: async (data, actions) => {
        const isValid = await this.#validateDeliveryOptions();
        if (!isValid) {
          this.#showError('Please select a delivery option for all products');
          return actions.reject();
        }

        const costs = await cart.calculateCosts();

        await this.#logPayment({
          payment_gateway: 'paypal',
          status: 'initiated',
          amount: costs.totalCents / 100,
          created_at: new Date().toISOString(),
        });

        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: (costs.totalCents / 100).toFixed(2),
              },
            },
          ],
        });
      },

      onApprove: async (data, actions) => {
        try {
          const orderData = await actions.order.capture();
          const transaction = orderData.purchase_units[0].payments.captures[0];

          await this.#logPayment({
            order_id: transaction.id,
            payment_gateway: 'paypal',
            status: 'success',
            amount: parseFloat(transaction.amount.value),
            created_at: new Date().toISOString(),
          });

          await orders.createNewOrder(cart);
          WindowUtils.setHref('orders.php');
        } catch (error) {
          console.error('Payment error:', error);
          this.#showError('Payment failed. Please try again.');

          await this.#logPayment({
            payment_gateway: 'paypal',
            status: 'error',
            created_at: new Date().toISOString(),
          });
        }
      },

      onError: async (err) => {
        console.error('PayPal error:', err);
        this.#showError('An error occurred with PayPal. Please try again.');

        await this.#logPayment({
          payment_gateway: 'paypal',
          status: 'error',
          created_at: new Date().toISOString(),
        });
      },
    }).render(this.#selector);
  }
}
