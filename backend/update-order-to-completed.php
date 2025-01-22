<?php
require_once 'db-config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

if (!isset($_POST['order_id'])) {
    echo json_encode(['success' => false, 'error' => 'Order ID is missing']);
    exit;
}

$orderId = $_POST['order_id'];
$userId = $_SESSION['user_id'];

try {
    // Check if the order belongs to the logged-in user and is not already completed
    $stmt = $conn->prepare("SELECT status FROM orders WHERE id = :order_id AND user_id = :user_id");
    $stmt->execute([':order_id' => $orderId, ':user_id' => $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit;
    }

    if ($order['status'] === 'completed') {
        echo json_encode(['success' => false, 'error' => 'Order is already completed']);
        exit;
    }

    // Update order status to 'completed'
    $stmt = $conn->prepare("UPDATE orders SET status = 'completed' WHERE id = :order_id");
    $stmt->execute([':order_id' => $orderId]);

    echo json_encode(['success' => true, 'message' => 'Order status updated to completed']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
