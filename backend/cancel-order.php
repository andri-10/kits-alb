<?php
require_once 'db-config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$orderId = $_POST['order_id'] ?? null;

if (!$orderId) {
    echo json_encode(['success' => false, 'error' => 'Order ID is required']);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT status
        FROM orders 
        WHERE id = :order_id AND user_id = :user_id
    ");
    
    $stmt->execute([
        ':order_id' => $orderId,
        ':user_id' => $_SESSION['user_id']
    ]);
    
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        throw new Exception('Order not found');
    }

    if ($order['status'] === 'cancelled') {
        throw new Exception('Order is already cancelled');
    }

    $stmt = $conn->prepare("
        UPDATE orders 
        SET status = 'cancelled' 
        WHERE id = :order_id
    ");
    $stmt->execute([':order_id' => $orderId]);

    $stmt = $conn->prepare("
        DELETE FROM payment_logs 
        WHERE order_id = :order_id
    ");
    $stmt->execute([':order_id' => $orderId]);

    $stmt = $conn->prepare("
        DELETE FROM order_items 
        WHERE order_id = :order_id
    ");
    $stmt->execute([':order_id' => $orderId]);

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
