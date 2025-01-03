<?php
// Database connection parameters
$host = 'localhost'; // Database host (e.g., localhost)
$dbname = 'web'; // Your database name
$username = 'root'; // Your database username
$password = ''; // Your database password

// Create the database connection using PDO
try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    // Set the PDO error mode to exception to handle errors properly
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Set the content-type header for JSON response
header('Content-Type: application/json');

// Get the raw POST data (since we're sending JSON)
$input = json_decode(file_get_contents("php://input"), true);

// Validate the input
if (isset($input['user_id'], $input['product_id'], $input['delivery_option'])) {
    $user_id = $input['user_id'];
    $product_id = $input['product_id'];
    $delivery_option = $input['delivery_option'];  // Values should be 0, 1, 2, or 3

    try {
        // Prepare the SQL query to update the delivery option for matching cart items
        $stmt = $db->prepare("UPDATE shopping_cart SET delivery_option = :delivery_option WHERE product_id = :product_id AND user_id = :user_id");
        $stmt->bindParam(':delivery_option', $delivery_option);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        // Send a success response
        echo json_encode(['success' => true, 'message' => 'Delivery option updated successfully']);
    } catch (PDOException $e) {
        // Handle any errors that occur during the database update
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    // Handle missing parameters
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
}
?>
