<?php
session_start();
$servername = "localhost";
$username = "root";
$password = "";
$database = "web";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed."]));
}
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "User not authenticated."]);
    exit();
}

$userId = $_SESSION['user_id'];
$sql = "SELECT name FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(["success" => true, "username" => $row['name']]);
} else {
    echo json_encode(["success" => false, "message" => "User not found."]);
}

$stmt->close();
$conn->close();
?>
