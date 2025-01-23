<?php
session_start();
require_once 'init.php';
require __DIR__ . '/stripe-php/init.php';
require __DIR__ . '/backend/config.php';

class StripePaymentHandler {
    private $stripe;

    public function __construct() {
        \Stripe\Stripe::setApiKey('sk_test_51QingtJvqD1LcS3xATWdxx8CoH2x5MG2AcCIdPfkC0VkqfvBWzo4Sf2x6FxXNuXQPoGK3mAOf0ng3lqnx1eWppsR00s2Li0JwF');
    }

    public function createPaymentIntent($amount) {
        try {
            if (!is_numeric($amount) || $amount <= 0) {
                throw new Exception('Invalid amount');
            }

            
            $amountInCents = (int)($amount * 100);

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

            return [
                'success' => true,
                'clientSecret' => $paymentIntent->client_secret
            ];

        } catch (\Stripe\Exception\CardException $e) {
            return [
                'success' => false,
                'error' => 'Card error: ' . $e->getMessage()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Payment error: ' . $e->getMessage()
            ];
        }
    }
}
