<?php
// Database connection (inline)
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web"; // Replace with your actual database name

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Query to fetch all users
$query = "SELECT id, name, email, role, created_at, updated_at, email_verified, profile_photo FROM users";

// Execute the query
$result = mysqli_query($conn, $query);

// Check if query was successful
if (!$result) {
    echo json_encode(["error" => "Query failed: " . mysqli_error($conn)]);
    exit;
}

// Fetch all users
$users = mysqli_fetch_all($result, MYSQLI_ASSOC);

// Check if there are any users
if (empty($users)) {
    echo json_encode(["message" => "No users found."]);
} else {
    // Return users as a JSON response
    echo json_encode(["success" => true, "users" => $users]);
}

// Close connection
mysqli_close($conn);
?>
