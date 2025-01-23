<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include('utils.php');

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
        1 => 7,  
        2 => 3,  
        3 => 1   
    ];
    $daysToAdd = isset($deliveryDays[$deliveryOption]) ? $deliveryDays[$deliveryOption] : 7;
    $deliveryDate = $today->modify("+$daysToAdd days");
    return $deliveryDate->format('Y-m-d');
}

function formatAllOrdersDetails($orderGroups) {
    $totalAllOrders = 0;
    $emailContent = "Thank you for your orders!\n\n";
    
    foreach ($orderGroups as $option => $orderData) {
        if (!empty($orderData['items'])) {
            $emailContent .= "=== Order Group " . ($option) . " (Delivery: " . 
                           ($option == 1 ? "7 days" : ($option == 2 ? "3 days" : "1 day")) . ") ===\n";
            $emailContent .= "Order ID: " . $orderData['order_id'] . "\n";
            $emailContent .= "Delivery Date: " . $orderData['delivery_date'] . "\n\n";
            $emailContent .= "Items:\n";
            
            foreach ($orderData['items'] as $item) {
                $priceFormatted = number_format($item['product_pricecents'] / 100, 2);
                $emailContent .= "- {$item['product_name']} (Size: {$item['cart_size']}) - \${$priceFormatted}\n";
            }
            
            $groupTotal = number_format($orderData['total'] / 100, 2);
            $emailContent .= "\nSubtotal for this group: \${$groupTotal}\n\n";
            $totalAllOrders += $orderData['total'];
        }
    }
    
    $grandTotal = number_format($totalAllOrders / 100, 2);
    $emailContent .= "===========================\n";
    $emailContent .= "Grand Total for All Orders: \${$grandTotal}\n";
    $emailContent .= "===========================\n\n";
    
    return $emailContent;
}

try {
    $conn->beginTransaction();
    $createdOrderIds = [];
    $orderGroups = [];
    $userEmail = '';

    
    $stmtUser = $conn->prepare("SELECT email FROM users WHERE id = :user_id");
    $stmtUser->execute([':user_id' => $userId]);
    $userEmail = $stmtUser->fetchColumn();

    
    for ($option = 1; $option <= 3; $option++) {
        $sql = "
            SELECT 
                c.id AS cart_id,         
                c.user_id, 
                c.product_id,
                p.name AS product_name,
                p.priceCents AS product_pricecents,
                p.image AS product_image,
                c.size AS cart_size,
                c.delivery_option AS delivery_option
            FROM shopping_cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = :user_id AND c.delivery_option = :delivery_option
        ";

        $stmtItems = $conn->prepare($sql);
        $stmtItems->bindParam(':user_id', $userId);
        $stmtItems->bindParam(':delivery_option', $option);
        $stmtItems->execute();

        $cartItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($cartItems)) {
            $finalTotalCents = isset($inputData[$option - 1]['finalTotalCents']) ? 
                              $inputData[$option - 1]['finalTotalCents'] : 0;

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

            $deliveryDate = calculateDeliveryDate($option);

            $stmt->execute([
                ':user_id' => $userId,
                ':total_price' => $finalTotalCents,
                ':status' => 'pending',
                ':delivery_date' => $deliveryDate
            ]);

            $orderId = $conn->lastInsertId();
            $createdOrderIds[] = $orderId;

            
            $orderGroups[$option] = [
                'order_id' => $orderId,
                'items' => $cartItems,
                'total' => $finalTotalCents,
                'delivery_date' => $deliveryDate
            ];

            
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
                ':amount' => $finalTotalCents
            ]);

            
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

                $stmtOrderItems->execute([
                    ':order_id' => $orderId,
                    ':product_id' => $item['product_id'],
                    ':price' => $item['product_pricecents'],
                    ':size' => $item['cart_size'],
                    ':delivery_date' => $deliveryDate,
                    ':product_image' => $item['product_image']
                ]);
            }
        }
    }

    if (empty($createdOrderIds)) {
        throw new Exception('No valid orders were created');
    }

    
    if (!empty($orderGroups)) {
        $emailContent = formatAllOrdersDetails($orderGroups);
        
        
        sendEmail($userEmail, 
                 "Your Order Confirmation - Orders #" . implode(', #', $createdOrderIds),
                 $emailContent);
        
        
        $adminEmailContent = "New orders received from customer ($userEmail):\n\n" . $emailContent;
        sendEmail('electroman784@gmail.com',
                 "New Orders Received - Orders #" . implode(', #', $createdOrderIds),
                 $adminEmailContent);
    }

    
    $stmtClearCart = $conn->prepare("
        DELETE FROM shopping_cart
        WHERE user_id = :user_id
    ");
    $stmtClearCart->execute([':user_id' => $userId]);

    $conn->commit();
    
    echo json_encode([
        'order_ids' => $createdOrderIds,
        'status' => 'success',
        'message' => 'Orders created, payments logged, and cart cleared successfully',
        'email_content' => $emailContent
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode([
        'error' => 'Error processing order and payment: ' . $e->getMessage()
    ]);
    exit;
}
?>