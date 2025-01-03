<?php
include("backend/session-timeout.php");

$servername = "localhost";
$username = "root";
$password = "";
$database = "web";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (!isset($_SESSION['user_id'])) {
    die("User not authenticated. Please log in.");
}

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['profile_image'])) {
    $image = $_FILES['profile_image'];

    // Validate image type and size
    if ($image['error'] === 0) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (in_array($image['type'], $allowedTypes)) {
            $imageName = time() . '_' . basename($image['name']);
            $targetDir = "images/users-pfp/";
            $targetFile = $targetDir . $imageName;

            // Move the uploaded file
            if (move_uploaded_file($image['tmp_name'], $targetFile)) {
                // Update database with the new image path
                $sql = "UPDATE users SET profile_photo = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("si", $imageName, $userId);
                $stmt->execute();
                
                header("Location: account.php");
                exit();
            } else {
                echo "Error uploading file.";
            }
        } else {
            echo "Invalid file type. Only JPG, PNG, and GIF are allowed.";
        }
    } else {
        echo "Error uploading file.";
    }
}
?>
