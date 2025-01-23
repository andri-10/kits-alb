<?php
require_once 'db-config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    
    $stmt = $conn->prepare("
        SELECT 
            o.id,
            o.total_price,
            o.status,
            o.created_at,
            o.delivery_date
        FROM orders o
        WHERE o.user_id = :user_id 
        AND o.status IN ('pending', 'completed')
        AND (
            o.delivery_date IS NULL 
            OR o.delivery_date > DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
        )
        ORDER BY o.id DESC
    ");
    
    $stmt->execute([':user_id' => $userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($orders as &$order) {
        
        $stmt = $conn->prepare("
            SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.price,
                oi.size,
                oi.delivery_date,
                oi.image,
                p.name as product_name,
                o.created_at as order_created_at, -- Include created_at from orders table
                o.status as order_status,     -- Include order status from orders table
                o.delivery_date as order_delivery_date
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN orders o ON oi.order_id = o.id -- Join orders to get created_at and status
            WHERE oi.order_id = :order_id
        ");
        
        $stmt->execute([':order_id' => $order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'orders' => $orders]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
