export class Product {
  #id;
  #image;
  #name;
  #rating;
  #priceCents;
  #keywords;

  constructor(args) {
    this.#id = args.id;
    this.#image = args.image;
    this.#name = args.name;
    this.#rating = args.rating;
    this.#priceCents = args.priceCents;
    this.#keywords = args.keywords;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }
  get stars() { return this.#rating.stars;}
  get ratingCount() { return this.#rating.count; }
  get priceCents() { return this.#priceCents; }
  get keywords() { return this.#keywords; }

  createImageUrl() {
    return this.#image || null;
  }

  createRatingStarsUrl() {
    return `images/ratings/rating-${
      this.#rating.stars.toString().replace('.', '')
    }.png`;
  };

  toJSON() {
    return {
      id: this.#id,
      image: this.#image,
      name: this.#name,
      rating: this.#rating,
      priceCents: this.#priceCents,
      keywords: this.#keywords,
    };
  }
}

export class ProductList {
  #products = [];

  async loadFromBackend() {
    try {
      const response = await fetch('backend/get-products.php');
      const responseText = await response.text();
      console.log('Response Text:', responseText);
  
      if (!response.ok) {
        throw new Error('Failed to fetch products from backend');
      }
  
      const productsData = JSON.parse(responseText);
      this.#products = productsData.map(product => {
        return new Product(product);
      });
  
      console.log('Loaded products:', this.#products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  findById(id) {
    return this.#products.find(product => {
      return product.id === id;
    });
  }

  search(searchText) {
    if (!searchText) return this.#products;

    return this.#products.filter(product => {
      const nameMatch = product.name.toLowerCase()
        .includes(searchText.toLowerCase());

      if (nameMatch) return true;

      const keywordMatch = product.keywords.find(keyword => {
        return keyword.toLowerCase()
          .includes(searchText.toLowerCase());
      });

      return !!keywordMatch;
    });
  }
}

export const products = new ProductList();
