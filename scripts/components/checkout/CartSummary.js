import { cart } from '../../data/cart.js';
import { deliveryOptions } from '../../data/deliveryOptions.js';
import { products } from '../../data/products.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { DomUtils } from '../../utils/DomUtils.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { ComponentV2 } from '../ComponentV2.js';
import { VariationUtils } from '../../utils/VariationUtils.js';

export class CartSummary extends ComponentV2 {
  events = {
    'click .js-delivery-option':(event) => this.#selectDeliveryOption(event),
    'keyup .js-new-quantity-input': (event) => this.#handleQuantityInput(event),
    'click .js-cancel-quantity-update': (event) => this.#cancelUpdateQuantity(event),
    'click .js-delete-quantity-link': (event) => this.#handleDeleteLinkClick(event),
    'click .js-update-button': (event) => this.#toggleSizeSelector(event),
    'click .js-update-size': (event) => this.#handleSizeUpdate(event),
    'click .js-collapse-button': (event) => this.#toggleSizeSelector(event), // Handle collapse
  };

  #paymentSummary;
  #checkoutHeader;

  setPaymentSummary(paymentSummary) {
    this.#paymentSummary = paymentSummary;
  }

  setCheckoutHeader(checkoutHeader) {
    this.#checkoutHeader = checkoutHeader;
  }
  cartData = [];
  /**
   * Render the cart, including fetching data and rendering cart items.
   */
  async render() {
    try {
      console.log('Rendering CartSummary component...');
      await this.fetchCartData();
      this.#attachEventListeners();  // Ensure event listeners are attached after render
    } catch (error) {
      console.error('Error rendering cart:', error);
      this.#renderErrorMessage('Unable to load cart. Please try again later.');
    }
  }

  #attachEventListeners() {
    Object.keys(this.events).forEach((selector) => {
      const [eventType, targetSelector] = selector.split(' ');
  
      // Log to check if the event listeners are being attached
      console.log(`Attaching listener for ${eventType} on ${targetSelector}`);
  
      this.element.addEventListener(eventType, (event) => {
        const targetElem = event.target.closest(targetSelector); // Use closest for delegation
  
        if (targetElem) {
          console.log('Event triggered on:', targetElem);
          this.events[selector](event);
        }
      });
    });
  }

  /**
   * Fetch cart data from the backend.
   */
  async fetchCartData() {
    try {
      console.log('Fetching cart data from backend...');
      const response = await fetch('/kits-alb/backend/get-cart-products.php');

      if (!response.ok) {
        throw new Error(`Failed to fetch cart data. Status: ${response.status}`);
      }

      const cartData = await response.json();
      console.log('Cart data:', cartData);  // Log the entire response to ensure it's correct

      this.cartData = cartData; // Store cart data in the class

      // Render cart items
      this.renderCartItems(cartData);
    } catch (error) {
      console.error('Error fetching cart data:', error);
      this.#renderErrorMessage('Unable to load cart items. Please try again later.');
    }
  }

  /**
   * Render the cart items.
   * @param {Array} cartData - The cart data fetched from the backend.
   */
  renderCartItems(cartData) {
    if (cartData.length === 0) {
      this.#renderEmptyCartMessage();
      return;
    }
  
    let cartSummaryHTML = '';
    cartData.forEach(cartItem => {
      // Generate unique delivery options HTML for each cart item
      const deliveryOptionsHTML = this.#createDeliveryOptionsHTML(cartItem);
  
      cartSummaryHTML += `
        <div class="js-cart-item cart-item-container" data-cart-item-id="${cartItem.productId}">
          <div class="delivery-date delivery-date-${cartItem.productId}">
            <span class="js-delivery-date js-delivery-date-${cartItem.productId}"></span>
          </div>
  
          <div class="cart-item-details-and-delivery">
            <div class="cart-item-details-grid">
              <img class="product-image" src="${cartItem.image}" alt="${cartItem.name}">
              <div class="product-details-and-quantity">
                <div class="product-details">
                  <div class="product-name">${cartItem.name}</div>
                  <div class="product-price">${MoneyUtils.formatMoney(cartItem.priceCents * cartItem.quantity)}</div>
                </div>
                <div class="quantity-container js-quantity-container">
                  Quantity: 
                  <span class="js-quantity-label">${cartItem.quantity}</span>
                  <input 
                    class="js-quantity-input js-new-quantity-input" 
                    type="number" 
                    value="${cartItem.quantity}" 
                    min="1" 
                    data-cart-item-id="${cartItem.productId}" />
                  <span class="js-delete-quantity-link link-primary">Delete</span>
                  <div class="quantity-message quantity-message-${cartItem.productId}"></div>
                </div>
              </div>
            </div>
  
            <div class="delivery-options">
              <div class="delivery-options-title">Choose a delivery option:</div>
              ${deliveryOptionsHTML}
            </div>
          </div>
  
          <div class="update-container">
            <button class="js-update-button">Update sizes</button>
  
            <!-- Hidden dropdown with size selectors -->
            <div class="js-size-selector-dropdown size-selector-dropdown" style="display: none;">
              <div class="size-options">
                <!-- The fetched product options will be injected here -->
              </div>
            </div>
          </div>
        </div>
      `;
    });
  
    this.element.innerHTML = cartSummaryHTML;
  }
  


  #toggleSizeSelector(event) {
    const updateButton = event.target.closest('.js-update-button');
    const cartItemElement = updateButton.closest('.js-cart-item');
    const productId = cartItemElement.getAttribute('data-cart-item-id');
    const dropdown = cartItemElement.querySelector('.js-size-selector-dropdown');
    const quantityInput = cartItemElement.querySelector('.js-quantity-input'); // Select the quantity input
  
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
      dropdown.style.display = 'block'; // Show the size selector
      updateButton.textContent = 'Collapse'; // Change button text
  
      // Fetch products related to this kit (assuming the product belongs to a kit)
      this.#fetchKitProducts(productId).then(kitProducts => {
        this.#populateSizeSelector(dropdown, kitProducts);
      });
  
      // Make the quantity input readonly when the size selector is shown (because the user is updating size)
      quantityInput.setAttribute('readonly', 'readonly'); // Prevent the user from modifying the quantity
    } else {
      dropdown.style.display = 'none'; // Hide the size selector
      updateButton.textContent = 'Update sizes'; // Reset button text
  
      // Revert the readonly state when the size selector is hidden (allow editing again)
      quantityInput.removeAttribute('readonly'); // Re-enable editing of the quantity
    }
  }
  
  // Fetch the related products from the backend for a specific kit
  async #fetchKitProducts(productId) {
    try {
      console.log('Fetching products for kit...', productId); // Debugging line
  
      const response = await fetch('/kits-alb/backend/get-individual-products.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }) // Sending productId in the request body
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error('Failed to fetch kit products');
      }
  
      // Parse the JSON response
      const data = await response.json();
  
      // Debugging: Log the response to verify
      console.log('Response data:', data); // Log the entire response
  
      // Check if the response contains the data we need
      if (data.success && Array.isArray(data.data)) {
        console.log('Kit Products:', data.data); // Log the products
        return data.data; // Return the product data
      } else {
        console.error('No data found or an error occurred');
        return [];
      }
    } catch (error) {
      console.error('Error fetching kit products:', error);
  console.error('Error details:', error.stack || error); // Log the error stack trace or the error message
      return []; // Return an empty array in case of an error
    }
  }
  
  // Populates the size selector dropdown with fetched kit products
  #populateSizeSelector(dropdown, kitProducts) {
    const sizeSelectorContainer = dropdown.querySelector('.size-options');
    sizeSelectorContainer.innerHTML = ''; // Clear existing options

    if (kitProducts.length === 0) {
      sizeSelectorContainer.innerHTML = `<div>No products available for this kit</div>`;
      return;
    }
    
    kitProducts.forEach(product => {
      console.log(product); // Debugging: Log product details

      const selectedSize = product.cart_size; // Fetch the selected size for this product
      console.log(`Selected size for ${product.product_name}:`, selectedSize); // Debugging output
  
      // Generate size options for each product
      const sizeOptionsHTML = this.#createSizeSelectorForProduct(product, selectedSize, product.cart_id);
  
      // Create the product container and append size options
      const productElement = document.createElement('div');
      productElement.classList.add('kit-product');
      productElement.innerHTML = `
        
        
        <div class="kit-product-image-container">
        <img class="product-image" style="margin:0" src="${product.product_image}" alt="${product.product_name}"/>
        <div class="product-details">
        <div class="product-name">${product.product_name || 'Unnamed Product'}</div>
        <div class="product-price">${MoneyUtils.formatMoney(product.product_pricecents)}</div>
        <div class="size-options-radio">${sizeOptionsHTML}</div>
        <div class="button-and-message">
        <button class="js-save-size-button" data-cart-id="${product.cart_id}">Save Size</button>
        <span class="update-size-message update-size-message-${product.cart_id}"></span>
        </div>
        </div>
        

        </div>
        
      `;
      sizeSelectorContainer.appendChild(productElement);
  
      // Add event listener for the save button
      productElement.querySelector('.js-save-size-button').addEventListener('click', (event) => {
        this.#handleSizeUpdate(event, product.cart_id);
      });
    });
  }
  
  // Create the size options for each individual product in the kit
  #createSizeSelectorForProduct(product, selectedSize, cartId) {
    let sizeOptionsHTML = '';

    // Available sizes (can be fetched from the backend or set beforehand)
    const availableSizes = ['S', 'M', 'L', 'XL', 'XXL']; // Default sizes

    // Loop through all available sizes and create the radio buttons
    availableSizes.forEach(size => {
        const isChecked = selectedSize === size;

        sizeOptionsHTML += `
            <label>
                <input 
                    type="radio" 
                    name="size-${cartId}"
                    value="${size}" 
                    ${isChecked ? 'checked' : ''} />
                ${size}
            </label><br>
        `;
    });

    return sizeOptionsHTML;
}


  /**
 * Handle size update when a size is selected.
 * @param {Event} event - The click event.
 * @param {String} cartId - The cart ID.
 */
  async #handleSizeUpdate(event, cartId) {
    const productElement = event.target.closest('.kit-product');
    const selectedSize = productElement.querySelector('input[type="radio"]:checked')?.value;
  
    if (!selectedSize) {
      console.error('No size selected');
      alert('Please select a size before saving.');
      return;
    }
  
    console.log(`Saving size ${selectedSize} for cart ID ${cartId}`); // Debugging: Log cart ID and size
  
    try {
      const response = await fetch('/kits-alb/backend/update-cart-size.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId, // Ensure cartId is passed here
          size: selectedSize, // Pass selectedSize correctly
        }),
      });
  
      const result = await response.json();
  
      // Get the message container for this cart item
      const messageContainer = productElement.querySelector(`.update-size-message-${cartId}`);
  
      if (result.success) {
        console.log(`Size updated successfully for cart ID ${cartId}`);
        
        // Show success message in green
        messageContainer.textContent = 'Size updated successfully.';
        messageContainer.style.color = 'green'; // Optional: Green text for success
      } else {
        console.error('Failed to update size:', result.message);
        
        // Show error message in red
        messageContainer.textContent = `Size is already selected!`;
        messageContainer.style.color = 'red'; // Optional: Red text for error
      }
  
      // Show the message by adding the 'is-visible' class
      messageContainer.classList.add('is-visible');
  
      setTimeout(() => {
        console.log('Fading out message'); // Debugging: Check if timeout runs
        messageContainer.classList.remove('is-visible');
      }, 2000);
  
    } catch (error) {
      console.error('Error updating size:', error);
  
      // Show error message in red
      const messageContainer = productElement.querySelector(`.update-size-message-${cartId}`);
      messageContainer.textContent = 'An error occurred while updating size.';
      messageContainer.style.color = 'red'; // Optional: Red text for error
  
      // Show the message by adding the 'is-visible' class
      messageContainer.classList.add('is-visible');
  
      // After 2 seconds, fade out the message by removing the 'is-visible' class
      setTimeout(() => {
        messageContainer.classList.remove('is-visible');
      }, 2000);
    }
  }
  

 


#createDeliveryOptionsHTML(cartItem) {
  let deliverOptionsHTML = '';
  
  // Loop through all delivery options for this cart item
  deliveryOptions.all.forEach(deliveryOption => {
    const id = deliveryOption.id;
    const costCents = deliveryOption.costCents;
    const deliveryDate = deliveryOption.calculateDeliveryDate();

    const shippingText = costCents === 0
      ? 'FREE Shipping'
      : `${MoneyUtils.formatMoney(costCents)} - Shipping`;

    deliverOptionsHTML += `
      <div class="js-delivery-option delivery-option"
        data-delivery-option-id="${id}" data-testid="delivery-option-${id}">
        
        <input
          class="js-delivery-option-input delivery-option-input"
          name="delivery-option-${cartItem.productId}" 
          type="radio"
          data-testid="delivery-option-input"
          ${deliveryOption.isDefault ? 'checked' : ''} 
        >
        
        <div>
          <div class="delivery-option-date">
            ${DateUtils.formatDateWeekday(deliveryDate)}
          </div>
          <div class="delivery-option-price">
            ${shippingText}
          </div>
        </div>
      </div>
    `;
  });

  return deliverOptionsHTML;
}

  /**
   * Handles delivery option selection.
   * @param {Event} event - The click event on the delivery option.
   */
  #selectDeliveryOption(event) {
    const deliveryOptionElem = event.target.closest('.js-delivery-option');
  
    // If deliveryOptionElem is null, it means the click did not happen on a .js-delivery-option
    if (!deliveryOptionElem) {
      console.error('Clicked element is not a .js-delivery-option');
      return;
    }
  
    // Get the delivery option ID from the clicked element
    const deliveryOptionId = deliveryOptionElem.getAttribute('data-delivery-option-id');
  
    console.log('Selected delivery option ID:', deliveryOptionId); // Debugging log
    
    if (!deliveryOptionId) {
      console.error('Delivery option ID is not valid or missing');
      return;
    }
  
    // Log all delivery options to check if IDs match
    console.log('Available Delivery Options:', deliveryOptions.all);
  
    // Find the selected delivery option using the string ID
    const selectedDeliveryOption = deliveryOptions.all.find(option => option.id === deliveryOptionId);
  
    if (!selectedDeliveryOption) {
      console.error('Selected delivery option not found!');
      return;
    }
  
    // Calculate the new delivery date based on the selected delivery option
    const newDeliveryDate = selectedDeliveryOption.calculateDeliveryDate();
  
    // Update the delivery date display for this cart item in the UI
    const cartItemElem = deliveryOptionElem.closest('.js-cart-item');
    const deliveryDateElem = cartItemElem.querySelector('.js-delivery-date');
    if (deliveryDateElem) {
      deliveryDateElem.textContent = `Delivery date: ${DateUtils.formatDateWeekday(newDeliveryDate)}`;
    } else {
      console.error('Delivery date element not found!');
    }
  }
  
  
  
  
  


/**
 * Update the header with the selected delivery option details.
 * @param {Object} deliveryOption - The selected delivery option.
 */
#updateHeaderWithDeliveryOption(deliveryOption) {
    const shippingCost = MoneyUtils.formatMoney(deliveryOption.costCents);
    const deliveryDate = DateUtils.formatDateWeekday(deliveryOption.calculateDeliveryDate());

    // Assuming you have a method on #checkoutHeader to update the delivery info:
    this.#checkoutHeader.updateDeliveryInfo(shippingCost, deliveryDate);
}


  #renderEmptyCartMessage() {
    this.element.innerHTML = `
      <div data-testid="empty-cart-message">
        Your cart is empty.
      </div>
      <a class="button-primary view-products-link" href="catalog.php" data-testid="view-products-link">
        View products
      </a>
    `;
  }

  #renderErrorMessage(message) {
    this.element.innerHTML = `<div class="error-message">${message}</div>`;
  }
  

  #handleQuantityInput(event) {
    const inputElement = event.target; // Get the input element that triggered the event

    if (!inputElement.classList.contains('js-new-quantity-input')) {
        return; // Exit early if the event wasn't triggered by the correct input element
    }

    // If the user presses "Enter", update the price
    if (event.key === 'Enter') {
        this.#updatePrice(inputElement); // Call the function to update the price
        this.#updateQuantity(inputElement);  // Proceed with updating the quantity as well
    } 
    // For escape key, cancel the update
    else if (event.key === 'Escape') {
        const currentQuantity = inputElement.closest('.js-quantity-container')
                                            ?.querySelector('.js-quantity-label')
                                            ?.textContent;
  
        if (!currentQuantity) {
            console.error("Current quantity not found. Can't cancel.");
            return; // Exit early if current quantity is not found
        }
  
        const digitsOnly = currentQuantity.replace(/\D/g, ''); // Removes all non-digit characters
        this.#cancelUpdateQuantity(inputElement, digitsOnly);  // Reset the quantity
    }
}

#updatePrice(inputElement) {
  const cartItemElement = inputElement.closest('.js-cart-item');  // Get the cart item element
  const productId = cartItemElement.getAttribute('data-cart-item-id');  // Get the product ID
  const quantity = parseInt(inputElement.value);  // Get the updated quantity from the input field
  const priceElement = cartItemElement.querySelector('.product-price');  // Get the price element to update

  if (!priceElement) {
      console.error("Price element not found.");
      return;
  }

  // Find the product data using the productId (adjust according to your data structure)
  const product = this.#getProductById(productId);  // Assuming this method fetches the correct product data
  const unitPrice = product.priceCents;  // Assuming the price is in cents

  // Calculate the total price based on quantity and unit price
  const totalPrice = unitPrice * quantity;

  // Update the displayed price
  priceElement.textContent = MoneyUtils.formatMoney(totalPrice);  // Format and display the total price
}

#getProductById(productId) {
  // Search for the product in the stored cart data
  const product = this.cartData.find(item => item.productId === productId);

  if (product) {
    return product;
  } else {
    console.error(`Product with ID ${productId} not found.`);
    return null; // Return null if the product isn't found
  }
}
  
  #cancelUpdateQuantity(inputElement, currentQuantity) {
    // Ensure the container and input element are valid
    const quantityContainer = inputElement.closest('.js-quantity-container');
    
    if (!quantityContainer) {
      console.error('Quantity container not found!');
      return;
    }
  
    // Hide the input element and show the label
    quantityContainer.classList.remove('is-updating-quantity');
    
    // Set the input value to the passed current quantity
    inputElement.value = currentQuantity;
  }

  

  // Handle adding products to the cart (send the difference to backend)
  async #addProductsToCart(productId, quantityToAdd) {
    console.log(`Adding ${quantityToAdd} products to cart with ID: ${productId}`);
    const userId = await this.#getUserId();

    if (!userId) {
        window.location.href = 'login.php';  // Redirect to login if no user ID
        return;
    }

    const addToCartPromises = [];
    for (let i = 0; i < quantityToAdd; i++) {
        addToCartPromises.push(this.#sendAddToCartRequest(productId));  // Push promises to the array
    }

    await Promise.all(addToCartPromises);
    this.#checkoutHeader.updateCartCount();
}

async #sendAddToCartRequest(productId) {
    const userId = await this.#getUserId();

    if (!userId) {
        console.error("User is not logged in");
        window.location.href = 'login.php';  // Redirect to login if no user ID
        return;
    }

    const basePath = window.location.origin + '/kits-alb/backend/';
    const response = await fetch(`${basePath}/add-to-cart.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: productId }),
    });

    const data = await response.json();
    console.log('Add to Cart Response:', data);
    if (data.status === 'Product added to cart' || data.status === 'Product quantity updated in cart') {
        console.log("Product added to cart successfully");
    } else {
        console.error(data.status);
    }
}

// Handle removing products from the cart (send the difference to backend)
#removeSomeProductsFromCart(productId, quantityToRemove) {
  fetch('/kits-alb/backend/remove-some-from-cart.php', {
      method: 'POST',
      body: JSON.stringify({
          product_id: productId,
          quantity: quantityToRemove  // Remove the excess quantity (N)
      }),
      headers: {
          'Content-Type': 'application/json',
      },
  })
  .then(response => response.json())
  .then(data => {
      if (data.status === 'Product removed from cart') {
          console.log(`Successfully removed ${quantityToRemove} items from the cart.`);
          this.#checkoutHeader.updateCartCount();
      } else {
          console.error('Failed to remove products from cart:', data.message);
      }
  })
  .catch(error => {
      console.error('Error removing products from cart:', error);
  });
}
  
#updateQuantity(inputElement) {
  const newQuantity = parseInt(inputElement.value, 10); // Get the new quantity from the input element

  if (newQuantity < 1) {
    alert('Quantity must be at least 1.');
    return; // Exit if the quantity is invalid
  }

  const cartItemContainer = inputElement.closest('.js-cart-item');
  const cartItemId = cartItemContainer.getAttribute('data-cart-item-id');

  const currentQuantityLabel = cartItemContainer.querySelector('.js-quantity-label');
  const currentQuantity = parseInt(currentQuantityLabel.textContent, 10);

  // If quantity hasn't changed, show a message and exit
  if (newQuantity === currentQuantity) {
    this.#showQuantityMessage(cartItemId, 'Quantity is the same', 'red');
    console.log("No change in quantity. Exiting...");
    return; // If the quantity hasn't changed, exit
  }

  const quantityDifference = newQuantity - currentQuantity;

  // Handle adding/removing products based on the quantity change
  if (quantityDifference > 0) {
    console.log(`Adding ${quantityDifference} item(s) to cart for product ID: ${cartItemId}`);
    this.#addProductsToCart(cartItemId, quantityDifference);
    this.#showQuantityMessage(cartItemId, `Added ${quantityDifference} item(s)`, 'black');
  } else if (quantityDifference < 0) {
    console.log(`Removing ${Math.abs(quantityDifference)} item(s) from cart for product ID: ${cartItemId}`);
    this.#removeSomeProductsFromCart(cartItemId, Math.abs(quantityDifference));
    this.#showQuantityMessage(cartItemId, `Removed ${Math.abs(quantityDifference)} item(s)`, 'black');
  }

  // Update the current quantity label with the new quantity
  currentQuantityLabel.textContent = newQuantity;

  // Optionally, log or handle further UI updates here
  console.log(`Updated quantity for product ID: ${cartItemId} to ${newQuantity}`);
}

#showQuantityMessage(cartItemId, message, color) {
  const cartItemContainer = document.querySelector(`[data-cart-item-id="${cartItemId}"]`);
  const messageContainer = cartItemContainer.querySelector(`.quantity-message-${cartItemId}`);

  // Set the message and apply color
  messageContainer.textContent = message;
  messageContainer.style.color = color;

  // Make the message visible by adding a class
  messageContainer.classList.add('is-visible');

  // After 2 seconds, fade out the message by removing the 'is-visible' class
  setTimeout(() => {
    messageContainer.classList.remove('is-visible');
  }, 2000);
}




  /**
   * Handle the deletion of an item when the "Delete" button is clicked.
   * @param {Event} event - The event from the "Delete" button click.
   */
  #handleDeleteLinkClick(event) {
    console.log("Boton clicked");
    // Ensure the event target is a delete link
    const deleteLink = event.target.closest('.js-delete-quantity-link');
    
    if (!deleteLink) {
      console.error('Delete link not found');
      return;  // Prevent further processing if the target is not the delete link
    }
  
    const cartItemContainer = deleteLink.closest('.js-cart-item');
    
    if (!cartItemContainer) {
      console.error('Cart item container not found');
      return;  // Prevent further processing if the cart item container is not found
    }
  
    const cartItemId = cartItemContainer.getAttribute('data-cart-item-id');
    
    if (!cartItemId) {
      console.error('Cart item ID not found');
      return;  // Prevent further processing if no cart item ID is found
    }
  
    // Proceed with backend removal and UI update
    this.#removeFromCart(cartItemId);
  
    // Remove the item from the UI
    this.#removeFromCartSummary(cartItemContainer);
  }
  /**
   * Remove an item from the cart on the backend.
   * @param {String} cartItemId - The ID of the item to remove from the cart.
   */
  #removeFromCart(cartItemId) {
    fetch('/kits-alb/backend/remove-from-cart.php', {
      method: 'POST',
      body: JSON.stringify({ product_id: cartItemId }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        this.#checkoutHeader.updateCartCount();
        console.log('Item removed from cart');
        
      } else {
        console.error('Error removing item:', data.error || 'Unknown error');
      }
    })
    .catch(error => {
      console.error('Error with request or response:', error);
    });
}
  
  #removeFromCartSummary(cartItemElement) {
    DomUtils.removeElement(cartItemElement);

    if (this.element.querySelectorAll('.js-cart-item').length === 0) {
      this.#renderEmptyCartMessage();
    }
  }

   async #getUserId() {
    const basePath = window.location.origin + '/kits-alb/backend/';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();
    return data.userId || null;
  }
}

