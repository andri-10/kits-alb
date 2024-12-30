<?php

$host = 'localhost';
$dbname = 'web';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $productId = isset($_GET['id']) ? $_GET['id'] : null;
    $product = null;
    $relatedProducts = [];

    if ($productId) {
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
        $stmt->execute(['id' => $productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($product) {
            $productKeywords = json_decode($product['keywords'], true);
            
            if ($productKeywords && is_array($productKeywords)) {
                // Filter out "jersey" from the keywords array
                $filteredKeywords = array_filter($productKeywords, function ($keyword) {
                    return strtolower($keyword) !== 'jersey';
                });
               
                if (!empty($filteredKeywords)) {
                    // Build the query with filtered keywords
                    $placeholders = implode(' OR ', array_fill(0, count($filteredKeywords), "keywords LIKE CONCAT('%', ?, '%')"));
                    
                    $query = "
                        SELECT * FROM products 
                        WHERE id != ? 
                        AND ($placeholders)
                        ORDER BY RAND()
                        LIMIT 6";
                    
                    $params = [$productId];
                    foreach ($filteredKeywords as $keyword) {
                        $params[] = $keyword;
                    }
                } else {
                    // Fallback: Fetch random products excluding the current one
                    $query = "
                        SELECT * FROM products 
                        WHERE id != ? 
                        ORDER BY RAND()
                        LIMIT 6";
                    $params = [$productId];
                }
            
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
            
                $relatedProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }        
        
    }

    if (!$product) {
        echo "Product not found.";
        exit;
    }

    $price = number_format($product['priceCents'] / 100, 2);
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['name']); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/catalog.css">
    <link rel="stylesheet" href="styles/pages/view-product.css">
</head>
<body>
    <header class="js-kits-header kits-header"></header>
    <div class="return-button">
        <a href="catalog.php" class="return-link">← Return</a>
    </div>
    <div class="product-container">
        <div class="product-details">
            <div class="product-image">
                <img src="<?php echo htmlspecialchars($product['image']); ?>" alt="<?php echo htmlspecialchars($product['name']); ?>" />
            </div>
            <div class="product-info">
                <h1><?php echo htmlspecialchars($product['name']); ?></h1>
                <div class="size-and-quantity">
                    <div class="size-menu">
                        <label for="size">Size:</label>
                        <select id="size" name="size">
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        </select>
                    </div>
                    <div class="quantity-menu">
                        <label for="quantity">Quantity:</label>
                    <select id="quantity" name="quantity">
                        <option selected value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
              </select>
            </div>
                
                </div>
                <p class="product-price">$<?php echo $price; ?></p>
                <div class="js-added-to-cart-message added-to-cart-message" data-testid="added-to-cart-message">
              <img src="images/icons/checkmark.png">
              Added
            </div>
                <button class="add-to-cart" data-product-id="<?php echo $product['id']; ?>">Add to Cart</button>
            </div>
        </div>
    </div>
    <div class="related-products">
        <h2>Related Products</h2>
        <div id="related-products-list" class="related-products-list">
            <?php if (count($relatedProducts) > 0): ?>
                <?php foreach ($relatedProducts as $related): ?>
                    <div class="related-product" data-product-id="<?php echo htmlspecialchars($related['id']); ?>">
                        <a href="view-product.php?id=<?php echo htmlspecialchars($related['id']); ?>" class="related-product-link">
                            <img src="<?php echo htmlspecialchars($related['image']); ?>" alt="<?php echo htmlspecialchars($related['name']); ?>">
                        </a>
                        <p class="product-name"><?php echo htmlspecialchars($related['name']); ?></p>
                        <p class="product-price">$<?php echo number_format($related['priceCents'] / 100, 2); ?></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>No related products found.</p>
            <?php endif; ?>
        </div>
    </div>
    <script type="module" src="scripts/pages/view-product.js"></script>
</body>
</html>
