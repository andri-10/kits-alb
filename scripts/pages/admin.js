document.getElementById('create-product-btn').addEventListener('click', function() {
  console.log("Create Product button clicked");
  openForm('create-product');
});

// Function to handle opening the "Create Product" form
function openForm(formType) {
  if (formType === 'create-product') {
      // Create the form HTML dynamically
      const formHtml = `
          <div id="popup-backdrop"></div>
          <div id="create-product-form">
              <h3>Create New Product</h3>
              <label for="product-id">Product ID:</label>
              <input type="text" id="product-id" placeholder="Enter Product ID" required><br>

              <label for="image">Product Image:</label>
              <input type="file" id="image" accept="image/*"><br>
              <img id="image-preview" src="#" alt="Image Preview" style="display:none;width:100px;height:100px;margin-top:10px;"><br>

              <label for="product-name">Product Name:</label>
              <input type="text" id="product-name" placeholder="Enter Product Name" required><br>

              <label for="rating">Rating:</label>
              <input type="number" id="rating" step="0.1" min="0" max="5" placeholder="Enter Rating (0-5)" required><br>

              <label for="count">Count:</label>
              <input type="number" id="count" min="1" placeholder="Enter Count" required><br>

              <label for="price">Price (in cents):</label>
              <input type="number" id="price" step="0.01" placeholder="Enter Price in cents" required><br>

              <label for="keywords">Keywords (comma separated):</label>
              <input type="text" id="keywords" placeholder="Enter Keywords"><br>

              <button type="submit" id="submit-product">Create Product</button>
              <button type="button" id="cancel-product" onclick="cancelForm()">Cancel</button>
          </div>
      `;

      // Inject the form HTML into the body
      document.body.insertAdjacentHTML('beforeend', formHtml);

      // Show the form and backdrop
      document.getElementById('create-product-form').style.display = 'block';
      document.getElementById('popup-backdrop').style.display = 'block';
      document.body.classList.add('popup-active'); // Prevent scrolling behind the popup

      // Add image preview functionality
      document.getElementById('image').addEventListener('change', function(event) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = function(e) {
              const preview = document.getElementById('image-preview');
              preview.src = e.target.result;
              preview.style.display = 'inline';
          };
          reader.readAsDataURL(file);
      });

      // Handle form submission
      document.getElementById('submit-product').addEventListener('click', function() {
          const productId = document.getElementById('product-id').value;
          const productName = document.getElementById('product-name').value;
          const rating = parseFloat(document.getElementById('rating').value);
          const count = parseInt(document.getElementById('count').value);
          const price = parseFloat(document.getElementById('price').value);
          const keywords = document.getElementById('keywords').value.split(',').map(keyword => keyword.trim());

          console.log('Product Details:', {
              productId,
              productName,
              rating,
              count,
              price,
              keywords
          });

          // Optionally, send the data to the server or store it in local storage for now

          // Close the form after submission (optional)
          cancelForm();
      });
  }
}

// Cancel function to close the form and backdrop
function cancelForm() {
  const form = document.getElementById('create-product-form');
  const backdrop = document.getElementById('popup-backdrop');
  if (form) {
      form.remove();
  }
  if (backdrop) {
      backdrop.remove();
  }
  document.body.classList.remove('popup-active'); // Re-enable scrolling
}
