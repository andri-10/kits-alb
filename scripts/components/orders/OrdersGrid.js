import { orders } from '../../data/orders.js';
import { cart } from '../../data/cart.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { products } from '../../data/products.js';
import { Component } from '../Component.js';
import { WindowUtils } from '../../utils/WindowUtils.js';

export class OrdersGrid extends Component {
  element;

  events = {
    'click .js-buy-again-button': (event) => this.#addToCart(event),
    'click .js-track-package-button': (event) => this.#trackPackage(event),
  };

  #addedToCartTimeouts = {};
  #kitsHeader;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
  }

  setKitsHeader(kitsHeader) {
    this.#kitsHeader = kitsHeader;
  }

  render() {
    let ordersHTML = '';

    orders.all.forEach(order => {
      const orderDate = DateUtils.formatDateMonth(order.orderTimeMs);
      const orderCost = MoneyUtils.formatMoney(order.totalCostCents);

      ordersHTML += `
        <div class="order-container" data-testid="order-container-${order.id}">
          <header class="order-header">
            <section class="left-section">
              <div class="order-date">
                <div class="order-header-label">Order Placed:</div>
                <div>${orderDate}</div>
              </div>
              <div class="order-total">
                <div class="order-header-label">Total:</div>
                <div>${orderCost}</div>
              </div>
            </section>

            <section class="right-section">
              <div class="order-header-label">Order ID:</div>
              <div>${order.id}</div>
            </section>
          </header>

          <div class="order-details-grid">
            ${this.#createOrderDetailsHTML(order)}
          </div>
        </div>
      `;
    });

    this.element.innerHTML = ordersHTML;
  }

  #createOrderDetailsHTML(order) {
    let ordersHTML = '';
  
    order.products.forEach(productDetails => {
      const product = products.findById(productDetails.productId);
      if (!product) {
        console.error(`Product not found for ID: ${productDetails.productId}`);
        return;
      }
  
      const productImage = product.createImageUrl();
      const deliveryDateMessage = Date.now() < productDetails.estimatedDeliveryTimeMs
        ? `Arriving on: ${DateUtils.formatDateMonth(productDetails.estimatedDeliveryTimeMs)}`
        : `Delivered on: ${DateUtils.formatDateMonth(productDetails.estimatedDeliveryTimeMs)}`;
  
      ordersHTML += `
        <div class="product-image-container">
          <img src="${productImage}">
        </div>
  
        <div class="product-details">
          <div class="product-name">
            ${product.name}
          </div>
  
          <div class="product-delivery-date">
            ${deliveryDateMessage}
          </div>
  
          <div class="product-quantity">
            Quantity: ${productDetails.quantity}
          </div>
  
          <button class="js-buy-again-button buy-again-button button-primary"
            data-order-id="${order.id}"
            data-cart-item-id="${productDetails.cartItemId}"
            data-testid="buy-again-button-${productDetails.cartItemId}">
  
            <img class="buy-again-icon" src="images/icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>
  
            <span class="buy-again-success">
              &#10003; Added
            </span>
          </button>
        </div>
  
        <div class="product-actions">
          <button class="js-track-package-button track-package-button button-secondary"
            data-order-id="${order.id}"
            data-cart-item-id="${productDetails.cartItemId}"
            data-testid="track-package-${productDetails.cartItemId}">
            Track package
          </button>
        </div>
      `;
    });
  
    return ordersHTML;
  }
  

  #addToCart(event) {
    const button = event.currentTarget;
    const orderId = button.getAttribute('data-order-id');
    const cartItemId = button.getAttribute('data-cart-item-id');

    const order = orders.findById(orderId);
    const productDetails = order.findProductDetails(cartItemId);
    cart.addProduct(productDetails.productId, 1);

    this.#kitsHeader?.updateCartCount();
    button.classList.add('added-to-cart');

    const previousTimeoutId = this.#addedToCartTimeouts[orderId + cartItemId];
    if (previousTimeoutId) {
      clearTimeout(previousTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      button.classList.remove('added-to-cart');
    }, 1500);

    this.#addedToCartTimeouts[orderId + cartItemId] = timeoutId;
  }

  #trackPackage(event) {
    const button = event.currentTarget;
    const orderId = button.getAttribute('data-order-id');
    const cartItemId = button.getAttribute('data-cart-item-id');

    WindowUtils.setHref(`tracking.php?orderId=${orderId}&cartItemId=${cartItemId}`);
  }
}
