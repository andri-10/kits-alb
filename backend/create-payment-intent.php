<?php
session_start();
require __DIR__ . '/stripe-php/init.php';  // Make sure this path is correct
require __DIR__ . '/backend/config.php';    // Your configuration file with the Stripe keys

// Enable error reporting for debugging purposes
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set the response type to JSON
header('Content-Type: application/json');

try {
    // Initialize Stripe
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if the 'amount' is provided in the request and it's valid
    if (isset($input['amount']) && is_numeric($input['amount']) && $input['amount'] > 0) {
        $amount = intval($input['amount']);
    } else {
        // If amount is not provided or invalid, throw an error
        throw new Exception('Invalid amount');
    }

    // Create PaymentIntent in Stripe
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amount,  // Amount should be in cents (e.g., $10 = 1000 cents)
        'currency' => 'usd',   // Currency for the payment
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'user_id' => $_SESSION['user_id'] ?? 'guest', // Retrieve user_id from session or default to 'guest'
            'order_id' => uniqid('order_')  // Generate a unique order ID
        ]
    ]);

    // Return the client secret and success status in the JSON response
    echo json_encode([
        'clientSecret' => $paymentIntent->client_secret,
        'success' => true
    ]);

} catch (Exception $e) {
    // Log the error and send a JSON response with the error message
    error_log("Error: " . $e->getMessage());  // Log the error message for debugging
    
    // Send HTTP status 500 for internal server error
    http_response_code(500);

    // Send a JSON response with the error message
    echo json_encode([
        'error' => $e->getMessage(),  // Return the exception message in the response
        'success' => false            // Indicate failure
    ]);
}
