import { products } from "../data/products.js";

document.addEventListener("DOMContentLoaded", async function() {
  await products.loadFromBackend();
  loadProductsToTable();
  loadUsersToTable();
});
function loadProductsToTable() {
  const table = document.getElementById('product-list-table');
  table.innerHTML = "";
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
  table.innerHTML = "";

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

  fetch('backend/get-all-users.php')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        data.users.forEach(user => {
          const row = table.insertRow();
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><img src="${user.profilePhoto || 'images/default-profile.png'}" alt="Profile Photo" width="50"></td>
            <td>${user.role}</td>
            <td>${user.email_verified ? 'Yes' : 'No'}</td>
            <td>${user.created_at}</td>
            <td>${user.updated_at}</td>
            <td>
              <button class="edit-user-btn" data-user-id="${user.id}">Edit</button>
              <button class="delete-user-btn" data-user-id="${user.id}">Delete</button>
              ${user.role === 'admin' ? `
                <button class="demote-user-btn" data-user-id="${user.id}">Demote</button>
              ` : ''}
              ${user.role === 'user' ? `
                <button class="promote-user-btn" data-user-id="${user.id}">Promote</button>
              ` : ''}
            </td>
          `;

          const promoteButton = row.querySelector('.promote-user-btn');
          const demoteButton = row.querySelector('.demote-user-btn');

          
          if (promoteButton) {
            promoteButton.addEventListener('click', () => {
              updateUserRole(user.id, 'admin');
            });
          }

          if (demoteButton) {
            demoteButton.addEventListener('click', () => {
              updateUserRole(user.id, 'user');
            });
          }
        });
      } else {
        const row = table.insertRow();
        row.innerHTML = `<td colspan="9">No users found.</td>`;
      }
    })
    .catch(error => {
      console.error('Error fetching users:', error);
    });
}

function updateUserRole(userId, newRole) {
  fetch('backend/update-role.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `user_id=${userId}&role=${newRole}`,
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        loadUsersToTable();
      } else {
        alert(`Error: ${data.error || "Failed to update role."}`);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An unexpected error occurred.');
    });
}



function editProduct(productId) {
  const product = products.findById(productId);
  console.log('Editing product:', product);
  openForm('update-product', product);
}
function deleteProduct(productId) {
  if (confirm(`Are you sure you want to delete the product with ID: ${productId}?`)) {
    fetch('backend/delete-product.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        productId: productId,
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Product with ID: ${productId} deleted successfully.`);
        location.reload();
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
function openForm(formType, product = null) {
  console.log("openForm called with type:", formType);
  if (document.getElementById('create-product-form')) {
    document.getElementById('create-product-form').remove();
  }
  if (document.getElementById('popup-backdrop')) {
    document.getElementById('popup-backdrop').remove();
  }
  if (document.getElementById('update-product-form')) {
    document.getElementById('update-product-form').remove();
  }
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
  document.body.insertAdjacentHTML('beforeend', formHtml);
  console.log("Form HTML inserted");
  document.getElementById(`${formType}-form`).style.display = 'block';
  document.getElementById('popup-backdrop').style.display = 'block';
  document.body.classList.add('popup-active');
  document.getElementById('cancel-product').addEventListener('click', cancelForm);
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
  document.getElementById('submit-product').addEventListener('click', function(event) {
    event.preventDefault();
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
    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
    }
    const url = formType === 'create-product' ? 'backend/create-product.php' : 'backend/update-product.php';
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
    cancelForm();
  });
}
function cancelForm() {
  const form = document.getElementById('create-product-form') || document.getElementById('update-product-form');
  const backdrop = document.getElementById('popup-backdrop');
  if (form) {
    form.remove();
  }
  if (backdrop) {
    backdrop.remove();
  }
  document.body.classList.remove('popup-active');
}
