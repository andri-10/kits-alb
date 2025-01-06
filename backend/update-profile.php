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

    // Fetch the current username from the database to compare with the new username
    $result = $conn->query("SELECT name FROM users WHERE id = $userId");
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $currentUsername = $row['name'];
    } else {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }

     // Validation: Check if username is empty
    

    // Validation: Check if username length is between 5 and 25 characters
    if ((strlen($newUsername) < 5 || strlen($newUsername) > 25) && strlen($newUsername) != 0 ) {
        echo json_encode(["success" => false, "message" => "Username should be between 5 and 25 characters long"]);
        exit();
    } 
    
    if (strlen($newUsername) == 0) {
        echo json_encode(["success" => false, "message" => "Username cannot be empty"]);
        exit();
    }

    // IMAGE UPLOAD LOGIC
    if ($image && $image['error'] === UPLOAD_ERR_OK) {
        $imageTmpName = $image['tmp_name'];
        $imageName = $image['name'];
        $imageExtension = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        // Validate the image extension
        if (!in_array($imageExtension, $allowedExtensions)) {
            echo json_encode(["success" => false, "message" => "Error: Invalid image type. Only JPG, JPEG, PNG, and GIF are allowed."]);
            exit();
        }

        // Define the target directory
        $targetDir = "C:/xampp/htdocs/kits-alb/images/users-pfp";

        // Ensure the target directory exists
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        // Set the new image path
        $uniqueImageName = time() . "_" . $imageName; // Add a timestamp to avoid duplicates
        $relativeImagePath = "./images/users-pfp/" . $uniqueImageName;

        // Move the uploaded image
        if (!move_uploaded_file($imageTmpName, $targetDir . "/" . $uniqueImageName)) {
            echo json_encode(["success" => false, "message" => "Error: Failed to upload the image."]);
            exit();
        }

        // Set the path for the database
        $profilePicturePath = $relativeImagePath;
    }

    if ($removeProfilePicture) {
        $profilePicturePath = "";
    }

    // Check if any changes were made
    $updates = [];
    $params = [];
    $types = "";

    // If the username has changed, add it to the updates
    if ($newUsername && $newUsername !== $currentUsername) {
        $updates[] = "name = ?";
        $params[] = $newUsername;
        $types .= "s";
    }

    // If the profile picture has changed, add it to the updates
    if ($profilePicturePath !== null) {
        $updates[] = "profile_photo = ?";
        $params[] = $profilePicturePath;
        $types .= "s";
    }

    // If there are no updates, show "No changes made"
    if (empty($updates) && strlen($newUsername) != 0) {
        echo json_encode(["success" => false, "message" => "No changes provided."]);
        exit();
    }

    // BUILD THE SQL QUERY
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
