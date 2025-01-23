<?php
error_reporting(E_ALL);
ob_start();

header('Content-Type: application/json');

try {
    require __DIR__ . '/../stripe-php/init.php';
    require __DIR__ . '/./config.php';

    
    error_log("Received payment request: " . file_get_contents('php://input'));

    
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Decoded input: " . print_r($input, true));

    if (!isset($input['amount'])) {
        throw new Exception('Amount is required');
    }

    $amount = $input['amount'];

    
    if (!is_numeric($amount) || $amount <= 0) {
        throw new Exception('Invalid amount');
    }

    
    $amountInCents = (int)$amount;

    
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

    \Stripe\ApiRequestor::setHttpClient(
        new \Stripe\HttpClient\CurlClient([CURLOPT_SSL_VERIFYPEER => false])
    );

    error_log("Creating PaymentIntent for amount: " . $amountInCents);

    
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'payment_method_types' => ['card'], 
        'metadata' => [
            'order_id' => uniqid('order_'),
            'customer_id' => $_SESSION['user_id'] ?? null
        ]
    ]);

    
    error_log("PaymentIntent created: " . print_r($paymentIntent, true));

    
    ob_clean();

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

ob_end_flush();