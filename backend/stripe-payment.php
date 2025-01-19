<?php
session_start();
require_once 'init.php';
require __DIR__ . '/stripe-php/init.php';
require __DIR__ . '/backend/config.php';

class StripePaymentHandler {
    private $stripe;

    public function __construct() {
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    }

    public function createPaymentIntent($amount) {
        try {
            if (!is_numeric($amount) || $amount <= 0) {
                throw new Exception('Invalid amount');
            }

            // Convert amount to cents for Stripe
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

    public function handleWebhook() {
        $payload = @file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        $endpointSecret = 'whsec_P6Ar6IjXqVUGZ5x9zhAfbJ4bBodb2cSh';

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, $endpointSecret
            );

            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event->data->object;
                    $this->handleSuccessfulPayment($paymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    $paymentIntent = $event->data->object;
                    $this->handleFailedPayment($paymentIntent);
                    break;
            }

            return ['success' => true];

        } catch (\UnexpectedValueException $e) {
            return ['error' => 'Invalid payload'];
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return ['error' => 'Invalid signature'];
        }
    }

    private function handleSuccessfulPayment($paymentIntent) {
        // Log successful payment
        $this->logPayment([
            'order_id' => $paymentIntent->metadata->order_id,
            'payment_gateway' => 'stripe',
            'amount' => $paymentIntent->amount / 100,
            'status' => 'success',
            'transaction_id' => $paymentIntent->id,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        
    }

    private function handleFailedPayment($paymentIntent) {
        $this->logPayment([
            'order_id' => $paymentIntent->metadata->order_id,
            'payment_gateway' => 'stripe',
            'amount' => $paymentIntent->amount / 100,
            'status' => 'failed',
            'transaction_id' => $paymentIntent->id,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }

    private function logPayment($paymentData) {
        try {
            $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

            if ($db->connect_error) {
                throw new Exception("Connection failed: " . $db->connect_error);
            }

            $query = "INSERT INTO payment_logs
                     (order_id, payment_gateway, amount, status, transaction_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)";

            $stmt = $db->prepare($query);
            $stmt->bind_param(
                'ssdsss',
                $paymentData['order_id'],
                $paymentData['payment_gateway'],
                $paymentData['amount'],
                $paymentData['status'],
                $paymentData['transaction_id'],
                $paymentData['created_at']
            );

            $stmt->execute();
            $stmt->close();
            $db->close();

        } catch (Exception $e) {
            error_log("Payment logging error: " . $e->getMessage());
        }
    }
}