import { cart } from '../../data/cart.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class KitsHeader extends ComponentV2 {


  constructor(selector, hideSearch = false) {
    super(selector);
    this.hideSearch = hideSearch;
  }


  events = {
    'click .js-hamburger-menu-toggle': (event) => this.#toggleDropdownMenu(event),
  
  };
  #cartQuantityElement;
 
  async getUserId() {
    const basePath = window.location.origin + '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();
    return data.userId || null;
  }

  async getUserId() {
    try {
      const response = await fetch('/backend/get-user-id.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.userId || null;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }
  
  async getProfilePhoto() {
    try {
      const response = await fetch('/backend/get-profile-photo.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.profilePhoto || null;
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      return null;
    }
  }
  

  async render() {

    const currentPage = window.location.pathname.split('/').pop();
    const logoLink = currentPage === 'orders.php' ? 'catalog.php' : 'index.php';

    const searchParams = new URLSearchParams(WindowUtils.getSearch());
    const searchText = searchParams.get('search') || '';
    let totalCartQuantity = await cart.calculateTotalQuantity();
    const userId = await this.getUserId();
    const cartLinkHref = userId ? 'checkout.php' : 'login.php';
    const orderLinkHref = userId ? 'orders.php' : 'login.php'; 
  
    let searchSection = '';
  
    if (!this.hideSearch) {
      searchSection = `
        <section class="middle-section">
          <input class="js-search-bar search-bar" type="text" placeholder="Search" value="${searchText}" data-testid="search-input">
  
          <button class="js-clear-search search-clear-button" data-testid="clear-search-button" aria-label="Clear Search">
            <img class="clear-icon" src="images/icons/clear-icon.png">
          </button>
  
          <button class="js-search-button search-button" data-testid="search-button">
            <img class="search-icon" src="images/icons/search-icon.png">
          </button>
        </section>
      `;
    }

    let accountSection = '';

    if(userId){
      const profilePhoto = await this.getProfilePhoto();
      
      accountSection = `
        <a class="js-pfp-link pfp-link header-link" href="account.php">
          <img class="pfp-icon" src="${profilePhoto ? profilePhoto.slice(2) : 'images/default-profile.png'}">
        </a>
      `
    }
  
    this.element.innerHTML = `
      <section class="left-section">
      <a href="${logoLink}" class="header-link">
        <img class="kits-logo" src="images/kits-logo-white.png">
        <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png">
      </a>
    </section>
  
      ${searchSection}
  
      <section class="right-section">
        <a class="orders-link header-link" href="${orderLinkHref}">
          <span class="returns-text">Returns</span>
          <span class="orders-text">& Orders</span>
        </a>
      
        

        <!-- Cart link now dynamically redirects based on user login -->
        <a class="js-cart-link cart-link header-link" href="${cartLinkHref}">
          <img class="cart-icon" src="images/icons/cart-icon.png">
          <div class="js-cart-quantity cart-quantity" data-testid="cart-quantity">
            ${totalCartQuantity}
          </div>
          <div class="cart-text">Cart</div>
        </a>

        ${accountSection}

      </section>
  
      <section class="right-section-mobile">
        <img class="js-hamburger-menu-toggle hamburger-menu-toggle" src="images/icons/hamburger-menu.png" data-testid="hamburger-menu-toggle">
      </section>
  
      <div class="js-hamburger-menu-dropdown hamburger-menu-dropdown" data-testid="hamburger-menu-dropdown">
        <a class="hamburger-menu-link" href="${orderLinkHref}">Returns & Orders</a>
        <a class="hamburger-menu-link" href="${cartLinkHref}">
          Cart (${totalCartQuantity})
        </a>
        
      </div>
    `;

    if(!this.hideSearch){
    const searchBar = document.querySelector('.kits-header .search-bar');
    const clearButton = document.querySelector('.kits-header .search-clear-button');
    if (searchBar.value.trim().length > 0) {
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }
    searchBar.addEventListener('input', function() {
      if (searchBar.value.trim().length > 0) {
        clearButton.style.display = 'block';
        searchBar.style.width = 'calc(100% - 40px)';
      } else {
        clearButton.style.display = 'none';
      }
    });
    this.element.querySelector('.js-search-bar').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.#performSearch();
      }
    });
    this.element.querySelector('.js-search-button').addEventListener('click', () => {
      this.#performSearch();
    });
    this.element.querySelector('.js-clear-search').addEventListener('click', () => {
      this.element.querySelector('.js-search-bar').value = ''; 
      clearButton.style.display = 'none';
      this.#performSearch();
    });
  }

    this.#cartQuantityElement = this.element.querySelector('.js-cart-quantity');
    

    this.updateCartCount();
    this.#initializeHamburgerMenu();
  }
  getCartQuantityElement() {
    return this.#cartQuantityElement;
  }

 

  async updateCartCount() {
    if (!this.#cartQuantityElement) {
      console.error("Cart quantity elements are not available.");
      return;
    }
    try {
      const totalCartQuantity = await cart.calculateTotalQuantity();

      if (totalCartQuantity === undefined) {
        console.error("Failed to retrieve the cart quantity.");
        return;
      }
      this.#cartQuantityElement.textContent = totalCartQuantity;
 
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
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

  #performSearch() {
    const searchText = this.element.querySelector('.js-search-bar').value;
    const searchParams = new URLSearchParams(WindowUtils.getSearch());
    searchParams.set('search', searchText);
    WindowUtils.setSearch(searchParams.toString());
  }
}