import {CheckoutHeader} from '../components/checkout/CheckoutHeader.js';
import {CartSummary} from '../components/checkout/CartSummary.js';
import {PaymentSummary} from '../components/checkout/PaymentSummary.js';
import {products} from '../data/products.js';

products.loadFromBackend().then(() => {
  const checkoutHeader = new CheckoutHeader('.js-checkout-header').create();
  const paymentSummary = new PaymentSummary('.js-payment-summary', 'pk_test_51QingtJvqD1LcS3xYG4Frz4qh9htiMyRoTGr0weMwD5dROi3d6Iuj9LRTKC7HP2jdlL57jNtOI8Q1d4W0Pw7UfJI004aeLOIFC').create();
  const cartSummary = new CartSummary('.js-cart-summary').create();
  cartSummary.setCheckoutHeader(checkoutHeader);
  cartSummary.setPaymentSummary(paymentSummary);
});

document.addEventListener("DOMContentLoaded", () => {
  const summaryElement = document.querySelector(".js-payment-summary");
  const cartSummary = document.querySelector(".js-cart-summary");
  const mainContainer = document.querySelector("main");

  let hasPassedScrollPoint = false;  
  const scrollPoint = 130; 

  
  window.addEventListener("scroll", () => {
    if (window.scrollY > scrollPoint && window.innerWidth >= 1001) {
      hasPassedScrollPoint = true;
      summaryElement.classList.add("scrolled");
    } else {
      hasPassedScrollPoint = false;
      summaryElement.classList.remove("scrolled");
    }
  });

  
  function updatePaymentPosition() {
    
    const paymentSummaryHeight = summaryElement.offsetHeight;

    
    if (paymentSummaryHeight > 900) {
      summaryElement.style.position = "relative";
      summaryElement.style.left = "";  
      summaryElement.style.width = ""; 
      summaryElement.style.top = "";   
      return;  
    }

    
    if (!hasPassedScrollPoint || window.innerWidth < 1001) {
      summaryElement.style.left = "";
      summaryElement.style.width = "";
      summaryElement.classList.remove("scrolled");
      summaryElement.style.position = "";  
      summaryElement.style.top = "";       
      return;
    }

    const cartSummaryRect = cartSummary.getBoundingClientRect();
    const cartRightEdge = cartSummaryRect.right;

    const mainRect = mainContainer.getBoundingClientRect();
    const mainWidth = mainRect.width;
    const availableSpace = mainWidth - (cartRightEdge - mainRect.left);

    const dynamicWidth = Math.max(323, Math.min(availableSpace - 15, 356.66)); 
    summaryElement.style.width = `${dynamicWidth}px`;

    const leftPosition = cartRightEdge;
    const viewportWidth = window.innerWidth;
    const rightPosition = leftPosition + dynamicWidth;

    if (rightPosition > viewportWidth - 15) {
      summaryElement.style.left = `${viewportWidth - dynamicWidth - 15}px`; 
    } else {
      summaryElement.style.left = `${leftPosition}px`;
    }

    
    summaryElement.style.position = "fixed";
    summaryElement.style.top = "6.8%";  
  }

  
  window.addEventListener("scroll", updatePaymentPosition);
  window.addEventListener("resize", () => {
    updatePaymentPosition();
    
    
    if (window.scrollY > scrollPoint && window.innerWidth >= 1001) {
      hasPassedScrollPoint = true;
      summaryElement.classList.add("scrolled");
    } else {
      hasPassedScrollPoint = false;
      summaryElement.classList.remove("scrolled");
    }
  });

  updatePaymentPosition(); 
});
