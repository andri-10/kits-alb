import {KitsHeader} from '../components/shared/KitsHeader.js';
import {OrdersGrid} from '../components/orders/OrdersGrid.js';
import {products} from '../data/products.js';

products.loadFromBackend().then(() => {
  const kitsHeader = new KitsHeader('.js-kits-header', true).create();
  const ordersGrid = new OrdersGrid('.js-orders-grid').create();
  ordersGrid.setKitsHeader(kitsHeader);
});
