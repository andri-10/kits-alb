<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set the content type to JSON
header('Content-Type: application/json');

// Start the session to retrieve the user_id from the session
session_start();

// Get the user ID from the session
$userId = $_SESSION['user_id'] ?? null;

// Check if user ID is not available
if (!$userId) {
    echo json_encode(['error' => 'No user ID provided or user not logged in']);
    exit;
}

// Connect to the database
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'web';
$conn = new mysqli($host, $user, $password, $database);

// Check if the connection was successful
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Prepare the SQL query to get cart details for the user
$sql = "
    SELECT 
        p.priceCents,
        COUNT(sc.product_id) AS quantity,
        sc.delivery_option,
        (p.priceCents * COUNT(sc.product_id)) AS product_cost_cents,
        CASE 
            WHEN sc.delivery_option = 1 THEN 0 
            WHEN sc.delivery_option = 2 THEN 499 
            WHEN sc.delivery_option = 3 THEN 999 
            ELSE 0 
        END AS shipping_cost_cents
    FROM products p
    JOIN shopping_cart sc ON p.id = sc.product_id
    WHERE sc.user_id = ?  -- Select cart items for the current user
    GROUP BY sc.product_id, sc.delivery_option
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();

// Initialize total costs
$productCostCents = 0;
$shippingCostCents = 0;

while ($row = $result->fetch_assoc()) {
    // Add the product cost for the current product to the total
    $productCostCents += $row['product_cost_cents'];

    // Add the shipping cost for the current product to the total
    $shippingCostCents += $row['shipping_cost_cents'];
}

// Calculate tax (10% of the total product and shipping costs)
$taxCents = ($productCostCents + $shippingCostCents) * 0.10;

// Calculate the total cost (product + shipping + tax)
$totalCents = $productCostCents + $shippingCostCents + $taxCents;

// Return the calculated costs as JSON
echo json_encode([
    'costs' => [
        'productCostCents' => $productCostCents,
        'shippingCostCents' => $shippingCostCents,
        'taxCents' => $taxCents,
        'totalCents' => $totalCents
    ]
]);

$conn->close();
?>
