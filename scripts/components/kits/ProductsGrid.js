import { cart } from '../../data/cart.js';
import { products } from '../../data/products.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class ProductsGrid extends ComponentV2 {
  events = {
    'click .js-add-to-cart-button': (event) => this.#checkSessionAndAddToCart(event),
    'click .js-view-product-button': (event) => this.#viewProduct(event),
  };

  #kitsHeader;
  #successMessageTimeouts = {};

  setKitsHeader(kitsHeader) {
    this.#kitsHeader = kitsHeader;
  }

  #viewProduct(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.getAttribute('data-product-id');
    window.location.href = `view-product.php?id=${productId}`;
  }

  async render() {
    try {
      const searchParams = new URLSearchParams(WindowUtils.getSearch());
      const searchText = searchParams.get('search') || '';

      const response = await fetch('backend/get-products.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const productsData = await response.json();
      const filteredProducts = productsData.filter(product => {
        return product.name.toLowerCase().includes(searchText.toLowerCase());
      });

      if (filteredProducts.length === 0) {
        this.element.innerHTML = `
          <div class="empty-results-message" data-testid="empty-results-message">
            No products matched your search.
          </div>`;
        return;
      }

      let productsGridHTML = '';
      filteredProducts.forEach((product) => {
        const productImage = product.image || product.createImageUrl();
        const ratingStarsImage = this.createRatingStarsUrl(product.rating.stars);
        const formattedPrice = MoneyUtils.formatMoney(product.priceCents);

        productsGridHTML += `
          <div class="js-product-container product-container" data-product-id="${product.id}">
            <div class="product-image-container">
              <img class="js-product-image product-image" src="${productImage}" data-testid="product-image">
            </div>

            <div class="product-name limit-to-2-lines">${product.name}</div>

            <div class="product-rating-container">
              <img class="product-rating-stars" src="${ratingStarsImage}">
              <div class="product-rating-count link-primary">${product.rating.count}</div>
            </div>

            <div class="product-price">${formattedPrice}</div>

            <div class="product-quantity-container">
              <select class="js-quantity-selector" data-testid="quantity-selector">
                <option selected value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>

            <div class="product-spacer"></div>

            <div class="js-added-to-cart-message added-to-cart-message" data-testid="added-to-cart-message">
              <img src="images/icons/checkmark.png">
              Added
            </div>

            <button 
              class="js-view-product-button view-product-button button-secondary" 
              data-product-id="${product.id}">
              View Product
            </button>

            <button class="js-add-to-cart-button add-to-cart-button button-primary" data-testid="add-to-cart-button">
              Add to Cart
            </button>
          </div>`;
      });

      this.element.innerHTML = productsGridHTML;
      this.attachEventListeners();
      this.element.querySelectorAll('.js-view-product-button').forEach((button) => {
        button.addEventListener('click', (event) => this.#viewProduct(event));
      });

    } catch (error) {
      console.error('Error rendering products:', error);
      this.element.innerHTML = `There was an error loading the products. Please try again later.`;
    }
  }

  attachEventListeners() {
    const addToCartButtons = this.element.querySelectorAll('.js-add-to-cart-button');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (event) => this.#checkSessionAndAddToCart(event));
    });
  }

  createRatingStarsUrl(stars) {
    return `./images/ratings/rating-${stars * 10}.png`;
  }

  async #checkSessionAndAddToCart(event) {
    const basePath = window.location.origin + '/backend';
    const response = await fetch(`${basePath}/check-session.php`);
    const data = await response.json();
    if (!data.isLoggedIn) {
      window.location.href = 'login.php';
      return;
    }
    this.#addToCartLogic(event);
  }

  async #addToCartLogic(event) {
    const productContainer = event.target.closest('.js-product-container');
    const productId = productContainer.getAttribute('data-product-id');
    const quantitySelector = productContainer.querySelector('.js-quantity-selector');
    const quantity = quantitySelector ? parseInt(quantitySelector.value, 10) : 1;
    const size = 'L';
    const addToCartPromises = [];
    for (let i = 0; i < quantity; i++) {
      addToCartPromises.push(this.#sendAddToCartRequest(productId, size));
    }
    await Promise.all(addToCartPromises);
    this.#kitsHeader.updateCartCount();
    this.#showSuccessMessage(productContainer, productId);
  }
  async #sendAddToCartRequest(productId, size) {
    const userId = await this.#getUserId();

    if (!userId) {
      window.location.href = 'login.php';
      return;
    }

    const basePath = window.location.origin + '/backend';
    const response = await fetch(`${basePath}/add-to-cart.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        size: size,
      }),
    });

    const data = await response.json();
    if (data.status === 'Product added to cart' || data.status === 'Product quantity updated in cart') {
    } else {
      console.error(data.status);
    }
  }
  #showSuccessMessage(productContainer, productId) {
    const successMessage = productContainer.querySelector('.js-added-to-cart-message');
    if (successMessage) {
      successMessage.classList.add('is-visible');

      if (this.#successMessageTimeouts[productId]) {
        clearTimeout(this.#successMessageTimeouts[productId]);
      }

      this.#successMessageTimeouts[productId] = setTimeout(() => {
        successMessage.classList.remove('is-visible');
      }, 2000);
    }
  }
  async #getUserId() {
    const basePath = window.location.origin + '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();
    return data.userId || null;
  }
}
