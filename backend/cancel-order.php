<?php
require_once 'db-config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$orderId = isset($_POST['order_id']) ? intval($_POST['order_id']) : null;

if (!$orderId) {
    echo json_encode(['success' => false, 'error' => 'Order ID is required']);
    exit;
}

try {
    // Check if order is cancellable
    $stmt = $conn->prepare("
        SELECT id 
        FROM orders 
        WHERE id = :order_id 
        AND user_id = :user_id 
        AND status = 'pending'
        AND DATE(created_at) = CURDATE()
    ");
    
    $stmt->execute([
        ':order_id' => $orderId,
        ':user_id' => $userId
    ]);
    
    if ($stmt->rowCount() === 0) {
        echo json_encode([
            'success' => false, 
            'error' => 'Order cannot be cancelled. Orders can only be cancelled on the day they were created.'
        ]);
        exit;
    }
    
    // Begin transaction
    $conn->beginTransaction();
    
    // Delete order items
    $stmt = $conn->prepare("DELETE FROM order_items WHERE order_id = :order_id");
    $stmt->execute([':order_id' => $orderId]);
    
    // Delete order
    $stmt = $conn->prepare("DELETE FROM orders WHERE id = :order_id");
    $stmt->execute([':order_id' => $orderId]);
    
    $conn->commit();
    
    echo json_encode(['success' => true, 'message' => 'Order cancelled successfully']);
    
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'error' => 'Failed to cancel order: ' . $e->getMessage()]);
}
?>