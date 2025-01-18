<?php

header('Content-Type: application/json');

try {
    $host = 'localhost';
$user = 'root';
$password = '';
$database = 'web';
$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    if (!$data) {
        throw new Exception('Invalid payment data');
    }

    $sql = "INSERT INTO payment_logs (
        payment_method,
        status,
        paypal_order_id,
        amount,
        timestamp
    ) VALUES (
        :payment_method,
        :status,
        :paypal_order_id,
        :amount,
        :timestamp
    )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        'payment_method' => $data['payment_method'],
        'status' => $data['status'],
        'paypal_order_id' => $data['paypal_order_id'] ?? null,
        'amount' => $data['amount'],
        'timestamp' => $data['timestamp']
    ]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
?>