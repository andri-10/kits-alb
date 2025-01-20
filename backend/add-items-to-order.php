<?php
session_start();

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'web';

ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_log("Starting add-items-to-order process");

try {
    $db = new mysqli($host, $username, $password, $database);
    
    if ($db->connect_error) {
        throw new Exception("Database connection failed: " . $db->connect_error);
    }

    if (!isset($_SESSION['user_id'])) {
        throw new Exception("User not logged in");
    }

    $userId = $_SESSION['user_id'];
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['order_id'])) {
        throw new Exception("Missing order_id");
    }
    
    $orderId = intval($input['order_id']);
    
    $db->begin_transaction();
    
    // Join shopping_cart with products to get the price
    $cartQuery = "SELECT sc.product_id, sc.size, sc.delivery_option, p.priceCents 
                  FROM shopping_cart sc 
                  JOIN products p ON sc.product_id = p.id 
                  WHERE sc.user_id = ?";
    $cartStmt = $db->prepare($cartQuery);
    
    if (!$cartStmt) {
        throw new Exception("Failed to prepare cart query: " . $db->error);
    }
    
    $cartStmt->bind_param('i', $userId);
    
    if (!$cartStmt->execute()) {
        throw new Exception("Failed to execute cart query: " . $cartStmt->error);
    }
    
    $cartResult = $cartStmt->get_result();
    
    if ($cartResult->num_rows === 0) {
        throw new Exception("No items found in cart for user: " . $userId);
    }
    
    // Log the first cart item to see its structure
    $firstItem = $cartResult->fetch_assoc();
    error_log("First cart item structure: " . json_encode($firstItem));
    $cartResult->data_seek(0); // Reset the pointer to start
    
    // Prepare insert with exact column names from your order_items table
    $insertQuery = "INSERT INTO order_items 
                   (order_id, product_id, size, delivery_option, price) 
                   VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    
    if (!$insertStmt) {
        throw new Exception("Failed to prepare insert statement: " . $db->error);
    }
    
    $insertedItems = 0;
    
    while ($item = $cartResult->fetch_assoc()) {
        error_log("Processing item: " . json_encode($item));
        
        $productId = $item['product_id'];
        $price = floatval($item['price']);
        $size = $item['size'];
        $deliveryOption = intval($item['delivery_option']);
        
        $insertStmt->bind_param('issii', 
            $orderId,
            $productId,
            $size,
            $deliveryOption,
            $price
        );
        
        if (!$insertStmt->execute()) {
            throw new Exception("Failed to insert item: " . $insertStmt->error . 
                              " [Product ID: $productId]");
        }
        
        $insertedItems++;
    }
    
    if ($insertedItems === 0) {
        throw new Exception("No items were inserted");
    }
    
    // Clear the cart
    $clearCartQuery = "DELETE FROM shopping_cart WHERE user_id = ?";
    $clearCartStmt = $db->prepare($clearCartQuery);
    
    if (!$clearCartStmt || !$clearCartStmt->bind_param('i', $userId)) {
        throw new Exception("Failed to prepare cart cleanup: " . $db->error);
    }
    
    if (!$clearCartStmt->execute()) {
        throw new Exception("Failed to clear cart: " . $clearCartStmt->error);
    }
    
    $db->commit();
    
    error_log("Successfully added $insertedItems items to order $orderId");
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => "Successfully added $insertedItems items to order",
        'order_id' => $orderId,
        'items_count' => $insertedItems
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->ping()) {
        $db->rollback();
    }
    
    error_log("Error in add-items-to-order: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);

} finally {
    if (isset($cartStmt)) $cartStmt->close();
    if (isset($insertStmt)) $insertStmt->close();
    if (isset($clearCartStmt)) $clearCartStmt->close();
    if (isset($db)) $db->close();
}
?>