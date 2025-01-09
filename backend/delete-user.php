<?php



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

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['user_id']) && isset($data['admin_id'])) {
    $user_id = (int) $data['user_id'];
    $admin_id = (int) $data['admin_id']; // Capture the admin's ID
    error_log("Received user_id: $user_id, admin_id: $admin_id");

    // Delete the user from the 'users' table
    $sql = "DELETE FROM users WHERE id = ?";
    $stmt = mysqli_prepare($conn, $sql);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        
        // Execute the delete query
        $result = mysqli_stmt_execute($stmt);
        
        if ($result) {
            // Log the admin action, even if the user is deleted
            $action = "Deleted user";
            $logSql = "INSERT INTO admin_logs (admin_id, user_id, action, description) VALUES (?, ?, ?, ?)";
            $logStmt = mysqli_prepare($conn, $logSql);
            $description = "User ID $user_id was deleted by admin ID $admin_id";
            mysqli_stmt_bind_param($logStmt, "iiss", $admin_id, $user_id, $action, $description);
            mysqli_stmt_execute($logStmt);
            
            // Send success response back to JavaScript
            echo json_encode(["success" => true, "message" => "User deleted successfully."]);
        } else {
            // Log and return error if deletion failed
            error_log("Error deleting user: " . mysqli_error($conn));
            echo json_encode(["success" => false, "error" => "Error deleting user."]);
        }

        mysqli_stmt_close($stmt);
    } else {
        // Log and return error if the query preparation fails
        error_log("Failed to prepare delete query: " . mysqli_error($conn));
        echo json_encode(["success" => false, "error" => "Failed to prepare delete query."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "User ID or Admin ID is missing."]);
}

mysqli_close($conn);
?>
