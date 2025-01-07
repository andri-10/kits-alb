<?php
session_start();
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("UPDATE Users SET remember_me_token = NULL WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->close();
}
session_unset();
session_destroy();
if (isset($_COOKIE['remember_me_token'])) {
    setcookie('remember_me_token', '', time() - 3600, '/');
}
$conn->close();
header("Location: login.php");
exit;
?>
