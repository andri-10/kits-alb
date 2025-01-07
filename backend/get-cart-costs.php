<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['error' => 'No user ID provided or user not logged in']);
    exit;
}
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'web';
$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
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
$productCostCents = 0;
$shippingCostCents = 0;

while ($row = $result->fetch_assoc()) {
    $productCostCents += $row['product_cost_cents'];
    $shippingCostCents += $row['shipping_cost_cents'];
}
$taxCents = ($productCostCents + $shippingCostCents) * 0.10;
$totalCents = $productCostCents + $shippingCostCents + $taxCents;
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
