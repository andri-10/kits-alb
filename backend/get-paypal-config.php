<?php
session_start();
header('Content-Type: application/json');

// Verify user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

// Load configuration from environment or config file
// IMPORTANT: Never expose your PayPal secret key
$paypalConfig = [
    'sandbox' => true, // Set to false for production
    'clientId' => getenv('PAYPAL_CLIENT_ID') ?: 'YOUR_SANDBOX_CLIENT_ID'
];

echo json_encode([
    'clientId' => $paypalConfig['clientId'],
    'environment' => $paypalConfig['sandbox'] ? 'sandbox' : 'production'
]);
?>