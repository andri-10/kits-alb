<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "web";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}
session_start();
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
if ($user_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}
$requestPayload = json_decode(file_get_contents('php://input'), true);
$cart_id = isset($requestPayload['cart_id']) ? intval($requestPayload['cart_id']) : null;
$size = isset($requestPayload['size']) ? $requestPayload['size'] : null;
if ($cart_id === null || $size === null) {
    echo json_encode(['status' => 'error', 'message' => 'Cart ID and size are required']);
    exit;
}
$sql = "
    UPDATE shopping_cart
    SET size = ?
    WHERE id = ? AND user_id = ?
";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare SQL statement: ' . $conn->error]);
    exit;
}
$stmt->bind_param("sii", $size, $cart_id, $user_id);
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Cart size updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No matching cart item found or no changes made']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update cart size: ' . $stmt->error]);
}
$stmt->close();
$conn->close();
?>
