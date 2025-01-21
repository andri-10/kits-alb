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

// Function to calculate the delivery date based on the delivery option
function calculateDeliveryDate($deliveryOption) {
    $today = new DateTime();
    
    $deliveryDays = [
        1 => 7,  // 1: 7 days delivery
        2 => 3,  // 2: 3 days delivery
        3 => 1   // 3: 1 day delivery
    ];

    $daysToAdd = isset($deliveryDays[$deliveryOption]) ? $deliveryDays[$deliveryOption] : 7;  // Default to 7 days if option not found
    $deliveryDate = $today->modify("+$daysToAdd days");

    return $deliveryDate->format('Y-m-d'); // Return the date in 'YYYY-MM-DD' format for MySQL
}

try {
    $conn->beginTransaction();
    $createdOrderIds = [];
    $option = 1;  // Start with the first delivery option

    foreach ($inputData as $batchOrder) {
        // Only process batches that have a total price and items
        if (empty($batchOrder['finalTotalCents'])) {
            continue;
        }

        // Convert cents to dollars with proper decimal formatting
        $totalPriceDollars = number_format($batchOrder['finalTotalCents'] / 100, 2, '.', '');

        // Insert the order into the database
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

        // Get the order ID for the newly created order
        $createdOrderIds[] = $conn->lastInsertId();

        // SQL query to fetch cart products for the logged-in user based on delivery option
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

        // Prepare and execute the query to fetch cart items for the current delivery option
        $stmtItems = $conn->prepare($sql);
        $stmtItems->bindParam(':user_id', $userId);
        $stmtItems->bindParam(':delivery_option', $option);
        $stmtItems->execute();

        // Fetch all the products for the current delivery option
        $cartItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Insert items into the order_items table for the current batch (without quantity)
        foreach ($cartItems as $item) {
            $stmtOrderItems = $conn->prepare("
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    price,
                    size,
                    delivery_date
                ) VALUES (
                    :order_id,
                    :product_id,
                    :price,
                    :size,
                    :delivery_date
                )
            ");

            // Insert the item for the current batch
            $deliveryDate = calculateDeliveryDate($option); // Calculate the delivery date based on the option

            $stmtOrderItems->execute([
                ':order_id' => $createdOrderIds[count($createdOrderIds) - 1],
                ':product_id' => $item['product_id'],
                ':price' => $item['product_pricecents'],
                ':size' => $item['cart_size'],
                ':delivery_date' => $deliveryDate
            ]);
        }

        // Increment the option for the next batch (delivery_option 1 -> 2 -> 3)
        $option++;
        if ($option > 3) {
            break;  // Stop if the option exceeds 3 (we only have 3 delivery options)
        }
    }

    if (empty($createdOrderIds)) {
        throw new Exception('No valid orders were created');
    }

    $conn->commit();
    echo json_encode(['order_ids' => $createdOrderIds, 'status' => 'success']);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(['error' => 'Error creating orders: ' . $e->getMessage()]);
    exit;
}
?>
