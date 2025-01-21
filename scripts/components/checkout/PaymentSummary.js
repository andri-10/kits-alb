import StripeHandler from './StripeHandler.js';
import { cart } from '../../data/cart.js';
import { orders } from '../../data/orders.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { ComponentV2 } from '../ComponentV2.js';

export class PaymentSummary extends ComponentV2 {
  constructor(selector, publishableKey) {
    super(selector);
    this.stripeHandler = new StripeHandler(publishableKey);
    this.cartData = [];
    this.individualCartData = [];
  }

  setCartData(cartData) {
    this.cartData = cartData;
    // If the element exists, update visibility based on cart data
    const paymentSummaryElement = document.querySelector('.payment-summary');
    if (paymentSummaryElement) {
      paymentSummaryElement.style.display =
          (!cartData || cartData.length === 0) ? 'none' : 'block';
    }
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
      const paymentSummaryElement = document.querySelector('.payment-summary');
      if (!cartData || cartData.length === 0) {
        if (paymentSummaryElement) {
          paymentSummaryElement.style.display = 'none';
        }
      } else {
        if (paymentSummaryElement) {
          paymentSummaryElement.style.display = 'block';
        }
      }

      this.renderCartItems(cartData);
    } catch (error) {
      console.error('Error fetching cart data:', error);

    }
  }

  async fetchIndividualProducts() {
    try {
      console.log('Fetching all cart products for the logged-in user...');
      
      // Send the request to the PHP backend to fetch all cart products for the logged-in user
      const response = await fetch('backend/get-your-cart-products.php', {
        method: 'GET',  // Using GET since we're fetching all cart products
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cart products. Status: ${response.status}`);
      }

      const cartProducts = await response.json();
      console.log('Cart products:', cartProducts);

      // Clear the individualCartData array before adding new data
      this.individualCartData = [];

      // If data is returned, add it to the individualCartData array
      if (cartProducts.success && cartProducts.data.length > 0) {
        this.individualCartData = cartProducts.data;  // Add all products to the array
        console.log("This is individual cartdata")
        console.log(this.individualCartData)
      } else {
        console.warn('No cart products found for the user.');
      }

    } catch (error) {
      console.error('Error fetching cart products:', error);
    }
}


  updateValidationStatus(isValid) {
    const warningElement = document.querySelector('.payment-summary-warning');
    const submitButton = document.querySelector('#submit-payment');

    if (!isValid) {
      // Show warning and disable submit button
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      // Hide warning and enable submit button
      if (warningElement) {
        warningElement.remove();
      }
      submitButton.disabled = false;
    }
  }


  async create() {
    await this.stripeHandler.initialize();
    await this.render();
    return this;
  }



  async #getUserId() {
    const basePath = '/backend';
    const response = await fetch(`${basePath}/get-user-id.php`);
    const data = await response.json();

    console.log(data.userId);
    return data.userId || null;

  }
  async refreshPaymentDetails() {
    const userId = await this.#getUserId();
    const {
      productCostCents,
      shippingCostCents,
      taxCents,
      totalCents
    } = await cart.calculateCosts(userId);

    await this.fetchIndividualProducts()
    await this.fetchCartData()

    console.log(this.cartData)
   this.groupCartDataByDeliveryOption(this.cartData)
   this.groupIndividualCartData(this.individualCartData)
    const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
    const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
    const quantity = await cart.calculateTotalQuantity();

    // Get validation status from CartSummary
    const cartItems = document.querySelectorAll('.js-cart-item');
    let allValid = true;

    cartItems.forEach(item => {
      const productId = item.getAttribute('data-cart-item-id');
      const deliveryOption = item.querySelector(`input[name="delivery-option-${productId}"]:checked`);

      if (!deliveryOption) {
        allValid = false;
      }


    });

    // Update the payment details dynamically
    document.getElementById("quantity-holder").textContent = `Items (${quantity}):`;
    document.getElementById("items-cost").textContent = `${MoneyUtils.formatMoney(productCostCents)}`;
    document.getElementById("shipping-money").textContent = `${MoneyUtils.formatMoney(shippingCostCents)}`;
    document.getElementById("before-tax-money").textContent = `${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}`;
    document.getElementById("tax-money").textContent = `${MoneyUtils.formatMoney(finalTaxCents)}`;
    document.getElementById("total-money").textContent = `${MoneyUtils.formatMoney(finalTotalCents)}`;

    // Update warning and button based on validation
    const warningElement = document.querySelector('.payment-summary-warning');
    const submitButton = document.querySelector('#submit-payment');

    if (!allValid) {
      // Show warning and disable submit button
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      // Hide warning and enable submit button
      if (warningElement) {
        warningElement.remove();
      }
      submitButton.disabled = false;
    }
  }
  async render() {
    try {
      
      await this.fetchCartData()
      console.log("CartDataLength: "+this.cartData.length)
      if (!this.cartData || this.cartData.length === 0) {

        this.element.style.display = 'none';

      }

      await this.fetchIndividualProducts()

      this.groupCartDataByDeliveryOption(this.cartData)
      this.groupIndividualCartData(this.individualCartData)
      const { productCostCents, shippingCostCents, taxCents, totalCents } = await cart.calculateCosts();
      const quantity = await cart.calculateTotalQuantity();
      const cartItems = cart.items;




      const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
      const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
      // Check if any items have no delivery option selected
      const hasInvalidDelivery = cartItems.some(item => item.selectedDelivery === 0);
      console.log(hasInvalidDelivery)
      this.element.innerHTML = `
        
          <div class="payment-summary-title">Order Summary</div>
          
          ${hasInvalidDelivery ? `
            <div class="payment-summary-warning">
              ⚠️ Please select delivery options for all items before proceeding
            </div>
          ` : ''}
          
          <div class="payment-summary-row">
            <div id="quantity-holder" >Items (${quantity}):</div>
            <div id="items-cost" class="payment-summary-money">${MoneyUtils.formatMoney(productCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Shipping & handling:</div>
            <div id="shipping-money" class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents)}</div>
          </div>

           <div class="payment-summary-row ">
            <div class="before-tax-header" >Total before tax:</div>
            <div id="before-tax-money" class="payment-summary-money">${MoneyUtils.formatMoney(shippingCostCents+productCostCents)}</div>
          </div>
          
          <div class="payment-summary-row">
            <div>Estimated Tax (10%):</div>
            <div id="tax-money" class="payment-summary-money">${MoneyUtils.formatMoney(finalTaxCents)}</div>
          </div>
          
          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div id="total-money" class="payment-summary-money">${MoneyUtils.formatMoney(finalTotalCents)}</div>
          </div>

          <div class="payment-form">
            <form id="payment-form">
              <div id="card-element" class="stripe-element"></div>
              <div id="card-errors" class="stripe-errors" role="alert"></div>
              
              <button type="submit" 
                      id="submit-payment" 
                      class="button-primary payment-button"
                      ${hasInvalidDelivery ? 'disabled' : ''}>
                Pay ${MoneyUtils.formatMoney(totalCents)}
              </button>
            </form>
          </div>
       
      `;

      // Add style for the warning
      const style = document.createElement('style');
      style.textContent = `
        .payment-summary-warning {
          background-color: #fff3cd;
          color: #856404;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          border: 1px solid #ffeeba;
        }
        
        .button-primary:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);

      this.stripeHandler.createCardElement('card-element');
      this.attachEventListeners();
    } catch (error) {
      console.error('Error rendering payment summary:', error);
      this.showError('Unable to load payment information');
    }
  }

  attachEventListeners() {
    const form = this.element.querySelector('#payment-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(event) {
    event.preventDefault();
    const submitButton = this.element.querySelector('#submit-payment');
    submitButton.disabled = true;
  
    try {
      let { totalCents } = await cart.calculateCosts();
      totalCents = Math.ceil(totalCents);
  
      // Validate that the cart is not empty
      const cartItems = cart.items;
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }
  
      // Fetch the user ID from the backend
      const userId = await this.fetchUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }
  
      // Group items by delivery option
      const groupedItems = this.groupCartDataByDeliveryOption(this.cartData);
  
      // Send the grouped items to the backend to create orders
      const orderResponse = await this.createOrders(userId, totalCents, groupedItems);
      if (!orderResponse || !orderResponse.order_ids || orderResponse.order_ids.length === 0) {
        throw new Error('Failed to create orders');
      }

     
  
      // Log payment and proceed
      await this.logPayment({
        order_ids: orderResponse.order_ids,
        amount: totalCents,
        created_at: new Date().toISOString()
      });
  
      // Redirect to orders page
      window.location.replace('orders.php');
  
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(error.message || 'Payment failed. Please try again.');
      submitButton.disabled = false;
    }
  }

  
  
  // Method to group cartData by delivery option
// Modify the groupCartDataByDeliveryOption method to group by delivery option
// Method to group cartData by delivery option, including quantity
groupCartDataByDeliveryOption(cartData) {
  console.log("Cart Data Before Grouping:", cartData);  // Debug log to inspect cart data
  
  const grouped = [
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }, // Group for delivery option 1
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }, // Group for delivery option 2
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }  // Group for delivery option 3
  ];

  // Shipping cost mapping for each delivery option
  const shippingCosts = {
    1: 0,      // Delivery option 1: No shipping cost
    2: 499,    // Delivery option 2: $4.99 (499 cents)
    3: 999     // Delivery option 3: $9.99 (999 cents)
  };

  // Delivery fees for each delivery option
  const deliveryFees = {
    1: 0,      // Delivery option 1: No delivery fee
    2: 499,    // Delivery option 2: $4.99 (499 cents)
    3: 999     // Delivery option 3: $9.99 (999 cents)
  };

  // Iterate through each item and group them by delivery option
  cartData.forEach(item => {
    const deliveryOption = item.deliveryOption;  // Delivery option number (1, 2, or 3)
    console.log("Delivery Option:", deliveryOption);  // Debug log to inspect delivery option
    
    if (deliveryOption >= 1 && deliveryOption <= 3) {
      const group = grouped[deliveryOption - 1];
      group.items.push(item);  // Add item to group for delivery option
      group.totalQuantity += item.quantity; // Add quantity to total quantity for the group
      group.totalPriceCents += item.priceCents * item.quantity; // Add price to total price for the group

      // Add the shipping cost based on the delivery option
      group.shippingCostCents += shippingCosts[deliveryOption]
    }
  });

  // Process each group to calculate final pricing (delivery fee, tax, final total)
  grouped.forEach((group, index) => {
    if (group.items.length > 0) {
      const deliveryOption = index + 1;

     

      // Calculate tax (10% of product price + shipping cost + delivery fee)
      group.taxCents = Math.ceil((group.totalPriceCents + group.shippingCostCents ) * 0.10);

      // Final total for this batch (product price + shipping + delivery fee + tax)
      group.finalTotalCents = group.totalPriceCents + group.shippingCostCents + group.taxCents;

      // Assign a delivery date based on the delivery option
      group.deliveryDate = this.calculateDeliveryDate(deliveryOption);
    }
  });

  console.log("Grouped Cart Data By Delivery Option:", grouped);  // Debug log to inspect grouped cart data
  return grouped;
}

groupIndividualCartData(cartData) {
  console.log("Individual Cart Data Before Grouping:", cartData);  // Debug log to inspect cart data
  
  // Group for 3 delivery options
  const grouped = [
    { items: [], deliveryDate: null },  // Group for delivery option 1
    { items: [], deliveryDate: null },  // Group for delivery option 2
    { items: [], deliveryDate: null }   // Group for delivery option 3
  ];

  // Iterate through each item and group them by delivery option
  cartData.forEach(item => {
    const deliveryOption = item.delivery_option;  // Delivery option number (1, 2, or 3)
    console.log("Delivery Option:", deliveryOption);  // Debug log to inspect delivery option
    
    if (deliveryOption >= 1 && deliveryOption <= 3) {
      const group = grouped[deliveryOption - 1];
      group.items.push(item);  // Add item to group for the corresponding delivery option
    }
  });

  // Process each group to assign a delivery date based on the delivery option
  grouped.forEach((group, index) => {
    if (group.items.length > 0) {
      const deliveryOption = index + 1;
      // Assign a delivery date based on the delivery option
      group.deliveryDate = this.calculateDeliveryDate(deliveryOption);
    }
  });

  console.log("Grouped Individual Cart Data By Delivery Option:", grouped);  // Debug log to inspect grouped cart data
  return grouped;
}




async createOrders(userId, totalCents, groupedItems) {
  console.log('Creating orders with the following data:');
  console.log('User ID:', userId);
  console.log('Grouped Items:', groupedItems);

  // Filter out empty groups and format the data
  const ordersToCreate = groupedItems.filter(group => group.items.length > 0);

  // Send the orders to the backend
  try {
    const response = await fetch('backend/create-order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ordersToCreate)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create orders');
    }

    const data = await response.json();
    console.log('Orders created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating orders:', error);
    throw error;
  }
}



// Helper method to calculate the delivery date based on the delivery option
calculateDeliveryDate(deliveryOption) {
  const today = new Date();

  const deliveryDays = {
    1: 7,  // 1: 7 days delivery
    2: 3,  // 2: 3 days delivery
    3: 1   // 3: 1 day delivery
  };

  const daysToAdd = deliveryDays[deliveryOption] || 7;  // Default to 7 days if option not found
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + daysToAdd);

  // Format the date for MySQL
  return deliveryDate.toISOString().split('T')[0]; // Returns in 'YYYY-MM-DD' format
}



  async fetchUserId() {
    try {
      const response = await fetch('backend/get-user-id.php');
      const data = await response.json();

      if (response.ok && data.userId) {
        return data.userId; // Return the user ID if it exists
      } else {
        console.error('Failed to fetch user ID:', data.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch('backend/create-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.error || 'Failed to create order');
      }
      return responseBody;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  showError(message) {
    const errorElement = this.element.querySelector('#card-errors');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  async logPayment(paymentData) {
    try {
      const response = await fetch('backend/log-payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const responseBody = await response.text();
      console.log('Log Payment Response:', responseBody); // Debug log for log payment response

      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }
}
