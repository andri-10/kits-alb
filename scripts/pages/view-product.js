import { KitsHeader } from '../components/shared/KitsHeader.js';
import { WindowUtils } from '../utils/WindowUtils.js';

document.addEventListener("DOMContentLoaded", () => {
  const kitsHeader = new KitsHeader('.js-kits-header', true).create();
  const addToCartButton = document.querySelector('.add-to-cart');
  if (addToCartButton) {
    addToCartButton.addEventListener("click", async (event) => {
      await handleAddToCart(event, kitsHeader);
    });
  }
});

async function handleAddToCart(event, kitsHeader) {
  const basePath = '/backend';
  const response = await fetch(`${basePath}/check-session.php`);
  const session = await response.json();

  if (!session.isLoggedIn) {
    window.location.href = 'login.php';
    return;
  }
  const addToCartButton = event.target;
  const productId = addToCartButton.getAttribute("data-product-id");
  const size = document.getElementById("size").value;
  const quantitySelector = document.getElementById("quantity");
  const quantity = quantitySelector ? parseInt(quantitySelector.value, 10) : 1;

  try {
    const addToCartPromises = [];
    for (let i = 0; i < quantity; i++) {
      addToCartPromises.push(sendAddToCartRequest(productId, size));
    }
    await Promise.all(addToCartPromises);

   
    kitsHeader.updateCartCount();
    showSuccessMessage(addToCartButton.closest('.product-container'));
  } catch (error) {
    console.error('Error adding to cart:', error);
    WindowUtils.showAlert('An error occurred while adding the product to the cart.', 'error');
  }
}

async function sendAddToCartRequest(productId, size) {
  const userId = await getUserId();

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

async function getUserId() {
  const basePath = window.location.origin + '/backend';
  const response = await fetch(`${basePath}/get-user-id.php`);
  const data = await response.json();
  return data.userId || null;
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