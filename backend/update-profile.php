<?php
session_start();

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $newUsername = isset($_POST['new_username']) ? trim($_POST['new_username']) : null;
    $removeProfilePicture = isset($_POST['remove_profile_picture']);
    $image = isset($_FILES['profile_image']) ? $_FILES['profile_image'] : null;
    $profilePicturePath = null;

    if ($image && $image['error'] === 0) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (in_array($image['type'], $allowedTypes)) {
            $imageName = time() . '_' . basename($image['name']);
            $targetDir = "images/users-pfp/";
            $targetFile = $targetDir . $imageName;

            if (move_uploaded_file($image['tmp_name'], $targetFile)) {
                $profilePicturePath = $imageName;
            } else {
                die("Error: Failed to upload image.");
            }
        } else {
            die("Error: Invalid image type. Only JPG, PNG, and GIF are allowed.");
        }
    }

    if ($removeProfilePicture) {
        $profilePicturePath = "default-profile.png";
    }

    $sql = "UPDATE users SET ";
    $updates = [];
    $params = [];
    $types = "";

    if ($newUsername) {
        $updates[] = "name = ?";
        $params[] = $newUsername;
        $types .= "s";
    }

    if ($profilePicturePath !== null) {
        $updates[] = "profile_photo = ?";
        $params[] = $profilePicturePath;
        $types .= "s";
    }

    if (!empty($updates)) {
        $sql .= implode(", ", $updates) . " WHERE id = ?";
        $params[] = $userId;
        $types .= "i";

        $stmt = $conn->prepare($sql);

        if ($stmt) {
            $stmt->bind_param($types, ...$params);
            if ($stmt->execute()) {
                header("Location: account.php?status=success");
                exit();
            } else {
                die("Error updating profile: " . $stmt->error);
            }
        } else {
            die("Error preparing statement: " . $conn->error);
        }
    } else {
        die("No changes provided.");
    }
}
?>
