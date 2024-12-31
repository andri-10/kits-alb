export class Product {
  #id;
  #image;
  #name;
  #rating;
  #priceCents;
  #keywords;
  #variations;
  #variationImages;

  constructor(args) {
    this.#id = args.id;
    this.#image = args.image;
    this.#name = args.name;
    this.#rating = args.rating;
    this.#priceCents = args.priceCents;
    this.#keywords = args.keywords;
    this.#variations = args.variations;
    this.#variationImages = args.variationImages;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }
  get stars() { return this.#rating.stars;}
  get ratingCount() { return this.#rating.count; }
  get priceCents() { return this.#priceCents; }
  get keywords() { return this.#keywords; }
  get variations() { return this.#variations; }

  createImageUrl(selectedVariation) {
    if (!this.#variations || !this.#variationImages) {
      return ''+ this.#image;
    }

    // If there was no selected variation, just use the
    // first option of every variation as the default.
    if (!selectedVariation) {
      selectedVariation = {};

      Object.keys(this.#variations).forEach(name => {
        selectedVariation[name] = this.#variations[name][0];
      });
    }

    // Now find a key in variationImages that matches the
    // selected variation (keys are JSON objects).
    const matchedKey = Object.keys(this.#variationImages).find(jsonString => {
      const matcherObject = JSON.parse(jsonString);

      // As long as all properties of the matcher object are the
      // same as the selected variation, then it's a match.
      return Object.keys(matcherObject).every(key => {
        return matcherObject[key] === selectedVariation[key];
      });
    });

    if (matchedKey) {
      return  this.#variationImages[matchedKey];
    }

    return this.#image;
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
      variations: this.#variations,
      variationImages: this.#variationImages
    };
  }
}

export class ProductList {
  #products = [];

  async loadFromBackend() {
    try {
      const response = await fetch('backend/get-products.php');
      
      // Log the response body as text for debugging
      const responseText = await response.text();
      console.log('Response Text:', responseText);  // Log the actual response body
  
      if (!response.ok) {
        throw new Error('Failed to fetch products from backend');
      }
  
      const productsData = JSON.parse(responseText);  // Explicitly parse as JSON
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
    // If there's no search text, return all the products.
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
