<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
header('Content-Type: application/json');
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Database connection failed."]);
    exit;
}
$query = "SELECT id, name, email, role, created_at, updated_at, email_verified, profile_photo FROM users";
$result = mysqli_query($conn, $query);
if (!$result) {
    error_log("Query failed: " . mysqli_error($conn));
    echo json_encode(["success" => false, "error" => "Failed to fetch users."]);
    exit;
}
$users = mysqli_fetch_all($result, MYSQLI_ASSOC);
if (empty($users)) {
    echo json_encode(["success" => false, "message" => "No users found."]);
} else {
    echo json_encode(["success" => true, "users" => $users]);
}
mysqli_close($conn);
?>
