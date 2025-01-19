<?php
require_once 'stripe-payment.php';

$stripeHandler = new StripePaymentHandler();
$result = $stripeHandler->handleWebhook();

if (isset($result['error'])) {
    http_response_code(400);
} else {
    http_response_code(200);
}
echo json_encode($result);