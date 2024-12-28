<?php
// Enable error reporting for debugging purposes
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

// Get the POST data (product_id)
$requestPayload = json_decode(file_get_contents('php://input'), true);
$product_id = isset($requestPayload['product_id']) ? $requestPayload['product_id'] : null;

// If product_id is not provided, return an error
if ($product_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID is required']);
    exit;
}

// Prepare the SQL query to get the individual products for this user and product_id
$sql = "
    SELECT 
        c.id AS cart_id,         -- Add cart ID to the selection
        p.id AS product_id,
        p.image AS product_image,
        p.name AS product_name,
        p.priceCents AS product_pricecents,
        c.size AS cart_size
    FROM products p
    JOIN shopping_cart c ON p.id = c.product_id
    WHERE c.user_id = ? AND c.product_id = ?  -- Select cart items for the current user and product_id
";

// Prepare the statement
$stmt = $conn->prepare($sql);

// Bind the parameters (user_id is an integer, product_id is a string)
$stmt->bind_param("is", $user_id, $product_id);  // "i" for integer (user_id), "s" for string (product_id)

// Execute the query
$stmt->execute();

// Get the result of the query
$result = $stmt->get_result();

// Check if any rows are returned
if ($result->num_rows > 0) {
    // Fetch all rows
    $products = $result->fetch_all(MYSQLI_ASSOC);

    // Return the products as a JSON response
    echo json_encode(['success' => true, 'data' => $products]);
} else {
    // If no products are found for this user and product_id, return an empty array
    echo json_encode(['success' => true, 'data' => []]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
