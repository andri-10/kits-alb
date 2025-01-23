import { DateUtils } from '../../utils/DateUtils.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { Component } from '../Component.js';


export class OrdersGrid extends Component {
  element;
  #kitsHeader;
  #orders = [];
  #currentFilter = 'all'; 

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
  
    const filteredOrders = this.#getFilteredOrders(this.#currentFilter);
  
    if (filteredOrders.length === 0) {
      ordersHTML += `
        <div class="orders-empty-state">
          <p>No orders match the selected status.</p>
        </div>
      `;
    } else {
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
              ${this.#renderOrderGroups(groupedItems, order.progress, order.created_at)}
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

  #renderOrderGroups(groupedItems, progress, createdAt) {
    let html = '';
    
    Object.entries(groupedItems).forEach(([deliveryDate, items]) => {
      html += `
        <div class="delivery-group">
          <div class="delivery-date">
            Expected Delivery: ${DateUtils.formatDateMonth(new Date(deliveryDate).getTime())}
          </div>
          <div class="progress-tracking">
            <div class="progress-bar">
              <div class="progress" style="width: ${this.#calculateProgress(deliveryDate, createdAt).progress}%"></div>
              <span class="progress-status">${this.#calculateProgress(deliveryDate, createdAt).status}: ${this.#calculateProgress(deliveryDate, createdAt).message}</span>
            </div>
          </div>
          <div class="items-grid">
            ${items.map(item => this.#renderOrderItem(item)).join('')}
          </div>
        </div>
      `;
      
      items.forEach(item => {
        const { progress } = this.#calculateProgress(deliveryDate, createdAt);
        
        if (progress === 100 && item.order_status === 'pending') {
          this.#updateOrderStatusToCompleted(item.order_id);
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

#calculateProgress(deliveryDate, createdAt) {
  
  const formatDate = (dateStr) => {
    return dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  }

  const delivery = new Date(deliveryDate);
  const created = new Date(formatDate(createdAt));
  const now = new Date();

  if (isNaN(delivery.getTime()) || isNaN(created.getTime())) {
    console.error("Invalid date(s) provided");
    return {
      status: 'Invalid Date',
      progress: 0,
      message: 'Cannot calculate progress due to invalid dates',
    };
  }

  delivery.setHours(12, 0, 0, 0);  
  


  const totalMilliseconds = delivery - created;
  const totalHours = totalMilliseconds / (1000 * 60 * 60); 
 


  const passedMilliseconds = now - created;
  
  const passedHours = passedMilliseconds / (1000 * 60 * 60);
  

 
  const percentagePassed = (passedHours / totalHours) * 100;
 

  
  
  
  const progressPercentage = Math.max(10, percentagePassed)

  if (passedHours >= totalHours) {
    return {
      status: 'Delivered',
      progress: 100,
      message: 'Package delivered',
    };
  }

  return {
    status: passedHours <= 24 ? 'Arriving Today' : 'In Transit',
    progress: progressPercentage,
    message: passedHours <= 24 ? 'Out for delivery' : 'On the way',
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
            <button class="button-primary size-update-btn js-toggle-size" 
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
  
  const formatDate = (dateStr) => {
    
    return dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  }

  const delivery = new Date(deliveryDate);
  const created = new Date(formatDate(createdAt)); 

  const now = new Date();

  
  if (isNaN(delivery.getTime()) || isNaN(created.getTime())) {
    console.error("Invalid date(s) provided");
    return false; 
  }

  
  delivery.setHours(12, 0, 0, 0);  

  
  const totalMilliseconds = delivery - created;
  
  
  const totalHours = totalMilliseconds / (1000 * 60 * 60);
 

  
  const passedMilliseconds = now - created;
  const passedHours = passedMilliseconds / (1000 * 60 * 60);
 

  const percentagePassed = (passedHours / totalHours) * 100;
  

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
    
    const isDisabled = this.#isUpdateDisabled(order.delivery_date, order.created_at);
    
    
    console.log(isDisabled);
    if (!isDisabled && order.status == "pending") {
      return `
        <button class="cancel-btn js-cancel-order" data-order-id="${order.id}">
          Cancel Order
        </button>
      `;
    }
    return ''; 
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
