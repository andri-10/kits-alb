<?php
// Start the session to access session variables
session_start();

// Inline database connection
$host = 'localhost'; // Replace with your database host
$username = 'root'; // Replace with your database username
$password = ''; // Replace with your database password
$database = 'web'; // Replace with your database name

// Create database connection
$db = new mysqli($host, $username, $password, $database);

// Check for connection errors
if ($db->connect_error) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database connection failed: ' . $db->connect_error]);
    exit;
}

// Check if user is logged in by checking session
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Forbidden, if user is not logged in
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id']; // Retrieve the user ID from session

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields (order_id is sent from JS)
if (!isset($input['order_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Missing required order details']);
    exit;
}

// Sanitize inputs
$orderId = intval($input['order_id']);

// Log for debugging purposes
error_log("User ID: " . $userId . " - Order ID: " . $orderId);

// Fetch the cart items for the user
$cartQuery = "SELECT product_id, price, size, delivery_option FROM shopping_cart WHERE user_id = ?";
$cartStmt = $db->prepare($cartQuery);
$cartStmt->bind_param('i', $userId);
$cartStmt->execute();
$cartResult = $cartStmt->get_result();

// Check if the user has items in the cart
if ($cartResult->num_rows === 0) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'No items found in the cart']);
    exit;
}

// Prepare the SQL query to insert into `order_items`
$query = "INSERT INTO order_items (order_id, product_id, size, delivery_option, price) VALUES (?, ?, ?, ?, ?)";
$stmt = $db->prepare($query);

// Loop through the cart items and insert them into `order_items`
while ($item = $cartResult->fetch_assoc()) {
    $productId = htmlspecialchars($item['product_id'], ENT_QUOTES, 'UTF-8');
    $price = floatval($item['price']);
    $size = htmlspecialchars($item['size'], ENT_QUOTES, 'UTF-8');
    $deliveryOption = intval($item['delivery_option']);

    // Log each cart item before insertion
    error_log("Inserting item: Product ID - $productId, Price - $price, Size - $size, Delivery Option - $deliveryOption");

    // Bind parameters and execute the query for each item
    $stmt->bind_param('isisd', $orderId, $productId, $size, $deliveryOption, $price);

    if (!$stmt->execute()) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Failed to add items to order: ' . $stmt->error]);
        exit;
    }
}

// Clean up the shopping cart (optional, depending on your requirements)
$deleteCartQuery = "DELETE FROM shopping_cart WHERE user_id = ?";
$deleteCartStmt = $db->prepare($deleteCartQuery);
$deleteCartStmt->bind_param('i', $userId);
$deleteCartStmt->execute();

// Log for cart cleanup
error_log("Shopping cart for user ID $userId has been cleaned.");

$stmt->close();
$cartStmt->close();
$deleteCartStmt->close();

// Close the database connection
$db->close();

// Log for successful completion
error_log("Successfully processed the order and cleaned the cart.");

// Send success response
http_response_code(200);
echo json_encode(['status' => 'success', 'message' => 'Items added to order successfully and cart cleaned']);
?>
