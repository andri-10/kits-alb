<?php
// Database connection
$host = 'localhost'; // Change to your database host
$dbname = 'web'; // Change to your database name
$username = 'root'; // Change to your database username
$password = ''; // Change to your database password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if a search term is provided
    $searchTerm = isset($_GET['search']) ? $_GET['search'] : '';

    // Base SQL query to fetch product data
    $sql = '
        SELECT id, name, image, stars, rating_count, priceCents, keywords
        FROM products
    ';

    // If a search term is provided, add a WHERE clause
    if ($searchTerm) {
        $sql .= ' WHERE name LIKE :searchTerm OR keywords LIKE :searchTerm';
    }

    // Add ORDER BY clause for sorting logic
    $sql .= '
        ORDER BY 
            -- Prioritize national teams over clubs based on the keywords
            CASE 
                WHEN keywords LIKE "%national%" THEN 1  -- National teams come first
                ELSE 2  -- Clubs come after national teams
            END,
            -- Sort by team name (excluding kit types "Home", "Away", "Third")
            LEFT(name, LOCATE(" ", name) - 1), 
            -- Prioritize Home, then Away, then Third kit types
            CASE 
                WHEN name LIKE "%Home%" THEN 1
                WHEN name LIKE "%Away%" THEN 2
                WHEN name LIKE "%Third%" THEN 3
                ELSE 4
            END
    ';

    // Prepare the SQL statement
    $stmt = $pdo->prepare($sql);

    // Bind search term if provided
    if ($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%'; // Add wildcards for partial matching
        $stmt->bindParam(':searchTerm', $searchTerm, PDO::PARAM_STR);
    }

    // Execute the query
    $stmt->execute();

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