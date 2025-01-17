<?php
$host = 'localhost';$dbname = 'web';$username = 'root';$password = '';try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
header('Content-Type: application/json');
$input = json_decode(file_get_contents("php://input"), true);
if (isset($input['user_id'], $input['product_id'], $input['delivery_option'])) {
    $user_id = $input['user_id'];
    $product_id = $input['product_id'];
    $delivery_option = $input['delivery_option'];
    try {
        $stmt = $db->prepare("UPDATE shopping_cart SET delivery_option = :delivery_option WHERE product_id = :product_id AND user_id = :user_id");
        $stmt->bindParam(':delivery_option', $delivery_option);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        echo json_encode(['success' => true, 'message' => 'Delivery option updated successfully']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
}
?>
