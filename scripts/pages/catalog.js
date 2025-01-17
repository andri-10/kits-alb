import {KitsHeader} from '../components/shared/KitsHeader.js';
import {ProductsGrid} from '../components/kits/ProductsGrid.js';
import {products} from '../data/products.js';

products.loadFromBackend().then(() => {
  const kitsHeader = new KitsHeader('.js-kits-header', false).create();
  const productsGrid = new ProductsGrid('.js-products-grid').create();
  productsGrid.setKitsHeader(kitsHeader);
});