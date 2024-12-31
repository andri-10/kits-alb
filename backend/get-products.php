<?php
// Database connection
$host = 'localhost'; // Change to your database host
$dbname = 'web'; // Change to your database name
$username = 'root'; // Change to your database username
$password = ''; // Change to your database password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // SQL query to fetch product data including keywords
    $sql = 'SELECT id, name, image, stars, rating_count, priceCents, keywords FROM products';
    // SQL query to fetch product data including keywords
    $sql = 'SELECT id, name, image, stars, rating_count, priceCents, keywords FROM products';
    $stmt = $pdo->query($sql);

    // Fetch all products as an associative array
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the products to the structure needed in the frontend
    $formattedProducts = [];
    foreach ($products as $product) {
        // Decode the 'keywords' string into an array (JSON decode)
        $keywords = json_decode($product['keywords'], true);  // true to get an associative array

        // Check if decoding was successful; if not, set an empty array
        if (json_last_error() !== JSON_ERROR_NONE) {
            $keywords = [];
        }

        // Decode the 'keywords' string into an array (JSON decode)
        $keywords = json_decode($product['keywords'], true);  // true to get an associative array

        // Check if decoding was successful; if not, set an empty array
        if (json_last_error() !== JSON_ERROR_NONE) {
            $keywords = [];
        }

        $formattedProducts[] = [
            'id' => $product['id'],
            'name' => $product['name'],
            'image' => $product['image'],
            'rating' => [
                'stars' => $product['stars'], // Assuming rating is a number out of 5
                'count' => $product['rating_count']
            ],
            'priceCents' => $product['priceCents'],
            'keywords' => $keywords // Include decoded keywords
            'priceCents' => $product['priceCents'],
            'keywords' => $keywords // Include decoded keywords
        ];
    }

    // Return the products as JSON
    header('Content-Type: application/json');
    echo json_encode($formattedProducts);

} catch (PDOException $e) {
    // Handle database connection errors
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch products: ' . $e->getMessage()]);
}
?>