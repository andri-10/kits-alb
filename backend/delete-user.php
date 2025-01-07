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

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id'])) {
    $user_id = (int) $data['user_id'];
    error_log("Received user_id: $user_id");

    
    $sql = "DELETE FROM users WHERE id = ?";

    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt) {

        mysqli_stmt_bind_param($stmt, "i", $user_id);

        $result = mysqli_stmt_execute($stmt);

        if ($result) {
            echo json_encode(["success" => true, "message" => "User deleted successfully."]);
        } else {
            error_log("Error executing query: " . mysqli_error($conn));  // Log the SQL error
            echo json_encode(["success" => false, "error" => "Error deleting user."]);
        }

        mysqli_stmt_close($stmt);
    } else {
        error_log("Failed to prepare the statement: " . mysqli_error($conn));  // Log if the statement preparation fails
        echo json_encode(["success" => false, "error" => "Failed to prepare the statement."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "User ID is missing."]);
}

mysqli_close($conn);

