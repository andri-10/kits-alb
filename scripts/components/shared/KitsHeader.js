import {cart} from '../../data/cart.js';
import {WindowUtils} from '../../utils/WindowUtils.js';
import {ComponentV2} from '../ComponentV2.js';

export class KitsHeader extends ComponentV2 {
  events = {
    'click .js-hamburger-menu-toggle':
      (event) => this.#toggleDropdownMenu(event),
    'keyup .js-search-bar':
      (event) => this.#handleSearchBarInput(event),
    'click .js-search-button':
      (event) => this.#handleSearchClick(event),
  };

  // Store references to cart quantity elements
  #cartQuantityElement;
  #cartQuantityMobileElement;

  async render() {
    const searchParams = new URLSearchParams(WindowUtils.getSearch());
    const searchText = searchParams.get('search') || '';
  
    // Wait for the total quantity to be fetched
    const totalCartQuantity = await cart.calculateTotalQuantity();
    
    // Render the header HTML
    this.element.innerHTML = `
      <section class="left-section">
        <a href="index.php" class="header-link">
          <img class="kits-logo" src="images/kits-logo-white.png">
          <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png">
        </a>
      </section>
  
      <section class="middle-section">
        <input class="js-search-bar search-bar" type="text" placeholder="Search" value="${searchText}" data-testid="search-input">
        <button class="js-search-button search-button" data-testid="search-button">
          <img class="search-icon" src="images/icons/search-icon.png">
        </button>
      </section>
  
      <section class="right-section">

      <?php if ($isLoggedIn): ?>
            <a class="orders-link header-link" href="orders.php">
          <?php else: ?>
            <a class="orders-link header-link" href="login.php">
          <?php endif; ?>
          <span class="returns-text">Returns</span>
          <span class="orders-text">& Orders</span>
        </a>
        <?php if ($isLoggedIn): ?>
            <a class="cart-link header-link" href="checkout.php">
          <?php else: ?>
            <a class="cart-link header-link" href="login.php">
          <?php endif; ?>
        
          <img class="cart-icon" src="images/icons/cart-icon.png">
          <div class="js-cart-quantity cart-quantity" data-testid="cart-quantity">
            ${totalCartQuantity}
          </div>
          <div class="cart-text">Cart</div>
        </a>
      </section>
  
      <section class="right-section-mobile">
        <img class="js-hamburger-menu-toggle hamburger-menu-toggle" src="images/icons/hamburger-menu.png" data-testid="hamburger-menu-toggle">
      </section>
  
      <div class="js-hamburger-menu-dropdown hamburger-menu-dropdown" data-testid="hamburger-menu-dropdown">
        <a class="hamburger-menu-link" href="orders.php">Returns & Orders</a>
        <a class="hamburger-menu-link" href="checkout.php">
          Cart (<span class="js-cart-quantity-mobile cart-quantity-mobile" data-testid="cart-quantity-mobile">${totalCartQuantity}</span>)
        </a>
      </div>
    `;
  
    // Ensure that cart quantity elements are available after render
    this.#cartQuantityElement = this.element.querySelector('.js-cart-quantity');
    this.#cartQuantityMobileElement = this.element.querySelector('.js-cart-quantity-mobile');
  
    // Update cart count after the render
    this.updateCartCount();
  }
  // Add selectors for both normal and mobile cart quantities
  getCartQuantityElement() {
    return this.#cartQuantityElement;
  }

  getCartQuantityMobileElement() {
    return this.#cartQuantityMobileElement;
  }

  async updateCartCount() {
    // Ensure that references to the elements are available
    if (!this.#cartQuantityElement || !this.#cartQuantityMobileElement) {
      console.error("Cart quantity elements are not available.");
      return;
    }
  
    // Get the updated total cart quantity
    try {
      const totalCartQuantity = await cart.calculateTotalQuantity();
  
      if (totalCartQuantity === undefined) {
        console.error("Failed to retrieve the cart quantity.");
        return;
      }
  
      // Update the cart count in the header directly for both normal and mobile
      this.#cartQuantityElement.textContent = totalCartQuantity;
      this.#cartQuantityMobileElement.textContent = totalCartQuantity;
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  #toggleDropdownMenu(event) {
    const dropdownMenu = this.element.querySelector('.js-hamburger-menu-dropdown');
    const isOpened = dropdownMenu.classList.contains('hamburger-menu-opened');
  
    if (!isOpened) {
      dropdownMenu.classList.add('hamburger-menu-opened');
      dropdownMenu.style.height = '88px'; // Set to the height of the menu
    } else {
      dropdownMenu.classList.remove('hamburger-menu-opened');
      dropdownMenu.style.height = '0'; // Collapse the menu
    }
  }
  

  #handleSearchBarInput(event) {
    if (event.key === 'Enter') {
      this.#searchProducts(
        this.element.querySelector('.js-search-bar').value
      );
    }
  }

  #handleSearchClick() {
    this.#searchProducts(
      this.element.querySelector('.js-search-bar').value
    );
  }

  #searchProducts(searchText) {
    if (!searchText) {
      WindowUtils.setHref('./catalog.php');
      return;
    }

    WindowUtils.setHref(`./?search=${searchText}`);
  }
}
