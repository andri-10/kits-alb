<?php
header('Content-Type: application/json');
session_start();

$host = 'localhost';
$dbname = 'web';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'User is not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$inputData = json_decode(file_get_contents('php://input'), true);

if (!is_array($inputData) || empty($inputData)) {
    echo json_encode(['error' => 'Invalid order data received']);
    exit;
}

function calculateDeliveryDate($deliveryOption) {
    $today = new DateTime();
    
    $deliveryDays = [
        1 => 7,  // 1: 7 days delivery
        2 => 3,  // 2: 3 days delivery
        3 => 1   // 3: 1 day delivery
    ];

    $daysToAdd = isset($deliveryDays[$deliveryOption]) ? $deliveryDays[$deliveryOption] : 7;
    $deliveryDate = $today->modify("+$daysToAdd days");

    return $deliveryDate->format('Y-m-d');
}

try {
    $conn->beginTransaction();
    $createdOrderIds = [];
    $option = 1;

    foreach ($inputData as $batchOrder) {
        if (empty($batchOrder['finalTotalCents'])) {
            continue;
        }

        $totalPriceDollars = $batchOrder['finalTotalCents'];

        // Insert the order
        $stmt = $conn->prepare("
            INSERT INTO orders (
                user_id, 
                total_price, 
                status, 
                delivery_date,
                created_at,
                updated_at
            ) VALUES (
                :user_id, 
                :total_price, 
                :status, 
                :delivery_date,
                NOW(),
                NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':total_price' => $totalPriceDollars,
            ':status' => 'pending',
            ':delivery_date' => $batchOrder['deliveryDate']
        ]);

        $orderId = $conn->lastInsertId();
        $createdOrderIds[] = $orderId;

        // Log the payment
        $stmtPayment = $conn->prepare("
            INSERT INTO payment_logs (
                order_id,
                amount,
                created_at
            ) VALUES (
                :order_id,
                :amount,
                NOW()
            )
        ");

        $stmtPayment->execute([
            ':order_id' => $orderId,
            ':amount' => $totalPriceDollars
        ]);

        // Get cart items
        $sql = "
            SELECT 
                c.id AS cart_id,         
                c.user_id, 
                c.product_id,
                p.name AS product_name,
                p.priceCents AS product_pricecents,
                p.image AS product_image,
                c.size AS cart_size,
                c.delivery_option AS delivery_option,
                c.created_at
            FROM shopping_cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = :user_id AND c.delivery_option = :delivery_option
        ";

        $stmtItems = $conn->prepare($sql);
        $stmtItems->bindParam(':user_id', $userId);
        $stmtItems->bindParam(':delivery_option', $option);
        $stmtItems->execute();

        $cartItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Insert order items
foreach ($cartItems as $item) {
    $stmtOrderItems = $conn->prepare("
        INSERT INTO order_items (
            order_id,
            product_id,
            price,
            size,
            delivery_date,
            image
        ) VALUES (
            :order_id,
            :product_id,
            :price,
            :size,
            :delivery_date,
            :product_image
        )
    ");

    $deliveryDate = calculateDeliveryDate($option);

    $stmtOrderItems->execute([
        ':order_id' => $orderId,
        ':product_id' => $item['product_id'],
        ':price' => $item['product_pricecents'],
        ':size' => $item['cart_size'],
        ':delivery_date' => $deliveryDate,
        ':product_image' => $item['product_image']
    ]);
}


        $option++;
        if ($option > 3) {
            break;
        }
    }

    if (empty($createdOrderIds)) {
        throw new Exception('No valid orders were created');
    }

    // Remove all items from the user's cart
    $stmtClearCart = $conn->prepare("
        DELETE FROM shopping_cart
        WHERE user_id = :user_id
    ");
    $stmtClearCart->execute([':user_id' => $userId]);

    $conn->commit();
    echo json_encode([
        'order_ids' => $createdOrderIds, 
        'status' => 'success',
        'message' => 'Orders created, payments logged, and cart cleared successfully'
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['error' => 'Error processing order and payment: ' . $e->getMessage()]);
    exit;
}
?>
