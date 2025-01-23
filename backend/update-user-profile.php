<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

require_once 'utils.php'; 

$servername = "localhost";
$username = "root";
$password = "";
$database = "web";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "User not authenticated. Please log in."]);
    exit();
}

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetUserId = isset($_POST['target_user_id']) ? intval($_POST['target_user_id']) : $userId;
    $newUsername = isset($_POST['new_username']) ? trim($_POST['new_username']) : null;
    $removeProfilePicture = isset($_POST['remove_profile_picture']);
    $image = isset($_FILES['profile_image']) ? $_FILES['profile_image'] : null;

    $result = $conn->prepare("SELECT name, profile_photo, email FROM users WHERE id = ?");
    $result->bind_param("i", $targetUserId);
    $result->execute();
    $userData = $result->get_result();
    
    if ($userData && $userData->num_rows > 0) {
        $row = $userData->fetch_assoc();
        $currentUsername = $row['name'];
        $currentProfilePhoto = $row['profile_photo'];
        $targetUserEmail = $row['email']; 
    } else {
        echo json_encode(["success" => false, "message" => "Target user not found"]);
        exit();
    }

    $updates = [];
    $params = [];
    $types = "";
    $logDescription = "";

    if ($newUsername && $newUsername !== $currentUsername) {
        if (strlen($newUsername) < 5 || strlen($newUsername) > 25) {
            echo json_encode(["success" => false, "message" => "Username should be between 5 and 25 characters long"]);
            exit();
        }
        $updates[] = "name = ?";
        $params[] = $newUsername;
        $types .= "s";
        $logDescription .= "Changed username from '$currentUsername' to '$newUsername'. ";
    }

    if ($removeProfilePicture) {
        $updates[] = "profile_photo = ?";
        $params[] = "";
        $types .= "s";
        $logDescription .= "Removed profile picture. ";
    }

    if (empty($updates)) {
        echo json_encode(["success" => false, "message" => "No changes provided."]);
        exit();
    }

    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $targetUserId;
    $types .= "i";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            if ($userId != $targetUserId) {
                $action = "Updated user profile";
                $logSql = "INSERT INTO admin_logs (admin_id, user_id, action, description) VALUES (?, ?, ?, ?)";
                $logStmt = $conn->prepare($logSql);
                $logStmt->bind_param("iiss", $userId, $targetUserId, $action, $logDescription);
                $logStmt->execute();
            }

            
            $subject = "Your Profile Has Been Updated";
            $body = "Dear $currentUsername,\n\nYour profile has been updated by an administrator.\n\n" . $logDescription . "\n\nIf you have any questions, please contact support.\n\nBest regards,\nFootball Kits Albania";
            if (!sendEmail($targetUserEmail, $subject, $body)) {
                echo json_encode(["success" => false, "message" => "Profile updated, but email could not be sent."]);
                exit();
            }

            echo json_encode([
                "success" => true,
                "message" => "Profile updated successfully, and an email notification was sent."
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Error updating profile: " . $stmt->error]);
        }
        exit();
    } else {
        echo json_encode(["success" => false, "message" => "Error preparing statement: " . $conn->error]);
        exit();
    }
}
?>
