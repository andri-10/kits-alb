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
    if (!isset($input['order_id']) || !isset($input['items'])) {
        throw new Exception("Missing required data");
    }

    $orderId = intval($input['order_id']);
    $items = $input['items'];

    $db->begin_transaction();

    // Insert query for order items
    $insertQuery = "INSERT INTO order_items
                   (order_id, product_id, size, price)
                   VALUES (?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);

    if (!$insertStmt) {
        throw new Exception("Failed to prepare insert statement: " . $db->error);
    }

    $insertedItems = 0;

    foreach ($items as $item) {
        error_log("Processing item: " . json_encode($item));

        $productId = $item['product_id'];
        $priceCents = intval($item['product_pricecents']);
        $size = $item['cart_size'];

        $insertStmt->bind_param('issi',
            $orderId,
            $productId,
            $size,
            $priceCents
        );

        if (!$insertStmt->execute()) {
            throw new Exception("Failed to insert item: " . $insertStmt->error .
                              " [Product ID: $productId, Price: $priceCents]");
        }

        $insertedItems++;
    }

    if ($insertedItems === 0) {
        throw new Exception("No items were inserted");
    }

    // Clear the cart items that were added to the order
    $productIds = array_map(function($item) {
        return $item['product_id'];
    }, $items);

    $placeholders = str_repeat('?,', count($productIds) - 1) . '?';
    $clearCartQuery = "DELETE FROM shopping_cart WHERE user_id = ? AND product_id IN ($placeholders)";
    $clearCartStmt = $db->prepare($clearCartQuery);

    if (!$clearCartStmt) {
        throw new Exception("Failed to prepare cart cleanup: " . $db->error);
    }

    $bindParams = array_merge([$userId], $productIds);
    $types = str_repeat('s', count($productIds));
    $clearCartStmt->bind_param('i' . $types, ...$bindParams);

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
    if (isset($insertStmt)) $insertStmt->close();
    if (isset($clearCartStmt)) $clearCartStmt->close();
    if (isset($db)) $db->close();
}