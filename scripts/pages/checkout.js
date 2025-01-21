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

  let hasPassedScrollPoint = false;  // Store whether scroll has passed the threshold
  const scrollPoint = 130; // The scroll threshold

  // Handle scroll event to track scroll position
  window.addEventListener("scroll", () => {
    if (window.scrollY > scrollPoint && window.innerWidth >= 1001) {
      hasPassedScrollPoint = true;
      summaryElement.classList.add("scrolled");
    } else {
      hasPassedScrollPoint = false;
      summaryElement.classList.remove("scrolled");
    }
  });

  // Function to update the payment summary's position
  function updatePaymentPosition() {
    // Get the height of js-payment-summary element
    const paymentSummaryHeight = summaryElement.offsetHeight;

    // If the height exceeds 900px, change the position to relative
    if (paymentSummaryHeight > 900) {
      summaryElement.style.position = "relative";
      summaryElement.style.left = "";  // Reset left position
      summaryElement.style.width = ""; // Reset width
      summaryElement.style.top = "";   // Reset top when it's in relative mode
      return;  // Exit the function when the position is relative
    }

    // Continue with fixed positioning logic when height <= 900px
    if (!hasPassedScrollPoint || window.innerWidth < 1001) {
      summaryElement.style.left = "";
      summaryElement.style.width = "";
      summaryElement.classList.remove("scrolled");
      summaryElement.style.position = "";  // Reset position to default
      summaryElement.style.top = "";       // Reset top when it's not scrolled
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
    summaryElement.style.top = "6.8%";  // Set top when scrolled
  }

  // Add listeners for scroll and resize
  window.addEventListener("scroll", updatePaymentPosition);
  window.addEventListener("resize", () => {
    updatePaymentPosition();
    
    // Check if the scroll position has passed the threshold on resize
    if (window.scrollY > scrollPoint && window.innerWidth >= 1001) {
      hasPassedScrollPoint = true;
      summaryElement.classList.add("scrolled");
    } else {
      hasPassedScrollPoint = false;
      summaryElement.classList.remove("scrolled");
    }
  });

  updatePaymentPosition(); // Call initially to set the position based on current height
});
