import '../packages/uuid.js';
import {MoneyUtils} from '../utils/MoneyUtils.js';
import {deliveryOptions} from './deliveryOptions.js';
import {products} from './products.js';

export class Order {
  #id;
  #orderTimeMs;
  #totalCostCents;
  #products;

  constructor(args) {
    this.#id = args.id;
    this.#orderTimeMs = args.orderTimeMs;
    this.#totalCostCents = args.totalCostCents;
    this.#products = args.products;
  }

  get id() { return this.#id; }
  get orderTimeMs() { return this.#orderTimeMs; }
  get totalCostCents() { return this.#totalCostCents; }
  get products() { return this.#products; }

  findProductDetails(cartItemId) {
    return this.#products.find(product => {
      return product.cartItemId === cartItemId;
    });
  }

  toJSON() {
    return {
      id: this.#id,
      orderTimeMs: this.#orderTimeMs,
      totalCostCents: this.#totalCostCents,
      products: this.#products
    };
  }
}

export class OrderList {
  #orders;

  constructor() {
    this.loadFromStorage();
  }

  get all() { return this.#orders; }

  findById(id) {
    return this.#orders.find(order => {
      return order.id === id;
    });
  }

  createNewOrder(cart) {
    if (cart.isEmpty()) return;

    const id = uuid();
    const orderTimeMs = Date.now();
    let productCostCents = 0;
    let shippingCostCents = 0;

    cart.items.forEach(cartItem => {
      const product = products.findById(cartItem.productId, products);
      productCostCents += product.priceCents * cartItem.quantity;

      const deliveryOption = deliveryOptions.findById(cartItem.deliveryOptionId);
      shippingCostCents += deliveryOption.costCents;
    });

    const taxCents = (productCostCents + shippingCostCents) *
      MoneyUtils.taxRate;

    const totalCostCents = Math.round(
      productCostCents + shippingCostCents + taxCents
    );
    const productDetailsList = [];

    cart.items.forEach(cartItem => {
      const deliveryOption = deliveryOptions.findById(
        cartItem.deliveryOptionId
      );

      productDetailsList.push({
        cartItemId: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        estimatedDeliveryTimeMs: deliveryOption
          .calculateDeliveryDate()
          .getTime(),
        variation: cartItem.variation
      });
    });

    const newOrder = new Order({
      id,
      orderTimeMs,
      totalCostCents,
      products: productDetailsList
    });

    this.#orders.unshift(newOrder);
    this.#saveToStorage();

    cart.reset();
  }

  loadFromStorage() {
    const ordersJSON = localStorage.getItem('orders');

    this.#orders = ordersJSON
      ? JSON.parse(ordersJSON).map(JSON => new Order(JSON))
      : [
        new Order({
          id: '27cba69d-4c3d-4098-b42d-ac7fa62b7664',
          orderTimeMs: Date.now() - 1000 * 60 * 60 * 5,
          totalCostCents: 3506,
          products: [{
            cartItemId: '79b6831d-f135-44b4-a709-42f3305f7e68',
            productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6',
            quantity: 1,
            estimatedDeliveryTimeMs:
              deliveryOptions.findById('6e2dd65a-6665-4f24-bcdc-f2ecdbc6e156')
                .calculateDeliveryDate() - 1000 * 60 * 60 * 5
          }, {
            cartItemId: 'dc804e77-cd81-4383-84e6-78f50c19d4b2',
            productId: '83d4ca15-0f35-48f5-b7a3-1ea210004f2e',
            quantity: 2,
            estimatedDeliveryTimeMs:
              deliveryOptions.findById('f297d333-a5c4-452f-840b-15a662257b3f')
                .calculateDeliveryDate() - 1000 * 60 * 60 * 5
          }]
        })
      ];
  }

  #saveToStorage() {
    localStorage.setItem('orders', JSON.stringify(this.#orders));
  }
}

export const orders = new OrderList();
