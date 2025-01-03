<?php
session_start();
require_once 'utils.php';

header('Content-Type: application/json'); // Ensure the response is in JSON format

$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = json_decode(file_get_contents('php://input'), true);

    if (isset($inputData['action']) && $inputData['action'] === 'resend') {
        // Logic to resend the token
        if (isset($_SESSION['reset_email'])) {
            $email = $_SESSION['reset_email'];
            $token = rand(100000, 999999); // Generate a new token
            $_SESSION['reset_token'] = $token; // Update the session with the new token
            $_SESSION['token_time'] = time(); // Reset the token time

            // Send the new token email
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

echo json_encode($response); // Send the response back to the front-end
?>
