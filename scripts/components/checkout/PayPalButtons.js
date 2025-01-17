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
    const cartItems = cart.items; 
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

  async #loadPayPalSdk(clientId) {
    if (window.paypal) {
      return; // SDK is already loaded
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Error loading PayPal SDK:', error);
        reject(new Error('Failed to load PayPal SDK'));
      };

      document.head.appendChild(script);
    });
  }

  async render(clientId) {
    try {
      await this.#loadPayPalSdk(clientId);

      paypal.Buttons({
        onInit: async (data, actions) => {
          if (cart.isEmpty() || !(await this.#validateDeliveryOptions())) {
            actions.disable();
          } else {
            actions.enable();
          }
        },

        createOrder: async (data, actions) => {
          const isValid = await this.#validateDeliveryOptions();
          if (!isValid) {
            this.#showError('Please select a delivery option for all products');
            return Promise.reject('Delivery options not selected');
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
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
      this.#showError('Failed to load PayPal buttons. Please refresh the page.');
    }
  }
}
