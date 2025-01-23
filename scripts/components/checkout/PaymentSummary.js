import StripeHandler from './StripeHandler.js';
import { cart } from '../../data/cart.js';

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
      
      
      const response = await fetch('backend/get-your-cart-products.php', {
        method: 'GET',  
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cart products. Status: ${response.status}`);
      }

      const cartProducts = await response.json();
      console.log('Cart products:', cartProducts);

      
      this.individualCartData = [];

      
      if (cartProducts.success && cartProducts.data.length > 0) {
        this.individualCartData = cartProducts.data;  
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
      
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      
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

    
    const cartItems = document.querySelectorAll('.js-cart-item');
    let allValid = true;

    cartItems.forEach(item => {
      const productId = item.getAttribute('data-cart-item-id');
      const deliveryOption = item.querySelector(`input[name="delivery-option-${productId}"]:checked`);

      if (!deliveryOption) {
        allValid = false;
      }


    });

    
    document.getElementById("quantity-holder").textContent = `Items (${quantity}):`;
    document.getElementById("items-cost").textContent = `${MoneyUtils.formatMoney(productCostCents)}`;
    document.getElementById("shipping-money").textContent = `${MoneyUtils.formatMoney(shippingCostCents)}`;
    document.getElementById("before-tax-money").textContent = `${MoneyUtils.formatMoney(productCostCents + shippingCostCents)}`;
    document.getElementById("tax-money").textContent = `${MoneyUtils.formatMoney(finalTaxCents)}`;
    document.getElementById("total-money").textContent = `${MoneyUtils.formatMoney(finalTotalCents)}`;
    document.getElementById("submit-payment").textContent = `Pay ${MoneyUtils.formatMoney(finalTotalCents)}`;
    
    const warningElement = document.querySelector('.payment-summary-warning');
    const submitButton = document.querySelector('#submit-payment');

    if (!allValid) {
      
      if (!warningElement) {
        const warningHTML = `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>`;
        this.element.insertAdjacentHTML('afterbegin', warningHTML);
      }
      submitButton.disabled = true;
    } else {
      
      if (warningElement) {
        warningElement.remove();
      }
      submitButton.disabled = false;
    }
  }
  async render() {
    try {
      await this.fetchCartData();
      console.log("CartDataLength: "+this.cartData.length);
      if (!this.cartData || this.cartData.length === 0) {
        this.element.style.display = 'none';
      }

      await this.fetchIndividualProducts();

      this.groupCartDataByDeliveryOption(this.cartData);
      this.groupIndividualCartData(this.individualCartData);
      const { productCostCents, shippingCostCents, taxCents, totalCents } = await cart.calculateCosts();
      const quantity = await cart.calculateTotalQuantity();
      const cartItems = cart.items;

      const finalTaxCents = Math.ceil((productCostCents + shippingCostCents) * 0.10);
      const finalTotalCents = productCostCents + shippingCostCents + finalTaxCents;
      const hasInvalidDelivery = cartItems.some(item => item.selectedDelivery === 0);

      this.element.innerHTML = `
        <div class="payment-summary-title">Order Summary</div>
        
        ${hasInvalidDelivery ? `
          <div class="payment-summary-warning">
            ⚠️ Please select delivery options for all items before proceeding
          </div>
        ` : ''}
        
        <div class="payment-summary-row">
          <div id="quantity-holder">Items (${quantity}):</div>
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
            
            
            <button type="submit" 
                    id="submit-payment" 
                    class="button-primary payment-button"
                    ${hasInvalidDelivery ? 'disabled' : ''}>
              Pay ${MoneyUtils.formatMoney(totalCents)}
            </button>
          </form>

        </div>
        
          <div id="card-errors" class="stripe-errors" role="alert"></div>
      `;

      
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

        .stripe-errors {
          color: #dc3545;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 12px;
          margin-top: 16px;
          margin-bottom: 16px;
          border-radius: 4px;
          display: none;
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

    const cardElement = document.getElementById("card-element");
  if (cardElement) {
    cardElement.addEventListener('input', () => this.clearPaymentError());
  }
  }

  clearPaymentError() {
    
    const errorElement = this.element.querySelector('#card-errors');
    if (errorElement) {
      errorElement.style.display = 'none'; 
    }
  }

  

  async handleSubmit(event) {
    event.preventDefault();
    const submitButton = this.element.querySelector('#submit-payment');
    submitButton.disabled = true;
  
    try {
      
      await this.fetchCartData();
      await this.fetchIndividualProducts();
      
      let { totalCents } = await cart.calculateCosts();
      totalCents = Math.ceil(totalCents);
  
      
      const cartItems = cart.items;
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }
  
      
      const cardElement = this.stripeHandler.card;
      if (!cardElement._complete) {
        throw new Error('Please fill in all payment information before proceeding.');
      }
  
      
      const userId = await this.fetchUserId();
      if (!userId) {
        throw new Error('User not logged in');
      }
  
      
      await this.refreshPaymentDetails();
      const groupedItems = this.groupCartDataByDeliveryOption(this.cartData);
  
      
      const hasInvalidDelivery = groupedItems.every(group => group.items.length === 0);
      if (hasInvalidDelivery) {
        throw new Error('Please select delivery options for all items before proceeding.');
      }
  
      
      const clientSecret = await this.stripeHandler.createPaymentIntent(totalCents);
      if (!clientSecret) {
        throw new Error('Failed to initialize payment. Please try again.');
      }
  
      
      const paymentResult = await this.stripeHandler.processPayment(clientSecret);
      if (!paymentResult || paymentResult.status !== 'succeeded') {
        throw new Error('Payment failed. Please try again.');
      }
  
      
      const orderResponse = await this.createOrders(userId, totalCents, groupedItems);
      if (!orderResponse || !orderResponse.order_ids || orderResponse.order_ids.length === 0) {
        throw new Error('Failed to create orders');
      }
  
      
      window.location.replace('orders.php');
  
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(error.message || 'Payment failed. Please try again.');
      submitButton.disabled = false;
    }
  }

  showError(message) {
    const errorElement = this.element.querySelector('#card-errors');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    
    setTimeout(() => {
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }, 3000);
  }

  
  
  


groupCartDataByDeliveryOption(cartData) {
  console.log("Cart Data Before Grouping:", cartData);  
  
  const grouped = [
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }, 
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }, 
    { items: [], totalQuantity: 0, totalPriceCents: 0, shippingCostCents: 0, deliveryFeeCents: 0, taxCents: 0, finalTotalCents: 0, deliveryDate: null }  
  ];

  
  const shippingCosts = {
    1: 0,      
    2: 499,    
    3: 999     
  };

  
  const deliveryFees = {
    1: 0,      
    2: 499,    
    3: 999     
  };

  
  cartData.forEach(item => {
    const deliveryOption = item.deliveryOption;  
    console.log("Delivery Option:", deliveryOption);  
    
    if (deliveryOption >= 1 && deliveryOption <= 3) {
      const group = grouped[deliveryOption - 1];
      group.items.push(item);  
      group.totalQuantity += item.quantity; 
      group.totalPriceCents += item.priceCents * item.quantity; 

      
      group.shippingCostCents += shippingCosts[deliveryOption]
    }
  });

  
  grouped.forEach((group, index) => {
    if (group.items.length > 0) {
      const deliveryOption = index + 1;

     

      
      group.taxCents = Math.ceil((group.totalPriceCents + group.shippingCostCents ) * 0.10);

      
      group.finalTotalCents = group.totalPriceCents + group.shippingCostCents + group.taxCents;

      
      group.deliveryDate = this.calculateDeliveryDate(deliveryOption);
    }
  });

  console.log("Grouped Cart Data By Delivery Option:", grouped);  
  return grouped;
}

groupIndividualCartData(cartData) {
  console.log("Individual Cart Data Before Grouping:", cartData);  
  
  
  const grouped = [
    { items: [], deliveryDate: null },  
    { items: [], deliveryDate: null },  
    { items: [], deliveryDate: null }   
  ];

  
  cartData.forEach(item => {
    const deliveryOption = item.delivery_option;  
    console.log("Delivery Option:", deliveryOption);  
    
    if (deliveryOption >= 1 && deliveryOption <= 3) {
      const group = grouped[deliveryOption - 1];
      group.items.push(item);  
    }
  });

  
  grouped.forEach((group, index) => {
    if (group.items.length > 0) {
      const deliveryOption = index + 1;
      
      group.deliveryDate = this.calculateDeliveryDate(deliveryOption);
    }
  });

  console.log("Grouped Individual Cart Data By Delivery Option:", grouped);  
  return grouped;
}




async createOrders(userId, totalCents, groupedItems) {
  console.log('Creating orders with the following data:');
  console.log('User ID:', userId);
  console.log('Grouped Items:', groupedItems);

  
  

  
  try {
    const response = await fetch('backend/create-order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupedItems)
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




calculateDeliveryDate(deliveryOption) {
  const today = new Date();

  const deliveryDays = {
    1: 7,  
    2: 3,  
    3: 1   
  };

  const daysToAdd = deliveryDays[deliveryOption] || 7;  
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + daysToAdd);

  
  return deliveryDate.toISOString().split('T')[0]; 
}



  async fetchUserId() {
    try {
      const response = await fetch('backend/get-user-id.php');
      const data = await response.json();

      if (response.ok && data.userId) {
        return data.userId; 
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



  async logPayment(paymentData) {
    try {
      const response = await fetch('backend/log-payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const responseBody = await response.text();
      console.log('Log Payment Response:', responseBody); 

      if (!response.ok) {
        throw new Error('Failed to log payment');
      }
    } catch (error) {
      console.error('Error logging payment:', error);
    }
  }
}
