<?php
// backend/log-payment.php

header('Content-Type: application/json');

try {
    require_once 'db-connection.php';

    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);

    if (!$data) {
        throw new Exception('Invalid payment data');
    }

    $sql = "INSERT INTO payment_logs (
        order_id,
        payment_gateway,
        amount,
        created_at
    ) VALUES (
        :order_id,
        :payment_gateway,
        :amount,
        :created_at
    )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        'order_id' => $data['order_id'] ?? null,
        'payment_gateway' => $data['payment_gateway'],
        'amount' => $data['amount'] ?? null,
        'created_at' => $data['created_at']
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
