<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();


$servername = "localhost";
$username = "root";$password = "";$dbname = "web";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;}
$user_id = $_SESSION['user_id'];

$conn->begin_transaction();

try {
    $query_count = "SELECT COUNT(*) AS total_items FROM shopping_cart WHERE user_id = ?";
    $stmt_count = $conn->prepare($query_count);
    $stmt_count->bind_param("i", $user_id);
    $stmt_count->execute();
    $result = $stmt_count->get_result();
    $row = $result->fetch_assoc();
    $response['cart_count'] = (int)$row['total_items'];    
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
    $response['cart_count'] = 0;
}
$conn->close();
error_log("Response data: " . print_r($response, true));
echo json_encode($response);
?>
