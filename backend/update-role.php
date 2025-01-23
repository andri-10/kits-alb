<?php
require 'utils.php';

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
header('Content-Type: application/json');


$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Database connection failed."]);
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? null;
    $newRole = $_POST['role'] ?? null;
    $adminId = $_POST['admin_id'] ?? null; 

    if ($userId && $newRole && $adminId) {
        
        $result = $conn->prepare("SELECT role, email FROM users WHERE id = ?");
        $result->bind_param("i", $userId);
        $result->execute();
        $result->bind_result($currentRole, $email);
        $result->fetch();
        $result->close();

        if ($currentRole !== $newRole) {
            
            $stmt = $conn->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?");
            $stmt->bind_param("si", $newRole, $userId);

            if ($stmt->execute()) {
                
                $logDescription = ($newRole === 'admin' && $currentRole !== 'admin') ?
                    "Promoted to admin." :
                    (($newRole === 'user' && $currentRole === 'admin') ?
                        "Demoted to user without admin privileges." :
                        "Changed role.");

                
                $action = "Changed role";
                $logSql = "INSERT INTO admin_logs (admin_id, user_id, action, description) VALUES (?, ?, ?, ?)";
                $logStmt = $conn->prepare($logSql);
                $logStmt->bind_param("iiss", $adminId, $userId, $action, $logDescription);
                $logStmt->execute();

                
                $subject = "Important - Football Kits Albania";
                $body = "Dear User,\n\nYou have been " .
                    ($newRole === 'admin' ? "promoted to an administrator role." : "demoted to a standard user role.") .
                    "\n\nSincerely,\nThe Football Kits Albania Team";

                $emailSent = sendEmail($email, $subject, $body);

                
                echo json_encode([
                    "success" => true,
                    "message" => "User role updated successfully.",
                    "emailSent" => $emailSent
                ]);
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
