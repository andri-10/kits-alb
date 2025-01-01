<?php
// Database connection (inline)
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

// Set JSON header
header('Content-Type: application/json');

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Database connection failed."]);
    exit;
}

// Query to fetch all users
$query = "SELECT id, name, email, role, created_at, updated_at, email_verified, profile_photo FROM users";

// Execute the query
$result = mysqli_query($conn, $query);

// Check if query was successful
if (!$result) {
    // Log error to server logs and return a generic message
    error_log("Query failed: " . mysqli_error($conn));
    echo json_encode(["success" => false, "error" => "Failed to fetch users."]);
    exit;
}

// Fetch all users
$users = mysqli_fetch_all($result, MYSQLI_ASSOC);

// Check if there are any users
if (empty($users)) {
    echo json_encode(["success" => false, "message" => "No users found."]);
} else {
    // Return users as a JSON response
    echo json_encode(["success" => true, "users" => $users]);
}

// Close connection
mysqli_close($conn);
?>
