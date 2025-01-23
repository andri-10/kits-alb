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
$orderItemId = $_POST['order_item_id'] ?? null;
$newSize = $_POST['size'] ?? null;

if (!$orderId || !$orderItemId || !$newSize) {
    echo json_encode(['success' => false, 'error' => 'Missing required parameters']);
    exit;
}

try {
    $conn->beginTransaction();

    
    $stmt = $conn->prepare("
        SELECT o.created_at, o.delivery_date, o.status
        FROM orders o
        WHERE o.id = :order_id
    ");
    $stmt->execute([':order_id' => $orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception('Order not found');
    }

    if ($order['status'] === 'cancelled') {
        throw new Exception('Cannot update cancelled order');
    }

    
    $createdAt = new DateTime($order['created_at']);
    $createdAt->setTime(0, 0, 0);
    $deliveryDate = new DateTime($order['delivery_date']);
    $today = new DateTime();
    
    $totalDays = $createdAt->diff($deliveryDate)->days;
    $progressDays = $createdAt->diff($today)->days;
    
    if ($progressDays > ($totalDays / 2)) {
        throw new Exception('Cannot update size after halfway to delivery');
    }

    
    $stmt = $conn->prepare("
        UPDATE order_items 
        SET size = :size 
        WHERE id = :order_item_id AND order_id = :order_id
    ");
    
    $stmt->execute([
        ':size' => $newSize,
        ':order_item_id' => $orderItemId,
        ':order_id' => $orderId
    ]);

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>