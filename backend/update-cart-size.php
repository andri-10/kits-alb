<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database connection settings
$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "web"; // Your database name

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}

// Start session to check if the user is logged in
session_start();

// Ensure user_id is provided via the session
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

// If user_id is not available, return an error
if ($user_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

// Get the POST data
$requestPayload = json_decode(file_get_contents('php://input'), true);
$cart_id = isset($requestPayload['cart_id']) ? intval($requestPayload['cart_id']) : null;
$size = isset($requestPayload['size']) ? $requestPayload['size'] : null;

// Validate input data
if ($cart_id === null || $size === null) {
    echo json_encode(['status' => 'error', 'message' => 'Cart ID and size are required']);
    exit;
}

// Prepare the SQL query to update the cart size
$sql = "
    UPDATE shopping_cart
    SET size = ?
    WHERE id = ? AND user_id = ?
";

// Prepare the statement
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare SQL statement: ' . $conn->error]);
    exit;
}

// Bind the parameters (size is a string, cart_id and user_id are integers)
$stmt->bind_param("sii", $size, $cart_id, $user_id);

// Execute the query
if ($stmt->execute()) {
    // Check if any rows were updated
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Cart size updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No matching cart item found or no changes made']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update cart size: ' . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
