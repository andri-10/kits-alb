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
    $adminId = $_POST['admin_id'] ?? null; // Assuming `admin_id` is passed (the one performing the role change)

    if ($userId && $newRole && $adminId) {
        // Fetch the current role of the user
        $result = $conn->prepare("SELECT role FROM users WHERE id = ?");
        $result->bind_param("i", $userId);
        $result->execute();
        $result->bind_result($currentRole);
        $result->fetch();
        $result->close();

        // Check if the current role is different from the new role
        if ($currentRole !== $newRole) {
            // Perform the role update
            $stmt = $conn->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
            $stmt->bind_param("si", $newRole, $userId);

            if ($stmt->execute()) {
                // Determine log description based on role change
                if ($newRole === 'admin' && $currentRole !== 'admin') {
                    $logDescription = "Promoted to admin.";
                } elseif ($newRole === 'user' && $currentRole === 'admin') {
                    $logDescription = "Demoted to user without admin privileges.";
                } else {
                    $logDescription = "Changed role.";
                }

                // Log the action in the admin_logs table
                $action = "Changed role";
                $logSql = "INSERT INTO admin_logs (admin_id, user_id, action, description) VALUES (?, ?, ?, ?)";
                $logStmt = $conn->prepare($logSql);
                $logStmt->bind_param("iiss", $adminId, $userId, $action, $logDescription);
                $logStmt->execute();

                // Respond with success message
                echo json_encode(["success" => true, "message" => "User role updated successfully."]);
            } else {
                echo json_encode(["success" => false, "error" => "Failed to update user role."]);
            }

            $stmt->close();
        } else {
            echo json_encode(["success" => false, "error" => "User role is already the same."]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Invalid input."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method."]);
}

mysqli_close($conn);
?>
