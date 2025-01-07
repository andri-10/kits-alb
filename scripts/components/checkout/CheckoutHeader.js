import {cart} from '../../data/cart.js';
import {ComponentV2} from '../ComponentV2.js';

export class CheckoutHeader extends ComponentV2 {
  async render() {
    const quantity = await cart.calculateTotalQuantity();

    this.element.innerHTML = `
      <div class="header-content">
        <section class="left-section">
          <a href="catalog.php" data-testid="kits-logo">
            <img class="kits-logo" src="images/kits-logo.png">
            <img class="kits-mobile-logo" src="images/kits-mobile-logo.png">
          </a>
        </section>

        <section class="middle-section">
          Checkout (<a class="js-return-to-home-link return-to-home-link"
            href="catalog.php" data-testid="cart-quantity">${quantity} items</a>)

          <div class="js-navigation-popover navigation-popover">
            <div class="popover-message">
              Are you sure you want to return to leave checkout?
            </div>
            <button class="js-close-navigation-popover button-secondary">
              Stay in checkout
            </button>
            <a href="catalog.php">
              <button class="button-primary">
                Return to home
              </button>
            </a>
          </div>
        </section>

        <section class="right-section">
          <img src="images/icons/checkout-lock-icon.png">
        </section>
      </div>
    `;
  }

  async updateCartCount() {
    const totalQuantity = await cart.calculateTotalQuantity();
    this.element.querySelector('.js-return-to-home-link')
      .textContent = `${totalQuantity} items`;
  }
}