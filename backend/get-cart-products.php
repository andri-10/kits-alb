<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();


$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;}
$user_id = $_SESSION['user_id'];
$sql = "
    SELECT 
        p.id AS product_id,
        p.image AS product_image,
        p.name AS product_name,
        p.priceCents,
        c.delivery_option,
        COUNT(c.product_id) AS quantity,
        GROUP_CONCAT(DISTINCT c.size) AS sizes
        
    FROM products p
    JOIN shopping_cart c ON p.id = c.product_id
    WHERE c.user_id = ?  
    GROUP BY c.product_id
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);$stmt->execute();

$result = $stmt->get_result();
if (!$result) {
    echo json_encode(['error' => 'Database query failed']);
    exit;
}

$cartItems = [];
while ($row = $result->fetch_assoc()) {
    $cartItems[] = [
        'productId' => $row['product_id'],
        'image' => $row['product_image'],
        'name' => $row['product_name'],
        'priceCents' => $row['priceCents'],
        'quantity' => $row['quantity'],
        'sizes' => explode(',', $row['sizes']),    
        'deliveryOption' => $row['delivery_option'] 
    ];
}
$stmt->close();
$conn->close();
echo json_encode($cartItems);
?>
