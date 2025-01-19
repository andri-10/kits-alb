<?php
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

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['user_id']) || !isset($input['total_price'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Missing required order details']);
    exit;
}

// Sanitize input
$userId = intval($input['user_id']);
$totalPrice = floatval($input['total_price']);
$status = isset($input['status']) ? htmlspecialchars($input['status'], ENT_QUOTES, 'UTF-8') : 'pending';
$deliveryDate = isset($input['delivery_date']) ? htmlspecialchars($input['delivery_date'], ENT_QUOTES, 'UTF-8') : null;

// Validate `status` against allowed values
$allowedStatuses = ['pending', 'completed', 'cancelled'];
if (!in_array($status, $allowedStatuses)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Invalid status value']);
    exit;
}

// Database query to insert the order
try {
    $query = "INSERT INTO orders (user_id, total_price, status, delivery_date)
              VALUES (?, ?, ?, ?)";

    $stmt = $db->prepare($query);
    $stmt->bind_param('idss', $userId, $totalPrice, $status, $deliveryDate);

    if ($stmt->execute()) {
        http_response_code(200); // Success
        echo json_encode(['status' => 'success', 'message' => 'Order added successfully', 'order_id' => $stmt->insert_id]);
    } else {
        throw new Exception("Error adding order: " . $stmt->error);
    }
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => $e->getMessage()]);
    exit;
} finally {
    // Close the statement and database connection
    if (isset($stmt)) {
        $stmt->close();
    }
    $db->close();
}
