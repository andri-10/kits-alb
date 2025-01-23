<?php
require_once 'db-config.php';
include('utils.php');
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

    // Get order details including email and total
    $stmt = $conn->prepare("
        SELECT o.status, o.total_price, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = :order_id AND o.user_id = :user_id
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

   
    $subject = 'Order Cancellation - Football Kits Albania';
    $body = "
##### Order Cancellation Confirmation #####

Order Details:
Order ID: #{$orderId}
Total Amount: $" . number_format($order['total_price']/100, 2) . "

Dear Customer,

We confirm that your order #{$orderId} has been successfully cancelled. 
If you have already paid for this order, a refund will be processed according to our refund policy.

If you did not request this cancellation or have any questions, please contact our customer support team immediately.

Thank you for shopping with Football Kits Albania.

Best regards,
Football Kits Albania Team
";

 
    $emailSent = sendEmail($order['email'], $subject, $body);

    $conn->commit();
    echo json_encode([
        'success' => true,
        'email_sent' => $emailSent
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>