import { KitsHeader } from '../components/shared/KitsHeader.js';
import { products } from '../data/products.js';
import { WindowUtils } from '../utils/WindowUtils.js';

products.loadFromBackend().then(() => {
  const kitsHeader = new KitsHeader('.js-kits-header').create();

  setupProductPage(kitsHeader);
});

function setupProductPage(kitsHeader) {
  document.addEventListener("DOMContentLoaded", () => {
    const addToCartButton = document.querySelector(".add-to-cart");

    if (addToCartButton) {
      addToCartButton.addEventListener("click", async (event) => {
        await handleAddToCart(event, kitsHeader);
      });
    }
  });
}

async function handleAddToCart(event, kitsHeader) {
  const basePath = `${window.location.origin}/kits-alb/backend/`;

  // Step 1: Check if the user is logged in
  const response = await fetch(`${basePath}/check-session.php`);
  const session = await response.json();

  if (!data.isLoggedIn) {
    window.location.href = 'login.php';
    return;
  }

  // Step 2: Perform add-to-cart logic
  const addToCartButton = event.target;
  const productId = addToCartButton.getAttribute("data-product-id");
  const size = document.getElementById("size").value;

  try {
    // Make the POST request to add the product to the cart
    const response = await fetch(`${basePath}/add-to-cart.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        size: size,
      }),
    });

    const data = await response.json();

    if (data.status === 'Product added to cart' || data.status === 'Product quantity updated in cart') {
      // Step 3: Update the cart count and show success message
      kitsHeader.updateCartCount();
      showSuccessMessage(addToCartButton.closest('.product-container'));
    } else {
      WindowUtils.showAlert('Failed to add the product to cart. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    WindowUtils.showAlert('An error occurred while adding the product to the cart.', 'error');
  }
}

function showSuccessMessage(productContainer) {
  const successMessage = productContainer.querySelector('.js-added-to-cart-message');

  if (successMessage) {
    successMessage.classList.add('is-visible');

    setTimeout(() => {
      successMessage.classList.remove('is-visible');
    }, 2000);
  } else {
    WindowUtils.showAlert('Product successfully added to cart!', 'success');
  }
}
