import { cart } from '../../data/cart.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class KitsHeader extends ComponentV2 {
  events = {
    'click .js-hamburger-menu-toggle': (event) => this.#toggleDropdownMenu(event),
    'keyup .js-search-bar': (event) => this.#handleSearchBarInput(event),
    'click .js-search-button': (event) => this.#handleSearchClick(event),
  };

<<<<<<< HEAD
=======
  // Store references to cart quantity elements
  #cartQuantityElement;
  #cartQuantityMobileElement;

>>>>>>> 31668712b17768f804beaea7b2b7a389036422fc
  async render() {
    const searchParams = new URLSearchParams(WindowUtils.getSearch());
    const searchText = searchParams.get('search') || '';

    let totalCartQuantity = await cart.calculateTotalQuantity();
    const userId = await this.#getUserId();
    const cartLinkHref = userId ? 'checkout.php' : 'login.php';
    const orderLinkHref = userId ? 'orders.php': 'login.php';

<<<<<<< HEAD
=======
    // Check if the user is logged in
    const userId = await this.#getUserId();
    const cartLinkHref = userId ? 'checkout.php' : 'login.php'; // Conditionally set the href
    const orderLinkHref = userId ? 'orders.php': 'login.php'; 
    // Render the header HTML with the dynamic cart link
>>>>>>> 31668712b17768f804beaea7b2b7a389036422fc
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
        <a class="orders-link header-link" href="${orderLinkHref}">
          <span class="returns-text">Returns</span>
          <span class="orders-text">& Orders</span>
        </a>
        <a class="js-cart-link cart-link header-link" href="${cartLinkHref}">
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
        <a class="hamburger-menu-link" href="${orderLinkHref}">Returns & Orders</a>
        <a class="hamburger-menu-link" href="${cartLinkHref}">
          Cart (<span class="js-cart-quantity-mobile cart-quantity-mobile" data-testid="cart-quantity-mobile">${totalCartQuantity}</span>)
        </a>
      </div>
    `;

    // Ensure event listener is active for mobile hamburger toggle
    this.#initializeHamburgerMenu();

    // Continue with the rest of the code...
  }

  #initializeHamburgerMenu() {
    const hamburgerMenuToggle = this.element.querySelector('.js-hamburger-menu-toggle');
    const hamburgerMenuDropdown = this.element.querySelector('.js-hamburger-menu-dropdown');
  
    hamburgerMenuToggle.addEventListener('click', () => this.#toggleDropdownMenu());
  }
  

  #toggleDropdownMenu() {
    const dropdownMenu = this.element.querySelector('.js-hamburger-menu-dropdown');
    const isOpened = dropdownMenu.classList.contains('hamburger-menu-opened');
  
    if (!isOpened) {
      dropdownMenu.classList.add('hamburger-menu-opened');
    } else {
      dropdownMenu.classList.remove('hamburger-menu-opened');
    }
  }

  #handleResize() {
    if (window.innerWidth > 575) {
      const dropdownMenu = this.element.querySelector('.js-hamburger-menu-dropdown');
      dropdownMenu.classList.remove('hamburger-menu-opened');
    }
  }
  

  #handleSearchBarInput(event) {
    if (event.key === 'Enter') {
      this.#searchProducts(this.element.querySelector('.js-search-bar').value);
    }
  }

  #handleSearchClick() {
    this.#searchProducts(this.element.querySelector('.js-search-bar').value);
  }

  #searchProducts(searchText) {
    if (!searchText) {
      WindowUtils.setHref('./catalog.php');
      return;
    }

    WindowUtils.setHref(`./?search=${searchText}`);
  }

  async #getUserId() {
    const basePath = window.location.origin + '/backend';
    try {
      const response = await fetch(`${basePath}/get-user-id.php`);
      const data = await response.json();
      console.log('User ID response:', data);  // Debugging line
      return data.userId || null;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }
  

}
