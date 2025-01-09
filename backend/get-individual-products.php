<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "web";$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}

$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
if ($user_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}
$requestPayload = json_decode(file_get_contents('php://input'), true);
$product_id = isset($requestPayload['product_id']) ? $requestPayload['product_id'] : null;
if ($product_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID is required']);
    exit;
}
$sql = "
    SELECT 
        c.id AS cart_id,         
        p.id AS product_id,
        p.image AS product_image,
        p.name AS product_name,
        p.priceCents AS product_pricecents,
        c.size AS cart_size
    FROM products p
    JOIN shopping_cart c ON p.id = c.product_id
    WHERE c.user_id = ? AND c.product_id = ?  
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $user_id, $product_id);$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    $products = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'data' => $products]);
} else {
    echo json_encode(['success' => true, 'data' => []]);
}
$stmt->close();
$conn->close();
?>
