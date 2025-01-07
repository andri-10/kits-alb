import {CheckoutHeader} from '../components/checkout/CheckoutHeader.js';
import {CartSummary} from '../components/checkout/CartSummary.js';
import {PaymentSummary} from '../components/checkout/PaymentSummary.js';
import {products} from '../data/products.js';

products.loadFromBackend().then(() => {
  const checkoutHeader = new CheckoutHeader('.js-checkout-header').create();
  const paymentSummary = new PaymentSummary('.js-payment-summary').create();
  const cartSummary = new CartSummary('.js-cart-summary').create();
  cartSummary.setCheckoutHeader(checkoutHeader);
  cartSummary.setPaymentSummary(paymentSummary);
});

document.addEventListener("DOMContentLoaded", () => {
  const summaryElement = document.querySelector(".payment-summary-holder");
  const cartSummary = document.querySelector(".cart-summary");
  const mainContainer = document.querySelector("main");

  window.addEventListener("scroll", () => {
    const scrollPoint = 191;
    if (window.scrollY > scrollPoint && window.innerWidth >= 1001) {
      summaryElement.classList.add("scrolled");
    } else {
      summaryElement.classList.remove("scrolled");
    }
  });

  function updatePaymentPosition() {

    if (!summaryElement.classList.contains("scrolled") || window.innerWidth<1001) {
      summaryElement.style.left = "";
      summaryElement.style.width = "";
      summaryElement.classList.remove("scrolled");
      return;
    }
   
    const cartSummaryRect = cartSummary.getBoundingClientRect();
    const cartRightEdge = cartSummaryRect.right;

    const mainRect = mainContainer.getBoundingClientRect();
    const mainWidth = mainRect.width;
    const availableSpace = mainWidth - (cartRightEdge - mainRect.left);

    const dynamicWidth = Math.max(323, Math.min(availableSpace-15, 356.66)); 
    summaryElement.style.width = `${dynamicWidth}px`;

    const leftPosition = cartRightEdge; 
    const viewportWidth = window.innerWidth;
    const rightPosition = leftPosition + dynamicWidth;
    if (rightPosition > viewportWidth - 15) {
      summaryElement.style.left = `${viewportWidth - dynamicWidth-15}px`; 
      
    } else {
      summaryElement.style.left = `${leftPosition}px`; 
      
    }
  }
  window.addEventListener("scroll", updatePaymentPosition);
  window.addEventListener("resize", updatePaymentPosition);

  updatePaymentPosition();
});