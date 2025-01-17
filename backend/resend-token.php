<?php
session_start();
require_once 'utils.php';

header('Content-Type: application/json');
$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = json_decode(file_get_contents('php://input'), true);

    if (isset($inputData['action']) && $inputData['action'] === 'resend') {
        if (isset($_SESSION['reset_email'])) {
            $email = $_SESSION['reset_email'];
            $token = rand(100000, 999999);            
            $_SESSION['reset_token'] = $token;            
            $_SESSION['token_time'] = time();            
            if (sendTokenEmail($email, $token)) {
                $response['success'] = true;
            } else {
                $response['message'] = 'Failed to send email.';
            }
        } else {
            $response['message'] = 'No session email found.';
        }
    }
}

echo json_encode($response);?>
