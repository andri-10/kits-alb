<?php
// create-payment-intent.php
// Enable error logging
error_reporting(E_ALL);


// Start output buffering to catch any unexpected output
ob_start();

header('Content-Type: application/json');

try {

    require __DIR__ . '/../stripe-php/init.php';
    require __DIR__ . '/./config.php';

    // Log the incoming request
    error_log("Received payment request: " . file_get_contents('php://input'));

    // Get the raw POST data
    $input = json_decode(file_get_contents('php://input'), true);

    // Log the decoded input
    error_log("Decoded input: " . print_r($input, true));

    if (!isset($input['amount'])) {
        throw new Exception('Amount is required');
    }

    $amount = $input['amount'];

    // Validate amount
    if (!is_numeric($amount) || $amount <= 0) {
        throw new Exception('Invalid amount');
    }

    // Convert amount to cents for Stripe
    $amountInCents = (int)($amount);  // Remove multiplication since amount is already in cents


    // Initialize Stripe
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

    \Stripe\ApiRequestor::setHttpClient(
        new \Stripe\HttpClient\CurlClient([CURLOPT_SSL_VERIFYPEER => false])
    );

    // Log the amount being sent to Stripe
    error_log("Creating PaymentIntent for amount: " . $amountInCents);

    // Create PaymentIntent
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'order_id' => uniqid('order_'),
            'customer_id' => $_SESSION['user_id'] ?? null
        ]
    ]);

    // Clear any output buffer before sending JSON response
    ob_clean();

    // Return the client secret
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret
    ]);

} catch (\Stripe\Exception\CardException $e) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Card error: ' . $e->getMessage()
    ]);
    error_log("Stripe Card Exception: " . $e->getMessage());
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
    error_log("Exception caught: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
}

// End output buffering
ob_end_flush();