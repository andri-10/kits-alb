<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Expires: 0');
header('Pragma: no-cache');
$response = [
    'isLoggedIn' => isset($_SESSION['user_id']),
    'message' => isset($_SESSION['user_id']) ? 'User is logged in' : 'User is not logged in'
];
echo json_encode($response);
exit;
?>
