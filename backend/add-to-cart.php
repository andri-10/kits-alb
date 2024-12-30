<?php
// Enable error reporting for debugging purposes
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database connection settings
$servername = "localhost"; // Your database server
$username = "root"; // Your database username
$password = ""; // Your database password
$dbname = "web"; // Your database name

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit; // Stop the script if connection fails
}

// Start session to check if the user is logged in
session_start();

// Verify if the user is logged in by checking the session
if (!isset($_SESSION['user_id'])) {
    // If not logged in, send an error message
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit; // Stop the script if user is not logged in
}

// Get the logged-in user_id from the session
$user_id = $_SESSION['user_id'];

// Get the POST data (product_id and size)
$data = json_decode(file_get_contents('php://input'), true);

// Log the incoming request data to check the input
error_log("Received data: " . print_r($data, true));  // Add this for debugging

// Check if product_id is present in the request
if (!isset($data['product_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID not provided']);
    exit;
}

$product_id = $data['product_id'];

// Check if size is provided in the request
if (!isset($data['size'])) {
    echo json_encode(['status' => 'error', 'message' => 'Size not provided']);
    exit;
}

$size = $data['size']; // Get size from the request

// Prepare and execute query to check if the product exists in the database
$query_check_product = "SELECT id FROM products WHERE id = ?";
$stmt_check_product = $conn->prepare($query_check_product);
$stmt_check_product->bind_param("s", $product_id); // "s" because product_id is a string
$stmt_check_product->execute();
$result_check_product = $stmt_check_product->get_result();

// Check if the product was found
if ($result_check_product->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Product not found']);
    exit; // Stop the script if product doesn't exist
}

// Add the product to the cart
$query = "INSERT INTO shopping_cart (user_id, product_id, size, created_at) VALUES (?, ?, ?, NOW())";
$stmt = $conn->prepare($query);
$stmt->bind_param("iss", $user_id, $product_id, $size); // "i" for user_id, "s" for product_id and size

// Ensure we get a response
$response = [];

if ($stmt->execute()) {
    $response['status'] = 'Product added to cart';
} else {
    $response['status'] = 'error';
    $response['message'] = 'Error adding product to cart';
}

$conn->close();

// Log the response data for debugging
error_log("Response data: " . print_r($response, true));

// Echo the response back
echo json_encode($response);
?>
