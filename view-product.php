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
                $placeholders = implode(' OR ', array_fill(0, count($productKeywords), "keywords LIKE CONCAT('%', ?, '%')"));

                $stmt = $pdo->prepare(
                    "SELECT * FROM products 
                     WHERE id != ? 
                     AND ($placeholders)
                     LIMIT 5"
                );
        
                $params = [$productId];
        
                foreach ($productKeywords as $keyword) {
                    $params[] = $keyword;
                }
        
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
                <label for="size">Size:</label>
                <select id="size" name="size">
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                </select>
                <p class="product-price">$<?php echo $price; ?></p>
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
