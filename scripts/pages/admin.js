import { products } from "../data/products.js"; // Import the ProductList class

document.addEventListener("DOMContentLoaded", async function() {
  // Load the products when the page loads
  await products.loadFromBackend();
  loadProductsToTable();
  loadUsersToTable();
});

// Function to load products from the ProductList into the table
function loadProductsToTable() {
  const table = document.getElementById('product-list-table');
  table.innerHTML = ""; // Clear any existing rows in the table

  // Add table headers
  const headerRow = table.insertRow();
  headerRow.innerHTML = `
    <th>Product ID</th>
    <th>Product Name</th>
    <th>Image</th>
    <th>Stars</th>
    <th>Ratings</th>
    <th>Price</th>
    <th>Keywords</th>
    <th>Actions</th>
  `;

  // Loop through the products array and add each product to the table
  products.search('').forEach(product => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td><img src="${product.createImageUrl()}" alt="Product Image" width="50"></td>
      <td>${product.stars}</td>
      <td>${product.ratingCount}</td>
      <td>$${(product.priceCents / 100).toFixed(2)}</td> <!-- Convert price from cents to dollars -->
      <td>${product.keywords.join(', ')}</td>
      <td>
        <button class="edit-product-btn" data-product-id="${product.id}">Edit</button>
        <button class="delete-product-btn" data-product-id="${product.id}">Delete</button>
      </td>
    `;

    // Add event listeners for each button
    const editButton = row.querySelector('.edit-product-btn');
    const deleteButton = row.querySelector('.delete-product-btn');

    editButton.addEventListener('click', function() {
      editProduct(product.id);
    });

    deleteButton.addEventListener('click', function() {
      deleteProduct(product.id);
    });
  });
}


function loadUsersToTable() {
  const table = document.getElementById('user-list-table');
  table.innerHTML = ""; // Clear any existing rows in the table

  // Add table headers
  const headerRow = table.insertRow();
  headerRow.innerHTML = `
    <th>User ID</th>
    <th>Name</th>
    <th>Email</th>
    <th>Profile Photo</th>
    <th>Role</th>
    <th>Email Verified</th>
    <th>Created At</th>
    <th>Updated At</th>
    <th>Actions</th>
  `;

  // Fetch users from the server
  fetch('backend/get-all-users.php')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Loop through the users array and add each user to the table
        data.users.forEach(user => {
          const row = table.insertRow();
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><img src="${user.profilePhoto || 'default-profile.png'}" alt="Profile Photo" width="50"></td>
            <td>${user.role}</td>
            <td>${user.email_verified ? 'Yes' : 'No'}</td>
            <td>${user.created_at}</td>
            <td>${user.updated_at}</td>
            <td>
              <button class="edit-user-btn" data-user-id="${user.id}">Edit</button>
              <button class="delete-user-btn" data-user-id="${user.id}">Delete</button>
              <button class="promote-user-btn" data-user-id="${user.id}">Promote</button>
              <button class="demote-user-btn" data-user-id="${user.id}">Demote</button>
            </td>
          `;

          // Add event listeners for each button
          const editButton = row.querySelector('.edit-user-btn');
          const deleteButton = row.querySelector('.delete-user-btn');
          const promoteButton = row.querySelector('.promote-user-btn');
          const demoteButton = row.querySelector('.demote-user-btn');

          editButton.addEventListener('click', function() {
            editUser(user.id);
          });

          deleteButton.addEventListener('click', function() {
            deleteUser(user.id);
          });

          promoteButton.addEventListener('click', function() {
            promoteUser(user.id);
          });

          demoteButton.addEventListener('click', function() {
            demoteUser(user.id);
          });
        });
      } else {
        // If there are no users or error occurred
        const row = table.insertRow();
        row.innerHTML = `<td colspan="9">No users found.</td>`;
      }
    })
    .catch(error => {
      console.error('Error fetching users:', error);
    });
}

// Function to handle editing a product
function editProduct(productId) {
  const product = products.findById(productId);  // Get the product by ID
  console.log('Editing product:', product); // Debugging line
  openForm('update-product', product);
}

// Function to handle deleting a product
function deleteProduct(productId) {
  if (confirm(`Are you sure you want to delete the product with ID: ${productId}?`)) {
    // Make the request to delete the product via the backend (deleteproduct.php)
    fetch('backend/delete-product.php', {
      method: 'POST', // Or 'GET' depending on how the backend expects it
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        productId: productId, // Send the productId as part of the request body
      })
    })
    .then(response => response.json())
    .then(data => {
      // Check for success or error in the response
      if (data.success) {
        alert(`Product with ID: ${productId} deleted successfully.`);
        location.reload();
        // Optionally, you can update the UI to remove the deleted product, e.g., removing the row from a table
        // Example: document.getElementById(`product-${productId}`).remove();
      } else {
        alert(`Error: ${data.error || 'Failed to delete the product.'}`);
      }
    })
    .catch(error => {
      alert('Error occurred while deleting the product. Please try again.');
      console.error(error);
    });
  }
}


document.getElementById('create-product-btn').addEventListener('click', function() {
  console.log("Create Product button clicked");
  openForm('create-product');
});

// Function to handle opening the "Create Product" or "Update Product" form
function openForm(formType, product = null) {
  console.log("openForm called with type:", formType); // Debugging line

  // Remove any existing form and backdrop before adding new ones
  if (document.getElementById('create-product-form')) {
    document.getElementById('create-product-form').remove();
  }
  if (document.getElementById('popup-backdrop')) {
    document.getElementById('popup-backdrop').remove();
  }
  if (document.getElementById('update-product-form')) {
    document.getElementById('update-product-form').remove();
  }

  // Create the form HTML for creating or updating a product
  let formHtml = '';
  if (formType === 'create-product') {
    formHtml = `
      <div id="popup-backdrop" class="popup-backdrop"></div>
      <div id="create-product-form" class="popup-form">
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
        <button type="button" id="cancel-product">Cancel</button>
      </div>
    `;
  } else if (formType === 'update-product' && product) {
    formHtml = `
      <div id="popup-backdrop" class="popup-backdrop"></div>
      <div id="update-product-form" class="popup-form">
        <h3>Update Product</h3>
        <label for="product-id">Product ID:</label>
        <input type="text" id="product-id" value="${product.id}" readonly required><br>
        <label for="image">Product Image:</label>
        <input type="file" id="image" accept="image/*"><br>
        <img id="image-preview" src="/../../${product.createImageUrl().slice(2)}" alt="Image Preview" style="display:inline;width:100px;height:100px;margin-top:10px;"><br>
        <label for="product-name">Product Name:</label>
        <input type="text" id="product-name" value="${product.name}" placeholder="Enter Product Name" required><br>
        <label for="rating">Rating:</label>
        <input type="number" id="rating" value="${product.stars}" step="0.1" min="0" max="5" placeholder="Enter Rating (0-5)" required><br>
        <label for="count">Count:</label>
        <input type="number" id="count" value="${product.ratingCount}" min="1" placeholder="Enter Count" required><br>
        <label for="price">Price (in cents):</label>
        <input type="number" id="price" value="${product.priceCents}" step="0.01" placeholder="Enter Price in cents" required><br>
        <label for="keywords">Keywords (comma separated):</label>
        <input type="text" id="keywords" value="${product.keywords.join(', ')}" placeholder="Enter Keywords"><br>
        <button type="submit" id="submit-product">Update Product</button>
        <button type="button" id="cancel-product">Cancel</button>
      </div>
    `;
  }

  // Inject the form HTML into the body
  document.body.insertAdjacentHTML('beforeend', formHtml);
  console.log("Form HTML inserted");

  // Show the form and backdrop
  document.getElementById(`${formType}-form`).style.display = 'block';
  document.getElementById('popup-backdrop').style.display = 'block';
  document.body.classList.add('popup-active'); // Prevent scrolling behind the popup

  // Add event listener for cancel button
  document.getElementById('cancel-product').addEventListener('click', cancelForm);

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

  // Handle form submission (Create or Update)
  document.getElementById('submit-product').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent default form submission behavior

    // Gather form data
    const productId = document.getElementById('product-id').value;
    const productName = document.getElementById('product-name').value;
    const rating = parseFloat(document.getElementById('rating').value);
    const count = parseInt(document.getElementById('count').value);
    const price = parseInt(document.getElementById('price').value) 
    const keywords = document.getElementById('keywords').value.split(',').map(keyword => keyword.trim());

    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('productName', productName);
    formData.append('rating', rating);
    formData.append('count', count);
    formData.append('price', price);
    formData.append('keywords', keywords.join(','));

    // Append the image file if there is one
    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
    }

    // Determine which PHP script to call (Create or Update)
    const url = formType === 'create-product' ? 'backend/create-product.php' : 'backend/update-product.php';

    // Send data to the server
    fetch(url, {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(data);
          alert('Product saved successfully!');
          location.reload();
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('There was an error processing the request.');
      });

    // Close the form after submission (optional)
    cancelForm();
  });
}


// Cancel function to close the form and backdrop
function cancelForm() {
  const form = document.getElementById('create-product-form') || document.getElementById('update-product-form');
  const backdrop = document.getElementById('popup-backdrop');
  if (form) {
    form.remove();
  }
  if (backdrop) {
    backdrop.remove();
  }
  document.body.classList.remove('popup-active'); // Re-enable scrolling
}
