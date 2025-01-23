<?php
require_once 'db-config.php';
include('utils.php');
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
    
    $stmt = $conn->prepare("SELECT o.status, o.id, o.total_price, u.email 
                           FROM orders o 
                           JOIN users u ON o.user_id = u.id 
                           WHERE o.id = :order_id AND o.user_id = :user_id");
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

    
    $stmt = $conn->prepare("UPDATE orders SET status = 'completed' WHERE id = :order_id");
    $stmt->execute([':order_id' => $orderId]);

    
    $emailSubject = "Order Delivery Confirmation";
    $emailBody = "##### Order Delivery Confirmation #####

Order Details:
Order ID: #{$orderId}
Total Amount: $" . number_format($order['total_price']/100, 2) . "

Dear Customer,

We confirm that your order #{$orderId} has been successfully delivered. 
We hope you enjoy your new football kit!

If you have any questions about your order, please don't hesitate to contact our customer support team.

Thank you for shopping with Football Kits Albania.

Best regards,
Football Kits Albania Team";

    
    $emailSent = sendEmail($order['email'], $emailSubject, $emailBody);

    $response = [
        'success' => true,
        'message' => 'Order status updated to completed',
        'email_sent' => $emailSent
    ];

    if (!$emailSent) {
        $response['email_error'] = 'Email notification could not be sent';
    }

    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>