<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check for connection error
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Remove the "remember me" token from the database, if the user is logged in
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    
    // Update the database to remove the remember_me_token
    $stmt = $conn->prepare("UPDATE Users SET remember_me_token = NULL WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->close();
}

// Clear all session data
session_unset();
session_destroy();

// Remove the "remember_me_token" cookie if it's set
if (isset($_COOKIE['remember_me_token'])) {
    setcookie('remember_me_token', '', time() - 3600, '/'); // Expire the cookie
}

// Close the database connection
$conn->close();

// Redirect the user to the login page
header("Location: login.php");
exit;
?>
