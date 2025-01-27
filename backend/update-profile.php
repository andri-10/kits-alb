<?php
session_start();

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
    $newUsername = isset($_POST['new_username']) ? trim($_POST['new_username']) : null;
    $removeProfilePicture = isset($_POST['remove_profile_picture']);
    $image = isset($_FILES['profile_image']) ? $_FILES['profile_image'] : null;
    $profilePicturePath = null;
    $result = $conn->query("SELECT name FROM users WHERE id = $userId");
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $currentUsername = $row['name'];
    } else {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }
    if ($newUsername && (strlen($newUsername) < 5 || strlen($newUsername) > 25)) {
        echo json_encode(["success" => false, "message" => "Username should be between 5 and 25 characters long"]);
        exit();
    }
    if ($image && $image['error'] === UPLOAD_ERR_OK) {
        $imageTmpName = $image['tmp_name'];
        $imageName = $image['name'];
        $imageExtension = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        if (!in_array($imageExtension, $allowedExtensions)) {
            echo json_encode(["success" => false, "message" => "Error: Invalid image type. Only JPG, JPEG, PNG, and GIF are allowed."]);
            exit();
        }

        $targetDir = "C:/xampp/htdocs/kits-alb/images/users-pfp";
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $uniqueImageName = time() . "_" . $imageName;
        $relativeImagePath = "./images/users-pfp/" . $uniqueImageName;
        if (!move_uploaded_file($imageTmpName, $targetDir . "/" . $uniqueImageName)) {
            echo json_encode(["success" => false, "message" => "Error: Failed to upload the image."]);
            exit();
        }
        $profilePicturePath = $relativeImagePath;
    }
    if ($removeProfilePicture) {
        $profilePicturePath = "";

    }
    $updates = [];
    $params = [];
    $types = "";
    if ($newUsername && $newUsername !== $currentUsername) {
        $updates[] = "name = ?";
        $params[] = $newUsername;
        $types .= "s";
    }
    if ($profilePicturePath !== null) {
        $updates[] = "profile_photo = ?";
        $params[] = $profilePicturePath;
        $types .= "s";
        $_SESSION['profile_photo']=$profilePicturePath;
    }
    if (empty($updates)) {
        echo json_encode(["success" => false, "message" => "No changes provided."]);
        exit();
    }
    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $userId;
    $types .= "i";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
            exit();
        } else {
            echo json_encode(["success" => false, "message" => "Error updating profile: " . $stmt->error]);
            exit();
        }
    } else {
        echo json_encode(["success" => false, "message" => "Error preparing statement: " . $conn->error]);
        exit();
    }
}
?>
