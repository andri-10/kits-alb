import { DateUtils } from '../../utils/DateUtils.js';
import { MoneyUtils } from '../../utils/MoneyUtils.js';
import { Component } from '../Component.js';


export class OrdersGrid extends Component {
  element;
  #kitsHeader;
  #orders = [];

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
    if (this.#orders.length === 0) {
      this.element.innerHTML = `
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
          <li>Orders can only be cancelled within 24 hours of placement</li>
          <li>Size modifications are not permitted after the halfway point to delivery</li>
        </ul>
      </div>
    `;

    let ordersHTML = disclaimer;

    this.#orders.forEach(order => {
      const orderDate = DateUtils.formatDateMonth(new Date(order.created_at).getTime());
      const orderCost = MoneyUtils.formatMoney(order.total_price);
      const groupedItems = this.#groupItemsByDeliveryDate(order.items);

      ordersHTML += `
        <div class="order-container js-order-container" data-order-id="${order.id}">
          <header class="order-header">
            <section class="left-section">
              <div class="order-date">
                <div class="order-header-label">Order Placed:</div>
                <div>${orderDate}</div>
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

    this.element.innerHTML = ordersHTML;
    this.#attachEventListeners();
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
    
    Object.entries(groupedItems).forEach(([deliveryDate, items]) => {
      html += `
        <div class="delivery-group">
          <div class="delivery-date">
            Expected Delivery: ${DateUtils.formatDateMonth(new Date(deliveryDate).getTime())}
          </div>
          <div class="progress-tracking">
            <div class="progress-bar">
              <div class="progress" style="width: ${progress.progress}%"></div>
              <span class="progress-status">${progress.status}: ${progress.message}</span>
            </div>
          </div>
          <div class="items-grid">
            ${items.map(item => this.#renderOrderItem(item)).join('')}
          </div>
        </div>
      `;
    });
    
    return html;
  }

  #renderOrderItem(item) {
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const isDisabled = this.#isUpdateDisabled(item.delivery_date);
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

  #isUpdateDisabled(deliveryDate) {
    const created = new Date(deliveryDate);
    created.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate);
    const today = new Date();
    
    const totalDays = (delivery - created) / (1000 * 60 * 60 * 24);
    const progressDays = (today - created) / (1000 * 60 * 60 * 24);
    
    return progressDays > (totalDays / 2);
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
    const orderDate = new Date(order.created_at).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    
    if (orderDate === today && order.status === 'pending') {
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
