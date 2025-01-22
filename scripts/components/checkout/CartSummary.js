import { deliveryOptions } from '../../data/deliveryOptions.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { DomUtils } from '../../utils/DomUtils.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { ComponentV2 } from '../ComponentV2.js';
import { PaymentSummary } from './PaymentSummary.js';

export class CartSummary extends ComponentV2 {
  events = {
    'click .js-delivery-option':(event) => this.#selectDeliveryOption(event),
    'keyup .js-new-quantity-input': (event) => this.#handleQuantityInput(event),
    'click .js-save-quantity-link': (event) => this.#handleSaveQuantityClick(event),
    'click .js-cancel-quantity-update': (event) => this.#cancelUpdateQuantity(event),
    'click .js-delete-quantity-link': (event) => this.#handleDeleteLinkClick(event),
    'click .js-update-button': (event) => this.#toggleSizeSelector(event),
    'click .js-update-size': (event) => this.#handleSizeUpdate(event),
    'click .js-collapse-button': (event) => this.#toggleSizeSelector(event),
  };

  #paymentSummary;
  #checkoutHeader;

  setPaymentSummary(paymentSummary) {
    this.#paymentSummary = new PaymentSummary('#payment-summary', 'pk_test_51QingtJvqD1LcS3xYG4Frz4qh9htiMyRoTGr0weMwD5dROi3d6Iuj9LRTKC7HP2jdlL57jNtOI8Q1d4W0Pw7UfJI004aeLOIFC');
    this.#paymentSummary.create(); 
  }

  setCheckoutHeader(checkoutHeader) {
    this.#checkoutHeader = checkoutHeader;
  }
  cartData = [];
  
  
  async render() {
    try {
      await this.fetchCartData();
      this.#attachEventListeners();
    } catch (error) {
      console.error('Error rendering cart:', error);
      this.#renderErrorMessage('Unable to load cart. Please try again later.');
    }
  }

  #attachEventListeners() {
    Object.keys(this.events).forEach((selector) => {
      const [eventType, targetSelector] = selector.split(' ');
  
      this.element.addEventListener(eventType, (event) => {
        const targetElem = event.target.closest(targetSelector);
  
        if (targetElem) {
          this.events[selector](event);
        }
      });
    });
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (event) => {
        this.#handleRadioChange(event);
      });
    });
  }
  
  #handleRadioChange(event) {
    const selectedRadio = event.target;
    const productId = selectedRadio.getAttribute("name").slice(16);
    const val = selectedRadio.getAttribute("value");
    if (selectedRadio.classList.contains('js-delivery-option')) {
      this.#selectDeliveryOption(event);
    }
    console.log('Radio button changed:', selectedRadio);
    console.log(productId);
    this.#handleDeliveryUpdate(productId, val);
    this.#paymentSummary.refreshPaymentDetails();
  }


  async fetchCartData() {
    try {
      console.log('Fetching cart data from backend...');
      const response = await fetch('backend/get-cart-products.php');

      if (!response.ok) {
        throw new Error(`Failed to fetch cart data. Status: ${response.status}`);
      }

      const cartData = await response.json();
      console.log('Cart data:', cartData);

      this.cartData = cartData;
      this.renderCartItems(cartData);
    } catch (error) {
      console.error('Error fetching cart data:', error);
      this.#renderErrorMessage('Unable to load cart items. Please try again later.');
    }
  }

  
  renderCartItems(cartData) {
    if (cartData.length === 0) {
      this.#renderEmptyCartMessage();
      return;
    }
  
    let cartSummaryHTML = '';
    cartData.forEach(cartItem => {
      const deliveryOptionsHTML = this.#createDeliveryOptionsHTML(cartItem);
      
      let val = 1;
      let deliveryText = "";
  
    deliveryOptions.all.forEach(deliveryOption => {
      const deliveryDate = deliveryOption.calculateDeliveryDate();
      if(cartItem.deliveryOption===val)
        deliveryText += `Delivery date: ${DateUtils.formatDateWeekday(deliveryDate)}`
      val += 1;
    });
  
      cartSummaryHTML += `
        <div class="js-cart-item cart-item-container" data-cart-item-id="${cartItem.productId}">
          <div class="delivery-date delivery-date-${cartItem.productId}">
            <span class="js-delivery-date js-delivery-date-${cartItem.productId}">${deliveryText}</span>
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
                  <span class="quanity-label js-quantity-label">${cartItem.quantity}</span>
                  
                  <p class = "edit-quantity"> Edit Quantity: </p>
                  <input 
                    class="js-quantity-input js-new-quantity-input" 
                    type="number" 
                    value="${cartItem.quantity}" 
                    min="1" 
                    data-cart-item-id="${cartItem.productId}" />
                  <span class="js-save-quantity-link link-primary">Save</span>
                  <p class="delete-quantity js-delete-quantity-link link-primary">Delete Item</p>
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
            <button class="button-primary update-size-button js-update-button">Update Sizes</button>
              <div class="js-size-selector-dropdown size-selector-dropdown" style="display: none;">
              <div class="size-options">
                
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
    const quantityInput = cartItemElement.querySelector('.js-quantity-input');
    
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
      dropdown.style.display = 'block';
      updateButton.textContent = 'Collapse';
      updateButton.classList.add('collapse-button');
      this.#fetchKitProducts(productId).then(kitProducts => {
        this.#populateSizeSelector(dropdown, kitProducts);
      });
      quantityInput.setAttribute('readonly', 'readonly');
    } else {
      dropdown.style.display = 'none';
      updateButton.textContent = 'Update Sizes';
      updateButton.classList.remove('collapse-button');
      quantityInput.removeAttribute('readonly');
    }
  }
  async #fetchKitProducts(productId) {
    try {
      console.log('Fetching products for kit...', productId);
  
      const response = await fetch('backend/get-individual-products.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch kit products');
      }
      const data = await response.json();
      console.log('Response data:', data);
      if (data.success && Array.isArray(data.data)) {
        console.log('Kit Products:', data.data);
        return data.data;
      } else {
        console.error('No data found or an error occurred');
        return [];
      }
    } catch (error) {
      console.error('Error fetching kit products:', error);
  console.error('Error details:', error.stack || error);
      return [];
    }
  }
  #populateSizeSelector(dropdown, kitProducts) {
    const sizeSelectorContainer = dropdown.querySelector('.size-options');
    sizeSelectorContainer.innerHTML = '';

    if (kitProducts.length === 0) {
      sizeSelectorContainer.innerHTML = `<div>No products available for this kit</div>`;
      return;
    }

    kitProducts.forEach(product => {
      console.log(product);

      const selectedSize = product.cart_size;
      console.log(`Selected size for ${product.product_name}:`, selectedSize);
      const sizeOptionsHTML = this.#createSizeSelectorForProduct(product, selectedSize, product.cart_id);
      const productElement = document.createElement('div');
      productElement.classList.add('kit-product');
      productElement.innerHTML = `
        <div class="kit-product-image-container">
          <img class="product-image" style="margin:0" src="${product.product_image}" alt="${product.product_name}"/>
          <div class="product-details">
            <div class="product-name">${product.product_name || 'Unnamed Product'}</div>
            <div class="product-price">${MoneyUtils.formatMoney(product.product_pricecents)}</div>
            <div class="size-options-radio">${sizeOptionsHTML}</div>
            <div class="update-size-message update-size-message-${product.cart_id}"></div>
          </div>
        </div>
      `;
      sizeSelectorContainer.appendChild(productElement);
      
      // Add event listener to radio buttons instead of the Save button
      productElement.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
          this.#handleSizeUpdate(event, product.cart_id);
        });
      });
    });
}

#createSizeSelectorForProduct(product, selectedSize, cartId) {
  let sizeOptionsHTML = '';
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
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
 
 async #handleSizeUpdate(event, cartId) {
    const productElement = event.target.closest('.kit-product');
    const selectedSize = productElement.querySelector('input[type="radio"]:checked')?.value;
  
    if (!selectedSize) {
      console.error('No size selected');
      alert('Please select a size.');
      return;
    }

    console.log(`Saving size ${selectedSize} for cart ID ${cartId}`);
  
    try {
      const response = await fetch('backend/update-cart-size.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId, 
          size: selectedSize, 
        }),
      });

      const result = await response.json();
      const messageContainer = productElement.querySelector(`.update-size-message-${cartId}`);
  
      if (result.success) {
        console.log(`Size updated successfully for cart ID ${cartId}`);
        messageContainer.textContent = 'Size updated successfully.';
        messageContainer.style.color = 'green';
      } else {
        console.error('Failed to update size:', result.message);
      }
      messageContainer.classList.add('is-visible');
  
      setTimeout(() => {
        console.log('Fading out message');
        messageContainer.classList.remove('is-visible');
      }, 2000);
  
    } catch (error) {
      console.error('Error updating size:', error);
  
      const messageContainer = productElement.querySelector(`.update-size-message-${cartId}`);
      messageContainer.textContent = 'An error occurred while updating size.';
      messageContainer.style.color = 'red'; 
  
      messageContainer.classList.add('is-visible');
  
      setTimeout(() => {
        messageContainer.classList.remove('is-visible');
      }, 2000);
    }

    this.#paymentSummary.refreshPaymentDetails();
}

  async #handleDeliveryUpdate(productId, value) {
    try {
      const userId = await this.#getUserId();
      if (!userId) {
        console.error('User is not logged in');
        window.location.href = 'login.php';
        return;
      }
      const response = await fetch('backend/update-cart-delivery.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          delivery_option: value,
        }),
      });
  
      const result = await response.json();
  
  
  
      if (result.success) {
        console.log(`Delivery option updated successfully for product ID ${productId}`);
     
      } else {
        console.error('Failed to update delivery option:', result.message);
     
      }
  
  
    } catch (error) {
      console.error('Error updating delivery option:', error);
    }

    this.#paymentSummary.refreshPaymentDetails();
  }
  
  
  #createDeliveryOptionsHTML(cartItem) {
    let deliverOptionsHTML = '';
    let val = 1;
  
    deliveryOptions.all.forEach(deliveryOption => {
      const id = deliveryOption.id;
      const costCents = deliveryOption.costCents;
      const deliveryDate = deliveryOption.calculateDeliveryDate();
  
      const shippingText = costCents === 0
        ? 'FREE Shipping'
        : `${MoneyUtils.formatMoney(costCents)} - Shipping`;
  
      const isChecked = cartItem.deliveryOption === val;
  
      deliverOptionsHTML += `
        <div class="js-delivery-option delivery-option"
          data-delivery-option-id="${id}" data-testid="delivery-option-${id}">
          
          <input
            class="js-delivery-option-input delivery-option-input"
            name="delivery-option-${cartItem.productId}" 
            type="radio"
            data-testid="delivery-option-input"
            value=${val}
            ${isChecked ? 'checked' : ''} 
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
  
      
  
      val += 1;
    });
  
    return deliverOptionsHTML;
  }
  

  #selectDeliveryOption(event) {
    const deliveryOptionElem = event.target.closest('.js-delivery-option');
  
   
    if (!deliveryOptionElem) {
      console.error('Clicked element is not a .js-delivery-option');
      return;
    }
  
    
    const deliveryOptionId = deliveryOptionElem.getAttribute('data-delivery-option-id');
  
    console.log('Selected delivery option ID:', deliveryOptionId); 
    
    if (!deliveryOptionId) {
      console.error('Delivery option ID is not valid or missing');
      return;
    }
  

    const selectedDeliveryOption = deliveryOptions.all.find(option => option.id === deliveryOptionId);
  
    if (!selectedDeliveryOption) {
      console.error('Selected delivery option not found!');
      return;
    }

    const newDeliveryDate = selectedDeliveryOption.calculateDeliveryDate();

    const cartItemElem = deliveryOptionElem.closest('.js-cart-item');
    const deliveryDateElem = cartItemElem.querySelector('.js-delivery-date');
    if (deliveryDateElem) {
      deliveryDateElem.textContent = `Delivery date: ${DateUtils.formatDateWeekday(newDeliveryDate)}`;
    } else {
      console.error('Delivery date element not found!');
    }

    this.#paymentSummary.refreshPaymentDetails();
  }

  #updateHeaderWithDeliveryOption(deliveryOption) {
      const shippingCost = MoneyUtils.formatMoney(deliveryOption.costCents);
      const deliveryDate = DateUtils.formatDateWeekday(deliveryOption.calculateDeliveryDate());
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
    const inputElement = event.target;

    if (!inputElement.classList.contains('js-new-quantity-input')) {
        return; 
    }

    if (event.key === 'Enter') {
        this.#updatePrice(inputElement);
        this.#updateQuantity(inputElement);
    } 

    else if (event.key === 'Escape') {
        const currentQuantity = inputElement.closest('.js-quantity-container')
                                            ?.querySelector('.js-quantity-label')
                                            ?.textContent;
  
        if (!currentQuantity) {
            console.error("Current quantity not found. Can't cancel.");
            return; 
        }
  
        const digitsOnly = currentQuantity.replace(/\D/g, ''); 
        this.#cancelUpdateQuantity(inputElement, digitsOnly);  
    }
  } 

  #handleSaveQuantityClick(event) {
    const inputElement = event.target.closest('.js-quantity-container').querySelector('.js-new-quantity-input');
    this.#updatePrice(inputElement); 
    this.#updateQuantity(inputElement);  
    this.#paymentSummary.refreshPaymentDetails();
  }

  #updatePrice(inputElement) {
    const cartItemElement = inputElement.closest('.js-cart-item'); 
    const productId = cartItemElement.getAttribute('data-cart-item-id'); 
    const previousCartQuantity = Number(cartItemElement.querySelector('.js-quantity-label').textContent);  
  
    
    let quantity = parseInt(inputElement.value);
    if (quantity <= 0 || isNaN(quantity)) {

      quantity = previousCartQuantity;  
    }
  
    const priceElement = cartItemElement.querySelector('.product-price');  
  
    if (!priceElement) {
      console.error("Price element not found.");
      return;
    }
  
    const product = this.#getProductById(productId); 
    const unitPrice = product.priceCents;  
    
    const totalPrice = unitPrice * quantity;
    
    
    priceElement.textContent = MoneyUtils.formatMoney(totalPrice); 
  }
  

  #getProductById(productId) {

  const product = this.cartData.find(item => item.productId === productId);

  if (product) {
    return product;
  } else {
    console.error(`Product with ID ${productId} not found.`);
    return null;
  }
  }

  #cancelUpdateQuantity(inputElement, currentQuantity) {
 
  const quantityContainer = inputElement.closest('.js-quantity-container');

  if (!quantityContainer) {
    console.error('Quantity container not found!');
    return;
  }

  
  quantityContainer.classList.remove('is-updating-quantity');


  inputElement.value = currentQuantity;
  this.#paymentSummary.refreshPaymentDetails();
  }
  
  async #addProductsToCart(productId, quantityToAdd) {
    console.log(`Adding ${quantityToAdd} products to cart with ID: ${productId}`);
    const userId = await this.#getUserId();
    

    if (!userId) {
        window.location.href = 'login.php';  
        return;
    }

    const addToCartPromises = [];
    for (let i = 0; i < quantityToAdd; i++) {
        addToCartPromises.push(this.#sendAddToCartRequest(productId)); 
    }

    await Promise.all(addToCartPromises);
    this.#checkoutHeader.updateCartCount();
    const selectedOptionElement = document.querySelector(`input[name="delivery-option-${productId}"]:checked`);
const selectedOption = selectedOptionElement ? selectedOptionElement.value : 0;
    if(selectedOption>0){
    this.#handleDeliveryUpdate(productId,selectedOption);
    }
    this.#paymentSummary.refreshPaymentDetails();
  }

  async #sendAddToCartRequest(productId) {
      const userId = await this.#getUserId();
      
      if (!userId) {
          console.error("User is not logged in");
          window.location.href = 'login.php';  
          return;
      }

      const response = await fetch(`backend/add-to-cart.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, product_id: productId, size: "L"}),
      });

      const data = await response.json();
      console.log('Add to Cart Response:', data);
      if (data.status === 'Product added to cart' || data.status === 'Product quantity updated in cart') {
          console.log("Product added to cart successfully");
      } else {
          console.error(data.status);
      }
  }


  #removeSomeProductsFromCart(productId, quantityToRemove) {
    fetch('backend/remove-some-from-cart.php', {
        method: 'POST',
        body: JSON.stringify({
            product_id: productId,
            quantity: quantityToRemove  
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
    const newQuantity = parseInt(inputElement.value, 10); 

    if (newQuantity < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    const cartItemContainer = inputElement.closest('.js-cart-item');
    const cartItemId = cartItemContainer.getAttribute('data-cart-item-id');

    const currentQuantityLabel = cartItemContainer.querySelector('.js-quantity-label');
    const currentQuantity = parseInt(currentQuantityLabel.textContent, 10);

   
    if (newQuantity === currentQuantity) {
      this.#showQuantityMessage(cartItemId, 'Quantity is the same', 'red');
      console.log("No change in quantity. Exiting...");
      return; 
    }

    const quantityDifference = newQuantity - currentQuantity;

    
    if (quantityDifference > 0) {
      console.log(`Adding ${quantityDifference} item(s) to cart for product ID: ${cartItemId}`);
      this.#addProductsToCart(cartItemId, quantityDifference);
      this.#showQuantityMessage(cartItemId, `Added ${quantityDifference} item(s)`, 'black');
    } else if (quantityDifference < 0) {
      console.log(`Removing ${Math.abs(quantityDifference)} item(s) from cart for product ID: ${cartItemId}`);
      this.#removeSomeProductsFromCart(cartItemId, Math.abs(quantityDifference));
      this.#showQuantityMessage(cartItemId, `Removed ${Math.abs(quantityDifference)} item(s)`, 'black');
    }

    
    currentQuantityLabel.textContent = newQuantity;
    this.#paymentSummary.refreshPaymentDetails();
  }

  #showQuantityMessage(cartItemId, message, color) {
    const cartItemContainer = document.querySelector(`[data-cart-item-id="${cartItemId}"]`);
    const messageContainer = cartItemContainer.querySelector(`.quantity-message-${cartItemId}`);

   
    messageContainer.textContent = message;
    messageContainer.style.color = color;

  
    messageContainer.classList.add('is-visible');

    setTimeout(() => {
      messageContainer.classList.remove('is-visible');
    }, 2000);
  }

  #handleDeleteLinkClick(event) {
    console.log("Boton clicked");

    const deleteLink = event.target.closest('.js-delete-quantity-link');
    
    if (!deleteLink) {
      console.error('Delete link not found');
      return; 
    }
  
    const cartItemContainer = deleteLink.closest('.js-cart-item');
    
    if (!cartItemContainer) {
      console.error('Cart item container not found');
      return;  
    }
  
    const cartItemId = cartItemContainer.getAttribute('data-cart-item-id');
    
    if (!cartItemId) {
      console.error('Cart item ID not found');
      return; 
    }
 
    this.#removeFromCart(cartItemId);

    this.#removeFromCartSummary(cartItemContainer);
    this.#paymentSummary.refreshPaymentDetails();
  }

  #removeFromCart(cartItemId) {
    fetch('backend/remove-from-cart.php', {
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
    const basePath = window.location.origin + '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();
    return data.userId || null;
  }

  #getSelectedRadioOption(groupName){
  
    const selectedRadio = document.querySelector(`input[name="${groupName}"]:checked`);
    
    if (selectedRadio) {
 
      return selectedRadio.value;
    } else {
   
      console.warn(`No option selected for radio group: ${groupName}`);
      return null;  
    }
  }

  #getAllSelectedRadioOptions() {
 
    const radioGroups = document.querySelectorAll('input[type="radio"]');
    
    const selectedOptions = {};
  
    radioGroups.forEach(radio => {
      const groupName = radio.name;
  
      if (!selectedOptions[groupName]) {
        const selectedValue = this.#getSelectedRadioOption(groupName);
        
        if (selectedValue) {
          selectedOptions[groupName] = selectedValue;
        } else {
    
          selectedOptions[groupName] = "none"; 
        }
      }
    });
  
   
    console.log(selectedOptions);
    return selectedOptions;
  }
  
}

