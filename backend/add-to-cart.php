<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
$servername = "localhost";$username = "root";$password = "";$dbname = "web";$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;}
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;}
$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
error_log("Received data: " . print_r($data, true));if (!isset($data['product_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID not provided']);
    exit;
}

$product_id = $data['product_id'];
if (!isset($data['size'])) {
    echo json_encode(['status' => 'error', 'message' => 'Size not provided']);
    exit;
}

$size = $data['size'];$query_check_product = "SELECT id FROM products WHERE id = ?";
$stmt_check_product = $conn->prepare($query_check_product);
$stmt_check_product->bind_param("s", $product_id);$stmt_check_product->execute();
$result_check_product = $stmt_check_product->get_result();
if ($result_check_product->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Product not found']);
    exit;}
$query = "INSERT INTO shopping_cart (user_id, product_id, size, created_at) VALUES (?, ?, ?, NOW())";
$stmt = $conn->prepare($query);
$stmt->bind_param("iss", $user_id, $product_id, $size);$response = [];

if ($stmt->execute()) {
    $response['status'] = 'Product added to cart';
} else {
    $response['status'] = 'error';
    $response['message'] = 'Error adding product to cart';
}

$conn->close();
error_log("Response data: " . print_r($response, true));
echo json_encode($response);
?>
