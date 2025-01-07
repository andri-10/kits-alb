<?php
$host = 'localhost';$dbname = 'web';$username = 'root';$password = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $searchTerm = isset($_GET['search']) ? $_GET['search'] : '';
    $sql = '
        SELECT id, name, image, stars, rating_count, priceCents, keywords
        FROM products
    ';
    if ($searchTerm) {
        $sql .= ' WHERE name LIKE :searchTerm OR keywords LIKE :searchTerm';
    }
    $sql .= '
        ORDER BY 
            -- Prioritize national teams over clubs based on the keywords
            CASE 
                WHEN keywords LIKE "%national%" THEN 1  -- National teams come first
                ELSE 2  -- Clubs come after national teams
            END,
            -- Sort by team name excluding "Home", "Away", "Third" (using REGEXP)
            REGEXP_REPLACE(name, "(Home|Away|Third|Kit|kit)", "") ASC,
            -- Prioritize Home, then Away, then Third kit types
            CASE 
                WHEN name LIKE "%Home%" THEN 1
                WHEN name LIKE "%Away%" THEN 2
                WHEN name LIKE "%Third%" THEN 3
                ELSE 4
            END
    ';
    $stmt = $pdo->prepare($sql);
    if ($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';        
        $stmt->bindParam(':searchTerm', $searchTerm, PDO::PARAM_STR);
    }
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $formattedProducts = [];
    foreach ($products as $product) {
        $keywords = json_decode($product['keywords'], true);        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $keywords = [];
        }

        $formattedProducts[] = [
            'id' => $product['id'],
            'name' => $product['name'],
            'image' => $product['image'],
            'rating' => [
                'stars' => $product['stars'],                
                'count' => $product['rating_count']
            ],
            'priceCents' => $product['priceCents'],
            'keywords' => $keywords        ];
    }
    header('Content-Type: application/json');
    echo json_encode($formattedProducts);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch products: ' . $e->getMessage()]);
}
?>
