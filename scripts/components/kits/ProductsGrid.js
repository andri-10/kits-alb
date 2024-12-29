import { cart } from '../../data/cart.js';
import { products } from '../../data/products.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { WindowUtils } from '../../utils/WindowUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class ProductsGrid extends ComponentV2 {
  events = {
    'click .js-add-to-cart-button': (event) => this.#checkSessionAndAddToCart(event),
    'click .js-variation-option': (event) => this.#selectVariation(event),
    'click .js-view-product-button': (event) => this.#viewProduct(event),
  };

  #kitsHeader;
  #successMessageTimeouts = {};

  setKitsHeader(kitsHeader) {
    this.#kitsHeader = kitsHeader;
  }
  
  #viewProduct(event) {
    event.preventDefault(); // Prevent default action
    const button = event.currentTarget; 
    const productId = button.getAttribute('data-product-id'); 
    window.location.href = `view-product.php?id=${productId}`;
}
  
  async render() {
    try {
      const searchParams = new URLSearchParams(WindowUtils.getSearch());
      const searchText = searchParams.get('search') || '';

      const response = searchText
        ? await fetch(`backend/search-products.php?search=${searchText}`)
        : await fetch('backend/get-products.php');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const productsData = await response.json();

      if (productsData.length === 0) {
        this.element.innerHTML = `
          <div class="empty-results-message" data-testid="empty-results-message">
            No products matched your search.
          </div>`;
        return;
      }

      let productsGridHTML = '';
      productsData.forEach((product) => {
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

            ${this.#createVariationsSelectorHTML(product)}

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

      // Manually attach event listeners
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

    const variationButtons = this.element.querySelectorAll('.js-variation-option');
    variationButtons.forEach((button) => {
      button.addEventListener('click', (event) => this.#selectVariation(event));
    });
  }

  createRatingStarsUrl(stars) {
    return `/kits-alb/images/ratings/rating-${stars * 10}.png`;
  }

  #createVariationsSelectorHTML(product) {
    if (!product.variations) return '';

    let variationsHTML = '';
    Object.keys(product.variations).forEach((name) => {
      variationsHTML += `
        <div class="variation-name">${name}</div>
        <div class="js-variation-options-container variation-options-container">
          ${this.#createVariationOptionsHTML(name, product.variations[name])}
        </div>`;
    });
    return variationsHTML;
  }

  #createVariationOptionsHTML(variationName, variationOptions) {
    let optionsHTML = '';
    variationOptions.forEach((option, index) => {
      optionsHTML += `
        <button class="js-variation-option variation-option ${index === 0 ? 'js-selected-variation is-selected' : ''}"
          data-variation-name="${variationName}" data-variation-value="${option}" data-testid="variation-${variationName}-${option}">
          ${option}
        </button>`;
    });
    return optionsHTML;
  }

  #selectVariation(event) {
    const button = event.currentTarget;
    const variationsContainer = button.closest('.js-variation-options-container');
    const previousButton = variationsContainer.querySelector('.js-selected-variation');
    if (previousButton) {
      previousButton.classList.remove('js-selected-variation', 'is-selected');
    }
    button.classList.add('js-selected-variation', 'is-selected');

    const productContainer = button.closest('.js-product-container');
    const productId = productContainer.getAttribute('data-product-id');
    const product = products.findById(productId);
    const variation = this.#getSelectedVariation(productContainer);
    const productImage = product.createImageUrl(variation);

    productContainer.querySelector('.js-product-image').src = productImage;
  }

  #getSelectedVariation(productContainer) {
    if (!productContainer.querySelector('.js-selected-variation')) {
      return null;
    }

    const selectedVariation = {};
    productContainer.querySelectorAll('.js-selected-variation').forEach((button) => {
      const name = button.getAttribute('data-variation-name');
      const value = button.getAttribute('data-variation-value');
      selectedVariation[name] = value;
    });
    return selectedVariation;
  }

  async #checkSessionAndAddToCart(event) {
    const basePath = window.location.origin + '/kits-alb/backend/';
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
  
    // Collect all add-to-cart requests into an array of promises
    const addToCartPromises = [];
    for (let i = 0; i < quantity; i++) {
      addToCartPromises.push(this.#sendAddToCartRequest(productId));  // Push promises to the array
    }
  
    // Wait for all promises to resolve
    await Promise.all(addToCartPromises);
  
    // Now update the cart count after all requests have completed
    this.#kitsHeader.updateCartCount();
  
    // Show success message for each product added
    this.#showSuccessMessage(productContainer, productId);
  }
  
  

  // Function to send the AJAX request to the PHP backend
  async #sendAddToCartRequest(productId) {
    const userId = await this.#getUserId();
  
    if (!userId) {
      window.location.href = 'login.php';
      return;
    }
  const basePath = window.location.origin + '/kits-alb/backend/';
    const response = await fetch(`${basePath}/add-to-cart.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
      }),
    });
  
    const data = await response.json();
    if (data.status === 'Product added to cart' || data.status === 'Product quantity updated in cart') {
      // Success message is handled in the #showSuccessMessage method after each product is added
    } else {
      console.error(data.status);
    }
  }

  // Function to display the success message
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

  // Function to retrieve the user ID from session or database
  async #getUserId() {
    const basePath = window.location.origin + '/kits-alb/backend/';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();
    return data.userId || null;
  }
}
