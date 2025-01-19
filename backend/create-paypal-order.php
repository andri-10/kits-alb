<?php
session_start();
require_once 'db-config.php';
header('Content-Type: application/json');

// Verify CSRF token
if (!isset($_SERVER['HTTP_X_CSRF_TOKEN']) || $_SERVER['HTTP_X_CSRF_TOKEN'] !== $_SESSION['csrf_token']) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid CSRF token']);
    exit;
}

// Verify user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

try {
    // Get JSON input
    $jsonInput = file_get_contents('php://input');
    $costs = json_decode($jsonInput, true);
    
    if (!$costs) {
        throw new Exception('Invalid cost data');
    }

    // Verify costs match what's in the database
    $stmt = $pdo->prepare("
        SELECT SUM(p.price * c.quantity) as total,
               SUM(c.quantity) as items
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    
    $stmt->execute([$_SESSION['user_id']]);
    $dbCosts = $stmt->fetch(PDO::FETCH_ASSOC);

    // Validate costs match (within 1 cent to avoid floating point issues)
    if (abs($dbCosts['total'] - $costs['totalCents']) > 1) {
        throw new Exception('Cost verification failed');
    }

    // Create order record
    $orderId = uniqid('ORDER_');
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_id, 
            user_id, 
            total_amount, 
            status,
            created_at
        ) VALUES (?, ?, ?, 'PENDING', NOW())
    ");
    
    $stmt->execute([
        $orderId,
        $_SESSION['user_id'],
        $costs['totalCents'] / 100
    ]);

    echo json_encode([
        'success' => true,
        'id' => $orderId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Order creation failed',
        'message' => $e->getMessage()
    ]);
}
?>