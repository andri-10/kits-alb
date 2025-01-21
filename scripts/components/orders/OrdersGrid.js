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
    let ordersHTML = '';

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
                <span class="expand-icon">▼</span>
              </button>
              ${this.#renderCancelButton(order)}
            </section>
          </header>

          <div class="order-details-grid js-order-details">
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
    return `
      <div class="order-item">
        <div class="product-image-container">
          <img src="${item.image}" alt="${item.product_name}">
        </div>
        <div class="product-details">
          <div class="product-name">${item.product_name}</div>
          <div class="product-size">Size: ${item.size}</div>
          <div class="product-price">${MoneyUtils.formatMoney(item.price)}</div>
        </div>
      </div>
    `;
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
  }
}