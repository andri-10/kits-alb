import { DateUtils } from '../../utils/DateUtils.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { Component } from '../Component.js';


export class OrdersGrid extends Component {
  element;
  #kitsHeader;
  #orders = [];
  #currentFilter = 'all'; // Add state to track current filter

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
    this.loadOrders();
  }

  setKitsHeader(kitsHeader) {
    this.#kitsHeader = kitsHeader;
  }

  async loadOrders() {
    try {
      const response = await fetch('backend/display-orders.php');
      const data = await response.json();
      
      if (data.success) {
        this.#orders = data.orders;
        this.render();
      } else {
        console.error('Failed to load orders:', data.error);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }
  render() {
    // Add a filter menu at the top with the current filter value
    const filterMenu = `
      <div class="order-filter">
        <label for="order-status">Filter by Status:</label>
        <select id="order-status" class="js-order-status-filter">
          <option value="all" ${this.#currentFilter === 'all' ? 'selected' : ''}>All</option>
          <option value="pending" ${this.#currentFilter === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="completed" ${this.#currentFilter === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
    `;
  
    // Check if no orders exist
    if (this.#orders.length === 0) {
      this.element.innerHTML = `
        ${filterMenu}
        <div class="orders-empty-state">
          <p>Your order list is empty</p>
        </div>
      `;
      return;
    }
  
    const disclaimer = `
      <div class="orders-disclaimer">
        <p>Please note:</p>
        <ul>
          <li>Order cancellations and size modifications are not permitted after the halfway point to delivery</li>
          <li>Once an order is cancelled, we will soon refund you!</li>
        </ul>
      </div>
    `;
  
    let ordersHTML = disclaimer + filterMenu;
  
    // Get filtered orders based on current filter
    const filteredOrders = this.#getFilteredOrders(this.#currentFilter);
  
    if (filteredOrders.length === 0) {
      ordersHTML += `
        <div class="orders-empty-state">
          <p>No orders match the selected status.</p>
        </div>
      `;
    } else {
      // Render filtered orders
      filteredOrders.forEach(order => {
        const orderDate = DateUtils.formatDateMonth(new Date(order.created_at).getTime());
        const orderCost = MoneyUtils.formatMoney(order.total_price);
        const groupedItems = this.#groupItemsByDeliveryDate(order.items);
        const orderDeliveryDate = DateUtils.formatDateMonth(new Date(order.delivery_date));
  
        ordersHTML += `
          <div class="order-container js-order-container" data-order-id="${order.id}">
            <header class="order-header">
              <section class="left-section">
                <div class="order-date">
                  <div class="order-header-label">Order Placed:</div>
                  <div>${orderDate}</div>
                </div>
                <div class="order-delivery-date">
                  <div class="order-header-label">${order.status === 'completed' ? 'Date Delivered:' : 'Expected delivery:'}</div>
                  <div>${order.status === 'completed' ? DateUtils.formatDateMonth(new Date(order.delivery_date)) : orderDeliveryDate}</div>
                </div>
                <div class="order-total">
                  <div class="order-header-label">Total:</div>
                  <div>${orderCost}</div>
                </div>
              </section>
              <section class="right-section">
                <div class="order-header-label">Order ID:</div>
                <div>${order.id}</div>
                <button class="toggle-btn js-toggle-order">
                  <span class="expand-icon">▶</span>
                </button>
                ${this.#renderCancelButton(order)}
              </section>
            </header>
            <div class="order-details-grid js-order-details" style="display: none;">
              ${this.#renderOrderGroups(groupedItems, order.progress)}
            </div>
          </div>
        `;
      });
    }
  
    this.element.innerHTML = ordersHTML;
    this.#attachEventListeners();
  }
  
  

  #getFilteredOrders(status) {
    if (status === 'pending') {
      return this.#orders.filter(order => order.status === 'pending');
    } else if (status === 'completed') {
      return this.#orders.filter(order => order.status === 'completed');
    }
    return this.#orders;
  }
  

  #groupItemsByDeliveryDate(items) {
    return items.reduce((groups, item) => {
      const date = item.delivery_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});
  }

  #renderOrderGroups(groupedItems, progress) {
    let html = '';
    
    // Loop through each delivery date group
    Object.entries(groupedItems).forEach(([deliveryDate, items]) => {
      // Render the HTML for each delivery date group
      html += `
        <div class="delivery-group">
          <div class="delivery-date">
            Expected Delivery: ${DateUtils.formatDateMonth(new Date(deliveryDate).getTime())}
          </div>
          <div class="progress-tracking">
            <div class="progress-bar">
              <div class="progress" style="width: ${this.#calculateProgress(deliveryDate).progress}%"></div>
              <span class="progress-status">${this.#calculateProgress(deliveryDate).status}: ${this.#calculateProgress(deliveryDate).message}</span>
            </div>
          </div>
          <div class="items-grid">
            ${items.map(item => this.#renderOrderItem(item)).join('')}
          </div>
        </div>
      `;
      
      // Check if the progress for any item is 100% and update the order status to 'completed'
      items.forEach(item => {
        const { progress } = this.#calculateProgress(deliveryDate);
        
        if (progress === 100 && item.order_status === 'pending') {
          this.#updateOrderStatusToCompleted(item.order_id); // Call the update function if progress is 100%
        }
      });
    });
    
    return html;
}

#updateOrderStatusToCompleted(orderId) {
  fetch('backend/update-order-to-completed.php', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
          order_id: orderId,  
      })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          console.log(`Order ${orderId} status updated to completed`);
        
      } else {
          console.error(`Error updating order ${orderId} status:`, data.error);
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

  #calculateProgress(deliveryDate) {
    const delivery = new Date(deliveryDate);
    delivery.setHours(0, 0, 0, 0); // Normalize delivery date to midnight

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize current date to midnight

    console.log("Normalized Delivery Date:", delivery.toISOString());
    console.log("Normalized Today:", today.toISOString());

    // Calculate the difference in milliseconds
    const diffInMilliseconds = delivery - today;
    
    // Convert milliseconds to hours
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    console.log("Difference in Hours:", diffInHours);

    if (diffInHours <= 0) {
        return {
            status: 'Delivered',
            progress: 100,
            message: 'Package delivered',
        };
    }

    // Define maximum delivery window in hours (e.g., 168 hours = 7 days)
    const totalHours = 168; // 7 days * 24 hours

    // Calculate the percentage based on remaining hours relative to totalHours
    const hoursRemainingPercentage = Math.max(
        0,
        Math.min(100, ((totalHours - diffInHours) / totalHours) * 100)
    );

    // Scale from 10 to 100
    const progressPercentage = 10 + hoursRemainingPercentage * 0.9;

    return {
        status: diffInHours <= 24 ? 'Arriving Today' : 'In Transit',  // Use 24 hours threshold for 'Arriving Today'
        progress: progressPercentage,
        message: diffInHours <= 24 ? 'Out for delivery' : 'On the way',
    };
}




#renderOrderItem(item) {
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
 
  const isDisabled = this.#isUpdateDisabled(item.order_delivery_date, item.order_created_at);
 
  const currentSize = item.size;
  
  const sizeDisplay = `
    <div class="product-size-section">
      <div class="current-size">Size: ${currentSize}</div>
    </div>
  `;

  const sizeSelector = `
    <div class="size-selector js-size-selector" style="display: none;">
      <div class="size-options">
        ${sizes.map(size => `
          <label class="size-radio">
            <input type="radio" 
              name="size_${item.id}" 
              value="${size}" 
              ${size === currentSize ? 'checked' : ''} 
              data-order-id="${item.order_id}"
              data-item-id="${item.id}"
              class="js-size-radio"
            >
            ${size}
          </label>
        `).join('')}
      </div>
      <div class="update-message js-update-message" style="display: none;">
        Item size updated successfully
      </div>
    </div>
  `;

  return `
    <div class="order-item">
      <div class="product-image-container">
        <img src="${item.image}" alt="${item.product_name}">
      </div>
      <div class="product-details">
        <div class="product-name">${item.product_name}</div>
        ${sizeDisplay}
        <div class="price-and-button">
          <div class="product-price">${MoneyUtils.formatMoney(item.price)}</div>
          ${!isDisabled ? `
            <button class="size-update-btn js-toggle-size" 
              data-item-id="${item.id}"
              data-order-id="${item.order_id}">
              Update Size
            </button>
          ` : ''}
        </div>
        ${sizeSelector}
      </div>
    </div>
  `;
}



#isUpdateDisabled(deliveryDate, createdAt) {
  // Convert createdAt to a valid ISO format if needed
  const formatDate = (dateStr) => {
    // If the date already has a time component, replace the space with 'T' to make it ISO compatible
    return dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  }

  const delivery = new Date(deliveryDate);
  const created = new Date(formatDate(createdAt)); // Convert createdAt to a proper format

  const now = new Date();

  // Check if the dates are valid before proceeding
  if (isNaN(delivery.getTime()) || isNaN(created.getTime())) {
    console.error("Invalid date(s) provided");
    return false; // Or handle it in another way, e.g., returning true or a default value
  }

  // Set the delivery time to 12 PM (noon) for consistency
  delivery.setHours(12, 0, 0, 0);  // Delivery time set to noon (12 PM)

  // Get the total time difference between the creation date and delivery date in milliseconds
  const totalMilliseconds = delivery - created;
  
  // Convert milliseconds to hours
  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  console.log("Total Hours Between Created and Delivery:", totalHours); // For debugging

  // Get the total time passed since the order was created (in hours)
  const passedMilliseconds = now - created;
  const passedHours = passedMilliseconds / (1000 * 60 * 60);
  console.log("Total Hours Passed Since Order Created:", passedHours); // For debugging

  // Calculate the percentage of time passed between the order creation and delivery
  const percentagePassed = (passedHours / totalHours) * 100;
  console.log("Percentage of Time Passed:", percentagePassed); // For debugging

  // Disable updates if more than 50% of the time has passed
  return percentagePassed > 50;
}




  async #updateSize(orderId, orderItemId, newSize) {
    try {
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('order_item_id', orderItemId);
      formData.append('size', newSize);

      const response = await fetch('backend/update-order-size.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update size');
      }

      // Show success message
      const itemContainer = this.element.querySelector(`[data-item-id="${orderItemId}"]`)
        .closest('.product-details');
      const messageElement = itemContainer.querySelector('.js-update-message');
      
      messageElement.style.display = 'block';
      messageElement.style.color = 'green';
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 3000); 

      return true;
    } catch (error) {
      console.error('Error updating size:', error);
      alert('Failed to update size: ' + error.message);
      return false;
    }
  }

  #renderCancelButton(order) {
    // Pass both delivery date and created date to check the update status
    const isDisabled = this.#isUpdateDisabled(order.delivery_date, order.created_at);
    
    
    console.log(isDisabled);
    if (!isDisabled && order.status == "pending") {
      return `
        <button class="cancel-btn js-cancel-order" data-order-id="${order.id}">
          Cancel Order
        </button>
      `;
    }
    return ''; // Do not render the button if the update is disabled
  }
  

  async #cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('order_id', orderId);

      const response = await fetch('backend/cancel-order.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Order cancelled successfully');
        this.loadOrders();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  }

  #attachEventListeners() {

    const statusFilter = this.element.querySelector('.js-order-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.#currentFilter = e.target.value;
        this.render();
      });
    }

  // The rest of your existing event listeners go here...
  this.element.querySelectorAll('.js-toggle-order').forEach(button => {
    button.addEventListener('click', (e) => {
      const container = e.target.closest('.js-order-container');
      container.classList.toggle('expanded');
      const icon = button.querySelector('.expand-icon');
      icon.textContent = container.classList.contains('expanded') ? '▼' : '▶';
    });
  });

    this.element.querySelectorAll('.js-toggle-order').forEach(button => {
      button.addEventListener('click', (e) => {
        const container = e.target.closest('.js-order-container');
        container.classList.toggle('expanded');
        const icon = button.querySelector('.expand-icon');
        icon.textContent = container.classList.contains('expanded') ? '▼' : '▶';
      });
    });

    this.element.querySelectorAll('.js-cancel-order').forEach(button => {
      button.addEventListener('click', (e) => {
        const orderId = e.target.dataset.orderId;
        this.#cancelOrder(orderId);
      });
    });

   

    this.element.querySelectorAll('.js-toggle-order').forEach(button => {
      button.addEventListener('click', (e) => {
        const container = e.target.closest('.js-order-container');
        const details = container.querySelector('.js-order-details');
        const icon = button.querySelector('.expand-icon');
        
        if (details.style.display === 'none') {
          details.style.display = 'block';
          icon.textContent = '▼';
        } else {
          details.style.display = 'none';
          icon.textContent = '▶';
        }
      });
    });


    this.element.querySelectorAll('.js-size-radio').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.orderId;
        const itemId = e.target.dataset.itemId;
        const newSize = e.target.value;
        
        const success = await this.#updateSize(orderId, itemId, newSize);
        if (success) {
          // Update the displayed current size
          const itemContainer = e.target.closest('.product-details');
          const currentSizeElement = itemContainer.querySelector('.current-size');
          currentSizeElement.textContent = `Size: ${newSize}`;
        }
      });
    });

    this.element.querySelectorAll('.js-toggle-size').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemId = e.target.dataset.itemId;
        const sizeSelector = e.target.closest('.product-details')
          .querySelector('.js-size-selector');
        
        if (sizeSelector.style.display === 'none') {
          sizeSelector.style.display = 'block';
          e.target.textContent = 'Collapse';
        } else {
          sizeSelector.style.display = 'none';
          e.target.textContent = 'Update Size';
        }
      });
    });
  }
  }
