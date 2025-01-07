<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
header('Content-Type: application/json');

// Connect to the database
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Database connection failed."]);
    exit;
}

// Check if required parameters are set
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? null;
    $newRole = $_POST['role'] ?? null;

    if ($userId && $newRole) {
        // Update the user's role
        $stmt = $conn->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("si", $newRole, $userId);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "User role updated successfully."]);
        } else {
            echo json_encode(["success" => false, "error" => "Failed to update user role."]);
        }

        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "Invalid input."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method."]);
}

mysqli_close($conn);
?>
