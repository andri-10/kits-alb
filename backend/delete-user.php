<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
header('Content-Type: application/json');

require_once 'utils.php'; // Include utils.php to access the sendEmail function

$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    echo json_encode(["success" => false, "error" => "Database connection failed."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['admin_id'])) {
    $user_id = (int) $data['user_id'];
    $admin_id = (int) $data['admin_id']; // Capture the admin's ID
    error_log("Received user_id: $user_id, admin_id: $admin_id");

    // Get the user's email before deletion
    $sql = "SELECT email, name FROM users WHERE id = ?";
    $stmt = mysqli_prepare($conn, $sql);

    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        if ($result && mysqli_num_rows($result) > 0) {
            $user = mysqli_fetch_assoc($result);
            $user_email = $user['email'];
            $user_name = $user['name'];

            // Delete the user from the 'users' table
            $deleteSql = "DELETE FROM users WHERE id = ?";
            $deleteStmt = mysqli_prepare($conn, $deleteSql);
            
            if ($deleteStmt) {
                mysqli_stmt_bind_param($deleteStmt, "i", $user_id);
                
                // Execute the delete query
                $deleteResult = mysqli_stmt_execute($deleteStmt);
                
                if ($deleteResult) {
                    // Log the admin action, even if the user is deleted
                    $action = "Deleted user";
                    $logSql = "INSERT INTO admin_logs (admin_id, user_id, action, description) VALUES (?, ?, ?, ?)";
                    $logStmt = mysqli_prepare($conn, $logSql);
                    $description = "User ID $user_id was deleted by admin ID $admin_id";
                    mysqli_stmt_bind_param($logStmt, "iiss", $admin_id, $user_id, $action, $description);
                    mysqli_stmt_execute($logStmt);
                    
                    // Send the email notification to the user
                    $subject = "Account Deletion Notice";
                    $body = "Dear $user_name,\n\nWe regret to inform you that your account has been removed by an administrator. The reason for this action was not specified.\n\nIf you have any questions or concerns, please reach out to our support team at support@kitsalb.com.\n\nBest regards,\nThe Kits Alb Team";
                    if (!sendEmail($user_email, $subject, $body)) {
                        echo json_encode(["success" => false, "message" => "User deleted, but email notification could not be sent."]);
                        exit();
                    }

                    // Send success response back to JavaScript
                    echo json_encode(["success" => true, "message" => "User deleted successfully, and an email notification was sent."]);
                } else {
                    // Log and return error if deletion failed
                    error_log("Error deleting user: " . mysqli_error($conn));
                    echo json_encode(["success" => false, "error" => "Error deleting user."]);
                }

                mysqli_stmt_close($deleteStmt);
            } else {
                // Log and return error if the delete query preparation fails
                error_log("Failed to prepare delete query: " . mysqli_error($conn));
                echo json_encode(["success" => false, "error" => "Failed to prepare delete query."]);
            }
        } else {
            echo json_encode(["success" => false, "error" => "User not found."]);
        }

        mysqli_stmt_close($stmt);
    } else {
        // Log and return error if the query preparation fails
        error_log("Failed to prepare user fetch query: " . mysqli_error($conn));
        echo json_encode(["success" => false, "error" => "Failed to prepare user fetch query."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "User ID or Admin ID is missing."]);
}

mysqli_close($conn);
?>
