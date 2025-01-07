import {cart} from '../../data/cart.js';
import {orders} from '../../data/orders.js';
import {WindowUtils} from '../../utils/WindowUtils.js';
import {Component} from '../Component.js';

export class PayPalButtons extends Component {
  element;
  #selector;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
    this.#selector = selector;
  }

  render() {
    paypal.Buttons({
      onInit: (data, actions) => {
        if (cart.isEmpty()) {
          actions.disable();
        }
      },
      createOrder: (data, actions) => {
        const costs = cart.calculateCosts();

        return actions.order.create({
          purchase_units: [{
            amount: {
              value: (costs.totalCents / 100).toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const orderData = await actions.order.capture();
        console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));

        const transaction = orderData.purchase_units[0].payments.captures[0];
        alert(`Transaction ${transaction.status}: ${transaction.id}\n\nSee console for all available details`);

        orders.createNewOrder(cart);
        WindowUtils.setHref('orders.php');
      }
    }).render(this.#selector);
  }
}
