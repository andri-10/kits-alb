import { KitsHeader } from '../components/shared/KitsHeader.js';
import { products } from '../data/products.js';

products.loadFromBackend().then(() => {

  const kitsHeader = new KitsHeader('.js-kits-header').create();

  setupProductPage();
});

function setupProductPage() {
  // Wait for the DOM to be fully loaded
  document.addEventListener("DOMContentLoaded", function() {
    const addToCartButton = document.querySelector(".add-to-cart");
    const returnButton = document.querySelector(".return-link");


    if (addToCartButton) {
      addToCartButton.addEventListener("click", function() {
        const productId = addToCartButton.getAttribute("data-product-id");
        const size = document.getElementById("size").value;


        console.log(`Product ID: ${productId}, Size: ${size}`);
        alert("Product added to cart!");
      });
    }

    if (returnButton) {
      returnButton.addEventListener("click", function() {
        window.location.href = "catalog.php";
      });
    }

    renderRelatedProducts();
  });
}

function renderRelatedProducts() {
  const relatedProductsList = document.getElementById("related-products-list");

  if (!relatedProductsList) {
    console.error("Related products container not found.");
    return;
  }

  // Fetch related products data from the backend
  const relatedProductsData = JSON.parse(relatedProductsList.dataset.relatedProducts || "[]");

  if (relatedProductsData.length === 0) {
    relatedProductsList.innerHTML = "<p>No related products available.</p>";
    return;
  }

  // Create HTML for related products
  const productHTML = relatedProductsData
    .map(product => `
      <div class="related-product">
        <a href="view-product.php?id=${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <p class="product-name">${product.name}</p>
          <p class="product-price">$${(product.priceCents / 100).toFixed(2)}</p>
        </a>
      </div>
    `)
    .join("");

  // Inject the HTML into the related products container
  relatedProductsList.innerHTML = productHTML;
}
