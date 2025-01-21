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
        ORDER BY o.created_at DESC
    ");
    
    $stmt->execute([':user_id' => $userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    
    foreach ($orders as &$order) {
        $stmt = $conn->prepare("
            SELECT 
                oi.id,
                oi.product_id,
                oi.price,
                oi.size,
                oi.delivery_date,
                oi.image,
                p.name as product_name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = :order_id
        ");
        
        $stmt->execute([':order_id' => $order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate order progress
        $created = new DateTime($order['created_at']);
        $delivery = new DateTime($order['delivery_date']);
        $today = new DateTime();
        
        if ($today->format('Y-m-d') === $created->format('Y-m-d')) {
            $order['progress'] = [
                'status' => 'Pending',
                'progress' => 10,
                'message' => 'Payment confirmation'
            ];
        } elseif ($today >= $delivery) {
            $order['progress'] = [
                'status' => 'Delivered',
                'progress' => 100,
                'message' => 'Package delivered'
            ];
        } else {
            $totalDays = $created->diff($delivery)->days;
            $progressDays = $created->diff($today)->days;
            $progressPercentage = min(90, 10 + (($progressDays / $totalDays) * 80));
            
            $order['progress'] = [
                'status' => 'Shipped',
                'progress' => $progressPercentage,
                'message' => 'On the way'
            ];
        }
    }
    
    echo json_encode(['success' => true, 'orders' => $orders]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>