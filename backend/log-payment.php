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
if (!isset($input['order_id']) || !isset($input['payment_gateway']) || !isset($input['amount'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Missing required payment details']);
    exit;
}

// Sanitize input
$orderId = intval($input['order_id']);
$paymentGateway = htmlspecialchars($input['payment_gateway'], ENT_QUOTES, 'UTF-8');
$amount = floatval($input['amount']);
$status = isset($input['status']) ? htmlspecialchars($input['status'], ENT_QUOTES, 'UTF-8') : 'pending';
$createdAt = isset($input['created_at']) ? $input['created_at'] : date('Y-m-d H:i:s');

// Database query to insert the payment log
try {
    $query = "INSERT INTO payment_logs (order_id, payment_gateway, amount, created_at) 
              VALUES (?, ?, ?, ?)";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('issd', $orderId, $paymentGateway, $amount, $createdAt);

    if ($stmt->execute()) {
        http_response_code(200); // Success
        echo json_encode(['status' => 'success', 'message' => 'Payment log saved successfully']);
    } else {
        throw new Exception("Error saving payment log: " . $stmt->error);
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
