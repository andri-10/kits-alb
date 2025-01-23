<?php
session_start();
header('Content-Type: application/json');


if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}



$paypalConfig = [
    'sandbox' => true, 
    'clientId' => getenv('PAYPAL_CLIENT_ID') ?: 'YOUR_SANDBOX_CLIENT_ID'
];

echo json_encode([
    'clientId' => $paypalConfig['clientId'],
    'environment' => $paypalConfig['sandbox'] ? 'sandbox' : 'production'
]);
?>